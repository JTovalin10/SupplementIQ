/**
 * Authentication Middleware
 * Validates JWT tokens and extracts authenticated user information
 */

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';

// Extend Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email: string;
        username?: string;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Validates JWT token and extracts user information
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'Authorization header with Bearer token is required'
      });
    }

    // Verify JWT token (you'll need to implement this based on your JWT secret)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    if (!decoded.sub) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token does not contain user information'
      });
    }

    // Get user information from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role, email, username')
      .eq('id', decoded.sub)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'Authenticated user does not exist'
      });
    }

    // Add user information to request object
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      username: user.username
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
}

/**
 * Admin Authorization Middleware
 * Ensures the authenticated user has admin or owner role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'User must be authenticated'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      message: 'Admin or owner role required'
    });
  }

  next();
}

/**
 * Owner Authorization Middleware
 * Ensures the authenticated user has owner role
 */
export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'User must be authenticated'
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      message: 'Owner role required'
    });
  }

  next();
}

/**
 * Middleware to ensure user can only act as themselves
 * Prevents admin ID spoofing attacks
 */
export function preventIdSpoofing(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'User must be authenticated'
    });
  }

  // Check if request body contains user IDs that don't match authenticated user
  const bodyUserIds = [
    req.body.requesterId,
    req.body.adminId,
    req.body.userId,
    req.body.ownerId
  ].filter(Boolean);

  const authenticatedUserId = req.user.id;

  for (const bodyUserId of bodyUserIds) {
    if (bodyUserId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'ID spoofing detected',
        message: 'You can only perform actions as your authenticated user',
        authenticatedUserId,
        attemptedUserId: bodyUserId
      });
    }
  }

  next();
}

/**
 * Role-based authentication middleware functions
 */

// Newcomer role (any authenticated user)
export function requireNewcomer(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'User must be authenticated'
    });
  }
  next();
}

// Contributor role (20+ contributions)
export function requireContributor(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'User must be authenticated'
    });
  }

  // Check if user has contributor role or higher
  const allowedRoles = ['contributor', 'trusted_editor', 'moderator', 'admin', 'owner'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      message: 'Contributor role or higher required (20+ contributions)'
    });
  }

  next();
}

// Trusted Editor role (100+ contributions)
export function requireTrustedEditor(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'User must be authenticated'
    });
  }

  const allowedRoles = ['trusted_editor', 'moderator', 'admin', 'owner'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      message: 'Trusted Editor role or higher required (100+ contributions)'
    });
  }

  next();
}

// Moderator role (1000+ contributions + community respect)
export function requireModerator(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'User must be authenticated'
    });
  }

  const allowedRoles = ['moderator', 'admin', 'owner'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      message: 'Moderator role or higher required (1000+ contributions + community respect)'
    });
  }

  next();
}

/**
 * Combined middleware for different role levels
 */
export const newcomerAuth = [authenticateToken, requireNewcomer, preventIdSpoofing];
export const contributorAuth = [authenticateToken, requireContributor, preventIdSpoofing];
export const trustedEditorAuth = [authenticateToken, requireTrustedEditor, preventIdSpoofing];
export const moderatorAuth = [authenticateToken, requireModerator, preventIdSpoofing];
export const adminAuth = [authenticateToken, requireAdmin, preventIdSpoofing];
export const ownerAuth = [authenticateToken, requireOwner, preventIdSpoofing];
