import { Resolver, Query, Mutation, Arg, Ctx, Authorized, InputType, Field, Int } from 'type-graphql';
import { AppDataSource } from '../config/database';
import { Match, MatchStatus, RevealLevel } from '../models/Match';
import { User } from '../models/User';
import { AuthContext } from '../middleware/auth';
import { logger } from '../utils/logger';

@InputType()
class CreateMatchInput {
  @Field()
  targetUserId: string;
}

@Resolver(() => Match)
export class MatchResolver {
  @Authorized()
  @Mutation(() => Match)
  async createMatch(
    @Arg('input') input: CreateMatchInput,
    @Ctx() { user }: AuthContext
  ): Promise<Match> {
    const matchRepository = AppDataSource.getRepository(Match);
    const userRepository = AppDataSource.getRepository(User);

    // Check if target user exists
    const targetUser = await userRepository.findOne({ where: { id: input.targetUserId } });
    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // Check if match already exists
    const existingMatch = await matchRepository.findOne({
      where: [
        { user1Id: user!.id, user2Id: input.targetUserId },
        { user1Id: input.targetUserId, user2Id: user!.id }
      ]
    });

    if (existingMatch) {
      // If it's a mutual match, activate it
      if (existingMatch.status === MatchStatus.PENDING) {
        existingMatch.status = MatchStatus.ACTIVE;
        const updatedMatch = await matchRepository.save(existingMatch);
        logger.info(`Match activated: ${existingMatch.id}`);
        return updatedMatch;
      }
      throw new Error('Match already exists');
    }

    // Create new match
    const match = matchRepository.create({
      user1Id: user!.id,
      user2Id: input.targetUserId,
      status: MatchStatus.PENDING,
      user1RevealLevel: RevealLevel.PROMPT_ONLY,
      user2RevealLevel: RevealLevel.PROMPT_ONLY,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      metadata: {
        initialPrompt: 'Tell me about your perfect weekend',
        icebreakers: []
      }
    });

    const savedMatch = await matchRepository.save(match);
    logger.info(`New match created: ${savedMatch.id}`);

    return savedMatch;
  }

  @Authorized()
  @Query(() => [Match])
  async getMyMatches(@Ctx() { user }: AuthContext): Promise<Match[]> {
    const matchRepository = AppDataSource.getRepository(Match);

    const matches = await matchRepository.find({
      where: [
        { user1Id: user!.id, status: MatchStatus.ACTIVE },
        { user2Id: user!.id, status: MatchStatus.ACTIVE }
      ],
      relations: ['user1', 'user2', 'messages'],
      order: { lastMessageAt: 'DESC' }
    });

    return matches;
  }

  @Authorized()
  @Mutation(() => Match)
  async updateRevealLevel(
    @Arg('matchId') matchId: string,
    @Arg('revealLevel') revealLevel: RevealLevel,
    @Ctx() { user }: AuthContext
  ): Promise<Match> {
    const matchRepository = AppDataSource.getRepository(Match);

    const match = await matchRepository.findOne({
      where: { id: matchId },
      relations: ['user1', 'user2']
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Check if user is part of this match
    if (match.user1Id !== user!.id && match.user2Id !== user!.id) {
      throw new Error('Unauthorized');
    }

    // Update reveal level for the current user
    if (match.user1Id === user!.id) {
      match.user1RevealLevel = revealLevel;
    } else {
      match.user2RevealLevel = revealLevel;
    }

    const updatedMatch = await matchRepository.save(match);
    logger.info(`Reveal level updated for match: ${matchId} by user: ${user!.id}`);

    return updatedMatch;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async archiveMatch(
    @Arg('matchId') matchId: string,
    @Ctx() { user }: AuthContext
  ): Promise<boolean> {
    const matchRepository = AppDataSource.getRepository(Match);

    const match = await matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new Error('Match not found');
    }

    // Check if user is part of this match
    if (match.user1Id !== user!.id && match.user2Id !== user!.id) {
      throw new Error('Unauthorized');
    }

    match.status = MatchStatus.ARCHIVED;
    await matchRepository.save(match);

    logger.info(`Match archived: ${matchId} by user: ${user!.id}`);
    return true;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async blockMatch(
    @Arg('matchId') matchId: string,
    @Ctx() { user }: AuthContext
  ): Promise<boolean> {
    const matchRepository = AppDataSource.getRepository(Match);

    const match = await matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new Error('Match not found');
    }

    // Check if user is part of this match
    if (match.user1Id !== user!.id && match.user2Id !== user!.id) {
      throw new Error('Unauthorized');
    }

    match.status = MatchStatus.BLOCKED;
    await matchRepository.save(match);

    logger.info(`Match blocked: ${matchId} by user: ${user!.id}`);
    return true;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async rateConversation(
    @Arg('matchId') matchId: string,
    @Arg('rating', () => Int) rating: number,
    @Ctx() { user }: AuthContext
  ): Promise<boolean> {
    const matchRepository = AppDataSource.getRepository(Match);

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const match = await matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new Error('Match not found');
    }

    // Check if user is part of this match
    if (match.user1Id !== user!.id && match.user2Id !== user!.id) {
      throw new Error('Unauthorized');
    }

    // Update rating
    if (!match.metadata.conversationRating) {
      match.metadata.conversationRating = {};
    }

    if (match.user1Id === user!.id) {
      match.metadata.conversationRating.user1Rating = rating;
    } else {
      match.metadata.conversationRating.user2Rating = rating;
    }

    await matchRepository.save(match);
    logger.info(`Conversation rated: ${matchId} by user: ${user!.id} - Rating: ${rating}`);

    return true;
  }

  @Authorized()
  @Query(() => [User])
  async getMatchSuggestions(
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Ctx() { user }: AuthContext
  ): Promise<User[]> {
    const userRepository = AppDataSource.getRepository(User);
    const matchRepository = AppDataSource.getRepository(Match);

    // Get users that current user hasn't matched with
    const existingMatchUserIds = await matchRepository
      .createQueryBuilder('match')
      .select(['match.user1Id', 'match.user2Id'])
      .where('match.user1Id = :userId OR match.user2Id = :userId', { userId: user!.id })
      .getMany()
      .then(matches => {
        const ids = new Set<string>();
        matches.forEach(match => {
          ids.add(match.user1Id);
          ids.add(match.user2Id);
        });
        ids.delete(user!.id);
        return Array.from(ids);
      });

    const suggestions = await userRepository
      .createQueryBuilder('user')
      .where('user.id != :userId', { userId: user!.id })
      .andWhere('user.isActive = true')
      .andWhere('user.id NOT IN (:...excludeIds)', { 
        excludeIds: existingMatchUserIds.length > 0 ? existingMatchUserIds : [''] 
      })
      .limit(limit)
      .getMany();

    return suggestions;
  }
}