#!/usr/bin/env ts-node

import { Redis } from 'ioredis';
import axios from 'axios';
import { performance } from 'perf_hooks';

/**
 * Staging Environment Monitor
 * 
 * Monitors Redis memory usage and sync lag in staging environment.
 * Provides alerts when thresholds are exceeded.
 */

interface MonitoringConfig {
  redisUrl: string;
  apiUrl: string;
  apiKey: string;
  memoryThresholdMB: number;
  syncLagThresholdMs: number;
  checkIntervalMs: number;
  alertWebhook?: string;
}

interface MonitoringMetrics {
  timestamp: number;
  redisMemory: {
    used: number;
    peak: number;
    rss: number;
    fragmentation: number;
  };
  syncLag: {
    current: number;
    average: number;
    max: number;
  };
  application: {
    healthy: boolean;
    responseTime: number;
    cacheHitRate?: number;
  };
  alerts: string[];
}

class StagingMonitor {
  private redisClient: Redis;
  private config: MonitoringConfig;
  private syncLagHistory: number[] = [];
  private alertCooldown: Set<string> = new Set();

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.redisClient = new Redis(config.redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring(): Promise<void> {
    console.log('🔍 Starting staging environment monitoring...');
    console.log(`📊 Check interval: ${this.config.checkIntervalMs / 1000}s`);
    console.log(`💾 Memory threshold: ${this.config.memoryThresholdMB}MB`);
    console.log(`⏱️ Sync lag threshold: ${this.config.syncLagThresholdMs}ms`);
    
    // Initial connection test
    try {
      await this.redisClient.ping();
      console.log('✅ Redis connection established');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      process.exit(1);
    }

    // Start monitoring loop
    setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        await this.processMetrics(metrics);
        this.displayMetrics(metrics);
      } catch (error) {
        console.error('❌ Monitoring error:', error);
      }
    }, this.config.checkIntervalMs);

    // Keep process alive
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * Collect all monitoring metrics
   */
  private async collectMetrics(): Promise<MonitoringMetrics> {
    const timestamp = Date.now();
    const alerts: string[] = [];

    // Collect Redis metrics
    const redisMetrics = await this.getRedisMetrics();
    
    // Collect application metrics
    const appMetrics = await this.getApplicationMetrics();
    
    // Calculate sync lag
    const syncLag = await this.calculateSyncLag();

    return {
      timestamp,
      redisMemory: redisMetrics,
      syncLag,
      application: appMetrics,
      alerts
    };
  }

  /**
   * Get Redis memory and performance metrics
   */
  private async getRedisMetrics() {
    const info = await this.redisClient.info('memory');
    const lines = info.split('\r\n');
    
    const getMetric = (key: string): number => {
      const line = lines.find(l => l.startsWith(key + ':'));
      return line ? parseInt(line.split(':')[1]) : 0;
    };

    const usedMemory = getMetric('used_memory');
    const peakMemory = getMetric('used_memory_peak');
    const rssMemory = getMetric('used_memory_rss');
    const fragmentation = parseFloat(
      lines.find(l => l.startsWith('mem_fragmentation_ratio:'))?.split(':')[1] || '1.0'
    );

    return {
      used: Math.round(usedMemory / 1024 / 1024), // Convert to MB
      peak: Math.round(peakMemory / 1024 / 1024),
      rss: Math.round(rssMemory / 1024 / 1024),
      fragmentation: Math.round(fragmentation * 100) / 100
    };
  }

  /**
   * Get application health and response time metrics
   */
  private async getApplicationMetrics() {
    const startTime = performance.now();
    
    try {
      const response = await axios.get(`${this.config.apiUrl}/health`, {
        headers: {
          'x-api-key': this.config.apiKey
        },
        timeout: 10000
      });

      const responseTime = Math.round(performance.now() - startTime);
      
      return {
        healthy: response.status === 200,
        responseTime,
        cacheHitRate: response.data.cache?.hitRate
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Math.round(performance.now() - startTime)
      };
    }
  }

  /**
   * Calculate sync lag metrics
   */
  private async calculateSyncLag() {
    try {
      // Get recent messages to calculate sync lag
      const startTime = performance.now();
      
      // Simulate cache write and read to measure sync lag
      const testKey = `sync_test_${Date.now()}`;
      await this.redisClient.set(testKey, JSON.stringify({ timestamp: Date.now() }), 'EX', 10);
      const result = await this.redisClient.get(testKey);
      
      const currentLag = Math.round(performance.now() - startTime);
      
      // Maintain history for averaging
      this.syncLagHistory.push(currentLag);
      if (this.syncLagHistory.length > 10) {
        this.syncLagHistory.shift();
      }

      const average = Math.round(
        this.syncLagHistory.reduce((a, b) => a + b, 0) / this.syncLagHistory.length
      );
      const max = Math.max(...this.syncLagHistory);

      // Cleanup test key
      await this.redisClient.del(testKey);

      return {
        current: currentLag,
        average,
        max
      };
    } catch (error) {
      console.error('Failed to calculate sync lag:', error);
      return {
        current: -1,
        average: -1,
        max: -1
      };
    }
  }

  /**
   * Process metrics and generate alerts
   */
  private async processMetrics(metrics: MonitoringMetrics): Promise<void> {
    const alerts: string[] = [];

    // Check Redis memory usage
    if (metrics.redisMemory.used > this.config.memoryThresholdMB) {
      const alertKey = 'redis-memory-high';
      if (!this.alertCooldown.has(alertKey)) {
        alerts.push(`🚨 Redis memory usage HIGH: ${metrics.redisMemory.used}MB (threshold: ${this.config.memoryThresholdMB}MB)`);
        this.alertCooldown.add(alertKey);
        setTimeout(() => this.alertCooldown.delete(alertKey), 300000); // 5 min cooldown
      }
    }

    // Check memory fragmentation
    if (metrics.redisMemory.fragmentation > 2.0) {
      const alertKey = 'redis-fragmentation';
      if (!this.alertCooldown.has(alertKey)) {
        alerts.push(`⚠️ Redis memory fragmentation HIGH: ${metrics.redisMemory.fragmentation}x`);
        this.alertCooldown.add(alertKey);
        setTimeout(() => this.alertCooldown.delete(alertKey), 600000); // 10 min cooldown
      }
    }

    // Check sync lag
    if (metrics.syncLag.current > this.config.syncLagThresholdMs) {
      const alertKey = 'sync-lag-high';
      if (!this.alertCooldown.has(alertKey)) {
        alerts.push(`🐌 Sync lag HIGH: ${metrics.syncLag.current}ms (threshold: ${this.config.syncLagThresholdMs}ms)`);
        this.alertCooldown.add(alertKey);
        setTimeout(() => this.alertCooldown.delete(alertKey), 120000); // 2 min cooldown
      }
    }

    // Check application health
    if (!metrics.application.healthy) {
      const alertKey = 'app-unhealthy';
      if (!this.alertCooldown.has(alertKey)) {
        alerts.push(`🚨 Application UNHEALTHY - Response time: ${metrics.application.responseTime}ms`);
        this.alertCooldown.add(alertKey);
        setTimeout(() => this.alertCooldown.delete(alertKey), 60000); // 1 min cooldown
      }
    }

    // Send alerts if configured
    if (alerts.length > 0 && this.config.alertWebhook) {
      await this.sendAlerts(alerts, metrics);
    }

    metrics.alerts = alerts;
  }

  /**
   * Send alerts to configured webhook
   */
  private async sendAlerts(alerts: string[], metrics: MonitoringMetrics): Promise<void> {
    try {
      await axios.post(this.config.alertWebhook!, {
        text: `🚨 Staging Environment Alert`,
        attachments: [{
          color: 'danger',
          fields: [
            {
              title: 'Alerts',
              value: alerts.join('\n'),
              short: false
            },
            {
              title: 'Redis Memory',
              value: `${metrics.redisMemory.used}MB (${metrics.redisMemory.fragmentation}x frag)`,
              short: true
            },
            {
              title: 'Sync Lag',
              value: `${metrics.syncLag.current}ms (avg: ${metrics.syncLag.average}ms)`,
              short: true
            }
          ]
        }]
      });
    } catch (error) {
      console.error('Failed to send alerts:', error);
    }
  }

  /**
   * Display metrics in console
   */
  private displayMetrics(metrics: MonitoringMetrics): void {
    const timestamp = new Date(metrics.timestamp).toISOString();
    
    console.log(`\n📊 [${timestamp}] Staging Metrics:`);
    
    // Redis metrics
    const memoryStatus = metrics.redisMemory.used > this.config.memoryThresholdMB ? '🔴' : '🟢';
    console.log(`${memoryStatus} Redis Memory: ${metrics.redisMemory.used}MB / ${this.config.memoryThresholdMB}MB (${metrics.redisMemory.fragmentation}x frag)`);
    
    // Sync lag
    const lagStatus = metrics.syncLag.current > this.config.syncLagThresholdMs ? '🔴' : '🟢';
    console.log(`${lagStatus} Sync Lag: ${metrics.syncLag.current}ms (avg: ${metrics.syncLag.average}ms, max: ${metrics.syncLag.max}ms)`);
    
    // Application health
    const healthStatus = metrics.application.healthy ? '🟢' : '🔴';
    console.log(`${healthStatus} App Health: ${metrics.application.healthy ? 'Healthy' : 'Unhealthy'} (${metrics.application.responseTime}ms)`);
    
    // Alerts
    if (metrics.alerts.length > 0) {
      console.log('🚨 ACTIVE ALERTS:');
      metrics.alerts.forEach(alert => console.log(`  ${alert}`));
    }

    // Rollback recommendation
    if (metrics.redisMemory.used > this.config.memoryThresholdMB * 1.2 || 
        metrics.syncLag.current > this.config.syncLagThresholdMs * 2) {
      console.log('\n🚨 CRITICAL: Consider rolling back with REDIS_ENABLED=false');
    }
  }

  /**
   * Generate rollback command
   */
  generateRollbackCommand(): string {
    return 'docker-compose -f config/staging/docker-compose.staging.yml up -d --env REDIS_ENABLED=false whatsapp-api';
  }

  /**
   * Shutdown monitoring gracefully
   */
  private async shutdown(): Promise<void> {
    console.log('\n🛑 Shutting down monitoring...');
    await this.redisClient.quit();
    process.exit(0);
  }
}

/**
 * Main execution
 */
async function main() {
  const config: MonitoringConfig = {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6380',
    apiUrl: process.env.STAGING_API_URL || 'http://localhost:3001',
    apiKey: process.env.API_KEY || 'staging-api-key',
    memoryThresholdMB: parseInt(process.env.REDIS_MEMORY_THRESHOLD_MB || '512'),
    syncLagThresholdMs: parseInt(process.env.SYNC_LAG_THRESHOLD_MS || '1000'),
    checkIntervalMs: parseInt(process.env.MONITOR_INTERVAL_MS || '30000'),
    alertWebhook: process.env.ALERT_WEBHOOK_URL
  };

  const monitor = new StagingMonitor(config);
  
  console.log('🚀 WhatsApp API Bridge - Staging Monitor');
  console.log('=========================================');
  console.log(`💾 Redis: ${config.redisUrl}`);
  console.log(`🌐 API: ${config.apiUrl}`);
  console.log(`🔔 Alerts: ${config.alertWebhook ? 'Enabled' : 'Console only'}`);
  
  await monitor.startMonitoring();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Monitor failed:', error);
    process.exit(1);
  });
}

export { StagingMonitor, MonitoringConfig, MonitoringMetrics };
