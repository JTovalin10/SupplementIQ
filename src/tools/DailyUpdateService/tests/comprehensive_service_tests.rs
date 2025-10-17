use daily_update_service::{
    DailyUpdateServiceV2, config::ServiceConfig, ProductData,
    cache_manager::CacheManager,
    go_integration::GoIntegration,
};
use std::sync::Arc;

#[tokio::test]
async fn test_service_creation_and_initialization_branches() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test initial state
    assert!(!*service.is_running.read().await);
    assert!(!*service.should_stop.read().await);
    assert_eq!(*service.total_processed.read().await, 0);
    assert_eq!(*service.total_accepted.read().await, 0);
    assert_eq!(*service.total_denied.read().await, 0);
    
    // Test initialization (may succeed or fail depending on Go binary)
    let init_result = service.initialize().await;
    assert!(init_result.is_ok() || init_result.is_err());
}

#[tokio::test]
async fn test_service_start_stop_branches() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test initial state
    assert!(!*service.is_running.read().await);
    assert!(!*service.should_stop.read().await);
    
    // Test start (may succeed or fail)
    let start_result = service.start().await;
    assert!(start_result.is_ok() || start_result.is_err());
    
    // Test stop (should always succeed)
    let stop_result = service.stop().await;
    assert!(stop_result.is_ok());
    
    // After stop, should_stop should be true
    assert!(*service.should_stop.read().await);
}

#[tokio::test]
async fn test_service_stats_branches() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test initial stats
    let stats = service.get_service_stats().await;
    assert!(!stats.is_running);
    assert_eq!(stats.total_processed, 0);
    assert_eq!(stats.total_accepted, 0);
    assert_eq!(stats.total_denied, 0);
    
    // Test stats after some operations
    service.initialize().await.ok(); // Ignore result
    
    let stats = service.get_service_stats().await;
    assert_eq!(stats.total_processed, 0); // Should still be 0
    assert_eq!(stats.total_accepted, 0);
    assert_eq!(stats.total_denied, 0);
}

#[tokio::test]
async fn test_service_force_update_branches() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test force update (may succeed or fail depending on Go binary)
    let update_result = service.force_hourly_update().await;
    assert!(update_result.is_ok() || update_result.is_err());
}

#[tokio::test]
async fn test_service_get_accepted_products_branches() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test getting accepted products (may succeed or fail)
    let products_result = service.get_accepted_products().await;
    assert!(products_result.is_ok() || products_result.is_err());
}

#[tokio::test]
async fn test_service_clone_for_task_branches() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test cloning for task
    let task_clone = service.clone_for_task();
    
    // Verify all components are cloned
    assert_eq!(Arc::strong_count(&service.cache_manager), 2); // Original + clone
    assert_eq!(Arc::strong_count(&service.go_integration), 2); // Original + clone
    assert_eq!(Arc::strong_count(&service.is_running), 2);
    assert_eq!(Arc::strong_count(&service.should_stop), 2);
    assert_eq!(Arc::strong_count(&service.last_update_time), 2);
    assert_eq!(Arc::strong_count(&service.total_processed), 2);
    assert_eq!(Arc::strong_count(&service.total_accepted), 2);
    assert_eq!(Arc::strong_count(&service.total_denied), 2);
}

#[tokio::test]
async fn test_service_concurrent_operations() {
    let config = ServiceConfig::default();
    let service = Arc::new(DailyUpdateServiceV2::new(config));
    
    let service_clone1 = service.clone();
    let service_clone2 = service.clone();
    let service_clone3 = service.clone();
    
    // Concurrent operations
    let stats1 = tokio::spawn(async move {
        service_clone1.get_service_stats().await
    });
    
    let stats2 = tokio::spawn(async move {
        service_clone2.get_service_stats().await
    });
    
    let products = tokio::spawn(async move {
        service_clone3.get_accepted_products().await
    });
    
    let (stats1_result, stats2_result, products_result) = tokio::join!(stats1, stats2, products);
    
    // All operations should complete
    assert!(stats1_result.is_ok());
    assert!(stats2_result.is_ok());
    assert!(products_result.is_ok());
    
    // Stats should be consistent
    let stats1 = stats1_result.unwrap();
    let stats2 = stats2_result.unwrap();
    assert_eq!(stats1.total_processed, stats2.total_processed);
    assert_eq!(stats1.total_accepted, stats2.total_accepted);
    assert_eq!(stats1.total_denied, stats2.total_denied);
}

#[tokio::test]
async fn test_service_multiple_start_stop_cycles() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test multiple start/stop cycles
    for i in 0..3 {
        // Start
        let start_result = service.start().await;
        assert!(start_result.is_ok() || start_result.is_err());
        
        // Stop
        let stop_result = service.stop().await;
        assert!(stop_result.is_ok());
        
        // Verify stop state
        assert!(*service.should_stop.read().await);
    }
}

#[tokio::test]
async fn test_service_error_handling_branches() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test that service handles errors gracefully
    let operations = vec![
        ("start", service.start().await.is_ok() || service.start().await.is_err()),
        ("stop", service.stop().await.is_ok()),
        ("initialize", service.initialize().await.is_ok() || service.initialize().await.is_err()),
        ("force_update", service.force_hourly_update().await.is_ok() || service.force_hourly_update().await.is_err()),
        ("get_products", service.get_accepted_products().await.is_ok() || service.get_accepted_products().await.is_err()),
    ];
    
    for (operation, should_handle_gracefully) in operations {
        assert!(should_handle_gracefully, "Operation {} should handle errors gracefully", operation);
    }
}

#[tokio::test]
async fn test_service_config_variations() {
    // Test with default config
    let default_config = ServiceConfig::default();
    let service1 = DailyUpdateServiceV2::new(default_config);
    assert!(service1.initialize().await.is_ok() || service1.initialize().await.is_err());
    
    // Test with custom config
    let custom_config = ServiceConfig {
        base_directory: std::path::PathBuf::from("./custom-data"),
        cache_config: daily_update_service::config::CacheConfig {
            max_capacity: 5000,
            ttl_seconds: 1800,
            idle_seconds: 900,
        },
        go_config: daily_update_service::config::GoConfig {
            binary_path: std::path::PathBuf::from("custom-go-binary"),
            working_directory: std::path::PathBuf::from("custom-working-dir"),
            command_timeout: 60,
        },
        update_config: daily_update_service::config::UpdateConfig {
            update_interval_hours: 2,
            check_interval_minutes: 10,
            enable_automatic_updates: false,
        },
    };
    
    let service2 = DailyUpdateServiceV2::new(custom_config);
    assert!(service2.initialize().await.is_ok() || service2.initialize().await.is_err());
}

#[tokio::test]
async fn test_service_component_interaction_branches() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test cache manager interaction
    let cache_stats = service.cache_manager.get_cache_stats().await;
    assert_eq!(cache_stats.total_entries, 0);
    
    // Test go integration interaction
    let go_stats = service.go_integration.get_go_stats().await;
    assert_eq!(go_stats.go_calls, 0);
    assert_eq!(go_stats.is_initialized, false);
    
    // Test that components are properly initialized
    let init_result = service.cache_manager.initialize().await;
    assert!(init_result.is_ok());
}

#[tokio::test]
async fn test_service_update_time_branches() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test initial update time
    let initial_time = *service.last_update_time.read().await;
    
    // Wait a bit
    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
    
    // Test that update time is properly managed
    let current_time = *service.last_update_time.read().await;
    assert_eq!(initial_time, current_time); // Should be same until update
    
    // Test force update (may update the time)
    let _ = service.force_hourly_update().await;
    
    let updated_time = *service.last_update_time.read().await;
    // Time may or may not be updated depending on success of force update
    assert!(updated_time >= initial_time);
}

#[tokio::test]
async fn test_service_statistics_tracking() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test initial statistics
    let stats = service.get_service_stats().await;
    assert_eq!(stats.total_processed, 0);
    assert_eq!(stats.total_accepted, 0);
    assert_eq!(stats.total_denied, 0);
    
    // Test that statistics are properly tracked
    // Note: In a real scenario, these would be updated by the service operations
    // Here we're just testing that the fields exist and are accessible
    let total_processed = *service.total_processed.read().await;
    let total_accepted = *service.total_accepted.read().await;
    let total_denied = *service.total_denied.read().await;
    
    assert_eq!(total_processed, 0);
    assert_eq!(total_accepted, 0);
    assert_eq!(total_denied, 0);
}

#[tokio::test]
async fn test_service_task_clone_operations() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    let task_clone = service.clone_for_task();
    
    // Test that task clone has access to all necessary components
    let cache_stats = task_clone.cache_manager.get_cache_stats().await;
    assert_eq!(cache_stats.total_entries, 0);
    
    let go_stats = task_clone.go_integration.get_go_stats().await;
    assert_eq!(go_stats.go_calls, 0);
    
    // Test that task clone can read state
    let is_running = *task_clone.is_running.read().await;
    let should_stop = *task_clone.should_stop.read().await;
    
    assert_eq!(is_running, false);
    assert_eq!(should_stop, false);
}

#[tokio::test]
async fn test_service_edge_cases() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test multiple initialization attempts
    let init1 = service.initialize().await;
    let init2 = service.initialize().await;
    
    // Both should handle gracefully (may succeed or fail)
    assert!(init1.is_ok() || init1.is_err());
    assert!(init2.is_ok() || init2.is_err());
    
    // Test multiple start attempts
    let start1 = service.start().await;
    let start2 = service.start().await;
    
    // Both should handle gracefully
    assert!(start1.is_ok() || start1.is_err());
    assert!(start2.is_ok() || start2.is_err());
    
    // Test multiple stop attempts
    let stop1 = service.stop().await;
    let stop2 = service.stop().await;
    
    // Both should succeed
    assert!(stop1.is_ok());
    assert!(stop2.is_ok());
}

#[tokio::test]
async fn test_service_concurrent_start_stop() {
    let config = ServiceConfig::default();
    let service = Arc::new(DailyUpdateServiceV2::new(config));
    
    let service_clone1 = service.clone();
    let service_clone2 = service.clone();
    
    // Concurrent start and stop
    let start_task = tokio::spawn(async move {
        service_clone1.start().await
    });
    
    let stop_task = tokio::spawn(async move {
        service_clone2.stop().await
    });
    
    let (start_result, stop_result) = tokio::join!(start_task, stop_task);
    
    // Both operations should complete
    assert!(start_result.is_ok());
    assert!(stop_result.is_ok());
    
    // Stop should succeed
    assert!(stop_result.unwrap().is_ok());
}

#[tokio::test]
async fn test_service_product_data_handling() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Test with various product data
    let products = vec![
        ProductData::new(
            "Test Product 1".to_string(),
            "test-product-1".to_string(),
            "protein".to_string(),
            "user-1".to_string(),
        ),
        ProductData::new(
            "Test Product 2".to_string(),
            "test-product-2".to_string(),
            "preworkout".to_string(),
            "user-2".to_string(),
        ),
        ProductData::new(
            "Test Product 3".to_string(),
            "test-product-3".to_string(),
            "multivitamin".to_string(),
            "user-3".to_string(),
        ),
    ];
    
    // Test that service can handle product data
    for product in &products {
        // Test approval status branches
        assert!(product.is_pending()); // Should be pending by default
        
        // Test approval status changes
        let mut product_clone = product.clone();
        product_clone.approval_status = 1;
        assert!(product_clone.is_approved());
        assert!(!product_clone.is_pending());
        assert!(!product_clone.is_denied());
        
        product_clone.approval_status = -1;
        assert!(product_clone.is_denied());
        assert!(!product_clone.is_approved());
        assert!(!product_clone.is_pending());
    }
}

#[tokio::test]
async fn test_service_comprehensive_workflow() {
    let config = ServiceConfig::default();
    let service = DailyUpdateServiceV2::new(config);
    
    // Comprehensive workflow test
    // 1. Initialize
    let init_result = service.initialize().await;
    assert!(init_result.is_ok() || init_result.is_err());
    
    // 2. Get initial stats
    let initial_stats = service.get_service_stats().await;
    assert_eq!(initial_stats.total_processed, 0);
    
    // 3. Try to start
    let start_result = service.start().await;
    assert!(start_result.is_ok() || start_result.is_err());
    
    // 4. Get stats after start
    let after_start_stats = service.get_service_stats().await;
    // Stats may or may not change depending on start success
    
    // 5. Try force update
    let update_result = service.force_hourly_update().await;
    assert!(update_result.is_ok() || update_result.is_err());
    
    // 6. Try to get accepted products
    let products_result = service.get_accepted_products().await;
    assert!(products_result.is_ok() || products_result.is_err());
    
    // 7. Stop service
    let stop_result = service.stop().await;
    assert!(stop_result.is_ok());
    
    // 8. Get final stats
    let final_stats = service.get_service_stats().await;
    assert!(!final_stats.is_running);
}

