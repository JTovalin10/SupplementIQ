use anyhow::Result;
use chrono::{DateTime, Utc};
use dashmap::DashMap;
use moka::future::Cache;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tracing::{info, error, warn};

/// Cache statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub total_entries: u64,
    pub hit_count: u64,
    pub miss_count: u64,
    pub eviction_count: u64,
    pub memory_usage_bytes: u64,
    pub last_reset_time: DateTime<Utc>,
}

/// Cache Manager - Handles caching operations for the DailyUpdateService
/// 
/// Responsibilities:
/// - Manage product data caching
/// - Handle cache invalidation and updates
/// - Provide cache statistics and monitoring
/// - Implement cache reset functionality
/// - Handle cache persistence and recovery
pub struct CacheManager {
    // Main product cache
    product_cache: Arc<Cache<String, String>>,
    
    // Admin cache (only reset on system outage)
    admin_cache: Arc<DashMap<String, String>>,
    
    // Cache statistics
    hit_count: Arc<DashMap<String, u64>>,
    miss_count: Arc<DashMap<String, u64>>,
    eviction_count: Arc<DashMap<String, u64>>,
    entry_count: Arc<std::sync::atomic::AtomicU64>,
    
    // Last reset time
    last_reset_time: Arc<DashMap<String, DateTime<Utc>>>,
    
    // Cache configuration
    max_capacity: u64,
    ttl_seconds: u64,
}

impl CacheManager {
    /// Create a new CacheManager instance
    pub fn new() -> Self {
        Self {
            product_cache: Arc::new(
                Cache::builder()
                    .max_capacity(10_000)
                    .time_to_live(Duration::from_secs(3600)) // 1 hour TTL
                    .time_to_idle(Duration::from_secs(1800)) // 30 minutes idle
                    .build(),
            ),
            admin_cache: Arc::new(DashMap::new()),
            hit_count: Arc::new(DashMap::new()),
            miss_count: Arc::new(DashMap::new()),
            eviction_count: Arc::new(DashMap::new()),
            entry_count: Arc::new(std::sync::atomic::AtomicU64::new(0)),
            last_reset_time: Arc::new(DashMap::new()),
            max_capacity: 10_000,
            ttl_seconds: 3600,
        }
    }
    
    /// Initialize the cache manager
    pub async fn initialize(&self) -> Result<bool> {
        info!("🔧 Initializing CacheManager...");
        
        // Initialize statistics
        self.hit_count.insert("product_cache".to_string(), 0);
        self.miss_count.insert("product_cache".to_string(), 0);
        self.eviction_count.insert("product_cache".to_string(), 0);
        self.last_reset_time.insert("product_cache".to_string(), Utc::now());
        
        info!("✅ CacheManager initialized successfully");
        Ok(true)
    }
    
    /// Get a value from the product cache
    pub async fn get(&self, key: &str) -> Option<String> {
        match self.product_cache.get(key).await {
            Some(value) => {
                // Update hit count
                if let Some(mut count) = self.hit_count.get_mut("product_cache") {
                    *count += 1;
                }
                Some(value)
            }
            None => {
                // Update miss count
                if let Some(mut count) = self.miss_count.get_mut("product_cache") {
                    *count += 1;
                }
                None
            }
        }
    }
    
    /// Insert a value into the product cache
    pub async fn insert(&self, key: String, value: String) {
        let is_new_key = !self.product_cache.contains_key(&key);
        self.product_cache.insert(key, value).await;
        // Increment entry count if this is a new key
        if is_new_key {
            self.entry_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        }
    }
    
    /// Insert multiple values into the product cache
    pub async fn insert_batch(&self, entries: Vec<(String, String)>) {
        for (key, value) in entries {
            let is_new_key = !self.product_cache.contains_key(&key);
            self.product_cache.insert(key, value).await;
            if is_new_key {
                self.entry_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
            }
        }
    }
    
    /// Remove a value from the product cache
    pub async fn remove(&self, key: &str) {
        let had_key = self.product_cache.contains_key(key);
        self.product_cache.invalidate(key).await;
        if had_key {
            self.entry_count.fetch_sub(1, std::sync::atomic::Ordering::Relaxed);
        }
    }
    
    /// Clear all product cache entries
    pub async fn clear(&self) {
        self.product_cache.invalidate_all();
        self.entry_count.store(0, std::sync::atomic::Ordering::Relaxed);
        info!("🧹 Product cache cleared");
    }
    
    /// Get admin cache value
    pub fn get_admin(&self, key: &str) -> Option<String> {
        self.admin_cache.get(key).map(|entry| entry.value().clone())
    }
    
    /// Insert admin cache value
    pub fn insert_admin(&self, key: String, value: String) {
        self.admin_cache.insert(key, value);
    }
    
    /// Clear admin cache (only on system outage)
    pub fn clear_admin(&self) {
        self.admin_cache.clear();
        info!("🧹 Admin cache cleared");
    }
    
    /// Perform daily cache reset (excluding admin cache)
    pub async fn perform_daily_cache_reset(&self) -> Result<()> {
        info!("🔄 Performing daily cache reset...");
        
        // Clear product cache
        self.clear().await;
        
        // Reset statistics
        self.hit_count.insert("product_cache".to_string(), 0);
        self.miss_count.insert("product_cache".to_string(), 0);
        self.eviction_count.insert("product_cache".to_string(), 0);
        
        // Update reset time
        self.last_reset_time.insert("product_cache".to_string(), Utc::now());
        
        info!("✅ Daily cache reset completed");
        Ok(())
    }
    
    /// Get cache statistics
    pub async fn get_cache_stats(&self) -> CacheStats {
        let total_entries = self.entry_count.load(std::sync::atomic::Ordering::Relaxed);
        
        let hit_count = self.hit_count
            .get("product_cache")
            .map(|entry| *entry.value())
            .unwrap_or(0);
        
        let miss_count = self.miss_count
            .get("product_cache")
            .map(|entry| *entry.value())
            .unwrap_or(0);
        
        let eviction_count = self.eviction_count
            .get("product_cache")
            .map(|entry| *entry.value())
            .unwrap_or(0);
        
        let last_reset_time = self.last_reset_time
            .get("product_cache")
            .map(|entry| *entry.value())
            .unwrap_or_else(|| Utc::now());
        
        // Estimate memory usage (rough calculation)
        let memory_usage_bytes = total_entries * 1024; // Rough estimate
        
        CacheStats {
            total_entries,
            hit_count,
            miss_count,
            eviction_count,
            memory_usage_bytes,
            last_reset_time,
        }
    }
    
    /// Shutdown the cache manager
    pub async fn shutdown(&self) -> Result<()> {
        info!("🔧 Shutting down CacheManager...");
        
        // Clear all caches
        self.clear().await;
        self.clear_admin();
        
        info!("✅ CacheManager shut down");
        Ok(())
    }
}
