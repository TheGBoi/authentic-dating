import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { User } from './User';
import { Match } from './Match';

export enum MessageType {
  TEXT = 'text',
  VOICE = 'voice',
  VIDEO = 'video',
  IMAGE = 'image',
  GIF = 'gif',
  STICKER = 'sticker',
  CHALLENGE = 'challenge',
  ICEBREAKER = 'icebreaker'
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  DELETED = 'deleted',
  MODERATED = 'moderated'
}

@ObjectType()
@Entity('messages')
export class Message {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Match)
  @ManyToOne(() => Match, match => match.messages)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column()
  matchId: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.sentMessages)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column()
  senderId: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT
  })
  type: MessageType;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  content?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  mediaUrl?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Field()
  @Column({ type: 'jsonb', default: {} })
  metadata: {
    duration?: number; // For voice/video messages
    dimensions?: { width: number; height: number }; // For images/videos
    challengeType?: string; // For challenge messages
    icebreakerCategory?: string; // For icebreaker messages
    fileName?: string; // For file attachments
    fileSize?: number; // File size in bytes
    isBlurred?: boolean; // For video messages with face blur
  };

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT
  })
  status: MessageStatus;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Field()
  @Column({ default: false })
  isEdited: boolean;

  @Field()
  @Column({ default: false })
  isFlagged: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  moderationReason?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}