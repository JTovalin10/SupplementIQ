use daily_update_service::ProductData;
use chrono::{DateTime, Utc};

#[tokio::test]
async fn test_product_data_creation_branches() {
    // Test basic creation
    let product = ProductData::new(
        "Test Product".to_string(),
        "test-product".to_string(),
        "protein".to_string(),
        "test-user-id".to_string(),
    );
    
    assert_eq!(product.name, "Test Product");
    assert_eq!(product.slug, "test-product");
    assert_eq!(product.category, "protein");
    assert_eq!(product.submitted_by, "test-user-id");
    
    // Test default values
    assert_eq!(product.id, None);
    assert_eq!(product.brand_id, None);
    assert_eq!(product.image_url, None);
    assert_eq!(product.description, None);
    assert_eq!(product.servings_per_container, None);
    assert_eq!(product.serving_size_g, None);
    assert_eq!(product.transparency_score, Some(0));
    assert_eq!(product.confidence_level, Some("estimated".to_string()));
    assert_eq!(product.dosage_rating, Some(0));
    assert_eq!(product.danger_rating, Some(0));
    assert_eq!(product.community_rating, Some(0.0));
    assert_eq!(product.total_reviews, Some(0));
    assert_eq!(product.approval_status, 0); // pending
    assert_eq!(product.reviewed_by, None);
    assert_eq!(product.rejection_reason, None);
    assert_eq!(product.reviewed_at, None);
    
    // Test timestamps
    let now = Utc::now();
    assert!(product.created_at <= now);
    assert!(product.updated_at <= now);
    assert_eq!(product.created_at, product.updated_at);
}

#[tokio::test]
async fn test_product_data_approval_status_branches() {
    let mut product = ProductData::new(
        "Test Product".to_string(),
        "test-product".to_string(),
        "preworkout".to_string(),
        "test-user-id".to_string(),
    );
    
    // Test pending status (default)
    assert_eq!(product.approval_status, 0);
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
    
    // Test edge cases
    product.approval_status = 2;
    assert!(!product.is_pending());
    assert!(!product.is_approved());
    assert!(!product.is_denied());
    
    product.approval_status = -2;
    assert!(!product.is_pending());
    assert!(!product.is_approved());
    assert!(!product.is_denied());
}

#[tokio::test]
async fn test_product_data_edge_cases() {
    // Test with empty strings
    let empty_product = ProductData::new(
        "".to_string(),
        "".to_string(),
        "".to_string(),
        "".to_string(),
    );
    
    assert_eq!(empty_product.name, "");
    assert_eq!(empty_product.slug, "");
    assert_eq!(empty_product.category, "");
    assert_eq!(empty_product.submitted_by, "");
    assert_eq!(empty_product.approval_status, 0);
    
    // Test with very long strings
    let long_string = "a".repeat(1000);
    let long_product = ProductData::new(
        long_string.clone(),
        long_string.clone(),
        long_string.clone(),
        long_string.clone(),
    );
    
    assert_eq!(long_product.name, long_string);
    assert_eq!(long_product.slug, long_string);
    assert_eq!(long_product.category, long_string);
    assert_eq!(long_product.submitted_by, long_string);
    
    // Test with special characters
    let special_product = ProductData::new(
        "Product with Special Chars: !@#$%^&*()".to_string(),
        "product-with-special-chars".to_string(),
        "protein".to_string(),
        "user-with-special-chars".to_string(),
    );
    
    assert!(special_product.name.contains("!@#$%^&*()"));
    assert_eq!(special_product.slug, "product-with-special-chars");
    assert_eq!(special_product.category, "protein");
    assert_eq!(special_product.submitted_by, "user-with-special-chars");
    
    // Test with unicode characters
    let unicode_product = ProductData::new(
        "Product with Unicode: 🚀🌟💫".to_string(),
        "product-with-unicode".to_string(),
        "multivitamin".to_string(),
        "user-with-unicode".to_string(),
    );
    
    assert!(unicode_product.name.contains("🚀🌟💫"));
    assert_eq!(unicode_product.slug, "product-with-unicode");
    assert_eq!(unicode_product.category, "multivitamin");
    assert_eq!(unicode_product.submitted_by, "user-with-unicode");
}

#[tokio::test]
async fn test_product_data_different_categories() {
    let categories = vec![
        "protein",
        "preworkout",
        "multivitamin",
        "creatine",
        "omega3",
        "bcaa",
        "glutamine",
        "whey",
        "casein",
        "mass_gainer",
    ];
    
    for category in categories {
        let product = ProductData::new(
            format!("Test {} Product", category),
            format!("test-{}-product", category),
            category.to_string(),
            "test-user-id".to_string(),
        );
        
        assert_eq!(product.category, category);
        assert_eq!(product.name, format!("Test {} Product", category));
        assert_eq!(product.slug, format!("test-{}-product", category));
        assert!(product.is_pending());
    }
}

#[tokio::test]
async fn test_product_data_optional_fields() {
    let mut product = ProductData::new(
        "Test Product".to_string(),
        "test-product".to_string(),
        "protein".to_string(),
        "test-user-id".to_string(),
    );
    
    // Test setting optional fields
    product.id = Some(123);
    product.brand_id = Some(456);
    product.image_url = Some("https://example.com/image.jpg".to_string());
    product.description = Some("A great protein powder".to_string());
    product.servings_per_container = Some(30);
    product.serving_size_g = Some(25.5);
    product.transparency_score = Some(85);
    product.confidence_level = Some("verified".to_string());
    product.dosage_rating = Some(90);
    product.danger_rating = Some(10);
    product.community_rating = Some(4.5);
    product.total_reviews = Some(150);
    product.reviewed_by = Some("admin-user-id".to_string());
    product.rejection_reason = Some("Insufficient information".to_string());
    product.reviewed_at = Some(Utc::now());
    
    // Verify all fields are set
    assert_eq!(product.id, Some(123));
    assert_eq!(product.brand_id, Some(456));
    assert_eq!(product.image_url, Some("https://example.com/image.jpg".to_string()));
    assert_eq!(product.description, Some("A great protein powder".to_string()));
    assert_eq!(product.servings_per_container, Some(30));
    assert_eq!(product.serving_size_g, Some(25.5));
    assert_eq!(product.transparency_score, Some(85));
    assert_eq!(product.confidence_level, Some("verified".to_string()));
    assert_eq!(product.dosage_rating, Some(90));
    assert_eq!(product.danger_rating, Some(10));
    assert_eq!(product.community_rating, Some(4.5));
    assert_eq!(product.total_reviews, Some(150));
    assert_eq!(product.reviewed_by, Some("admin-user-id".to_string()));
    assert_eq!(product.rejection_reason, Some("Insufficient information".to_string()));
    assert!(product.reviewed_at.is_some());
    
    // Test clearing optional fields
    product.id = None;
    product.brand_id = None;
    product.image_url = None;
    product.description = None;
    product.servings_per_container = None;
    product.serving_size_g = None;
    product.reviewed_by = None;
    product.rejection_reason = None;
    product.reviewed_at = None;
    
    // Verify fields are cleared
    assert_eq!(product.id, None);
    assert_eq!(product.brand_id, None);
    assert_eq!(product.image_url, None);
    assert_eq!(product.description, None);
    assert_eq!(product.servings_per_container, None);
    assert_eq!(product.serving_size_g, None);
    assert_eq!(product.reviewed_by, None);
    assert_eq!(product.rejection_reason, None);
    assert_eq!(product.reviewed_at, None);
}

#[tokio::test]
async fn test_product_data_rating_bounds() {
    let mut product = ProductData::new(
        "Test Product".to_string(),
        "test-product".to_string(),
        "protein".to_string(),
        "test-user-id".to_string(),
    );
    
    // Test transparency score bounds
    product.transparency_score = Some(0);
    assert_eq!(product.transparency_score, Some(0));
    
    product.transparency_score = Some(50);
    assert_eq!(product.transparency_score, Some(50));
    
    product.transparency_score = Some(100);
    assert_eq!(product.transparency_score, Some(100));
    
    // Test dosage rating bounds
    product.dosage_rating = Some(0);
    assert_eq!(product.dosage_rating, Some(0));
    
    product.dosage_rating = Some(50);
    assert_eq!(product.dosage_rating, Some(50));
    
    product.dosage_rating = Some(100);
    assert_eq!(product.dosage_rating, Some(100));
    
    // Test danger rating bounds
    product.danger_rating = Some(0);
    assert_eq!(product.danger_rating, Some(0));
    
    product.danger_rating = Some(50);
    assert_eq!(product.danger_rating, Some(50));
    
    product.danger_rating = Some(100);
    assert_eq!(product.danger_rating, Some(100));
    
    // Test community rating bounds
    product.community_rating = Some(0.0);
    assert_eq!(product.community_rating, Some(0.0));
    
    product.community_rating = Some(5.0);
    assert_eq!(product.community_rating, Some(5.0));
    
    product.community_rating = Some(10.0);
    assert_eq!(product.community_rating, Some(10.0));
}

#[tokio::test]
async fn test_product_data_confidence_levels() {
    let confidence_levels = vec![
        "verified",
        "likely",
        "estimated",
        "unknown",
    ];
    
    for level in confidence_levels {
        let mut product = ProductData::new(
            "Test Product".to_string(),
            "test-product".to_string(),
            "protein".to_string(),
            "test-user-id".to_string(),
        );
        
        product.confidence_level = Some(level.to_string());
        assert_eq!(product.confidence_level, Some(level.to_string()));
    }
}

#[tokio::test]
async fn test_product_data_serialization() {
    let product = ProductData::new(
        "Test Product".to_string(),
        "test-product".to_string(),
        "protein".to_string(),
        "test-user-id".to_string(),
    );
    
    // Test serialization
    let serialized = serde_json::to_string(&product).unwrap();
    assert!(serialized.contains("Test Product"));
    assert!(serialized.contains("test-product"));
    assert!(serialized.contains("protein"));
    assert!(serialized.contains("test-user-id"));
    
    // Test deserialization
    let deserialized: ProductData = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.name, product.name);
    assert_eq!(deserialized.slug, product.slug);
    assert_eq!(deserialized.category, product.category);
    assert_eq!(deserialized.submitted_by, product.submitted_by);
    assert_eq!(deserialized.approval_status, product.approval_status);
}

#[tokio::test]
async fn test_product_data_clone() {
    let original = ProductData::new(
        "Test Product".to_string(),
        "test-product".to_string(),
        "protein".to_string(),
        "test-user-id".to_string(),
    );
    
    let cloned = original.clone();
    
    assert_eq!(cloned.name, original.name);
    assert_eq!(cloned.slug, original.slug);
    assert_eq!(cloned.category, original.category);
    assert_eq!(cloned.submitted_by, original.submitted_by);
    assert_eq!(cloned.approval_status, original.approval_status);
    assert_eq!(cloned.id, original.id);
    assert_eq!(cloned.brand_id, original.brand_id);
    
    // Test that clone is independent
    let mut modified_clone = cloned;
    modified_clone.name = "Modified Product".to_string();
    modified_clone.approval_status = 1;
    
    assert_eq!(original.name, "Test Product");
    assert_eq!(original.approval_status, 0);
    assert_eq!(modified_clone.name, "Modified Product");
    assert_eq!(modified_clone.approval_status, 1);
}

#[tokio::test]
async fn test_product_data_debug_formatting() {
    let product = ProductData::new(
        "Test Product".to_string(),
        "test-product".to_string(),
        "protein".to_string(),
        "test-user-id".to_string(),
    );
    
    // Test debug formatting
    let debug_string = format!("{:?}", product);
    assert!(debug_string.contains("Test Product"));
    assert!(debug_string.contains("test-product"));
    assert!(debug_string.contains("protein"));
    assert!(debug_string.contains("test-user-id"));
}

#[tokio::test]
async fn test_product_data_timestamp_behavior() {
    let before = Utc::now();
    
    let product1 = ProductData::new(
        "Product 1".to_string(),
        "product-1".to_string(),
        "protein".to_string(),
        "user-1".to_string(),
    );
    
    let between = Utc::now();
    
    let product2 = ProductData::new(
        "Product 2".to_string(),
        "product-2".to_string(),
        "preworkout".to_string(),
        "user-2".to_string(),
    );
    
    let after = Utc::now();
    
    // Test that timestamps are set correctly
    assert!(product1.created_at >= before);
    assert!(product1.created_at <= between);
    assert!(product1.updated_at >= before);
    assert!(product1.updated_at <= between);
    
    assert!(product2.created_at >= between);
    assert!(product2.created_at <= after);
    assert!(product2.updated_at >= between);
    assert!(product2.updated_at <= after);
    
    // Test that created_at and updated_at are equal for new products
    assert_eq!(product1.created_at, product1.updated_at);
    assert_eq!(product2.created_at, product2.updated_at);
}

