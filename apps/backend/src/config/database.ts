import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Match } from '../models/Match';
import { Message } from '../models/Message';
import { PersonalityScore } from '../models/PersonalityScore';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'mindmatch',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mindmatch_db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Match, Message, PersonalityScore],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});