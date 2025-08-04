import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from 'type-graphql';
import { User } from './User';
import { Message } from './Message';

export enum MatchStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
  EXPIRED = 'expired'
}

export enum RevealLevel {
  PROMPT_ONLY = 'prompt_only',
  NAME_AND_PROMPT = 'name_and_prompt',
  BLURRED_PHOTO = 'blurred_photo',
  FULL_PHOTO = 'full_photo',
  FULL_PROFILE = 'full_profile'
}

@ObjectType()
@Entity('matches')
export class Match {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.matches1)
  @JoinColumn({ name: 'user1_id' })
  user1: User;

  @Column()
  user1Id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.matches2)
  @JoinColumn({ name: 'user2_id' })
  user2: User;

  @Column()
  user2Id: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.PENDING
  })
  status: MatchStatus;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: RevealLevel,
    default: RevealLevel.PROMPT_ONLY
  })
  user1RevealLevel: RevealLevel;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: RevealLevel,
    default: RevealLevel.PROMPT_ONLY
  })
  user2RevealLevel: RevealLevel;

  @Field(() => Int)
  @Column({ default: 0 })
  messageCount: number;

  @Field(() => Int)
  @Column({ default: 0 })
  challengesCompleted: number;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Field()
  @Column({ type: 'jsonb', default: {} })
  metadata: {
    initialPrompt?: string;
    icebreakers?: string[];
    completedChallenges?: string[];
    conversationRating?: {
      user1Rating?: number;
      user2Rating?: number;
    };
  };

  @Field()
  @Column({ default: false })
  isRematchable: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Message, message => message.match)
  messages: Message[];
}