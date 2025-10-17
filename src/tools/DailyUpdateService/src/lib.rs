use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error, warn};

pub mod cache_manager;
pub mod go_integration;
pub mod config;

use cache_manager::CacheManager;
use go_integration::GoIntegration;
use config::ServiceConfig;

/// Product data structure for temporary products processing (matches products table schema)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductData {
    pub id: Option<i32>,
    pub brand_id: Option<i32>,
    pub category: String, // product_category enum
    pub name: String,
    pub slug: String,
    pub image_url: Option<String>,
    pub description: Option<String>,
    pub servings_per_container: Option<i32>,
    pub serving_size_g: Option<f64>,
    pub transparency_score: Option<i32>,
    pub confidence_level: Option<String>,
    pub dosage_rating: Option<i32>,
    pub danger_rating: Option<i32>,
    pub community_rating: Option<f64>,
    pub total_reviews: Option<i32>,
    // Approval status: 1 = approved, 0 = pending, -1 = denied
    pub approval_status: i32,
    pub submitted_by: String, // UUID
    pub reviewed_by: Option<String>, // UUID
    pub rejection_reason: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub reviewed_at: Option<DateTime<Utc>>,
}

impl ProductData {
    pub fn new(
        name: String,
        slug: String,
        category: String,
        submitted_by: String,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: None,
            brand_id: None,
            category,
            name,
            slug,
            image_url: None,
            description: None,
            servings_per_container: None,
            serving_size_g: None,
            transparency_score: Some(0),
            confidence_level: Some("estimated".to_string()),
            dosage_rating: Some(0),
            danger_rating: Some(0),
            community_rating: Some(0.0),
            total_reviews: Some(0),
            approval_status: 0, // pending
            submitted_by,
            reviewed_by: None,
            rejection_reason: None,
            created_at: now,
            updated_at: now,
            reviewed_at: None,
        }
    }
    
    /// Check if product is approved
    pub fn is_approved(&self) -> bool {
        self.approval_status == 1
    }
    
    /// Check if product is pending
    pub fn is_pending(&self) -> bool {
        self.approval_status == 0
    }
    
    /// Check if product is denied
    pub fn is_denied(&self) -> bool {
        self.approval_status == -1
    }
}

/// Service statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceStats {
    pub is_running: bool,
    pub last_update_time: DateTime<Utc>,
    pub total_processed: u64,
    pub total_accepted: u64,
    pub total_denied: u64,
    pub cache_stats: cache_manager::CacheStats,
    pub go_stats: go_integration::GoStats,
}

/// DailyUpdateService V2 - Modular architecture with temporary products system
/// 
/// Features:
/// - Modular component architecture (Cache, Trie, Go Integration)
/// - Background processing with async tasks
/// - Temporary products table integration (replaces queue system)
/// - Scheduled daily updates every hour
/// - Thread-safe operations with Rust's ownership system
/// - Comprehensive error handling and recovery
/// - Statistics and monitoring
/// - Automatic processing of accepted products
pub struct DailyUpdateServiceV2 {
    // Component managers
    pub cache_manager: Arc<CacheManager>,
    pub go_integration: Arc<GoIntegration>,
    
    // Service state
    pub is_running: Arc<RwLock<bool>>,
    pub should_stop: Arc<RwLock<bool>>,
    
    // Update scheduling (every hour instead of daily)
    pub last_update_time: Arc<RwLock<DateTime<Utc>>>,
    
    // Statistics
    pub total_processed: Arc<RwLock<u64>>,
    pub total_accepted: Arc<RwLock<u64>>,
    pub total_denied: Arc<RwLock<u64>>,
    
    // Configuration
    pub config: ServiceConfig,
}

impl DailyUpdateServiceV2 {
    /// Create a new DailyUpdateServiceV2 instance
    pub fn new(config: ServiceConfig) -> Self {
        Self {
            cache_manager: Arc::new(CacheManager::new()),
            go_integration: Arc::new(GoIntegration::new()),
            is_running: Arc::new(RwLock::new(false)),
            should_stop: Arc::new(RwLock::new(false)),
            last_update_time: Arc::new(RwLock::new(Utc::now())),
            total_processed: Arc::new(RwLock::new(0)),
            total_accepted: Arc::new(RwLock::new(0)),
            total_denied: Arc::new(RwLock::new(0)),
            config,
        }
    }
    
    /// Initialize the service with all components
    pub async fn initialize(&self) -> Result<()> {
        info!("🚀 Initializing DailyUpdateServiceV2...");
        
        if !self.initialize_components().await? {
            error!("❌ Failed to initialize components");
            return Err(anyhow::anyhow!("Failed to initialize components"));
        }
        
        info!("✅ DailyUpdateServiceV2 initialized successfully");
        Ok(())
    }
    
    /// Start background processing tasks
    pub async fn start(&self) -> Result<()> {
        let mut is_running = self.is_running.write().await;
        if *is_running {
            warn!("⚠️ DailyUpdateServiceV2 already running");
            return Ok(());
        }
        
        *is_running = true;
        drop(is_running);
        
        let mut should_stop = self.should_stop.write().await;
        *should_stop = false;
        drop(should_stop);
        
        // Start the update task (runs every hour)
        let service_clone = self.clone_for_task();
        tokio::spawn(async move {
            service_clone.update_task().await;
        });
        
        info!("✅ DailyUpdateServiceV2 started - hourly updates enabled");
        Ok(())
    }
    
    /// Stop background processing tasks
    pub async fn stop(&self) -> Result<()> {
        let is_running = self.is_running.read().await;
        if !*is_running {
            return Ok(());
        }
        drop(is_running);
        
        info!("🛑 Stopping DailyUpdateServiceV2...");
        
        let mut should_stop = self.should_stop.write().await;
        *should_stop = true;
        drop(should_stop);
        
        // Wait a bit for tasks to finish
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        
        let mut is_running = self.is_running.write().await;
        *is_running = false;
        
        info!("✅ DailyUpdateServiceV2 stopped");
        Ok(())
    }
    
    /// Force trigger hourly update (for testing)
    pub async fn force_hourly_update(&self) -> Result<()> {
        info!("🔄 Force triggering hourly update...");
        self.perform_hourly_update().await?;
        Ok(())
    }
    
    /// Get accepted products from temporary table for processing
    pub async fn get_accepted_products(&self) -> Result<Vec<ProductData>> {
        self.go_integration.get_accepted_products().await
    }
    
    /// Get comprehensive service statistics
    pub async fn get_service_stats(&self) -> ServiceStats {
        let is_running = *self.is_running.read().await;
        let last_update_time = *self.last_update_time.read().await;
        let total_processed = *self.total_processed.read().await;
        let total_accepted = *self.total_accepted.read().await;
        let total_denied = *self.total_denied.read().await;
        
        ServiceStats {
            is_running,
            last_update_time,
            total_processed,
            total_accepted,
            total_denied,
            cache_stats: self.cache_manager.get_cache_stats().await,
            go_stats: self.go_integration.get_go_stats().await,
        }
    }
    
    /// Clone the service for use in async tasks
    pub fn clone_for_task(&self) -> DailyUpdateServiceTask {
        DailyUpdateServiceTask {
            cache_manager: self.cache_manager.clone(),
            go_integration: self.go_integration.clone(),
            is_running: self.is_running.clone(),
            should_stop: self.should_stop.clone(),
            last_update_time: self.last_update_time.clone(),
            total_processed: self.total_processed.clone(),
            total_accepted: self.total_accepted.clone(),
            total_denied: self.total_denied.clone(),
        }
    }
    
    /// Initialize all component managers
    async fn initialize_components(&self) -> Result<bool> {
        info!("🔧 Initializing components...");
        
        // Initialize Cache Manager
        if !self.cache_manager.initialize().await? {
            error!("❌ Failed to initialize CacheManager");
            return Ok(false);
        }
        info!("✅ CacheManager initialized");
        
        // Initialize Go Integration
        let mut go_integration = GoIntegration::new();
        if !go_integration.initialize().await? {
            error!("❌ Failed to initialize GoIntegration");
            return Ok(false);
        }
        info!("✅ GoIntegration initialized");
        
        Ok(true)
    }
    
    /// Perform the actual hourly update
    async fn perform_hourly_update(&self) -> Result<()> {
        info!("🔄 Starting hourly update process...");
        
        // 1. Process accepted products from temporary table
        self.process_accepted_products().await?;
        
        // 2. Reset caches (excluding AdminCache - only on system outage)
        self.cache_manager.perform_daily_cache_reset().await?;
        
        // Update last update time
        let mut last_update_time = self.last_update_time.write().await;
        *last_update_time = Utc::now();
        
        info!("✅ Hourly update completed successfully");
        Ok(())
    }
    
    /// Process accepted products from temporary table
    async fn process_accepted_products(&self) -> Result<()> {
        info!("📋 Processing accepted products from temporary table...");
        
        // Get accepted products from temporary table via Go integration
        let accepted_products = self.go_integration.get_accepted_products().await?;
        
        if accepted_products.is_empty() {
            info!("ℹ️ No accepted products to process");
            return Ok(());
        }
        
        info!("📦 Found {} accepted products to process", accepted_products.len());
        
        let mut processed_count = 0;
        let mut accepted_count = 0;
        let mut denied_count = 0;
        
        // Process each accepted product
        for product in &accepted_products {
            match self.go_integration.migrate_product(product).await {
                Ok(true) => {
                    accepted_count += 1;
                    info!("✅ Migrated product: {} ({})", product.name, product.category);
                }
                Ok(false) => {
                    denied_count += 1;
                    error!("❌ Failed to migrate product: {}", product.name);
                }
                Err(e) => {
                    denied_count += 1;
                    error!("❌ Error processing product {}: {}", product.name, e);
                }
            }
            processed_count += 1;
        }
        
        // Update statistics
        {
            let mut total_processed = self.total_processed.write().await;
            let mut total_accepted = self.total_accepted.write().await;
            let mut total_denied = self.total_denied.write().await;
            
            *total_processed += processed_count;
            *total_accepted += accepted_count;
            *total_denied += denied_count;
        }
        
        info!("✅ Processed {} accepted products", accepted_products.len());
        Ok(())
    }
}

/// Task-specific service data for async operations
pub struct DailyUpdateServiceTask {
    pub cache_manager: Arc<CacheManager>,
    pub go_integration: Arc<GoIntegration>,
    pub is_running: Arc<RwLock<bool>>,
    pub should_stop: Arc<RwLock<bool>>,
    pub last_update_time: Arc<RwLock<DateTime<Utc>>>,
    pub total_processed: Arc<RwLock<u64>>,
    pub total_accepted: Arc<RwLock<u64>>,
    pub total_denied: Arc<RwLock<u64>>,
}

impl DailyUpdateServiceTask {
    /// Main update task function (runs every hour)
    async fn update_task(&self) {
        info!("🔄 Update task started - checking every hour for updates...");
        
        loop {
            let should_stop = *self.should_stop.read().await;
            if should_stop {
                break;
            }
            
            match self.check_and_update().await {
                Ok(_) => {
                    // Sleep for 5 minutes before checking again
                    tokio::time::sleep(tokio::time::Duration::from_secs(300)).await;
                }
                Err(e) => {
                    error!("❌ Error in update task: {}", e);
                    tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
                }
            }
        }
        
        info!("🔄 Update task stopped");
    }
    
    /// Check if it's time for hourly update and perform it
    async fn check_and_update(&self) -> Result<()> {
        if self.is_time_for_hourly_update().await {
            info!("⏰ Time for hourly update - processing...");
            self.perform_hourly_update().await?;
        }
        Ok(())
    }
    
    /// Check if it's time for hourly update
    async fn is_time_for_hourly_update(&self) -> bool {
        let now = Utc::now();
        let last_update = *self.last_update_time.read().await;
        
        // Check if at least 1 hour has passed
        now.signed_duration_since(last_update).num_hours() >= 1
    }
    
    /// Perform the actual hourly update
    async fn perform_hourly_update(&self) -> Result<()> {
        info!("🔄 Starting hourly update process...");
        
        // 1. Process accepted products from temporary table
        self.process_accepted_products().await?;
        
        // 2. Reset caches (excluding AdminCache - only on system outage)
        self.cache_manager.perform_daily_cache_reset().await?;
        
        // Update last update time
        let mut last_update_time = self.last_update_time.write().await;
        *last_update_time = Utc::now();
        
        info!("✅ Hourly update completed successfully");
        Ok(())
    }
    
    /// Process accepted products from temporary table
    async fn process_accepted_products(&self) -> Result<()> {
        info!("📋 Processing accepted products from temporary table...");
        
        // Get accepted products from temporary table via Go integration
        let accepted_products = self.go_integration.get_accepted_products().await?;
        
        if accepted_products.is_empty() {
            info!("ℹ️ No accepted products to process");
            return Ok(());
        }
        
        info!("📦 Found {} accepted products to process", accepted_products.len());
        
        let mut processed_count = 0;
        let mut accepted_count = 0;
        let mut denied_count = 0;
        
        // Process each accepted product
        for product in &accepted_products {
            match self.go_integration.migrate_product(product).await {
                Ok(true) => {
                    accepted_count += 1;
                    info!("✅ Migrated product: {} ({})", product.name, product.category);
                }
                Ok(false) => {
                    denied_count += 1;
                    error!("❌ Failed to migrate product: {}", product.name);
                }
                Err(e) => {
                    denied_count += 1;
                    error!("❌ Error processing product {}: {}", product.name, e);
                }
            }
            processed_count += 1;
        }
        
        // Update statistics
        {
            let mut total_processed = self.total_processed.write().await;
            let mut total_accepted = self.total_accepted.write().await;
            let mut total_denied = self.total_denied.write().await;
            
            *total_processed += processed_count;
            *total_accepted += accepted_count;
            *total_denied += denied_count;
        }
        
        info!("✅ Processed {} accepted products", accepted_products.len());
        Ok(())
    }
}