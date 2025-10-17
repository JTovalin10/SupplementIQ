use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use tracing::{info, error, warn};

use crate::ProductData;

/// Go integration statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoStats {
    pub successful_inserts: u64,
    pub failed_inserts: u64,
    pub batch_operations: u64,
    pub go_calls: u64,
    pub go_binary_path: String,
    pub working_directory: String,
    pub is_initialized: bool,
}

/// Go Integration - Handles communication with Go Supabase component (temporary products system)
/// 
/// Responsibilities:
/// - Migrate accepted products from temporary table to main products table
/// - Call Go component for batch operations
/// - Handle Go binary execution and error handling
/// - Manage Go component communication protocols
/// - Handle Go component response parsing
pub struct GoIntegration {
    go_supabase_binary: String,
    go_working_directory: String,
    
    // Statistics
    successful_inserts: Arc<AtomicU64>,
    failed_inserts: Arc<AtomicU64>,
    batch_operations: Arc<AtomicU64>,
    pub go_calls: Arc<AtomicU64>,
    
    pub is_initialized: Arc<std::sync::atomic::AtomicBool>,
}

impl GoIntegration {
    /// Create a new GoIntegration instance
    pub fn new() -> Self {
        Self {
            go_supabase_binary: String::new(),
            go_working_directory: String::new(),
            successful_inserts: Arc::new(AtomicU64::new(0)),
            failed_inserts: Arc::new(AtomicU64::new(0)),
            batch_operations: Arc::new(AtomicU64::new(0)),
            go_calls: Arc::new(AtomicU64::new(0)),
            is_initialized: Arc::new(std::sync::atomic::AtomicBool::new(false)),
        }
    }
    
    /// Initialize Go integration with binary path
    pub async fn initialize(&mut self) -> Result<bool> {
        info!("🔧 Initializing GoIntegration...");
        
        // Set default paths
        self.go_supabase_binary = "go-supabase/main".to_string();
        self.go_working_directory = "go-supabase".to_string();
        
        // Check if Go binary exists and is executable
        if !self.check_go_binary().await? {
            error!("❌ Go binary not found or not executable");
            return Ok(false);
        }
        
        // Verify Go component is working
        if !self.verify_go_component().await? {
            error!("❌ Go component verification failed");
            return Ok(false);
        }
        
        self.is_initialized.store(true, Ordering::Relaxed);
        info!("✅ GoIntegration initialized successfully");
        Ok(true)
    }
    
    /// Migrate accepted product from temporary table to main table via Go component
    pub async fn migrate_product(&self, product: &ProductData) -> Result<bool> {
        if !self.is_initialized.load(Ordering::Relaxed) {
            return Err(anyhow::anyhow!("GoIntegration not initialized"));
        }
        
        self.go_calls.fetch_add(1, Ordering::Relaxed);
        
        let json_payload = self.generate_product_json(product);
        let command = "migrate-product";
        
        match self.execute_go_with_json(command, json_payload).await {
            Ok(exit_code) => {
                if exit_code == 0 {
                    self.successful_inserts.fetch_add(1, Ordering::Relaxed);
                    Ok(true)
                } else {
                    self.failed_inserts.fetch_add(1, Ordering::Relaxed);
                    Ok(false)
                }
            }
            Err(e) => {
                self.failed_inserts.fetch_add(1, Ordering::Relaxed);
                error!("❌ Error migrating product {}: {}", product.name, e);
                Err(e)
            }
        }
    }
    
    /// Get approved products from temporary table via Go component (approval_status = 1)
    pub async fn get_accepted_products(&self) -> Result<Vec<ProductData>> {
        if !self.is_initialized.load(Ordering::Relaxed) {
            return Err(anyhow::anyhow!("GoIntegration not initialized"));
        }
        
        self.go_calls.fetch_add(1, Ordering::Relaxed);
        
        match self.execute_go_command("get-approved-products").await {
            Ok(exit_code) => {
                if exit_code == 0 {
                    // In a real implementation, you would parse the output
                    // For now, return empty vector
                    Ok(Vec::new())
                } else {
                    Err(anyhow::anyhow!("Go command failed with exit code: {}", exit_code))
                }
            }
            Err(e) => {
                error!("❌ Error getting approved products: {}", e);
                Err(e)
            }
        }
    }
    
    /// Check if product exists in main table via Go component
    pub async fn check_product_exists(
        &self,
        name: &str,
        brand: &str,
        flavor: &str,
        year: &str,
    ) -> Result<bool> {
        if !self.is_initialized.load(Ordering::Relaxed) {
            return Err(anyhow::anyhow!("GoIntegration not initialized"));
        }
        
        self.go_calls.fetch_add(1, Ordering::Relaxed);
        
        let args = format!("check-product --name {} --brand {} --flavor {} --year {}", 
                          name, brand, flavor, year);
        
        match self.execute_go_command(&args).await {
            Ok(exit_code) => Ok(exit_code == 0),
            Err(e) => {
                error!("❌ Error checking product existence: {}", e);
                Err(e)
            }
        }
    }
    
    /// Check if brand exists via Go component
    pub async fn check_brand_exists(&self, brand_name: &str) -> Result<bool> {
        if !self.is_initialized.load(Ordering::Relaxed) {
            return Err(anyhow::anyhow!("GoIntegration not initialized"));
        }
        
        self.go_calls.fetch_add(1, Ordering::Relaxed);
        
        let args = format!("check-brand --name {}", brand_name);
        
        match self.execute_go_command(&args).await {
            Ok(exit_code) => Ok(exit_code == 0),
            Err(e) => {
                error!("❌ Error checking brand existence: {}", e);
                Err(e)
            }
        }
    }
    
    /// Verify Go component is working
    pub async fn verify_go_component(&self) -> Result<bool> {
        match self.execute_go_command("verify").await {
            Ok(exit_code) => Ok(exit_code == 0),
            Err(e) => {
                error!("❌ Go component verification failed: {}", e);
                Ok(false)
            }
        }
    }
    
    /// Get Go integration statistics
    pub async fn get_go_stats(&self) -> GoStats {
        GoStats {
            successful_inserts: self.successful_inserts.load(Ordering::Relaxed),
            failed_inserts: self.failed_inserts.load(Ordering::Relaxed),
            batch_operations: self.batch_operations.load(Ordering::Relaxed),
            go_calls: self.go_calls.load(Ordering::Relaxed),
            go_binary_path: self.go_supabase_binary.clone(),
            working_directory: self.go_working_directory.clone(),
            is_initialized: self.is_initialized.load(Ordering::Relaxed),
        }
    }
    
    /// Execute Go binary with command and arguments
    pub async fn execute_go_command(&self, args: &str) -> Result<i32> {
        let output = Command::new(&self.go_supabase_binary)
            .args(args.split_whitespace())
            .current_dir(&self.go_working_directory)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?
            .wait_with_output()?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            error!("Go command failed: {}", stderr);
        }
        
        Ok(output.status.code().unwrap_or(-1))
    }
    
    /// Execute Go binary with JSON payload
    async fn execute_go_with_json(&self, command: &str, json_payload: String) -> Result<i32> {
        let escaped_json = self.escape_json_for_shell(&json_payload);
        let args = format!("{} --json '{}'", command, escaped_json);
        
        self.execute_go_command(&args).await
    }
    
    /// Check if Go binary exists and is executable
    pub async fn check_go_binary(&self) -> Result<bool> {
        match Command::new(&self.go_supabase_binary)
            .arg("--version")
            .current_dir(&self.go_working_directory)
            .output()
        {
            Ok(output) => Ok(output.status.success()),
            Err(_) => Ok(false),
        }
    }
    
    /// Escape JSON string for shell execution
    fn escape_json_for_shell(&self, json: &str) -> String {
        json.replace('\'', "'\"'\"'")
    }
    
    /// Generate JSON payload for single product
    fn generate_product_json(&self, product: &ProductData) -> String {
        serde_json::to_string(product).unwrap_or_else(|_| "{}".to_string())
    }
    
    /// Generate JSON payload for batch products
    pub fn generate_batch_products_json(&self, products: &[ProductData]) -> String {
        serde_json::to_string(products).unwrap_or_else(|_| "[]".to_string())
    }
    
    /// Parse Go component response
    pub fn parse_go_response(&self, response: &str) -> bool {
        // Simple response parsing - in a real implementation, you'd parse JSON
        response.contains("success") || response.contains("ok")
    }
    
    /// Shutdown the Go integration
    pub async fn shutdown(&self) -> Result<()> {
        info!("🔧 Shutting down GoIntegration...");
        
        self.is_initialized.store(false, Ordering::Relaxed);
        
        info!("✅ GoIntegration shut down");
        Ok(())
    }
}
