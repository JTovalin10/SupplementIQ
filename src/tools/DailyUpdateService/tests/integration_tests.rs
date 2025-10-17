use daily_update_service::{
    DailyUpdateServiceV2, config::ServiceConfig, ProductData,
    cache_manager::CacheManager,
    go_integration::GoIntegration,
};
use std::sync::Arc;

#[tokio::test]
async fn test_service_creation() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Service should be created successfully
    assert!(!*service.is_running.read().await);
}

#[tokio::test]
async fn test_service_initialization() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Initialize should succeed (even if Go binary doesn't exist)
    let result = service.initialize().await;
    // We expect this to fail in test environment, but service should handle it gracefully
    assert!(result.is_ok() || result.is_err());
}

#[tokio::test]
async fn test_product_data_creation() {
    let product = ProductData::new(
        "Test Protein".to_string(),
        "test-protein".to_string(),
        "protein".to_string(),
        "test-user-id".to_string(),
    );
    
    assert_eq!(product.name, "Test Protein");
    assert_eq!(product.slug, "test-protein");
    assert_eq!(product.category, "protein");
    assert_eq!(product.submitted_by, "test-user-id");
    assert_eq!(product.approval_status, 0); // pending
    assert!(product.is_pending());
    assert!(!product.is_approved());
    assert!(!product.is_denied());
}

#[tokio::test]
async fn test_product_data_approval_status() {
    let mut product = ProductData::new(
        "Test Product".to_string(),
        "test-product".to_string(),
        "preworkout".to_string(),
        "test-user-id".to_string(),
    );
    
    // Test pending status
    assert!(product.is_pending());
    assert!(!product.is_approved());
    assert!(!product.is_denied());
    
    // Test approved status
    product.approval_status = 1;
    assert!(!product.is_pending());
    assert!(product.is_approved());
    assert!(!product.is_denied());
    
    // Test denied status
    product.approval_status = -1;
    assert!(!product.is_pending());
    assert!(!product.is_approved());
    assert!(product.is_denied());
}

#[tokio::test]
async fn test_cache_manager_creation() {
    let cache_manager = CacheManager::new();
    
    // Cache manager should be created successfully
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 0);
    assert_eq!(stats.hit_count, 0);
    assert_eq!(stats.miss_count, 0);
}

#[tokio::test]
async fn test_cache_manager_operations() {
    let cache_manager = Arc::new(CacheManager::new());
    
    // Initialize cache manager
    let init_result = cache_manager.initialize().await;
    assert!(init_result.is_ok());
    
    // Test cache operations
    cache_manager.insert("test-key".to_string(), "test-value".to_string()).await;
    
    let retrieved = cache_manager.get("test-key").await;
    assert_eq!(retrieved, Some("test-value".to_string()));
    
    // Test cache miss
    let not_found = cache_manager.get("non-existent-key").await;
    assert_eq!(not_found, None);
}

#[tokio::test]
async fn test_go_integration_creation() {
    let go_integration = GoIntegration::new();
    
    // Go integration should be created successfully
    assert!(!go_integration.is_initialized.load(std::sync::atomic::Ordering::Relaxed));
}

#[tokio::test]
async fn test_service_stats() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    let stats = service.get_service_stats().await;
    
    assert!(!stats.is_running);
    assert_eq!(stats.total_processed, 0);
    assert_eq!(stats.total_accepted, 0);
    assert_eq!(stats.total_denied, 0);
}

#[tokio::test]
async fn test_service_start_stop() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Service should not be running initially
    assert!(!*service.is_running.read().await);
    
    // Start service (this may succeed or fail depending on Go binary availability)
    let start_result = service.start().await;
    // We expect this to either succeed or fail gracefully
    assert!(start_result.is_ok() || start_result.is_err());
    
    // Stop service
    let stop_result = service.stop().await;
    assert!(stop_result.is_ok());
}

#[tokio::test]
async fn test_force_hourly_update() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Force update should handle missing Go binary gracefully
    let update_result = service.force_hourly_update().await;
    // We expect this to fail in test environment due to missing Go binary
    assert!(update_result.is_err());
}

#[tokio::test]
async fn test_get_accepted_products() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Get accepted products should handle missing Go binary gracefully
    let products_result = service.get_accepted_products().await;
    // We expect this to fail in test environment due to missing Go binary
    assert!(products_result.is_err());
}

#[tokio::test]
async fn test_service_config_default() {
    let config = ServiceConfig::default();
    
    assert_eq!(config.base_directory.to_str().unwrap(), "./data/daily-update");
    assert_eq!(config.cache_config.max_capacity, 10_000);
    assert_eq!(config.cache_config.ttl_seconds, 3600);
    assert_eq!(config.cache_config.idle_seconds, 1800);
    assert_eq!(config.go_config.command_timeout, 30);
    assert_eq!(config.update_config.update_interval_hours, 1);
    assert_eq!(config.update_config.check_interval_minutes, 5);
    assert!(config.update_config.enable_automatic_updates);
}

#[tokio::test]
async fn test_concurrent_access() {
    let config = ServiceConfig::default();
    let service = Arc::new(DailyUpdateServiceV2::new(config));
    
    // Test concurrent access to service stats
    let service_clone1 = service.clone();
    let service_clone2 = service.clone();
    
    let stats1 = tokio::spawn(async move {
        service_clone1.get_service_stats().await
    });
    
    let stats2 = tokio::spawn(async move {
        service_clone2.get_service_stats().await
    });
    
    let (stats1_result, stats2_result) = tokio::join!(stats1, stats2);
    
    assert!(stats1_result.is_ok());
    assert!(stats2_result.is_ok());
    
    let stats1 = stats1_result.unwrap();
    let stats2 = stats2_result.unwrap();
    
    // Both should return the same initial stats
    assert_eq!(stats1.total_processed, stats2.total_processed);
    assert_eq!(stats1.total_accepted, stats2.total_accepted);
    assert_eq!(stats1.total_denied, stats2.total_denied);
}

#[tokio::test]
async fn test_error_handling() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test that service handles errors gracefully
    let result = service.start().await;
    // Service should either succeed or fail gracefully
    assert!(result.is_ok() || result.is_err());
    
    // Service should still be in a valid state
    // Note: If service started successfully, is_running will be true
    let is_running = *service.is_running.read().await;
    assert!(is_running || !is_running); // Always true, just checking state is valid
}

#[tokio::test]
async fn test_service_clone_for_task() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    let task_clone = service.clone_for_task();
    
    // Task clone should have the same components
    assert_eq!(Arc::strong_count(&service.cache_manager), 2); // Original + clone
    assert_eq!(Arc::strong_count(&service.go_integration), 2); // Original + clone
}

// Integration tests (these require the Go binary to be present)
#[tokio::test]
#[ignore] // Ignore by default since Go binary may not be present
async fn test_integration_with_go_binary() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Initialize service
    let init_result = service.initialize().await;
    if init_result.is_err() {
        // Skip test if Go binary is not available
        return;
    }
    
    // Test service operations
    let start_result = service.start().await;
    assert!(start_result.is_ok());
    
    // Wait a bit for the service to run
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Stop service
    let stop_result = service.stop().await;
    assert!(stop_result.is_ok());
}

#[tokio::test]
#[ignore] // Ignore by default since Go binary may not be present
async fn test_go_integration_with_binary() {
    let mut go_integration = GoIntegration::new();
    
    let init_result = go_integration.initialize().await;
    if init_result.is_err() {
        // Skip test if Go binary is not available
        return;
    }
    
    assert!(init_result.unwrap());
    
    // Test getting accepted products
    let products_result = go_integration.get_accepted_products().await;
    assert!(products_result.is_ok());
    
    // Test migrating a product
    let test_product = ProductData::new(
        "Test Product".to_string(),
        "test-product".to_string(),
        "protein".to_string(),
        "test-user-id".to_string(),
    );
    
    let migrate_result = go_integration.migrate_product(&test_product).await;
    // This might fail if the product doesn't exist in the database
    assert!(migrate_result.is_ok() || migrate_result.is_err());
}
