/**
 * Request Queue System
 * Implements a pull-based queue with size limit 1 and 2-second polling
 * Prevents insider attacks through controlled execution timing
 */

interface QueuedRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  timestamp: Date;
  type: 'democratic' | 'owner';
  data: any;
  priority: number; // Higher number = higher priority
}

interface QueueConfig {
  maxQueueSize: number;
  pollIntervalMs: number;
  maxWaitTimeMs: number;
  enableAntiAttackMode: boolean;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private config: QueueConfig;
  private lastProcessedTime: Date | null = null;
  private totalProcessed: number = 0;
  private totalRejected: number = 0;

  constructor(config?: Partial<QueueConfig>) {
    this.config = {
      maxQueueSize: 1, // Only 1 request at a time
      pollIntervalMs: 2000, // Check every 2 seconds
      maxWaitTimeMs: 60000, // Max wait time (1 minute)
      enableAntiAttackMode: true,
      ...config
    };

    console.log('🚀 RequestQueue initialized with config:', this.config);
    this.startPolling();
  }

  /**
   * Add a request to the queue
   * @param request The request to queue
   * @returns Promise<boolean> - true if queued, false if rejected
   */
  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'priority'>): Promise<boolean> {
    const queuedRequest: QueuedRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      priority: request.type === 'owner' ? 100 : 50, // Owner requests have higher priority
      ...request
    };

    // Check if queue is full
    if (this.queue.length >= this.config.maxQueueSize) {
      console.log(`🚫 Queue full (${this.queue.length}/${this.config.maxQueueSize}), rejecting request ${queuedRequest.id}`);
      this.totalRejected++;
      return false;
    }

    // Anti-attack mode: Check for rapid requests
    if (this.config.enableAntiAttackMode && this.isRapidRequest(queuedRequest)) {
      console.log(`🚫 Anti-attack mode: Rapid request detected from ${queuedRequest.requesterId}`);
      this.totalRejected++;
      return false;
    }

    // Add to queue
    this.queue.push(queuedRequest);
    console.log(`✅ Request ${queuedRequest.id} queued (${this.queue.length}/${this.config.maxQueueSize})`);

    // Trigger immediate processing if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }

    return true;
  }

  /**
   * Start the polling mechanism
   */
  private startPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }

    this.pollTimer = setInterval(() => {
      this.processQueue();
    }, this.config.pollIntervalMs);

    console.log(`⏰ Started polling every ${this.config.pollIntervalMs}ms`);
  }

  /**
   * Stop the polling mechanism
   */
  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      console.log('⏹️ Stopped polling');
    }
  }

  /**
   * Process the queue (pull-based execution)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing queue (${this.queue.length} requests)`);

    try {
      // Sort by priority (higher priority first)
      this.queue.sort((a, b) => b.priority - a.priority);

      // Process the highest priority request
      const request = this.queue.shift();
      if (request) {
        await this.executeRequest(request);
        this.lastProcessedTime = new Date();
        this.totalProcessed++;
      }
    } catch (error) {
      console.error('❌ Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a request
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    const startTime = Date.now();
    console.log(`⚡ Executing request ${request.id} (${request.type}) from ${request.requesterName}`);

    try {
      // Simulate request execution
      // In real implementation, this would call the actual update service
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms execution time

      const executionTime = Date.now() - startTime;
      console.log(`✅ Request ${request.id} executed successfully in ${executionTime}ms`);

      // Emit event for external handling
      this.emitRequestExecuted(request, executionTime);

    } catch (error) {
      console.error(`❌ Request ${request.id} execution failed:`, error);
      this.emitRequestFailed(request, error);
    }
  }

  /**
   * Check if this is a rapid request (anti-attack)
   */
  private isRapidRequest(request: QueuedRequest): boolean {
    if (!this.lastProcessedTime) {
      return false;
    }

    const timeSinceLastProcessed = Date.now() - this.lastProcessedTime.getTime();
    const rapidThreshold = 5000; // 5 seconds

    // Check for rapid requests from the same admin
    const recentRequests = this.queue.filter(r => 
      r.requesterId === request.requesterId &&
      (Date.now() - r.timestamp.getTime()) < rapidThreshold
    );

    return recentRequests.length > 0 || timeSinceLastProcessed < rapidThreshold;
  }

  /**
   * Emit request executed event
   */
  private emitRequestExecuted(request: QueuedRequest, executionTime: number): void {
    // This would typically emit to an event emitter or call a callback
    console.log(`📡 Request ${request.id} executed:`, {
      type: request.type,
      requester: request.requesterName,
      executionTime,
      queueSize: this.queue.length
    });
  }

  /**
   * Emit request failed event
   */
  private emitRequestFailed(request: QueuedRequest, error: any): void {
    console.error(`📡 Request ${request.id} failed:`, {
      type: request.type,
      requester: request.requesterName,
      error: error.message
    });
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueSize: number;
    maxQueueSize: number;
    isProcessing: boolean;
    lastProcessedTime: Date | null;
    totalProcessed: number;
    totalRejected: number;
    pollIntervalMs: number;
    config: QueueConfig;
  } {
    return {
      queueSize: this.queue.length,
      maxQueueSize: this.config.maxQueueSize,
      isProcessing: this.isProcessing,
      lastProcessedTime: this.lastProcessedTime,
      totalProcessed: this.totalProcessed,
      totalRejected: this.totalRejected,
      pollIntervalMs: this.config.pollIntervalMs,
      config: this.config
    };
  }

  /**
   * Get current queue contents
   */
  getQueue(): QueuedRequest[] {
    return [...this.queue]; // Return copy to prevent external modification
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    const clearedCount = this.queue.length;
    this.queue = [];
    console.log(`🧹 Cleared ${clearedCount} requests from queue`);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Queue config updated:', this.config);

    // Restart polling if interval changed
    if (newConfig.pollIntervalMs) {
      this.startPolling();
    }
  }

  /**
   * Force process queue (for testing)
   */
  async forceProcess(): Promise<void> {
    await this.processQueue();
  }

  /**
   * Check if queue is healthy
   */
  isHealthy(): boolean {
    const now = Date.now();
    const maxAge = this.config.maxWaitTimeMs;
    
    // Check for stale requests
    const staleRequests = this.queue.filter(req => 
      (now - req.timestamp.getTime()) > maxAge
    );

    return staleRequests.length === 0;
  }

  /**
   * Cleanup stale requests
   */
  cleanupStaleRequests(): number {
    const now = Date.now();
    const maxAge = this.config.maxWaitTimeMs;
    
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(req => 
      (now - req.timestamp.getTime()) <= maxAge
    );

    const removedCount = initialLength - this.queue.length;
    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} stale requests`);
    }

    return removedCount;
  }

  /**
   * Shutdown the queue
   */
  shutdown(): void {
    this.stopPolling();
    this.clearQueue();
    console.log('🛑 RequestQueue shutdown complete');
  }
}

// Singleton instance
export const requestQueue = new RequestQueue({
  maxQueueSize: 1,
  pollIntervalMs: 2000,
  maxWaitTimeMs: 60000,
  enableAntiAttackMode: true
});

// Optimized cleanup - only runs when requests are present
let queueCleanupTimer: NodeJS.Timeout | null = null;

function scheduleQueueCleanup(): void {
  // Cancel existing timer if any
  if (queueCleanupTimer) {
    clearTimeout(queueCleanupTimer);
  }
  
  // Only schedule cleanup if there are queued requests
  const stats = requestQueue.getStats();
  if (stats.queueSize > 0) {
    queueCleanupTimer = setTimeout(() => {
      const cleanedCount = requestQueue.cleanupStaleRequests();
      if (cleanedCount > 0) {
        console.log(`🧹 Queue: Cleaned up ${cleanedCount} stale requests`);
      }
      // Schedule next cleanup if there are still queued requests
      scheduleQueueCleanup();
    }, 30000); // 30 seconds
    console.log(`🧹 Queue cleanup scheduled in 30 seconds (${stats.queueSize} queued requests)`);
  } else {
    console.log('🧹 No queued requests, queue cleanup stopped');
  }
}

// Override the original enqueue method to trigger cleanup scheduling
const originalEnqueue = requestQueue.enqueue.bind(requestQueue);
requestQueue.enqueue = async function(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'priority'>): Promise<boolean> {
  const result = await originalEnqueue(request);
  if (result) {
    // Schedule cleanup since we added a request
    scheduleQueueCleanup();
  }
  return result;
};

// Initial cleanup scheduling
scheduleQueueCleanup();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down RequestQueue...');
  requestQueue.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down RequestQueue...');
  requestQueue.shutdown();
  process.exit(0);
});

export { RequestQueue };
export type { QueueConfig, QueuedRequest };

