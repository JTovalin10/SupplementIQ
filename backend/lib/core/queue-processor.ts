/**
 * Queue Processor
 * Handles the actual execution of queued update requests
 * Integrates with the daily update service and maintains security restrictions
 */

import { dailyUpdateService } from '../services/daily-update-service';
import { QueuedRequest, requestQueue } from './request-queue';

class QueueProcessor {
  private isProcessing: boolean = false;
  private executionHistory: Array<{
    requestId: string;
    type: 'democratic' | 'owner';
    executedAt: Date;
    executionTime: number;
    success: boolean;
    error?: string;
  }> = [];

  constructor() {
    this.setupEventHandlers();
    console.log('🔄 QueueProcessor initialized with optimized cleanup');
  }

  /**
   * Setup event handlers for queue events
   */
  private setupEventHandlers(): void {
    // Optimized polling - only check when queue has requests
    this.startOptimizedPolling();
  }

  /**
   * Start optimized polling that only runs when requests are present
   */
  private startOptimizedPolling(): void {
    const pollQueue = () => {
      const queueStats = requestQueue.getStats();
      
      if (queueStats.queueSize > 0) {
        // Only process if there are requests
        this.checkAndProcessQueue();
        // Schedule next poll in 1 second
        setTimeout(pollQueue, 1000);
      } else {
        // No requests, wait longer before checking again
        setTimeout(pollQueue, 5000); // Check every 5 seconds when idle
      }
    };
    
    // Start polling
    pollQueue();
    console.log('⏰ QueueProcessor: Started optimized polling (1s when active, 5s when idle)');
  }

  /**
   * Check and process the queue
   */
  private async checkAndProcessQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    const queueStats = requestQueue.getStats();
    if (queueStats.queueSize === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 QueueProcessor: Processing ${queueStats.queueSize} queued requests`);

    try {
      // Get the next request (highest priority)
      const queueContents = requestQueue.getQueue();
      if (queueContents.length === 0) {
        return;
      }

      // Sort by priority (higher priority first)
      queueContents.sort((a, b) => b.priority - a.priority);
      const request = queueContents[0];

      // Execute the request
      await this.executeUpdateRequest(request);

    } catch (error) {
      console.error('❌ QueueProcessor error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute an update request
   */
  private async executeUpdateRequest(request: QueuedRequest): Promise<void> {
    const startTime = Date.now();
    console.log(`⚡ QueueProcessor: Executing ${request.type} request ${request.id} from ${request.requesterName}`);

    try {
      // Check time restrictions before executing
      const timeCheckResult = await this.checkTimeRestrictions();
      if (!timeCheckResult.allowed) {
        throw new Error(timeCheckResult.reason);
      }

      // Execute the actual update
      await dailyUpdateService.forceUpdate();

      const executionTime = Date.now() - startTime;
      console.log(`✅ QueueProcessor: Request ${request.id} executed successfully in ${executionTime}ms`);

      // Record successful execution
      this.recordExecution(request, executionTime, true);

      // Remove from queue (this would need to be implemented in requestQueue)
      // For now, we'll let the queue handle this through its own mechanism

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ QueueProcessor: Request ${request.id} failed after ${executionTime}ms:`, errorMessage);
      
      // Record failed execution
      this.recordExecution(request, executionTime, false, errorMessage);

      // For failed requests, we might want to retry or handle differently
      // For now, we'll just log the failure
    }
  }

  /**
   * Check time restrictions for update execution
   */
  private async checkTimeRestrictions(): Promise<{ allowed: boolean; reason?: string }> {
    const now = new Date();
    const lastUpdateTime = dailyUpdateService.getLastUpdateTime();
    
    // Check if last update was less than 2 hours ago
    if (lastUpdateTime) {
      const timeSinceLastUpdate = now.getTime() - lastUpdateTime.getTime();
      const twoHoursMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      
      if (timeSinceLastUpdate < twoHoursMs) {
        const remainingTime = Math.ceil((twoHoursMs - timeSinceLastUpdate) / (60 * 1000)); // minutes
        return {
          allowed: false,
          reason: `Update cannot be executed yet. Please wait ${remainingTime} more minutes. (2-hour cooldown)`
        };
      }
    }
    
    // Check if we're within 1 hour of the scheduled daily update (3 AM)
    const scheduledUpdateHour = 3; // 3 AM
    const currentHour = now.getHours();
    const oneHourBuffer = 1;
    
    const isWithinUpdateWindow = 
      (currentHour >= (scheduledUpdateHour - oneHourBuffer) && currentHour <= (scheduledUpdateHour + oneHourBuffer));
    
    if (isWithinUpdateWindow) {
      return {
        allowed: false,
        reason: `Update cannot be executed within 1 hour of scheduled daily update (${scheduledUpdateHour}:00 AM)`
      };
    }

    return { allowed: true };
  }

  /**
   * Record execution history
   */
  private recordExecution(
    request: QueuedRequest, 
    executionTime: number, 
    success: boolean, 
    error?: string
  ): void {
    this.executionHistory.push({
      requestId: request.id,
      type: request.type,
      executedAt: new Date(),
      executionTime,
      success,
      error
    });

    // Keep only last 100 executions to prevent memory growth
    if (this.executionHistory.length > 100) {
      this.executionHistory = this.executionHistory.slice(-100);
    }
  }

  /**
   * Get execution statistics
   */
  getStats(): {
    isProcessing: boolean;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    recentExecutions: Array<{
      requestId: string;
      type: 'democratic' | 'owner';
      executedAt: Date;
      executionTime: number;
      success: boolean;
    }>;
  } {
    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(e => e.success).length;
    const failedExecutions = totalExecutions - successfulExecutions;
    const averageExecutionTime = totalExecutions > 0 
      ? this.executionHistory.reduce((sum, e) => sum + e.executionTime, 0) / totalExecutions 
      : 0;

    return {
      isProcessing: this.isProcessing,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime: Math.round(averageExecutionTime),
      recentExecutions: this.executionHistory.slice(-10).map(e => ({
        requestId: e.requestId,
        type: e.type,
        executedAt: e.executedAt,
        executionTime: e.executionTime,
        success: e.success
      }))
    };
  }

  /**
   * Force process queue (for testing/admin use)
   */
  async forceProcess(): Promise<void> {
    await this.checkAndProcessQueue();
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit: number = 50): typeof this.executionHistory {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    const clearedCount = this.executionHistory.length;
    this.executionHistory = [];
    console.log(`🧹 Cleared ${clearedCount} execution history entries`);
  }
}

// Singleton instance
export const queueProcessor = new QueueProcessor();

export { QueueProcessor };
