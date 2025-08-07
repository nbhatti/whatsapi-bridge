import { Request, Response } from 'express';
import { MessageQueueService, DeviceHealthService } from '../services';
import { logError, logInfo } from '../config/logger';

const messageQueueService = MessageQueueService.getInstance();
const deviceHealthService = DeviceHealthService.getInstance();

/**
 * GET /api/v1/queue/status
 * Get overall queue status
 */
export const getQueueStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await messageQueueService.getQueueStatus();
    
    res.json({
      success: true,
      data: {
        queue: status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logError('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /api/v1/queue/clear
 * Clear all queued messages (admin only)
 */
export const clearQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const clearedCount = await messageQueueService.clearQueue();
    
    logInfo(`Queue cleared: ${clearedCount} messages removed`);
    
    res.json({
      success: true,
      message: 'Queue cleared successfully',
      data: {
        clearedMessages: clearedCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logError('Error clearing queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear queue',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * PUT /api/v1/queue/config
 * Update queue configuration
 */
export const updateQueueConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = req.body;
    
    messageQueueService.updateConfig(config);
    
    logInfo('Queue configuration updated', config);
    
    res.json({
      success: true,
      message: 'Queue configuration updated successfully',
      data: {
        updatedConfig: config,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logError('Error updating queue config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update queue configuration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/v1/devices/:id/health
 * Get device health status
 */
export const getDeviceHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const health = await deviceHealthService.getDeviceHealth(id);
    
    if (!health) {
      res.status(404).json({
        success: false,
        error: 'Device health data not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    logError(`Error getting device health for ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get device health',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/v1/devices/:id/queue-status
 * Get device-specific queue status
 */
export const getDeviceQueueStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const status = await messageQueueService.getDeviceStatus(id);
    const health = await deviceHealthService.getDeviceHealth(id);
    const safetyCheck = await deviceHealthService.isSafeToSendMessage(id);
    const recommendedDelay = await deviceHealthService.getRecommendedDelay(id);
    
    res.json({
      success: true,
      data: {
        deviceId: id,
        queue: status,
        health: health ? {
          status: health.status,
          score: health.score,
          warnings: health.warnings
        } : null,
        safety: safetyCheck,
        recommendedDelay,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logError(`Error getting device queue status for ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get device queue status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/v1/health/devices
 * Get health status for all devices
 */
export const getAllDevicesHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const devicesHealth = await deviceHealthService.getAllDeviceHealth();
    
    res.json({
      success: true,
      data: {
        devices: devicesHealth,
        summary: {
          total: devicesHealth.length,
          healthy: devicesHealth.filter(d => d.status === 'healthy').length,
          warning: devicesHealth.filter(d => d.status === 'warning').length,
          critical: devicesHealth.filter(d => d.status === 'critical').length,
          blocked: devicesHealth.filter(d => d.status === 'blocked').length
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logError('Error getting all devices health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get devices health',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/v1/health/attention
 * Get devices that need attention
 */
export const getDevicesNeedingAttention = async (req: Request, res: Response): Promise<void> => {
  try {
    const devicesNeedingAttention = await deviceHealthService.getDevicesNeedingAttention();
    
    res.json({
      success: true,
      data: {
        devices: devicesNeedingAttention,
        count: devicesNeedingAttention.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logError('Error getting devices needing attention:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get devices needing attention',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /api/v1/devices/:id/warmup
 * Start warmup phase for a device
 */
export const startDeviceWarmup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await deviceHealthService.startWarmupPhase(id);
    
    logInfo(`Warmup phase started for device ${id}`);
    
    res.json({
      success: true,
      message: 'Warmup phase started successfully',
      data: {
        deviceId: id,
        warmupStarted: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logError(`Error starting warmup for device ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to start warmup phase',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/v1/blocking-prevention/dashboard
 * Get comprehensive dashboard data for blocking prevention
 */
export const getBlockingPreventionDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const [queueStatus, devicesHealth, devicesNeedingAttention] = await Promise.all([
      messageQueueService.getQueueStatus(),
      deviceHealthService.getAllDeviceHealth(),
      deviceHealthService.getDevicesNeedingAttention()
    ]);
    
    // Calculate statistics
    const healthSummary = {
      total: devicesHealth.length,
      healthy: devicesHealth.filter(d => d.status === 'healthy').length,
      warning: devicesHealth.filter(d => d.status === 'warning').length,
      critical: devicesHealth.filter(d => d.status === 'critical').length,
      blocked: devicesHealth.filter(d => d.status === 'blocked').length,
      averageScore: devicesHealth.length > 0 
        ? Math.round(devicesHealth.reduce((sum, d) => sum + d.score, 0) / devicesHealth.length)
        : 0
    };
    
    const queueSummary = {
      ...queueStatus,
      throughput: queueStatus.processing > 0 ? 'Active' : 'Idle'
    };
    
    res.json({
      success: true,
      data: {
        queue: queueSummary,
        health: healthSummary,
        alerts: {
          devicesNeedingAttention: devicesNeedingAttention.length,
          criticalDevices: devicesHealth.filter(d => d.status === 'critical').length,
          queueBacklog: queueStatus.pending > 10
        },
        devices: devicesHealth.map(d => ({
          id: d.deviceId,
          status: d.status,
          score: d.score,
          messagesPerHour: d.metrics.messagesPerHour,
          successRate: d.metrics.successRate,
          warnings: d.warnings.length,
          warmupPhase: d.metrics.warmupPhase
        })),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logError('Error getting blocking prevention dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
