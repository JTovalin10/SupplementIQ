/**
 * SecurityTree TypeScript Wrapper
 * Provides admin request security tracking with C++ performance
 */

import * as path from 'path';

interface SecurityTreeService {
  canMakeRequest(adminId: string, timestamp: number): boolean;
  recordRequest(adminId: string, timestamp: number): void;
  isRequestExpired(requestTimestamp: number, currentTimestamp: number, expirationMinutes?: number): boolean;
  cleanupExpiredRequests(currentTimestamp: number): void;
  hasAdminMadeRequestToday(adminId: string, timestamp: number): boolean;
  getAdminRequestCountToday(adminId: string, timestamp: number): number;
  resetDaily(): void;
  needsDailyReset(timestamp: number): boolean;
  getAllAdminStats(timestamp: number): AdminStats[];
  getTotalRequestsToday(timestamp: number): number;
  getCurrentTimestamp(): number;
  validateAdminId(adminId: string): boolean;
}

interface AdminStats {
  adminId: string;
  requestsToday: number;
  lastRequestTime: number;
  hasActiveRequest: boolean;
}

let securityTreeService: SecurityTreeService | null = null;

function loadSecurityTreeModule(): SecurityTreeService | null {
  try {
    const modulePath = path.join(__dirname, '../../tools/SecurityTree/build/Release/security_tree_addon.node');
    console.log(`Attempting to load SecurityTree module from: ${modulePath}`);
    const addon = require(modulePath);
    console.log('SecurityTree module loaded successfully.');
    return addon.createSecurityTree();
  } catch (error) {
    console.error('Failed to load SecurityTree module:', error);
    return null;
  }
}

export function getSecurityTreeService(): SecurityTreeService {
  if (!securityTreeService) {
    securityTreeService = loadSecurityTreeModule();
    if (!securityTreeService) {
      throw new Error('SecurityTree Service is not available.');
    }
  }
  return securityTreeService;
}

export async function initializeSecurityTreeService(): Promise<boolean> {
  try {
    const service = getSecurityTreeService();
    // Test the service
    const timestamp = service.getCurrentTimestamp();
    console.log(`SecurityTree service initialized at timestamp: ${timestamp}`);
    return true;
  } catch (error) {
    console.error('Error initializing SecurityTree Service:', error);
    return false;
  }
}

// Fallback TypeScript implementation for development/testing
class FallbackSecurityTreeService implements SecurityTreeService {
  private adminRecords: Map<string, { requestsToday: number; lastRequestTime: number; hasActiveRequest: boolean; dayStartTime: number }> = new Map();
  private lastResetDay: string = '';

  canMakeRequest(adminId: string, timestamp: number): boolean {
    this.cleanupExpiredRequests(timestamp);
    
    if (this.hasAdminMadeRequestToday(adminId, timestamp)) {
      console.log(`🚫 Admin ${adminId} has already made a request today`);
      return false;
    }
    
    const record = this.adminRecords.get(adminId);
    if (record && record.hasActiveRequest) {
      if (!this.isRequestExpired(record.lastRequestTime, timestamp)) {
        console.log(`🚫 Admin ${adminId} has an active non-expired request`);
        return false;
      }
    }
    
    return true;
  }

  recordRequest(adminId: string, timestamp: number): void {
    const dayStart = this.getDayStart(timestamp);
    const record = this.adminRecords.get(adminId) || {
      requestsToday: 0,
      lastRequestTime: 0,
      hasActiveRequest: false,
      dayStartTime: 0
    };
    
    if (record.dayStartTime !== dayStart) {
      record.requestsToday = 0;
      record.dayStartTime = dayStart;
    }
    
    record.requestsToday++;
    record.lastRequestTime = timestamp;
    record.hasActiveRequest = true;
    
    this.adminRecords.set(adminId, record);
    console.log(`✅ Recorded request for admin ${adminId} at timestamp ${timestamp} (requests today: ${record.requestsToday})`);
  }

  isRequestExpired(requestTimestamp: number, currentTimestamp: number, expirationMinutes: number = 10): boolean {
    if (requestTimestamp <= 0 || currentTimestamp <= 0) {
      return true;
    }
    
    const expirationTime = requestTimestamp + (expirationMinutes * 60);
    return currentTimestamp > expirationTime;
  }

  cleanupExpiredRequests(currentTimestamp: number): void {
    let expiredCount = 0;
    for (const [adminId, record] of this.adminRecords) {
      if (record.hasActiveRequest && this.isRequestExpired(record.lastRequestTime, currentTimestamp)) {
        record.hasActiveRequest = false;
        expiredCount++;
        console.log(`🧹 Expired request for admin ${adminId}`);
      }
    }
    
    if (expiredCount > 0) {
      console.log(`🧹 Cleaned up ${expiredCount} expired requests`);
    }
  }

  hasAdminMadeRequestToday(adminId: string, timestamp: number): boolean {
    const record = this.adminRecords.get(adminId);
    if (!record) {
      return false;
    }
    
    const dayStart = this.getDayStart(timestamp);
    return record.dayStartTime === dayStart && record.requestsToday > 0;
  }

  getAdminRequestCountToday(adminId: string, timestamp: number): number {
    const record = this.adminRecords.get(adminId);
    if (!record) {
      return 0;
    }
    
    const dayStart = this.getDayStart(timestamp);
    if (record.dayStartTime === dayStart) {
      return record.requestsToday;
    }
    
    return 0;
  }

  resetDaily(): void {
    console.log('🔄 Resetting SecurityTree for new day (fallback)');
    for (const [adminId, record] of this.adminRecords) {
      record.requestsToday = 0;
      record.hasActiveRequest = false;
    }
    console.log('✅ SecurityTree reset completed (fallback)');
  }

  needsDailyReset(timestamp: number): boolean {
    const today = new Date(timestamp * 1000).toDateString();
    return today !== this.lastResetDay;
  }

  getAllAdminStats(timestamp: number): AdminStats[] {
    const stats: AdminStats[] = [];
    for (const [adminId, record] of this.adminRecords) {
      stats.push({
        adminId,
        requestsToday: record.requestsToday,
        lastRequestTime: record.lastRequestTime,
        hasActiveRequest: record.hasActiveRequest
      });
    }
    return stats;
  }

  getTotalRequestsToday(timestamp: number): number {
    let total = 0;
    const dayStart = this.getDayStart(timestamp);
    
    for (const [adminId, record] of this.adminRecords) {
      if (record.dayStartTime === dayStart) {
        total += record.requestsToday;
      }
    }
    
    return total;
  }

  getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  validateAdminId(adminId: string): boolean {
    // UUID v4 validation (Supabase standard format)
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return Boolean(adminId && uuidV4Regex.test(adminId));
  }

  private getDayStart(timestamp: number): number {
    // Convert to PST/PDT timezone (UTC-8 or UTC-7)
    const date = new Date(timestamp * 1000);
    
    // Get PST/PDT offset (handles DST automatically)
    const pstOffset = -8 * 60; // PST is UTC-8 (in minutes)
    const pdtOffset = -7 * 60; // PDT is UTC-7 (in minutes)
    
    // Check if we're in DST (rough approximation: March-November)
    const month = date.getUTCMonth();
    const isDST = month >= 2 && month <= 10; // March (2) to November (10)
    const offset = isDST ? pdtOffset : pstOffset;
    
    // Apply PST/PDT offset
    const pstDate = new Date(date.getTime() + (offset * 60 * 1000));
    
    // Set to midnight PST/PDT
    pstDate.setUTCHours(0, 0, 0, 0);
    
    // Convert back to UTC timestamp
    const utcTimestamp = Math.floor(pstDate.getTime() / 1000) - (offset * 60);
    
    return utcTimestamp;
  }
}

// Initialize service with fallback
let securityService: SecurityTreeService;

try {
  securityService = getSecurityTreeService();
  console.log('✅ Using high-performance C++ SecurityTree service');
} catch (error) {
  console.warn('⚠️ C++ SecurityTree service unavailable, falling back to TypeScript version');
  console.warn('Error:', error);
  securityService = new FallbackSecurityTreeService();
}

export { securityService };
