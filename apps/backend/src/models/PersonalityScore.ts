import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from 'type-graphql';
import { User } from './User';

export enum PersonalityDimension {
  OPENNESS = 'openness',
  CONSCIENTIOUSNESS = 'conscientiousness',
  EXTRAVERSION = 'extraversion',
  AGREEABLENESS = 'agreeableness',
  NEUROTICISM = 'neuroticism',
  HUMOR_STYLE = 'humor_style',
  COMMUNICATION_STYLE = 'communication_style',
  RELATIONSHIP_GOALS = 'relationship_goals',
  CONFLICT_RESOLUTION = 'conflict_resolution',
  EMOTIONAL_INTELLIGENCE = 'emotional_intelligence'
}

@ObjectType()
@Entity('personality_scores')
export class PersonalityScore {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.personalityScores)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: PersonalityDimension
  })
  dimension: PersonalityDimension;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 3, scale: 2 })
  score: number;

  @Field(() => Int)
  @Column()
  confidence: number; // 0-100, how confident we are in this score

  @Field()
  @Column({ type: 'jsonb', default: {} })
  details: {
    responses?: number[]; // Raw quiz responses
    reasoning?: string; // AI reasoning for the score
    traits?: string[]; // Specific traits identified
    keywords?: string[]; // Keywords from text analysis
  };

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}