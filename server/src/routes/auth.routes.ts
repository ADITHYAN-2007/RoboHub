import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  REFRESH_COOKIE_NAME,
} from '../utils/token.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  collegeId: z.string().min(3, 'College/Student ID is required'),
  email: z.string().email('Valid institutional email is required'),
  department: z.string().min(2, 'Department is required'),
  year: z.string().optional(),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
    ),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingEmail = await User.findOne({ email: data.email.toLowerCase() });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
        errors: ['EMAIL_ALREADY_EXISTS'],
      });
      return;
    }

    const existingCollegeId = await User.findOne({ collegeId: data.collegeId.trim() });
    if (existingCollegeId) {
      res.status(409).json({
        success: false,
        message: 'An account with this Student / College ID already exists.',
        errors: ['COLLEGE_ID_ALREADY_EXISTS'],
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Registration ALWAYS defaults strictly to STUDENT
    const user = await User.create({
      fullName: data.fullName.trim(),
      collegeId: data.collegeId.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      department: data.department.trim(),
      year: data.year || '1st Year',
      phone: data.phone || '',
      role: 'STUDENT',
      isVerified: true, // Auto-verified for instant access in demo/evaluation mode
      isActive: true,
      verificationToken,
      verificationExpires,
    });

    await logAudit({
      actor: user._id,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user._id.toString(),
      details: `New student registration: ${user.email}`,
      req,
    });

    // Create session & tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const refreshTokenHash = hashToken(refreshToken);

    const session = await Session.create({
      user: user._id,
      sessionToken: crypto.randomUUID(),
      refreshTokenHash,
      device: req.headers['user-agent']?.includes('Mobile') ? 'Mobile' : 'Desktop',
      browser: req.headers['user-agent'] || 'Modern Web Browser',
      ip: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Welcome to RoboLab Hub!',
      data: {
        user,
        accessToken,
        sessionId: session._id,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      await logAudit({
        action: 'LOGIN_FAILED',
        entity: 'User',
        details: `Login failed for non-existent email: ${email}`,
        req,
      });
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        errors: ['INVALID_CREDENTIALS'],
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account is currently deactivated. Please contact laboratory administration.',
        errors: ['ACCOUNT_DEACTIVATED'],
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await logAudit({
        actor: user._id,
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user._id.toString(),
        details: `Login failed: Incorrect password for ${user.email}`,
        req,
      });
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        errors: ['INVALID_CREDENTIALS'],
      });
      return;
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const refreshTokenHash = hashToken(refreshToken);

    const session = await Session.create({
      user: user._id,
      sessionToken: crypto.randomUUID(),
      refreshTokenHash,
      device: req.headers['user-agent']?.includes('Mobile') ? 'Mobile' : 'Desktop',
      browser: req.headers['user-agent'] || 'Modern Web Browser',
      ip: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setRefreshTokenCookie(res, refreshToken);

    await logAudit({
      actor: user._id,
      action: 'LOGIN',
      entity: 'Session',
      entityId: session._id.toString(),
      details: `User logged in from ${session.device}`,
      req,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        accessToken,
        sessionId: session._id,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;

    if (!rawRefreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token not found.',
        errors: ['REFRESH_TOKEN_MISSING'],
      });
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      clearRefreshTokenCookie(res);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token. Please sign in again.',
        errors: ['REFRESH_TOKEN_EXPIRED'],
      });
      return;
    }

    const currentHash = hashToken(rawRefreshToken);
    const session = await Session.findOne({
      user: payload.userId,
      refreshTokenHash: currentHash,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      clearRefreshTokenCookie(res);
      res.status(401).json({
        success: false,
        message: 'Session has been revoked or expired.',
        errors: ['SESSION_REVOKED'],
      });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      clearRefreshTokenCookie(res);
      res.status(403).json({
        success: false,
        message: 'Account inactive or removed.',
        errors: ['ACCOUNT_INACTIVE'],
      });
      return;
    }

    // Rotate refresh token
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    const newRefreshTokenHash = hashToken(newRefreshToken);

    session.refreshTokenHash = newRefreshTokenHash;
    session.lastActiveAt = new Date();
    await session.save();

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        accessToken: newAccessToken,
        user,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (rawRefreshToken && req.user) {
      const currentHash = hashToken(rawRefreshToken);
      await Session.updateOne({ refreshTokenHash: currentHash }, { revoked: true });
    }

    clearRefreshTokenCookie(res);

    if (req.user) {
      await logAudit({
        actor: req.user._id,
        action: 'LOGOUT',
        entity: 'Session',
        details: 'User logged out',
        req,
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || !passwordRegex.test(newPassword)) {
      res.status(400).json({
        success: false,
        message:
          'New password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
        errors: ['INVALID_NEW_PASSWORD'],
      });
      return;
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: 'Current password does not match.',
        errors: ['PASSWORD_MISMATCH'],
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Revoke other sessions
    await Session.updateMany({ user: user._id }, { revoked: true });

    await logAudit({
      actor: user._id,
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      entityId: user._id.toString(),
      details: 'User changed account password',
      req,
    });

    res.json({
      success: true,
      message: 'Password changed successfully. Please sign in again with your new credentials.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Return token in response for demonstration / testing verification
      res.json({
        success: true,
        message: 'If an account exists with that email, a password reset token has been generated.',
        demoResetToken: resetToken, // Provided to allow smooth interactive testing
      });
      return;
    }

    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset token has been generated.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'Token and new password are required' });
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({
        success: false,
        message:
          'Password must contain at least 8 characters, uppercase, lowercase, number, and special character.',
      });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
        errors: ['INVALID_OR_EXPIRED_TOKEN'],
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await Session.updateMany({ user: user._id }, { revoked: true });

    await logAudit({
      actor: user._id,
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      entityId: user._id.toString(),
      details: 'Password was reset via security token',
      req,
    });

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Verification token is required' });
      return;
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.',
      });
      return;
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/sessions
router.get('/sessions', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user!._id, revoked: false })
      .sort({ lastActiveAt: -1 })
      .select('-refreshTokenHash');

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auth/sessions/:sessionId
router.delete('/sessions/:sessionId', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      user: req.user!._id,
    });

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found.' });
      return;
    }

    session.revoked = true;
    await session.save();

    res.json({
      success: true,
      message: 'Session revoked successfully.',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auth/sessions (revoke all other sessions)
router.delete('/sessions', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME];
    const currentHash = rawRefreshToken ? hashToken(rawRefreshToken) : '';

    await Session.updateMany(
      {
        user: req.user!._id,
        refreshTokenHash: { $ne: currentHash },
      },
      { revoked: true }
    );

    res.json({
      success: true,
      message: 'All other active sessions revoked.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
