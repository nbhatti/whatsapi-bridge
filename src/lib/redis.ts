import Redis, { RedisOptions, Cluster } from 'ioredis';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  tls?: boolean;
  db?: number;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  lazyConnect?: boolean;
}

class RedisManager {
  private static instance: RedisManager | null = null;
  private client: Redis | Cluster | null = null;
  private config: RedisConfig | null = null;
  private keyPrefix: string;

  private constructor() {
    const env = process.env.NODE_ENV || 'development';
    this.keyPrefix = `whatsapp:${env}:`;
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  private getConfig(): RedisConfig {
    if (this.config) {
      return this.config;
    }

    // Load configuration from environment variables with defaults
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === 'true',
      db: parseInt(process.env.REDIS_DB || '0', 10),
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
      lazyConnect: true,
    };

    return this.config;
  }

  private createRedisOptions(): RedisOptions {
    const config = this.getConfig();
    
    const options: RedisOptions = {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      connectTimeout: config.connectTimeout,
      commandTimeout: config.commandTimeout,
      lazyConnect: config.lazyConnect,
      keyPrefix: this.keyPrefix,
    };

    // Add TLS configuration if enabled
    if (config.tls) {
      options.tls = {};
    }

    return options;
  }

  private createClusterOptions(): any {
    const config = this.getConfig();
    
    return {
      redisOptions: {
        password: config.password,
        db: config.db,
        keyPrefix: this.keyPrefix,
        tls: config.tls ? {} : undefined,
      },
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      retryDelayOnFailover: config.retryDelayOnFailover,
      lazyConnect: config.lazyConnect,
    };
  }

  private async createClient(): Promise<Redis | Cluster> {
    const config = this.getConfig();
    
    // Check if we're using Redis Cluster
    const clusterHosts = process.env.REDIS_CLUSTER_HOSTS;
    
    if (clusterHosts) {
      // Parse cluster hosts (format: "host1:port1,host2:port2,...")
      const hosts = clusterHosts.split(',').map(hostPort => {
        const [host, port] = hostPort.trim().split(':');
        return { host, port: parseInt(port || '6379', 10) };
      });

      const clusterOptions = this.createClusterOptions();
      this.client = new Redis.Cluster(hosts, clusterOptions);
    } else {
      // Single Redis instance
      const options = this.createRedisOptions();
      this.client = new Redis(options);
    }

    // Add event listeners
    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('ready', () => {
      console.log('Redis client ready');
    });

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    this.client.on('close', () => {
      console.log('Redis client connection closed');
    });

    this.client.on('reconnecting', () => {
      console.log('Redis client reconnecting...');
    });

    return this.client;
  }

  /**
   * Get the Redis client instance. Creates connection lazily on first access.
   */
  public async getRedis(): Promise<Redis | Cluster> {
    if (!this.client) {
      this.client = await this.createClient();
    }
    return this.client;
  }

  /**
   * Close the Redis connection
   */
  public async closeRedis(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      console.log('Redis connection closed');
    }
  }

  /**
   * Get the current key prefix
   */
  public getKeyPrefix(): string {
    return this.keyPrefix;
  }

  /**
   * Add prefix to a key if not already present
   */
  public prefixKey(key: string): string {
    if (key.startsWith(this.keyPrefix)) {
      return key;
    }
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Remove prefix from a key
   */
  public unprefixKey(key: string): string {
    if (key.startsWith(this.keyPrefix)) {
      return key.substring(this.keyPrefix.length);
    }
    return key;
  }

  /**
   * Health check for Redis connection
   */
  public async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const client = await this.getRedis();
      await client.ping();
      return { status: 'healthy', message: 'Redis connection is working' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get connection info
   */
  public getConnectionInfo(): { host: string; port: number; keyPrefix: string; isCluster: boolean } {
    const config = this.getConfig();
    return {
      host: config.host,
      port: config.port,
      keyPrefix: this.keyPrefix,
      isCluster: !!process.env.REDIS_CLUSTER_HOSTS,
    };
  }
}

// Export singleton instance methods
const redisManager = RedisManager.getInstance();

/**
 * Get the Redis client instance. Creates connection lazily on first access.
 * Supports both single Redis instance and Redis Cluster.
 */
export const getRedis = (): Promise<Redis | Cluster> => redisManager.getRedis();

/**
 * Close the Redis connection
 */
export const closeRedis = (): Promise<void> => redisManager.closeRedis();

/**
 * Get the current key prefix (whatsapp:{env}:)
 */
export const getKeyPrefix = (): string => redisManager.getKeyPrefix();

/**
 * Add prefix to a key if not already present
 */
export const prefixKey = (key: string): string => redisManager.prefixKey(key);

/**
 * Remove prefix from a key
 */
export const unprefixKey = (key: string): string => redisManager.unprefixKey(key);

/**
 * Health check for Redis connection
 */
export const redisHealthCheck = (): Promise<{ status: string; message: string }> => redisManager.healthCheck();

/**
 * Get connection info
 */
export const getConnectionInfo = (): { host: string; port: number; keyPrefix: string; isCluster: boolean } => 
  redisManager.getConnectionInfo();

// Export the RedisManager class for advanced usage
export { RedisManager };

// Export types
export type { RedisConfig };
