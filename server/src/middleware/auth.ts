import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenPayload } from '../utils/token.js';
import { User, type IUser } from '../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
        errors: ['Missing bearer authorization header'],
      });
      return;
    }

    let payload: TokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: unknown) {
      const isExpired = err instanceof Error && err.name === 'TokenExpiredError';
      res.status(401).json({
        success: false,
        message: isExpired ? 'Access token expired.' : 'Invalid access token.',
        errors: [isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'],
      });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists.',
        errors: ['USER_NOT_FOUND'],
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact laboratory administration.',
        errors: ['ACCOUNT_DEACTIVATED'],
      });
      return;
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    next(error);
  }
}
