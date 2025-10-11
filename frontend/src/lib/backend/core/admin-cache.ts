/**
 * Admin cache system for efficient role checking
 * Caches admin list and automatically invalidates when admins are added/removed
 */

import { supabase } from '../supabase';

interface CachedAdmin {
  id: string;
  role: string;
}

interface AdminCache {
  admins: CachedAdmin[];
  lastUpdated: number;
  ownerId: string | null;
  ownerLastUpdated: number;
}

class AdminCacheManager {
  private cache: AdminCache = {
    admins: [],
    lastUpdated: 0,
    ownerId: null,
    ownerLastUpdated: 0
  };

  /**
   * Get all admins from cache or database
   * Cache only refreshes when admins are added/removed, not by time
   */
  async getAdmins(): Promise<CachedAdmin[]> {
    if (this.cache.admins.length === 0) {
      await this.refreshCache();
    }
    return this.cache.admins;
  }

  /**
   * Get admin count efficiently
   */
  async getAdminCount(): Promise<number> {
    const admins = await this.getAdmins();
    return admins.filter(admin => admin.role === 'admin').length;
  }

  /**
   * Check if user is an admin using cache
   */
  async isUserAdmin(userId: string): Promise<boolean> {
    const admins = await this.getAdmins();
    return admins.some(admin => admin.id === userId && admin.role === 'admin');
  }

  /**
   * Check if user is owner using cached owner ID
   */
  async isUserOwner(userId: string): Promise<boolean> {
    const ownerId = await this.getOwnerId();
    return ownerId === userId;
  }

  /**
   * Get user authority (admin/owner status) in a single query
   */
  async getUserAuthority(userId: string): Promise<{ isAdmin: boolean; isOwner: boolean; role: string | null }> {
    const admins = await this.getAdmins();
    const user = admins.find(admin => admin.id === userId);
    
    if (!user) {
      return { isAdmin: false, isOwner: false, role: null };
    }

    return {
      isAdmin: user.role === 'admin',
      isOwner: user.role === 'owner',
      role: user.role
    };
  }

  /**
   * Get owner ID from cache
   */
  async getOwnerId(): Promise<string | null> {
    // If owner ID not cached, find it from admin list
    if (!this.cache.ownerId) {
      const admins = await this.getAdmins();
      const owner = admins.find(admin => admin.role === 'owner');
      this.cache.ownerId = owner ? owner.id : null;
    }
    
    return this.cache.ownerId;
  }

  /**
   * Refresh the cache from database
   */
  private async refreshCache(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, role')
        .in('role', ['admin', 'owner']);

      if (error) {
        console.error('Failed to refresh admin cache:', error);
        return;
      }

      this.cache.admins = data || [];
      this.cache.lastUpdated = Date.now();
      
      console.log(`Admin cache refreshed: ${this.cache.admins.length} admins/owners cached`);
    } catch (error) {
      console.error('Error refreshing admin cache:', error);
    }
  }


  /**
   * Force refresh the cache (used when admins are added/removed)
   */
  async invalidateCache(): Promise<void> {
    console.log('Invalidating admin cache...');
    this.cache.admins = [];
    this.cache.lastUpdated = 0;
    await this.refreshCache();
  }

  /**
   * Add a new admin to cache without full refresh
   */
  async addAdminToCache(adminData: { id: string; role: string }): Promise<void> {
    // Check if admin already exists
    const existingIndex = this.cache.admins.findIndex(admin => admin.id === adminData.id);
    
    if (existingIndex >= 0) {
      // Update existing admin
      this.cache.admins[existingIndex] = adminData;
    } else {
      // Add new admin
      this.cache.admins.push(adminData);
    }
    
    // Note: Owner ID changes are handled separately via updateOwnerId()
    
    console.log(`✅ Admin added to cache: ${adminData.id} (${adminData.role})`);
  }

  /**
   * Remove an admin from cache without full refresh
   */
  async removeAdminFromCache(userId: string): Promise<void> {
    const initialLength = this.cache.admins.length;
    this.cache.admins = this.cache.admins.filter(admin => admin.id !== userId);
    
    // Note: Owner ID changes are handled separately via updateOwnerId()
    
    if (this.cache.admins.length < initialLength) {
      console.log(`✅ Admin removed from cache: ${userId}`);
    }
  }

  /**
   * Update owner ID (called when owner changes)
   */
  async updateOwnerId(newOwnerId: string | null): Promise<void> {
    this.cache.ownerId = newOwnerId;
    this.cache.ownerLastUpdated = Date.now();
    console.log(`✅ Owner ID updated in cache: ${newOwnerId}`);
  }

  /**
   * Cold start - initialize cache from database (for system outages)
   */
  async coldStart(): Promise<void> {
    console.log('🔄 Cold start: Initializing admin cache...');
    this.cache.admins = [];
    this.cache.ownerId = null;
    this.cache.lastUpdated = 0;
    this.cache.ownerLastUpdated = 0;
    
    await this.refreshCache();
    
    // Set owner ID after loading admins
    const owner = this.cache.admins.find(admin => admin.role === 'owner');
    this.cache.ownerId = owner ? owner.id : null;
    
    console.log(`✅ Cold start complete: ${this.cache.admins.length} admins/owners loaded, owner: ${this.cache.ownerId}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalCached: number;
    adminCount: number;
    ownerCount: number;
    lastUpdated: Date;
  } {
    const adminCount = this.cache.admins.filter(admin => admin.role === 'admin').length;
    const ownerCount = this.cache.admins.filter(admin => admin.role === 'owner').length;

    return {
      totalCached: this.cache.admins.length,
      adminCount,
      ownerCount,
      lastUpdated: new Date(this.cache.lastUpdated),
    };
  }
}

// Singleton instance
export const adminCache = new AdminCacheManager();

/**
 * Utility function to invalidate admin cache when admins are modified
 * Call this after creating or removing admins
 */
export async function invalidateAdminCache(): Promise<void> {
  await adminCache.invalidateCache();
}
