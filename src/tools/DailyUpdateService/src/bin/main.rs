use daily_update_service::{DailyUpdateServiceV2, config::ServiceConfig};
use anyhow::Result;
use tracing::{info, error};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    info!("🚀 Starting DailyUpdateService Rust implementation...");
    
    // Load configuration
    let config = ServiceConfig::default();
    
    // Create service instance
    let service = DailyUpdateServiceV2::new(config);
    
    // Initialize the service
    if let Err(e) = service.initialize().await {
        error!("❌ Failed to initialize service: {}", e);
        return Err(e);
    }
    
    // Start the service
    if let Err(e) = service.start().await {
        error!("❌ Failed to start service: {}", e);
        return Err(e);
    }
    
    info!("✅ DailyUpdateService started successfully");
    
    // Keep the service running
    tokio::signal::ctrl_c().await?;
    
    info!("🛑 Shutting down DailyUpdateService...");
    
    // Stop the service
    if let Err(e) = service.stop().await {
        error!("❌ Error stopping service: {}", e);
    }
    
    info!("✅ DailyUpdateService shut down successfully");
    Ok(())
}
