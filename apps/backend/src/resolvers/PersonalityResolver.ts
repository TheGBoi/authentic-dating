import { Resolver, Query, Mutation, Arg, Ctx, Authorized, InputType, Field, Int, Float } from 'type-graphql';
import { AppDataSource } from '../config/database';
import { PersonalityScore, PersonalityDimension } from '../models/PersonalityScore';
import { User } from '../models/User';
import { AuthContext } from '../middleware/auth';
import { logger } from '../utils/logger';

@InputType()
class QuizResponseInput {
  @Field(() => Int)
  questionId: number;

  @Field(() => Int)
  response: number; // 1-5 scale
}

@InputType()
class SubmitQuizInput {
  @Field(() => [QuizResponseInput])
  responses: QuizResponseInput[];
}

@InputType()
class PersonalityScoreInput {
  @Field(() => String)
  dimension: PersonalityDimension;

  @Field(() => Float)
  score: number;

  @Field(() => Int)
  confidence: number;
}

@Resolver(() => PersonalityScore)
export class PersonalityResolver {
  @Authorized()
  @Mutation(() => [PersonalityScore])
  async submitPersonalityQuiz(
    @Arg('input') input: SubmitQuizInput,
    @Ctx() { user }: AuthContext
  ): Promise<PersonalityScore[]> {
    const personalityRepository = AppDataSource.getRepository(PersonalityScore);

    // Calculate personality scores based on responses
    const scores = this.calculatePersonalityScores(input.responses);

    // Delete existing scores for this user
    await personalityRepository.delete({ userId: user!.id });

    // Create new personality scores
    const personalityScores: PersonalityScore[] = [];
    for (const scoreData of scores) {
      const score = personalityRepository.create({
        userId: user!.id,
        dimension: scoreData.dimension,
        score: scoreData.score,
        confidence: scoreData.confidence,
        details: {
          responses: input.responses.map(r => r.response),
          reasoning: scoreData.reasoning,
          traits: scoreData.traits,
          keywords: scoreData.keywords
        }
      });

      const savedScore = await personalityRepository.save(score);
      personalityScores.push(savedScore);
    }

    logger.info(`Personality quiz submitted for user: ${user!.id}`);
    return personalityScores;
  }

  @Authorized()
  @Query(() => [PersonalityScore])
  async getMyPersonalityScores(@Ctx() { user }: AuthContext): Promise<PersonalityScore[]> {
    const personalityRepository = AppDataSource.getRepository(PersonalityScore);

    const scores = await personalityRepository.find({
      where: { userId: user!.id },
      order: { dimension: 'ASC' }
    });

    return scores;
  }

  @Authorized()
  @Query(() => Float)
  async getCompatibilityScore(
    @Arg('targetUserId') targetUserId: string,
    @Ctx() { user }: AuthContext
  ): Promise<number> {
    const personalityRepository = AppDataSource.getRepository(PersonalityScore);

    // Get both users' personality scores
    const [userScores, targetScores] = await Promise.all([
      personalityRepository.find({ where: { userId: user!.id } }),
      personalityRepository.find({ where: { userId: targetUserId } })
    ]);

    if (userScores.length === 0 || targetScores.length === 0) {
      return 0;
    }

    // Calculate compatibility score
    const compatibility = this.calculateCompatibility(userScores, targetScores);
    return compatibility;
  }

  @Authorized()
  @Query(() => [String])
  async getIcebreakers(
    @Arg('matchId') matchId: string,
    @Ctx() { user }: AuthContext
  ): Promise<string[]> {
    // This would typically call the AI service to generate contextual icebreakers
    // For now, returning some basic icebreakers
    const basicIcebreakers = [
      "What's the most interesting place you've traveled to?",
      "If you could have dinner with anyone, who would it be?",
      "What's your favorite way to spend a weekend?",
      "What's something you're passionate about that most people don't know?",
      "If you could learn any skill instantly, what would it be?"
    ];

    // Shuffle and return 3 random icebreakers
    const shuffled = basicIcebreakers.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  private calculatePersonalityScores(responses: QuizResponseInput[]): any[] {
    // This is a simplified personality scoring algorithm
    // In production, this would be much more sophisticated
    
    const dimensions = Object.values(PersonalityDimension);
    const scores = [];

    for (const dimension of dimensions) {
      // Basic scoring logic - would be much more complex in reality
      const relevantResponses = responses.slice(0, Math.ceil(responses.length / dimensions.length));
      const average = relevantResponses.reduce((sum, r) => sum + r.response, 0) / relevantResponses.length;
      const normalizedScore = (average - 1) / 4; // Normalize to 0-1

      scores.push({
        dimension,
        score: Math.round(normalizedScore * 100) / 100,
        confidence: 75, // Static confidence for now
        reasoning: `Calculated from ${relevantResponses.length} quiz responses`,
        traits: this.getTraitsForDimension(dimension, normalizedScore),
        keywords: this.getKeywordsForDimension(dimension)
      });
    }

    return scores;
  }

  private calculateCompatibility(userScores: PersonalityScore[], targetScores: PersonalityScore[]): number {
    let totalCompatibility = 0;
    let dimensionCount = 0;

    for (const userScore of userScores) {
      const targetScore = targetScores.find(s => s.dimension === userScore.dimension);
      if (targetScore) {
        // Calculate compatibility for this dimension
        const difference = Math.abs(userScore.score - targetScore.score);
        const compatibility = 1 - difference; // Higher similarity = higher compatibility
        totalCompatibility += compatibility;
        dimensionCount++;
      }
    }

    return dimensionCount > 0 ? Math.round((totalCompatibility / dimensionCount) * 100) / 100 : 0;
  }

  private getTraitsForDimension(dimension: PersonalityDimension, score: number): string[] {
    const traits: { [key: string]: string[] } = {
      [PersonalityDimension.OPENNESS]: score > 0.5 ? ['creative', 'curious', 'imaginative'] : ['practical', 'conventional', 'traditional'],
      [PersonalityDimension.CONSCIENTIOUSNESS]: score > 0.5 ? ['organized', 'responsible', 'disciplined'] : ['flexible', 'spontaneous', 'casual'],
      [PersonalityDimension.EXTRAVERSION]: score > 0.5 ? ['outgoing', 'social', 'energetic'] : ['reserved', 'quiet', 'introspective'],
      [PersonalityDimension.AGREEABLENESS]: score > 0.5 ? ['cooperative', 'trusting', 'helpful'] : ['competitive', 'skeptical', 'independent'],
      [PersonalityDimension.NEUROTICISM]: score > 0.5 ? ['sensitive', 'emotional', 'anxious'] : ['calm', 'stable', 'resilient']
    };

    return traits[dimension] || ['balanced'];
  }

  private getKeywordsForDimension(dimension: PersonalityDimension): string[] {
    const keywords: { [key: string]: string[] } = {
      [PersonalityDimension.OPENNESS]: ['creativity', 'art', 'travel', 'learning'],
      [PersonalityDimension.CONSCIENTIOUSNESS]: ['planning', 'goals', 'work', 'achievement'],
      [PersonalityDimension.EXTRAVERSION]: ['social', 'parties', 'people', 'energy'],
      [PersonalityDimension.AGREEABLENESS]: ['helping', 'cooperation', 'harmony', 'trust'],
      [PersonalityDimension.NEUROTICISM]: ['stress', 'emotion', 'worry', 'sensitivity']
    };

    return keywords[dimension] || [];
  }
}