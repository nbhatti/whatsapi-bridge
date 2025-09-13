import * as client from 'prom-client';
import * as fs from 'fs';
import * as path from 'path';
import { env } from './env';

// Load config from JSON file
const configPath = path.join(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Create a Registry for custom metrics
const register = new client.Registry();

// Add default labels to all metrics
const defaultLabels = {
  service: config.metrics.prometheus.defaultLabels.service,
  environment: env.NODE_ENV,
  version: process.env.npm_package_version || '1.0.0',
};

register.setDefaultLabels(defaultLabels);

// Add process and Node.js metrics
client.collectDefaultMetrics({ register, prefix: config.metrics.prometheus.prefix });

// Cache-specific metrics
export const cacheHitsCounter = new client.Counter({
  name: `${config.metrics.prometheus.prefix}hits_total`,
  help: 'Total number of cache hits',
  labelNames: ['cache_type', 'operation'],
  registers: [register],
});

export const cacheFlushesCounter = new client.Counter({
  name: `${config.metrics.prometheus.prefix}flushes_total`,
  help: 'Total number of cache flushes',
  labelNames: ['flush_type'],
  registers: [register],
});

export const syncCyclesCounter = new client.Counter({
  name: `${config.metrics.prometheus.prefix}sync_cycles_total`,
  help: 'Total number of sync cycles completed',
  labelNames: ['sync_type', 'status'],
  registers: [register],
});

export const cacheListSizeGauge = new client.Gauge({
  name: `${config.metrics.prometheus.prefix}list_size`,
  help: 'Current size of cache lists',
  labelNames: ['list_type'],
  registers: [register],
});

export const redisPingLatencyGauge = new client.Gauge({
  name: `${config.metrics.prometheus.prefix}redis_ping_latency_ms`,
  help: 'Redis PING command latency in milliseconds',
  registers: [register],
});

export const cacheOperationDurationHistogram = new client.Histogram({
  name: `${config.metrics.prometheus.prefix}operation_duration_seconds`,
  help: 'Duration of cache operations',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  registers: [register],
});

// Export the register for metrics endpoint
export { register };

// Helper functions for common metric operations
export class MetricsService {
  static incrementCacheHits(cacheType: 'in' | 'out' | 'chats' | 'chat_details' | 'chat_participants', operation: 'get' | 'set' | 'delete' | 'hit' | 'miss' | 'expired'): void {
    if (config.metrics.prometheus.enabled) {
      cacheHitsCounter.inc({ cache_type: cacheType, operation });
    }
  }

  static incrementCacheFlushes(flushType: 'manual' | 'auto' | 'full' | 'device_invalidation' | 'chat_invalidation' | 'chat_clear_all'): void {
    if (config.metrics.prometheus.enabled) {
      cacheFlushesCounter.inc({ flush_type: flushType });
    }
  }

  static incrementSyncCycles(syncType: 'in' | 'out' | 'full', status: 'success' | 'error'): void {
    if (config.metrics.prometheus.enabled) {
      syncCyclesCounter.inc({ sync_type: syncType, status });
    }
  }

  static setCacheListSize(listType: 'in' | 'out', size: number): void {
    if (config.metrics.prometheus.enabled) {
      cacheListSizeGauge.set({ list_type: listType }, size);
    }
  }

  static setRedisPingLatency(latencyMs: number): void {
    if (config.metrics.prometheus.enabled) {
      redisPingLatencyGauge.set(latencyMs);
    }
  }

  static recordCacheOperationDuration(operation: string, durationSeconds: number): void {
    if (config.metrics.prometheus.enabled) {
      cacheOperationDurationHistogram.observe({ operation }, durationSeconds);
    }
  }

  static async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
