import { AuthChecker } from 'type-graphql';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';

export interface AuthContext {
  req: any;
  res: any;
  user?: User;
  io?: any;
}

export const authMiddleware: AuthChecker<AuthContext> = async ({ context }, roles) => {
  const { req } = context;
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return false;
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { id: decoded.userId },
      relations: ['personalityScores']
    });

    if (!user) {
      return false;
    }

    // Add user to context
    context.user = user;

    // Check roles if specified
    if (roles.length > 0) {
      // For now, we'll implement basic role checking
      // In the future, you might want to add role-based access control
      return true;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
};