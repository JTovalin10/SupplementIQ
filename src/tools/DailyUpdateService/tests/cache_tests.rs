use daily_update_service::cache_manager::CacheManager;
use anyhow::Result;
use std::sync::Arc;

#[tokio::test]
async fn test_cache_manager_initialization() {
    let cache_manager = CacheManager::new();
    
    let init_result = cache_manager.initialize().await;
    assert!(init_result.is_ok());
    
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 0);
    assert_eq!(stats.hit_count, 0);
    assert_eq!(stats.miss_count, 0);
}

#[tokio::test]
async fn test_cache_insert_and_get() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Insert a value
    cache_manager.insert("key1".to_string(), "value1".to_string()).await;
    
    // Get the value
    let result = cache_manager.get("key1").await;
    assert_eq!(result, Some("value1".to_string()));
    
    // Check stats
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 1);
    assert_eq!(stats.hit_count, 1);
    assert_eq!(stats.miss_count, 0);
}

#[tokio::test]
async fn test_cache_miss() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Try to get a non-existent key
    let result = cache_manager.get("non-existent").await;
    assert_eq!(result, None);
    
    // Check stats
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 0);
    assert_eq!(stats.hit_count, 0);
    assert_eq!(stats.miss_count, 1);
}

#[tokio::test]
async fn test_cache_batch_insert() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    let entries = vec![
        ("key1".to_string(), "value1".to_string()),
        ("key2".to_string(), "value2".to_string()),
        ("key3".to_string(), "value3".to_string()),
    ];
    
    cache_manager.insert_batch(entries).await;
    
    // Verify all entries are in cache
    assert_eq!(cache_manager.get("key1").await, Some("value1".to_string()));
    assert_eq!(cache_manager.get("key2").await, Some("value2".to_string()));
    assert_eq!(cache_manager.get("key3").await, Some("value3".to_string()));
    
    // Check stats
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 3);
}

#[tokio::test]
async fn test_cache_remove() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Insert a value
    cache_manager.insert("key1".to_string(), "value1".to_string()).await;
    
    // Verify it's there
    assert_eq!(cache_manager.get("key1").await, Some("value1".to_string()));
    
    // Remove it
    cache_manager.remove("key1").await;
    
    // Verify it's gone
    assert_eq!(cache_manager.get("key1").await, None);
    
    // Check stats
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 0);
}

#[tokio::test]
async fn test_cache_admin_operations() {
    let cache_manager = Arc::new(CacheManager::new());
    
    // Test admin cache operations
    cache_manager.insert_admin("admin_key".to_string(), "admin_value".to_string());
    
    let result = cache_manager.get_admin("admin_key");
    assert_eq!(result, Some("admin_value".to_string()));
    
    // Test admin cache miss
    let miss_result = cache_manager.get_admin("non-existent");
    assert_eq!(miss_result, None);
    
    // Clear admin cache
    cache_manager.clear_admin();
    
    let cleared_result = cache_manager.get_admin("admin_key");
    assert_eq!(cleared_result, None);
}

#[tokio::test]
async fn test_cache_daily_reset() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Insert some data
    cache_manager.insert("key1".to_string(), "value1".to_string()).await;
    cache_manager.insert("key2".to_string(), "value2".to_string()).await;
    
    // Verify data is there
    let stats_before = cache_manager.get_cache_stats().await;
    assert_eq!(stats_before.total_entries, 2);
    
    // Perform daily reset
    let reset_result = cache_manager.perform_daily_cache_reset().await;
    assert!(reset_result.is_ok());
    
    // Verify cache is cleared
    let stats_after = cache_manager.get_cache_stats().await;
    assert_eq!(stats_after.total_entries, 0);
    assert_eq!(stats_after.hit_count, 0);
    assert_eq!(stats_after.miss_count, 0);
}

#[tokio::test]
async fn test_cache_concurrent_access() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    let cache_clone1 = cache_manager.clone();
    let cache_clone2 = cache_manager.clone();
    
    // Concurrent inserts
    let insert1 = tokio::spawn(async move {
        cache_clone1.insert("key1".to_string(), "value1".to_string()).await;
    });
    
    let insert2 = tokio::spawn(async move {
        cache_clone2.insert("key2".to_string(), "value2".to_string()).await;
    });
    
    tokio::join!(insert1, insert2);
    
    // Verify both values are in cache
    assert_eq!(cache_manager.get("key1").await, Some("value1".to_string()));
    assert_eq!(cache_manager.get("key2").await, Some("value2".to_string()));
    
    // Check stats
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 2);
}

#[tokio::test]
async fn test_cache_stats_accuracy() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Insert some data
    cache_manager.insert("key1".to_string(), "value1".to_string()).await;
    cache_manager.insert("key2".to_string(), "value2".to_string()).await;
    
    // Hit some keys
    cache_manager.get("key1").await;
    cache_manager.get("key2").await;
    
    // Miss some keys
    cache_manager.get("key3").await;
    cache_manager.get("key4").await;
    
    // Check stats
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 2);
    assert_eq!(stats.hit_count, 2);
    assert_eq!(stats.miss_count, 2);
}
