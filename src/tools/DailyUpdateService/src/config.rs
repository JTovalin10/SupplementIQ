use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Service configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceConfig {
    /// Base directory for data storage
    pub base_directory: PathBuf,
    
    /// Cache configuration
    pub cache_config: CacheConfig,
    
    /// Go integration configuration
    pub go_config: GoConfig,
    
    /// Update schedule configuration
    pub update_config: UpdateConfig,
}

/// Cache configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheConfig {
    /// Maximum cache capacity
    pub max_capacity: u64,
    
    /// Time to live in seconds
    pub ttl_seconds: u64,
    
    /// Time to idle in seconds
    pub idle_seconds: u64,
}


/// Go integration configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoConfig {
    /// Go binary path
    pub binary_path: PathBuf,
    
    /// Working directory
    pub working_directory: PathBuf,
    
    /// Command timeout in seconds
    pub command_timeout: u64,
}

/// Update schedule configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateConfig {
    /// Update interval in hours
    pub update_interval_hours: u64,
    
    /// Check interval in minutes
    pub check_interval_minutes: u64,
    
    /// Enable automatic updates
    pub enable_automatic_updates: bool,
}

impl Default for ServiceConfig {
    fn default() -> Self {
        Self {
            base_directory: PathBuf::from("./data/daily-update"),
            cache_config: CacheConfig::default(),
            go_config: GoConfig::default(),
            update_config: UpdateConfig::default(),
        }
    }
}

impl Default for CacheConfig {
    fn default() -> Self {
        Self {
            max_capacity: 10_000,
            ttl_seconds: 3600, // 1 hour
            idle_seconds: 1800, // 30 minutes
        }
    }
}


impl Default for GoConfig {
    fn default() -> Self {
        Self {
            binary_path: PathBuf::from("go-supabase/main"),
            working_directory: PathBuf::from("go-supabase"),
            command_timeout: 30,
        }
    }
}

impl Default for UpdateConfig {
    fn default() -> Self {
        Self {
            update_interval_hours: 1,
            check_interval_minutes: 5,
            enable_automatic_updates: true,
        }
    }
}
