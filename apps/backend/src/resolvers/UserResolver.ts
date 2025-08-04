import { Resolver, Query, Mutation, Arg, Ctx, Authorized, InputType, Field, Int } from 'type-graphql';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database';
import { User, Gender, VerificationStatus } from '../models/User';
import { AuthContext, generateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

@InputType()
class RegisterInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => Int)
  age: number;

  @Field(() => String)
  gender: Gender;

  @Field(() => [String])
  interests: string[];
}

@InputType()
class LoginInput {
  @Field()
  email: string;

  @Field()
  password: string;
}

@InputType()
class UpdateProfileInput {
  @Field({ nullable: true })
  bio?: string;

  @Field(() => [String], { nullable: true })
  interests?: string[];

  @Field(() => [String], { nullable: true })
  promptAnswers?: string[];

  @Field({ nullable: true })
  profilePhotoUrl?: string;
}

@InputType()
class PreferencesInput {
  @Field(() => Int)
  minAge: number;

  @Field(() => Int)
  maxAge: number;

  @Field(() => Int)
  maxDistance: number;

  @Field(() => [String])
  genderPreference: Gender[];
}

@Resolver(() => User)
export class UserResolver {
  @Mutation(() => User)
  async register(@Arg('input') input: RegisterInput): Promise<User> {
    const userRepository = AppDataSource.getRepository(User);

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email: input.email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user
    const user = userRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      age: input.age,
      gender: input.gender,
      interests: input.interests,
      preferences: {
        ageRange: { min: 18, max: 99 },
        maxDistance: 50,
        genderPreference: [],
        dealBreakers: []
      },
      privacySettings: {
        incognitoMode: false,
        showOnlineStatus: true,
        allowVoiceMessages: true,
        allowVideoMessages: true
      }
    });

    const savedUser = await userRepository.save(user);
    logger.info(`New user registered: ${savedUser.id}`);

    return savedUser;
  }

  @Mutation(() => String)
  async login(@Arg('input') input: LoginInput): Promise<string> {
    const userRepository = AppDataSource.getRepository(User);

    // Find user
    const user = await userRepository.findOne({ where: { email: input.email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last seen and online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await userRepository.save(user);

    // Generate token
    const token = generateToken(user.id);
    logger.info(`User logged in: ${user.id}`);

    return token;
  }

  @Authorized()
  @Query(() => User)
  async me(@Ctx() { user }: AuthContext): Promise<User> {
    return user!;
  }

  @Authorized()
  @Mutation(() => User)
  async updateProfile(
    @Arg('input') input: UpdateProfileInput,
    @Ctx() { user }: AuthContext
  ): Promise<User> {
    const userRepository = AppDataSource.getRepository(User);

    // Update user fields
    Object.assign(user!, input);
    
    const updatedUser = await userRepository.save(user!);
    logger.info(`Profile updated for user: ${user!.id}`);

    return updatedUser;
  }

  @Authorized()
  @Mutation(() => User)
  async updatePreferences(
    @Arg('input') input: PreferencesInput,
    @Ctx() { user }: AuthContext
  ): Promise<User> {
    const userRepository = AppDataSource.getRepository(User);

    user!.preferences = {
      ...user!.preferences,
      ageRange: { min: input.minAge, max: input.maxAge },
      maxDistance: input.maxDistance,
      genderPreference: input.genderPreference
    };

    const updatedUser = await userRepository.save(user!);
    logger.info(`Preferences updated for user: ${user!.id}`);

    return updatedUser;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async updateOnlineStatus(
    @Arg('isOnline') isOnline: boolean,
    @Ctx() { user }: AuthContext
  ): Promise<boolean> {
    const userRepository = AppDataSource.getRepository(User);

    user!.isOnline = isOnline;
    user!.lastSeen = new Date();

    await userRepository.save(user!);
    logger.info(`Online status updated for user: ${user!.id} - ${isOnline}`);

    return true;
  }

  @Authorized()
  @Query(() => [User])
  async getDiscoveryFeed(
    @Arg('limit', () => Int, { defaultValue: 20 }) limit: number,
    @Ctx() { user }: AuthContext
  ): Promise<User[]> {
    const userRepository = AppDataSource.getRepository(User);

    // Basic discovery logic - exclude self and already matched users
    // In production, this would be much more sophisticated with personality matching
    const users = await userRepository
      .createQueryBuilder('user')
      .where('user.id != :userId', { userId: user!.id })
      .andWhere('user.isActive = true')
      .andWhere('user.age BETWEEN :minAge AND :maxAge', {
        minAge: user!.preferences.ageRange.min,
        maxAge: user!.preferences.ageRange.max
      })
      .limit(limit)
      .getMany();

    return users;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteAccount(@Ctx() { user }: AuthContext): Promise<boolean> {
    const userRepository = AppDataSource.getRepository(User);

    // Soft delete - mark as inactive
    user!.isActive = false;
    user!.isOnline = false;
    await userRepository.save(user!);

    logger.info(`Account deactivated for user: ${user!.id}`);
    return true;
  }
}