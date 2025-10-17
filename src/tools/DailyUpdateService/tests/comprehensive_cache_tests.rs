use daily_update_service::cache_manager::CacheManager;
use anyhow::Result;
use std::sync::Arc;

#[tokio::test]
async fn test_cache_manager_all_branches() {
    let cache_manager = Arc::new(CacheManager::new());
    
    // Test initialization
    let init_result = cache_manager.initialize().await;
    assert!(init_result.is_ok());
    assert_eq!(init_result.unwrap(), true);
    
    // Test initial stats
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 0);
    assert_eq!(stats.hit_count, 0);
    assert_eq!(stats.miss_count, 0);
    assert_eq!(stats.eviction_count, 0);
}

#[tokio::test]
async fn test_cache_manager_insert_and_get_branches() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Test inserting new key
    cache_manager.insert("key1".to_string(), "value1".to_string()).await;
    
    // Test getting existing key (hit)
    let result = cache_manager.get("key1").await;
    assert_eq!(result, Some("value1".to_string()));
    
    // Test getting non-existent key (miss)
    let result = cache_manager.get("non-existent").await;
    assert_eq!(result, None);
    
    // Test updating existing key
    cache_manager.insert("key1".to_string(), "updated_value1".to_string()).await;
    let result = cache_manager.get("key1").await;
    assert_eq!(result, Some("updated_value1".to_string()));
    
    // Check stats after operations
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 1); // Only one unique key
    assert_eq!(stats.hit_count, 2); // Two hits
    assert_eq!(stats.miss_count, 1); // One miss
}

#[tokio::test]
async fn test_cache_manager_batch_operations_loops() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Test batch insert with 0 entries (empty loop)
    cache_manager.insert_batch(vec![]).await;
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 0);
    
    // Test batch insert with 1 entry
    cache_manager.insert_batch(vec![
        ("key1".to_string(), "value1".to_string())
    ]).await;
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 1);
    assert_eq!(cache_manager.get("key1").await, Some("value1".to_string()));
    
    // Test batch insert with 2+ entries
    cache_manager.insert_batch(vec![
        ("key2".to_string(), "value2".to_string()),
        ("key3".to_string(), "value3".to_string()),
        ("key4".to_string(), "value4".to_string()),
    ]).await;
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 4); // Total of 4 unique keys
    
    // Verify all entries
    assert_eq!(cache_manager.get("key1").await, Some("value1".to_string()));
    assert_eq!(cache_manager.get("key2").await, Some("value2".to_string()));
    assert_eq!(cache_manager.get("key3").await, Some("value3".to_string()));
    assert_eq!(cache_manager.get("key4").await, Some("value4".to_string()));
}

#[tokio::test]
async fn test_cache_manager_remove_branches() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Test removing non-existent key
    cache_manager.remove("non-existent").await;
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 0); // Should still be 0
    
    // Test removing existing key
    cache_manager.insert("key1".to_string(), "value1".to_string()).await;
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 1);
    
    cache_manager.remove("key1").await;
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 0); // Should be decremented
    
    // Verify key is actually removed
    assert_eq!(cache_manager.get("key1").await, None);
}

#[tokio::test]
async fn test_cache_manager_admin_cache_branches() {
    let cache_manager = Arc::new(CacheManager::new());
    
    // Test admin cache operations
    // Test getting non-existent admin key
    let result = cache_manager.get_admin("non-existent");
    assert_eq!(result, None);
    
    // Test inserting admin key
    cache_manager.insert_admin("admin_key".to_string(), "admin_value".to_string());
    let result = cache_manager.get_admin("admin_key");
    assert_eq!(result, Some("admin_value".to_string()));
    
    // Test updating admin key
    cache_manager.insert_admin("admin_key".to_string(), "updated_admin_value".to_string());
    let result = cache_manager.get_admin("admin_key");
    assert_eq!(result, Some("updated_admin_value".to_string()));
    
    // Test clearing admin cache
    cache_manager.clear_admin();
    let result = cache_manager.get_admin("admin_key");
    assert_eq!(result, None);
}

#[tokio::test]
async fn test_cache_manager_daily_reset_branches() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Add some data
    cache_manager.insert("key1".to_string(), "value1".to_string()).await;
    cache_manager.insert("key2".to_string(), "value2".to_string()).await;
    cache_manager.get("key1").await; // Hit
    cache_manager.get("non-existent").await; // Miss
    
    let stats_before = cache_manager.get_cache_stats().await;
    assert_eq!(stats_before.total_entries, 2);
    assert_eq!(stats_before.hit_count, 1);
    assert_eq!(stats_before.miss_count, 1);
    
    // Perform daily reset
    let reset_result = cache_manager.perform_daily_cache_reset().await;
    assert!(reset_result.is_ok());
    
    // Wait a bit for cache operations to complete
    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
    
    // Check stats after reset
    let stats_after = cache_manager.get_cache_stats().await;
    assert_eq!(stats_after.total_entries, 0);
    assert_eq!(stats_after.hit_count, 0);
    assert_eq!(stats_after.miss_count, 0);
    assert_eq!(stats_after.eviction_count, 0);
    
    // Verify cache is actually cleared
    assert_eq!(cache_manager.get("key1").await, None);
    assert_eq!(cache_manager.get("key2").await, None);
}

#[tokio::test]
async fn test_cache_manager_concurrent_operations() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    let cache_clone1 = cache_manager.clone();
    let cache_clone2 = cache_manager.clone();
    let cache_clone3 = cache_manager.clone();
    
    // Concurrent inserts
    let insert1 = tokio::spawn(async move {
        cache_clone1.insert("key1".to_string(), "value1".to_string()).await;
    });
    
    let insert2 = tokio::spawn(async move {
        cache_clone2.insert("key2".to_string(), "value2".to_string()).await;
    });
    
    let insert3 = tokio::spawn(async move {
        cache_clone3.insert("key3".to_string(), "value3".to_string()).await;
    });
    
    tokio::join!(insert1, insert2, insert3);
    
    // Verify all values are in cache
    assert_eq!(cache_manager.get("key1").await, Some("value1".to_string()));
    assert_eq!(cache_manager.get("key2").await, Some("value2".to_string()));
    assert_eq!(cache_manager.get("key3").await, Some("value3".to_string()));
    
    // Check stats
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 3);
}

#[tokio::test]
async fn test_cache_manager_concurrent_reads_and_writes() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Insert initial data
    cache_manager.insert("key1".to_string(), "value1".to_string()).await;
    
    let cache_clone1 = cache_manager.clone();
    let cache_clone2 = cache_manager.clone();
    let cache_clone3 = cache_manager.clone();
    
    // Concurrent reads and writes
    let read1 = tokio::spawn(async move {
        cache_clone1.get("key1").await
    });
    
    let write1 = tokio::spawn(async move {
        cache_clone2.insert("key2".to_string(), "value2".to_string()).await;
    });
    
    let read2 = tokio::spawn(async move {
        cache_clone3.get("key1").await
    });
    
    let (result1, _, result2) = tokio::join!(read1, write1, read2);
    
    // Both reads should succeed
    assert_eq!(result1.unwrap(), Some("value1".to_string()));
    assert_eq!(result2.unwrap(), Some("value1".to_string()));
    
    // Verify write succeeded
    assert_eq!(cache_manager.get("key2").await, Some("value2".to_string()));
}

#[tokio::test]
async fn test_cache_manager_edge_cases() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Test with empty strings
    cache_manager.insert("".to_string(), "".to_string()).await;
    assert_eq!(cache_manager.get("").await, Some("".to_string()));
    
    // Test with very long strings
    let long_key = "a".repeat(1000);
    let long_value = "b".repeat(1000);
    cache_manager.insert(long_key.clone(), long_value.clone()).await;
    assert_eq!(cache_manager.get(&long_key).await, Some(long_value.clone()));
    
    // Test with special characters
    let special_key = "key with spaces!@#$%^&*()";
    let special_value = "value with special chars!@#$%^&*()";
    cache_manager.insert(special_key.to_string(), special_value.to_string()).await;
    assert_eq!(cache_manager.get(special_key).await, Some(special_value.to_string()));
    
    // Test with unicode characters
    let unicode_key = "key with unicode: 🚀🌟💫";
    let unicode_value = "value with unicode: 🚀🌟💫";
    cache_manager.insert(unicode_key.to_string(), unicode_value.to_string()).await;
    assert_eq!(cache_manager.get(unicode_key).await, Some(unicode_value.to_string()));
}

#[tokio::test]
async fn test_cache_manager_stats_accuracy() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Test initial stats
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 0);
    assert_eq!(stats.hit_count, 0);
    assert_eq!(stats.miss_count, 0);
    
    // Insert some data
    cache_manager.insert("key1".to_string(), "value1".to_string()).await;
    cache_manager.insert("key2".to_string(), "value2".to_string()).await;
    
    // Test hits
    cache_manager.get("key1").await;
    cache_manager.get("key2").await;
    cache_manager.get("key1").await; // Hit same key again
    
    // Test misses
    cache_manager.get("non-existent1").await;
    cache_manager.get("non-existent2").await;
    
    // Check final stats
    let stats = cache_manager.get_cache_stats().await;
    assert_eq!(stats.total_entries, 2);
    assert_eq!(stats.hit_count, 3); // 3 hits
    assert_eq!(stats.miss_count, 2); // 2 misses
}

#[tokio::test]
async fn test_cache_manager_clear_operations() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Add some data
    cache_manager.insert("key1".to_string(), "value1".to_string()).await;
    cache_manager.insert("key2".to_string(), "value2".to_string()).await;
    
    // Verify data is there
    assert_eq!(cache_manager.get("key1").await, Some("value1".to_string()));
    assert_eq!(cache_manager.get("key2").await, Some("value2".to_string()));
    
    let stats_before = cache_manager.get_cache_stats().await;
    assert_eq!(stats_before.total_entries, 2);
    
    // Clear cache
    cache_manager.clear().await;
    
    // Verify cache is cleared
    assert_eq!(cache_manager.get("key1").await, None);
    assert_eq!(cache_manager.get("key2").await, None);
    
    let stats_after = cache_manager.get_cache_stats().await;
    assert_eq!(stats_after.total_entries, 0);
}

#[tokio::test]
async fn test_cache_manager_multiple_resets() {
    let cache_manager = Arc::new(CacheManager::new());
    cache_manager.initialize().await.unwrap();
    
    // Add data and reset multiple times
    for i in 0..5 {
        cache_manager.insert(format!("key{}", i), format!("value{}", i)).await;
        
        let stats_before = cache_manager.get_cache_stats().await;
        assert_eq!(stats_before.total_entries, 1); // Only one entry at a time since we reset each iteration
        
        let reset_result = cache_manager.perform_daily_cache_reset().await;
        assert!(reset_result.is_ok());
        
        let stats_after = cache_manager.get_cache_stats().await;
        assert_eq!(stats_after.total_entries, 0);
    }
}

#[tokio::test]
async fn test_cache_manager_admin_cache_edge_cases() {
    let cache_manager = Arc::new(CacheManager::new());
    
    // Test admin cache with empty strings
    cache_manager.insert_admin("".to_string(), "".to_string());
    assert_eq!(cache_manager.get_admin(""), Some("".to_string()));
    
    // Test admin cache with long strings
    let long_key = "a".repeat(1000);
    let long_value = "b".repeat(1000);
    cache_manager.insert_admin(long_key.clone(), long_value.clone());
    assert_eq!(cache_manager.get_admin(&long_key), Some(long_value));
    
    // Test admin cache with special characters
    let special_key = "admin key with spaces!@#$%^&*()";
    let special_value = "admin value with special chars!@#$%^&*()";
    cache_manager.insert_admin(special_key.to_string(), special_value.to_string());
    assert_eq!(cache_manager.get_admin(special_key), Some(special_value.to_string()));
    
    // Test clearing admin cache
    cache_manager.clear_admin();
    assert_eq!(cache_manager.get_admin(""), None);
    assert_eq!(cache_manager.get_admin(&long_key), None);
    assert_eq!(cache_manager.get_admin(special_key), None);
}

#[tokio::test]
async fn test_cache_manager_concurrent_admin_operations() {
    let cache_manager = Arc::new(CacheManager::new());
    
    let cache_clone1 = cache_manager.clone();
    let cache_clone2 = cache_manager.clone();
    let cache_clone3 = cache_manager.clone();
    
    // Concurrent admin operations
    let insert1 = tokio::spawn(async move {
        cache_clone1.insert_admin("admin_key1".to_string(), "admin_value1".to_string());
    });
    
    let insert2 = tokio::spawn(async move {
        cache_clone2.insert_admin("admin_key2".to_string(), "admin_value2".to_string());
    });
    
    let get1 = tokio::spawn(async move {
        cache_clone3.get_admin("admin_key1")
    });
    
    tokio::join!(insert1, insert2, get1);
    
    // Verify operations
    assert_eq!(cache_manager.get_admin("admin_key1"), Some("admin_value1".to_string()));
    assert_eq!(cache_manager.get_admin("admin_key2"), Some("admin_value2".to_string()));
}

