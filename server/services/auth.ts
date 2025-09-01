import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { type User } from '@shared/schema';
import { storage } from '../storage';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'default_refresh_secret';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateTokens(user: User): AuthTokens {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return null;
    }
  }

  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
    } catch {
      return null;
    }
  }

  static async getUserFromToken(token: string): Promise<User | null> {
    const payload = this.verifyAccessToken(token);
    if (!payload) return null;

    const user = await storage.getUser(payload.userId);
    return user || null;
  }
}
