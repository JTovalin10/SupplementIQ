/**
 * Admin utilities for authentication and validation
 */

import { supabase } from '../../lib/supabase';
import { adminCache } from '../../lib/core/admin-cache';

// Admin management - fetch from database
const OWNER_ROLE = 'owner'; // Database role for owner

/**
 * Get user role and authority using cached data
 * @param userId - The user ID to check
 * @returns Promise<{isAdmin: boolean, isOwner: boolean, role: string | null}>
 */
export async function getUserAuthority(userId: string): Promise<{isAdmin: boolean, isOwner: boolean, role: string | null}> {
  try {
    return await adminCache.getUserAuthority(userId);
  } catch (error) {
    console.error(`❌ Exception checking user authority for ${userId}:`, error);
    return { isAdmin: false, isOwner: false, role: null };
  }
}

/**
 * Check if a user is an admin using cache
 * @param userId - The user ID to check
 * @returns Promise<boolean> - true if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  return await adminCache.isUserAdmin(userId);
}

/**
 * Get admin count using cache
 * @returns Promise<number> - Number of admin users
 */
export async function getAdminCount(): Promise<number> {
  return await adminCache.getAdminCount();
}

/**
 * Get all admin users from the database (DEPRECATED - use getAdminCount for performance)
 * @deprecated Use getAdminCount() instead for better performance
 * @returns Promise<string[]> - Array of admin user IDs
 */
export async function getAllAdmins(): Promise<string[]> {
  console.warn('⚠️  getAllAdmins() is deprecated and inefficient. Use getAdminCount() instead.');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(50); // Reduced limit for safety

    if (error) {
      console.error('❌ Error fetching admin list:', error.message);
      return [];
    }

    return data?.map(user => user.id) || [];
  } catch (error) {
    console.error('❌ Exception fetching admin list:', error);
    return [];
  }
}

/**
 * Check if a user is the owner using cache
 * @param userId - The user ID to check
 * @returns Promise<boolean> - true if user is owner
 */
export async function isUserOwner(userId: string): Promise<boolean> {
  return await adminCache.isUserOwner(userId);
}

/**
 * Get the owner user from the database
 * @returns Promise<string | null> - Owner user ID or null if not found
 */
export async function getOwnerId(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('role', OWNER_ROLE)
      .single();

    if (error) {
      console.error('❌ Error fetching owner ID:', error.message);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('❌ Exception fetching owner ID:', error);
    return null;
  }
}

/**
 * Validate admin ID format
 * @param adminId - The admin ID to validate
 * @returns boolean - true if valid
 */
export function validateAdminId(adminId: string): boolean {
  if (!adminId || typeof adminId !== 'string') {
    return false;
  }
  
  // Check length (1-100 characters)
  if (adminId.length < 1 || adminId.length > 100) {
    return false;
  }
  
  // Check for valid characters (alphanumeric, hyphens, underscores)
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(adminId);
}

/**
 * Check if current time is within update restriction window
 * @param scheduledUpdateHour - Hour when daily update runs (default: 3 AM)
 * @returns boolean - true if within restriction window
 */
export function isWithinUpdateWindow(scheduledUpdateHour: number = 3): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const oneHourBuffer = 1;
  
  return (currentHour >= (scheduledUpdateHour - oneHourBuffer) && 
          currentHour <= (scheduledUpdateHour + oneHourBuffer));
}

/**
 * Check if enough time has passed since last update
 * @param lastUpdateTime - Timestamp of last update
 * @param cooldownHours - Hours to wait between updates (default: 2)
 * @returns boolean - true if cooldown period has passed
 */
export function hasCooldownPassed(lastUpdateTime: Date, cooldownHours: number = 2): boolean {
  const now = new Date();
  const timeDiff = now.getTime() - lastUpdateTime.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff >= cooldownHours;
}

/**
 * Generate a unique request ID
 * @returns string - Unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a request has expired
 * @param requestTimestamp - When the request was created
 * @param expirationMinutes - Minutes until expiration (default: 10)
 * @returns boolean - true if request has expired
 */
export function isRequestExpired(requestTimestamp: Date, expirationMinutes: number = 10): boolean {
  const now = new Date();
  const timeDiff = now.getTime() - requestTimestamp.getTime();
  const minutesDiff = timeDiff / (1000 * 60);
  
  return minutesDiff > expirationMinutes;
}
