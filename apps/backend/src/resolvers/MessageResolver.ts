import { Resolver, Query, Mutation, Arg, Ctx, Authorized, InputType, Field, Int, Subscription, Root, PubSub, PubSubEngine } from 'type-graphql';
import { AppDataSource } from '../config/database';
import { Message, MessageType, MessageStatus } from '../models/Message';
import { Match, MatchStatus } from '../models/Match';
import { AuthContext } from '../middleware/auth';
import { logger } from '../utils/logger';

@InputType()
class SendMessageInput {
  @Field()
  matchId: string;

  @Field(() => String)
  type: MessageType;

  @Field({ nullable: true })
  content?: string;

  @Field({ nullable: true })
  mediaUrl?: string;
}

@Resolver(() => Message)
export class MessageResolver {
  @Authorized()
  @Mutation(() => Message)
  async sendMessage(
    @Arg('input') input: SendMessageInput,
    @Ctx() { user, io }: AuthContext,
    @PubSub() pubSub: PubSubEngine
  ): Promise<Message> {
    const messageRepository = AppDataSource.getRepository(Message);
    const matchRepository = AppDataSource.getRepository(Match);

    // Find the match
    const match = await matchRepository.findOne({
      where: { id: input.matchId },
      relations: ['user1', 'user2']
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Check if user is part of this match
    if (match.user1Id !== user!.id && match.user2Id !== user!.id) {
      throw new Error('Unauthorized');
    }

    // Check if match is active
    if (match.status !== MatchStatus.ACTIVE) {
      throw new Error('Match is not active');
    }

    // Create message
    const message = messageRepository.create({
      matchId: input.matchId,
      senderId: user!.id,
      type: input.type,
      content: input.content,
      mediaUrl: input.mediaUrl,
      metadata: {}
    });

    const savedMessage = await messageRepository.save(message);

    // Update match with last message time and message count
    match.lastMessageAt = new Date();
    match.messageCount += 1;

    // Check if we should update reveal levels based on message count
    if (match.messageCount >= 5) {
      if (match.user1RevealLevel === 'prompt_only') {
        match.user1RevealLevel = 'name_and_prompt' as any;
      }
      if (match.user2RevealLevel === 'prompt_only') {
        match.user2RevealLevel = 'name_and_prompt' as any;
      }
    }

    await matchRepository.save(match);

    // Emit real-time message via Socket.IO
    if (io) {
      const recipientId = match.user1Id === user!.id ? match.user2Id : match.user1Id;
      io.to(`user:${recipientId}`).emit('newMessage', {
        ...savedMessage,
        sender: user
      });
    }

    // Publish for GraphQL subscriptions
    await pubSub.publish('MESSAGE_SENT', {
      messageAdded: savedMessage,
      matchId: input.matchId
    });

    logger.info(`Message sent: ${savedMessage.id} in match: ${input.matchId}`);
    return savedMessage;
  }

  @Authorized()
  @Query(() => [Message])
  async getMessages(
    @Arg('matchId') matchId: string,
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
    @Ctx() { user }: AuthContext
  ): Promise<Message[]> {
    const messageRepository = AppDataSource.getRepository(Message);
    const matchRepository = AppDataSource.getRepository(Match);

    // Verify user has access to this match
    const match = await matchRepository.findOne({
      where: { id: matchId }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.user1Id !== user!.id && match.user2Id !== user!.id) {
      throw new Error('Unauthorized');
    }

    const messages = await messageRepository.find({
      where: { matchId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset
    });

    return messages;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async markMessageAsRead(
    @Arg('messageId') messageId: string,
    @Ctx() { user }: AuthContext
  ): Promise<boolean> {
    const messageRepository = AppDataSource.getRepository(Message);
    const matchRepository = AppDataSource.getRepository(Match);

    const message = await messageRepository.findOne({
      where: { id: messageId },
      relations: ['match']
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Check if user is the recipient (not the sender)
    const match = await matchRepository.findOne({ where: { id: message.matchId } });
    if (!match) {
      throw new Error('Match not found');
    }

    const isRecipient = (match.user1Id === user!.id && message.senderId === match.user2Id) ||
                       (match.user2Id === user!.id && message.senderId === match.user1Id);

    if (!isRecipient) {
      throw new Error('Cannot mark own message as read');
    }

    message.status = MessageStatus.READ;
    message.readAt = new Date();
    await messageRepository.save(message);

    return true;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteMessage(
    @Arg('messageId') messageId: string,
    @Ctx() { user }: AuthContext
  ): Promise<boolean> {
    const messageRepository = AppDataSource.getRepository(Message);

    const message = await messageRepository.findOne({
      where: { id: messageId }
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Only sender can delete their message
    if (message.senderId !== user!.id) {
      throw new Error('Can only delete your own messages');
    }

    message.status = MessageStatus.DELETED;
    message.deletedAt = new Date();
    await messageRepository.save(message);

    logger.info(`Message deleted: ${messageId} by user: ${user!.id}`);
    return true;
  }

  @Subscription(() => Message, {
    topics: 'MESSAGE_SENT',
    filter: ({ payload, args }) => payload.matchId === args.matchId
  })
  messageAdded(
    @Arg('matchId') matchId: string,
    @Root() messagePayload: { messageAdded: Message; matchId: string }
  ): Message {
    return messagePayload.messageAdded;
  }
}