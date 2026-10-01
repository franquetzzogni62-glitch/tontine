import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './db.js';

export interface UserSession {
  token: string;
  userId: string;
  role: 'moderator' | 'admin' | 'member';
  groupId?: string;
  memberId?: string;
  user: any;
  createdAt: number;
  expiresAt: number;
}

// In-memory session store (with TTL)
const activeSessions = new Map<string, UserSession>();

// Cleanup expired sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(token);
    }
  }
}, 10 * 60 * 1000);

export function createSession(
  user: any,
  role: 'moderator' | 'admin' | 'member',
  groupId?: string,
  memberId?: string
): UserSession {
  const token = `tf_${crypto.randomBytes(32).toString('hex')}`;
  // Moderator: 7 days, Member: 3 days
  const ttl = role === 'member' ? 3 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const session: UserSession = {
    token,
    userId: user.id,
    role,
    groupId,
    memberId,
    user,
    createdAt: now,
    expiresAt: now + ttl,
  };

  activeSessions.set(token, session);
  return session;
}

export function getSession(token?: string): UserSession | null {
  if (!token) return null;
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const session = activeSessions.get(cleanToken);
  if (!session) return null;

  if (session.expiresAt < Date.now()) {
    activeSessions.delete(cleanToken);
    return null;
  }
  return session;
}

export function deleteSession(token?: string): boolean {
  if (!token) return false;
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  return activeSessions.delete(cleanToken);
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userSession?: UserSession;
      authenticatedUser?: any;
    }
  }
}

/**
 * Authentication Middleware:
 * Rejects with 401 JSON if not authenticated.
 */
export function requireAuth(allowedRoles?: Array<'moderator' | 'admin' | 'member'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || (req.headers['x-session-token'] as string);
    const session = getSession(authHeader);

    if (!session) {
      return res.status(401).json({
        error: 'Non autorisé. Veuillez vous connecter avec un compte valide.',
        code: 'UNAUTHORIZED',
      });
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      return res.status(403).json({
        error: 'Accès interdit pour votre profil utilisateur.',
        code: 'FORBIDDEN',
      });
    }

    req.userSession = session;
    req.authenticatedUser = session.user;
    next();
  };
}

export const requireModerator = requireAuth(['moderator', 'admin']);
export const requireMember = requireAuth(['member']);
