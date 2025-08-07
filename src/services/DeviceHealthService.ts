import { getRedisClient } from '../config/redis';
import logger, { logInfo, logError, logWarn } from '../config/logger';
import { DeviceManager } from './DeviceManager';

export interface DeviceHealth {
  deviceId: string;
  status: 'healthy' | 'warning' | 'critical' | 'blocked';
  score: number; // 0-100, higher is better
  metrics: {
    messagesPerHour: number;
    successRate: number;
    avgResponseTime: number;
    disconnectionCount: number;
    lastActivity: number;
    warmupPhase: boolean;
  };
  warnings: string[];
  lastUpdated: number;
}

export interface DeviceActivityLog {
  timestamp: number;
  action: 'message_sent' | 'message_failed' | 'connected' | 'disconnected' | 'qr_generated' | 'authenticated';
  success: boolean;
  responseTime?: number;
  error?: string;
}

export class DeviceHealthService {
  private static instance: DeviceHealthService;
  private redisClient;
  private deviceManager;
  private monitoringInterval?: NodeJS.Timeout;
  
  // Redis keys with specific prefixes to avoid conflicts
  private readonly HEALTH_KEY = 'whatsapp:device_health';
  private readonly ACTIVITY_KEY = 'whatsapp:device_activity';
  private readonly WARMUP_KEY = 'whatsapp:device_warmup';
  
  // Health scoring weights
  private readonly SCORE_WEIGHTS = {
    activity: 0.3,
    successRate: 0.4,
    responseTime: 0.2,
    stability: 0.1,
  };

  private constructor() {
    this.redisClient = getRedisClient();
    this.deviceManager = DeviceManager.getInstance();
    this.startMonitoring();
  }

  public static getInstance(): DeviceHealthService {
    if (!DeviceHealthService.instance) {
      DeviceHealthService.instance = new DeviceHealthService();
    }
    return DeviceHealthService.instance;
  }

  /**
   * Start monitoring device health
   */
  private startMonitoring(): void {
    logInfo('Device health monitoring started');
    
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateAllDeviceHealth();
      } catch (error) {
        logError('Error updating device health:', error);
      }
    }, 30000);

    // Cleanup on process exit
    process.on('SIGINT', () => {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        logInfo('Device health monitoring stopped');
      }
    });
  }

  /**
   * Log device activity
   */
  public async logActivity(deviceId: string, activity: DeviceActivityLog): Promise<void> {
    try {
      const key = `${this.ACTIVITY_KEY}:${deviceId}`;
      const activityData = JSON.stringify(activity);
      
      // Add to Redis list (keep last 100 activities)
      await this.redisClient.lpush(key, activityData);
      await this.redisClient.ltrim(key, 0, 99);
      
      // Update device health immediately for critical events
      if (activity.action === 'disconnected' || (activity.action === 'message_failed' && !activity.success)) {
        await this.updateDeviceHealth(deviceId);
      }
    } catch (error) {
      logError(`Failed to log activity for device ${deviceId}:`, error);
    }
  }

  /**
   * Update health for all active devices
   */
  private async updateAllDeviceHealth(): Promise<void> {
    const devices = this.deviceManager.getAllDevices();
    
    for (const device of devices) {
      await this.updateDeviceHealth(device.id);
    }
  }

  /**
   * Update health for a specific device
   */
  public async updateDeviceHealth(deviceId: string): Promise<DeviceHealth> {
    const device = this.deviceManager.getDevice(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    // Get recent activity
    const activities = await this.getRecentActivity(deviceId, 100);
    
    // Calculate metrics
    const metrics = await this.calculateMetrics(deviceId, activities);
    
    // Calculate health score
    const score = this.calculateHealthScore(metrics);
    
    // Determine status and warnings
    const { status, warnings } = this.determineHealthStatus(score, metrics, device.status);
    
    const health: DeviceHealth = {
      deviceId,
      status,
      score,
      metrics,
      warnings,
      lastUpdated: Date.now(),
    };

    // Save to Redis
    await this.redisClient.hset(
      `${this.HEALTH_KEY}:${deviceId}`,
      'data',
      JSON.stringify(health)
    );

    // Log warnings if any
    if (warnings.length > 0) {
      logWarn(`Device ${deviceId} health warnings:`, warnings);
    }

    return health;
  }

  /**
   * Get recent activity for a device
   */
  private async getRecentActivity(deviceId: string, limit: number = 50): Promise<DeviceActivityLog[]> {
    const key = `${this.ACTIVITY_KEY}:${deviceId}`;
    const activities = await this.redisClient.lrange(key, 0, limit - 1);
    
    return activities.map(activity => JSON.parse(activity));
  }

  /**
   * Calculate device metrics
   */
  private async calculateMetrics(deviceId: string, activities: DeviceActivityLog[]): Promise<DeviceHealth['metrics']> {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Filter activities
    const recentActivities = activities.filter(a => a.timestamp > oneHourAgo);
    const dailyActivities = activities.filter(a => a.timestamp > oneDayAgo);
    
    // Count messages in last hour
    const messagesPerHour = recentActivities.filter(a => 
      a.action === 'message_sent' || a.action === 'message_failed'
    ).length;
    
    // Calculate success rate
    const messageActivities = dailyActivities.filter(a => 
      a.action === 'message_sent' || a.action === 'message_failed'
    );
    const successRate = messageActivities.length > 0 
      ? messageActivities.filter(a => a.success).length / messageActivities.length * 100
      : 100;
    
    // Calculate average response time
    const responseTimes = dailyActivities
      .filter(a => a.responseTime && a.responseTime > 0)
      .map(a => a.responseTime!);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    // Count disconnections in last 24 hours
    const disconnectionCount = dailyActivities.filter(a => a.action === 'disconnected').length;
    
    // Get last activity timestamp
    const lastActivity = activities.length > 0 ? activities[0].timestamp : 0;
    
    // Check if device is in warmup phase (first 30 minutes after connection)
    const warmupPhase = await this.isInWarmupPhase(deviceId);
    
    return {
      messagesPerHour,
      successRate,
      avgResponseTime,
      disconnectionCount,
      lastActivity,
      warmupPhase,
    };
  }

  /**
   * Calculate overall health score (0-100)
   */
  private calculateHealthScore(metrics: DeviceHealth['metrics']): number {
    let score = 100;
    
    // Penalize high message rate (over 20/hour is suspicious)
    if (metrics.messagesPerHour > 20) {
      score -= (metrics.messagesPerHour - 20) * 2;
    }
    
    // Penalize low success rate
    score = score * (metrics.successRate / 100);
    
    // Penalize slow response times (over 5 seconds)
    if (metrics.avgResponseTime > 5000) {
      score -= Math.min((metrics.avgResponseTime - 5000) / 1000 * 5, 20);
    }
    
    // Penalize frequent disconnections
    score -= metrics.disconnectionCount * 10;
    
    // Penalize inactivity (no activity in last hour)
    if (Date.now() - metrics.lastActivity > 60 * 60 * 1000) {
      score -= 15;
    }
    
    // Bonus for warmup phase (less strict during initial period)
    if (metrics.warmupPhase) {
      score = Math.min(score + 10, 100);
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Determine health status and warnings
   */
  private determineHealthStatus(
    score: number, 
    metrics: DeviceHealth['metrics'],
    deviceStatus: any
  ): { status: DeviceHealth['status']; warnings: string[] } {
    const warnings: string[] = [];
    let status: DeviceHealth['status'] = 'healthy';
    
    // Check for critical issues
    if (deviceStatus !== 'ready') {
      status = 'critical';
      warnings.push('Device not ready for operation');
    }
    
    if (score < 30) {
      status = 'critical';
      warnings.push('Very low health score');
    } else if (score < 60) {
      status = 'warning';
      warnings.push('Low health score');
    }
    
    // Specific warnings
    if (metrics.messagesPerHour > 30) {
      warnings.push('High message rate detected - risk of blocking');
      if (status === 'healthy') status = 'warning';
    }
    
    if (metrics.successRate < 80) {
      warnings.push('Low message success rate');
      if (status === 'healthy') status = 'warning';
    }
    
    if (metrics.disconnectionCount > 3) {
      warnings.push('Frequent disconnections detected');
      if (status === 'healthy') status = 'warning';
    }
    
    if (metrics.avgResponseTime > 10000) {
      warnings.push('High response times detected');
      if (status === 'healthy') status = 'warning';
    }
    
    return { status, warnings };
  }

  /**
   * Check if device is in warmup phase
   */
  private async isInWarmupPhase(deviceId: string): Promise<boolean> {
    const warmupKey = `${this.WARMUP_KEY}:${deviceId}`;
    const warmupStart = await this.redisClient.get(warmupKey);
    
    if (!warmupStart) {
      return false;
    }
    
    const warmupDuration = 30 * 60 * 1000; // 30 minutes
    return Date.now() - parseInt(warmupStart) < warmupDuration;
  }

  /**
   * Start warmup phase for a device
   */
  public async startWarmupPhase(deviceId: string): Promise<void> {
    const warmupKey = `${this.WARMUP_KEY}:${deviceId}`;
    await this.redisClient.set(warmupKey, Date.now().toString());
    await this.redisClient.expire(warmupKey, 30 * 60); // 30 minutes
    
    logInfo(`Warmup phase started for device ${deviceId}`);
  }

  /**
   * Get device health
   */
  public async getDeviceHealth(deviceId: string): Promise<DeviceHealth | null> {
    const healthData = await this.redisClient.hget(`${this.HEALTH_KEY}:${deviceId}`, 'data');
    
    if (!healthData) {
      // If no health data exists, calculate it
      return await this.updateDeviceHealth(deviceId);
    }
    
    return JSON.parse(healthData);
  }

  /**
   * Get health for all devices
   */
  public async getAllDeviceHealth(): Promise<DeviceHealth[]> {
    const devices = this.deviceManager.getAllDevices();
    const healthData: DeviceHealth[] = [];
    
    for (const device of devices) {
      try {
        const health = await this.getDeviceHealth(device.id);
        if (health) {
          healthData.push(health);
        }
      } catch (error) {
        logError(`Error getting health for device ${device.id}:`, error);
      }
    }
    
    return healthData;
  }

  /**
   * Get devices that need attention
   */
  public async getDevicesNeedingAttention(): Promise<DeviceHealth[]> {
    const allHealth = await this.getAllDeviceHealth();
    return allHealth.filter(health => 
      health.status === 'warning' || health.status === 'critical'
    );
  }

  /**
   * Check if device is safe to send messages
   */
  public async isSafeToSendMessage(deviceId: string): Promise<{ safe: boolean; reason?: string }> {
    const health = await this.getDeviceHealth(deviceId);
    
    if (!health) {
      return { safe: false, reason: 'Device health data not available' };
    }
    
    if (health.status === 'critical') {
      return { safe: false, reason: 'Device in critical health state' };
    }
    
    if (health.metrics.messagesPerHour > 25) {
      return { safe: false, reason: 'Message rate too high' };
    }
    
    if (health.metrics.successRate < 70) {
      return { safe: false, reason: 'Success rate too low' };
    }
    
    return { safe: true };
  }

  /**
   * Get recommended delay for next message
   */
  public async getRecommendedDelay(deviceId: string): Promise<number> {
    const health = await this.getDeviceHealth(deviceId);
    
    if (!health) {
      return 5000; // Default 5 seconds
    }
    
    let baseDelay = 2000; // 2 seconds base
    
    // Increase delay based on health score
    if (health.score < 50) {
      baseDelay *= 3;
    } else if (health.score < 70) {
      baseDelay *= 2;
    }
    
    // Increase delay based on message rate
    if (health.metrics.messagesPerHour > 15) {
      baseDelay *= 1.5;
    }
    
    // Reduce delay during warmup (be more lenient)
    if (health.metrics.warmupPhase) {
      baseDelay *= 0.7;
    }
    
    // Add some randomness (±20%)
    const randomFactor = 0.8 + Math.random() * 0.4;
    
    return Math.round(baseDelay * randomFactor);
  }
}
