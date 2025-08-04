import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, Int } from 'type-graphql';
import { Match } from './Match';
import { Message } from './Message';
import { PersonalityScore } from './PersonalityScore';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  OTHER = 'other'
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export enum SubscriptionType {
  FREE = 'free',
  PREMIUM = 'premium',
  PREMIUM_PLUS = 'premium_plus'
}

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phone?: string;

  @Column()
  passwordHash: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field(() => Int)
  @Column()
  age: number;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: Gender
  })
  gender: Gender;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.UNVERIFIED
  })
  verificationStatus: VerificationStatus;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: SubscriptionType,
    default: SubscriptionType.FREE
  })
  subscriptionType: SubscriptionType;

  @Field({ nullable: true })
  @Column({ nullable: true })
  bio?: string;

  @Field(() => [String])
  @Column('text', { array: true, default: '{}' })
  interests: string[];

  @Field(() => [String])
  @Column('text', { array: true, default: '{}' })
  photos: string[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  profilePhotoUrl?: string;

  @Field(() => [String])
  @Column('text', { array: true, default: '{}' })
  promptAnswers: string[];

  @Field()
  @Column({ type: 'jsonb', default: {} })
  preferences: {
    ageRange: { min: number; max: number };
    maxDistance: number;
    genderPreference: Gender[];
    dealBreakers: string[];
  };

  @Field()
  @Column({ type: 'point', nullable: true })
  location?: { latitude: number; longitude: number };

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field()
  @Column({ default: false })
  isOnline: boolean;

  @Field()
  @Column({ type: 'timestamp', nullable: true })
  lastSeen?: Date;

  @Field()
  @Column({ type: 'jsonb', default: {} })
  privacySettings: {
    incognitoMode: boolean;
    showOnlineStatus: boolean;
    allowVoiceMessages: boolean;
    allowVideoMessages: boolean;
  };

  @Field(() => [String])
  @Column('text', { array: true, default: '{}' })
  badges: string[];

  @Field(() => Int)
  @Column({ default: 0 })
  conversationRating: number;

  @Field(() => Int)
  @Column({ default: 0 })
  totalConversations: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Match, match => match.user1)
  matches1: Match[];

  @OneToMany(() => Match, match => match.user2)
  matches2: Match[];

  @OneToMany(() => Message, message => message.sender)
  sentMessages: Message[];

  @OneToMany(() => PersonalityScore, score => score.user)
  personalityScores: PersonalityScore[];
}