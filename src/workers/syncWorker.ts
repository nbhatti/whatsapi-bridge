import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import logger from '../config/logger';
import { getRedisClient } from '../config/redis';
import { MetricsService } from '../config/metrics';

/**
 * Interface for sync worker configuration
 */
interface SyncWorkerConfig {
  syncInterval: number;
  lockKey: string;
  lockExpiry: number;
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Interface for downstream storage writer
 */
interface DownstreamWriter {
  write(messages: any[], queueType: 'in' | 'out'): Promise<void>;
}

/**
 * PostgreSQL writer implementation
 */
class PostgreSQLWriter implements DownstreamWriter {
  async write(messages: any[], queueType: 'in' | 'out'): Promise<void> {
    // TODO: Implement PostgreSQL batch write
    logger.info(`[PostgreSQL] Writing ${messages.length} messages from ${queueType} queue`);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * File writer implementation
 */
class FileWriter implements DownstreamWriter {
  private readonly basePath: string;

  constructor(basePath: string = './data') {
    this.basePath = basePath;
  }

  async write(messages: any[], queueType: 'in' | 'out'): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      // Ensure directory exists
      await fs.mkdir(this.basePath, { recursive: true });
      
      const filename = `messages_${queueType}_${new Date().toISOString().slice(0, 10)}.jsonl`;
      const filePath = path.join(this.basePath, filename);
      
      // Append messages as JSONL (JSON Lines)
      const data = messages.map(msg => JSON.stringify(msg)).join('\n') + '\n';
      await fs.appendFile(filePath, data, 'utf8');
      
      logger.info(`[File] Written ${messages.length} messages to ${filePath}`);
    } catch (error) {
      logger.error(`[File] Error writing messages:`, error);
      throw error;
    }
  }
}

/**
 * Webhook writer implementation
 */
class WebhookWriter implements DownstreamWriter {
  private readonly webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async write(messages: any[], queueType: 'in' | 'out'): Promise<void> {
    const axios = await import('axios');
    
    try {
      const payload = {
        queueType,
        messages,
        timestamp: new Date().toISOString(),
        count: messages.length
      };

      const response = await axios.default.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      logger.info(`[Webhook] Sent ${messages.length} messages to ${this.webhookUrl}, response: ${response.status}`);
    } catch (error) {
      logger.error(`[Webhook] Error sending messages to ${this.webhookUrl}:`, error);
      throw error;
    }
  }
}

/**
 * Periodic sync worker that processes messages from Redis queues
 * and writes them to downstream storage systems
 */
export class SyncWorker extends EventEmitter {
  private readonly redisClient: Redis;
  private readonly config: SyncWorkerConfig;
  private readonly downstreamWriters: DownstreamWriter[];
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly processId: string;

  constructor(
    redisClient?: Redis,
    customConfig?: Partial<SyncWorkerConfig>,
    downstreamWriters?: DownstreamWriter[]
  ) {
    super();
    
    this.redisClient = redisClient || getRedisClient();
    this.processId = `sync-worker-${process.pid}-${Date.now()}`;
    
    // Configuration with defaults
    this.config = {
      syncInterval: parseInt(process.env.SYNC_INTERVAL_MS || '60000', 10),
      lockKey: 'whatsapp:syncLock',
      lockExpiry: parseInt(process.env.SYNC_LOCK_EXPIRY_MS || '300000', 10), // 5 minutes
      batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '100', 10),
      retryAttempts: parseInt(process.env.SYNC_RETRY_ATTEMPTS || '3', 10),
      retryDelay: parseInt(process.env.SYNC_RETRY_DELAY_MS || '5000', 10),
      ...customConfig,
    };

    // Setup downstream writers
    this.downstreamWriters = downstreamWriters || this.createDefaultWriters();

    // Bind methods
    this.syncProcess = this.syncProcess.bind(this);
    this.acquireLock = this.acquireLock.bind(this);
    this.releaseLock = this.releaseLock.bind(this);
  }

  /**
   * Create default downstream writers based on environment configuration
   */
  private createDefaultWriters(): DownstreamWriter[] {
    const writers: DownstreamWriter[] = [];

    // PostgreSQL writer
    if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
      writers.push(new PostgreSQLWriter());
    }

    // File writer
    if (process.env.SYNC_FILE_PATH) {
      writers.push(new FileWriter(process.env.SYNC_FILE_PATH));
    }

    // Webhook writer
    if (process.env.SYNC_WEBHOOK_URL) {
      writers.push(new WebhookWriter(process.env.SYNC_WEBHOOK_URL));
    }

    // Default to file writer if no writers configured
    if (writers.length === 0) {
      writers.push(new FileWriter());
      logger.warn('No downstream writers configured, using default file writer');
    }

    return writers;
  }

  /**
   * Acquire distributed lock to prevent concurrent workers
   */
  private async acquireLock(): Promise<boolean> {
    try {
      const result = await this.redisClient.set(
        this.config.lockKey,
        this.processId,
        'PX',
        this.config.lockExpiry,
        'NX'
      );
      
      const acquired = result === 'OK';
      if (acquired) {
        logger.debug(`[SyncWorker] Lock acquired by ${this.processId}`);
      } else {
        logger.debug(`[SyncWorker] Failed to acquire lock, another worker is running`);
      }
      
      return acquired;
    } catch (error) {
      logger.error('[SyncWorker] Error acquiring lock:', error);
      return false;
    }
  }

  /**
   * Release distributed lock
   */
  private async releaseLock(): Promise<void> {
    try {
      // Use Lua script to safely release lock only if we own it
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.redisClient.eval(script, 1, this.config.lockKey, this.processId);
      
      if (result === 1) {
        logger.debug(`[SyncWorker] Lock released by ${this.processId}`);
      }
    } catch (error) {
      logger.error('[SyncWorker] Error releasing lock:', error);
    }
  }

  /**
   * Process messages from a specific queue
   */
  private async processQueue(queueKey: string, tempKey: string, queueType: 'in' | 'out'): Promise<number> {
    let processedCount = 0;
    const messages: any[] = [];

    try {
      // Move messages from main queue to temporary queue using RPOPLPUSH
      while (messages.length < this.config.batchSize) {
        const message = await this.redisClient.rpoplpush(queueKey, tempKey);
        if (!message) {
          break; // Queue is empty
        }

        try {
          // Parse message if it's JSON
          const parsedMessage = JSON.parse(message);
          messages.push(parsedMessage);
        } catch (parseError) {
          // If not JSON, store as plain text
          messages.push({ rawMessage: message, timestamp: new Date().toISOString() });
          logger.warn(`[SyncWorker] Non-JSON message in queue ${queueKey}:`, message);
        }
      }

      if (messages.length === 0) {
        return 0;
      }

      logger.info(`[SyncWorker] Processing ${messages.length} messages from ${queueKey}`);

      // Write to all downstream systems
      const writePromises = this.downstreamWriters.map(writer => 
        writer.write(messages, queueType)
      );

      await Promise.all(writePromises);
      processedCount = messages.length;

      // On success, clear temporary queue
      await this.redisClient.del(tempKey);
      
      logger.info(`[SyncWorker] Successfully synced ${processedCount} messages from ${queueKey}`);
      
      return processedCount;

    } catch (error) {
      logger.error(`[SyncWorker] Error processing queue ${queueKey}:`, error);
      
      // On failure, rollback by moving messages back to main queue
      if (messages.length > 0) {
        try {
          logger.info(`[SyncWorker] Rolling back ${messages.length} messages to ${queueKey}`);
          
          // Move all messages from temp queue back to main queue
          const pipeline = this.redisClient.pipeline();
          
          while (true) {
            const message = await this.redisClient.rpoplpush(tempKey, queueKey);
            if (!message) break;
          }
          
          await pipeline.exec();
          logger.info(`[SyncWorker] Rollback completed for ${queueKey}`);
          
        } catch (rollbackError) {
          logger.error(`[SyncWorker] Error during rollback for ${queueKey}:`, rollbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Main sync process
   */
  private async syncProcess(): Promise<void> {
    const lockAcquired = await this.acquireLock();
    if (!lockAcquired) {
      return; // Another worker is running
    }

    try {
      logger.debug('[SyncWorker] Starting sync process');
      
      const startTime = Date.now();
      let totalProcessed = 0;

      // Process incoming messages
      const inProcessed = await this.processQueue('whatsapp:in', 'tmp:in', 'in');
      totalProcessed += inProcessed;
      
      // Track in sync cycles
      if (inProcessed > 0) {
        MetricsService.incrementSyncCycles('in', 'success');
      }

      // Process outgoing messages  
      const outProcessed = await this.processQueue('whatsapp:out', 'tmp:out', 'out');
      totalProcessed += outProcessed;
      
      // Track out sync cycles
      if (outProcessed > 0) {
        MetricsService.incrementSyncCycles('out', 'success');
      }
      
      // Track full sync cycle if both processed
      if (totalProcessed > 0) {
        MetricsService.incrementSyncCycles('full', 'success');
      }

      const duration = Date.now() - startTime;

      if (totalProcessed > 0) {
        logger.info(`[SyncWorker] Sync completed: ${totalProcessed} messages processed in ${duration}ms`);
        this.emit('sync_success', { 
          processedCount: totalProcessed, 
          duration,
          inProcessed,
          outProcessed
        });
      }

    } catch (error) {
      // Track error sync cycles
      MetricsService.incrementSyncCycles('full', 'error');
      
      logger.error('[SyncWorker] Sync process failed:', error);
      this.emit('sync_error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      await this.releaseLock();
    }
  }

  /**
   * Start the sync worker
   */
  public start(): void {
    if (this.isRunning) {
      logger.warn('[SyncWorker] Worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info(`[SyncWorker] Starting sync worker with interval ${this.config.syncInterval}ms`);

    // Run initial sync
    this.syncProcess().catch(error => {
      logger.error('[SyncWorker] Initial sync failed:', error);
    });

    // Setup periodic sync
    this.syncInterval = setInterval(this.syncProcess, this.config.syncInterval);
    
    // Emit start event
    this.emit('worker_started', { processId: this.processId, config: this.config });
  }

  /**
   * Stop the sync worker
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('[SyncWorker] Worker is not running');
      return;
    }

    this.isRunning = false;
    logger.info('[SyncWorker] Stopping sync worker');

    // Clear interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Release lock if we have it
    await this.releaseLock();

    // Clean up any temporary queues on shutdown
    try {
      await this.redisClient.del('tmp:in', 'tmp:out');
      logger.debug('[SyncWorker] Cleaned up temporary queues');
    } catch (error) {
      logger.error('[SyncWorker] Error cleaning up temporary queues:', error);
    }

    // Emit stop event
    this.emit('worker_stopped', { processId: this.processId });
  }

  /**
   * Get worker status
   */
  public getStatus(): {
    isRunning: boolean;
    processId: string;
    config: SyncWorkerConfig;
    uptime?: number;
  } {
    return {
      isRunning: this.isRunning,
      processId: this.processId,
      config: this.config,
    };
  }

  /**
   * Manually trigger sync process (for testing or admin purposes)
   */
  public async manualSync(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Worker is not running');
    }
    
    logger.info('[SyncWorker] Manual sync triggered');
    await this.syncProcess();
  }
}

/**
 * Factory function to create and start sync worker
 */
export function createSyncWorker(
  redisClient?: Redis,
  config?: Partial<SyncWorkerConfig>,
  downstreamWriters?: DownstreamWriter[]
): SyncWorker {
  const worker = new SyncWorker(redisClient, config, downstreamWriters);
  
  // Setup event listeners for logging
  worker.on('sync_success', (data) => {
    logger.info('[SyncWorker] Sync completed successfully', data);
  });

  worker.on('sync_error', (data) => {
    logger.error('[SyncWorker] Sync failed', data);
  });

  worker.on('worker_started', (data) => {
    logger.info('[SyncWorker] Worker started', data);
  });

  worker.on('worker_stopped', (data) => {
    logger.info('[SyncWorker] Worker stopped', data);
  });

  return worker;
}

/**
 * Start sync worker as standalone process (for PM2 or separate process)
 */
export async function startSyncWorkerProcess(): Promise<void> {
  const worker = createSyncWorker();
  
  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`[SyncWorker] Received ${signal}, shutting down gracefully...`);
    await worker.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  // Start the worker
  worker.start();
  
  logger.info('[SyncWorker] Sync worker process started');
}

// Export types and implementations
export type { SyncWorkerConfig, DownstreamWriter };
export { PostgreSQLWriter, FileWriter, WebhookWriter };

// Auto-start if this file is run directly
if (require.main === module) {
  startSyncWorkerProcess().catch(error => {
    logger.error('[SyncWorker] Failed to start worker process:', error);
    process.exit(1);
  });
}
