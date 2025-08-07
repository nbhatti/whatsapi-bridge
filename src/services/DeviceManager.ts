
import { Client, LocalAuth } from 'whatsapp-web.js';
import { getRedisClient } from '../config/redis';
import logger, { logError, logInfo } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import {
  emitQRCode,
  emitDeviceReady,
  emitDeviceAuthenticated,
  emitMessage,
  emitDeviceState,
  emitDeviceDisconnected,
} from '../sockets';
import { AnalyticsService } from './AnalyticsService';
import { DeviceHealthService } from './DeviceHealthService';
import fs from 'fs';
import path from 'path';

const DEVICES_SET_KEY = 'whatsapp:devices';
const DEVICE_KEY_PREFIX = 'whatsapp:device:';
const AUTH_KEY_PREFIX = 'whatsapp:auth:';

// Custom Redis store for LocalAuth
class RedisStore {
    private redisClient: Redis;
    private keyPrefix: string;

    constructor(redisClient: Redis, keyPrefix: string = 'whatsapp:auth:') {
        this.redisClient = redisClient;
        this.keyPrefix = keyPrefix;
    }

    async sessionExists(options: any): Promise<boolean> {
        const key = `${this.keyPrefix}${options.clientId}`;
        const exists = await this.redisClient.exists(key);
        return exists === 1;
    }

    async save(options: any): Promise<void> {
        const key = `${this.keyPrefix}${options.clientId}`;
        await this.redisClient.set(key, JSON.stringify(options.session));
    }

    async extract(options: any): Promise<any> {
        const key = `${this.keyPrefix}${options.clientId}`;
        const data = await this.redisClient.get(key);
        return data ? JSON.parse(data) : null;
    }

    async delete(options: any): Promise<void> {
        const key = `${this.keyPrefix}${options.clientId}`;
        await this.redisClient.del(key);
    }
}

export interface Device {
    id: string;
    client: Client;
    status: 'initializing' | 'qr' | 'ready' | 'disconnected' | 'error';
    qrCode?: string;
    phoneNumber?: string;
    clientName?: string;
    createdAt: number;
    lastSeen: number;
}

export class DeviceManager {
    private static instance: DeviceManager;
    private devices: Map<string, Device>;
    private redisClient;
    private redisStore;

    private constructor() {
        this.devices = new Map();
        this.redisClient = getRedisClient();
        this.redisStore = new RedisStore(this.redisClient);
    }

    /**
     * Helper function to format device display ID with phone number and name
     */
    private getDeviceDisplayId(device: Device): string {
        if (device.phoneNumber && device.clientName) {
            return `${device.id} (${device.phoneNumber} - ${device.clientName})`;
        } else if (device.phoneNumber) {
            return `${device.id} (${device.phoneNumber})`;
        } else if (device.clientName) {
            return `${device.id} (${device.clientName})`;
        }
        return device.id;
    }

    public static getInstance(): DeviceManager {
        if (!DeviceManager.instance) {
            DeviceManager.instance = new DeviceManager();
        }
        return DeviceManager.instance;
    }

    public async createDevice(): Promise<Device> {
        const deviceId = uuidv4();

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: deviceId,
                // @ts-ignore
                store: this.redisStore,
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
        });

        const device: Device = {
            id: deviceId,
            client,
            status: 'initializing',
            createdAt: Date.now(),
            lastSeen: Date.now(),
        };

        this.devices.set(deviceId, device);
        await this.redisClient.sadd(DEVICES_SET_KEY, deviceId);
        await this.updateDeviceInRedis(device);

        this.attachEventListeners(device);

        client.initialize().catch(err => {
            logError(`Failed to initialize device ${deviceId}`, err);
            device.status = 'error';
            this.updateDeviceInRedis(device);
            emitDeviceState(deviceId, 'error');
        });

        return device;
    }

    public getDevice(id: string): Device | undefined {
        return this.devices.get(id);
    }

    public getAllDevices(): Device[] {
        return Array.from(this.devices.values());
    }

    public async deleteDevice(id: string): Promise<void> {
        const device = this.devices.get(id);
        if (device) {
            await device.client.destroy();
            this.devices.delete(id);
            await this.redisClient.srem(DEVICES_SET_KEY, id);
            await this.redisClient.del(`${DEVICE_KEY_PREFIX}${id}`);
            // Also cleanup auth data
            await this.redisStore.delete({ clientId: id });
            emitDeviceDisconnected(id, 'Device deleted');
        }
    }

    public async deleteAllDevices(): Promise<void> {
        logInfo('Deleting all devices');
        const deviceIds = Array.from(this.devices.keys());
        
        // Delete all devices in parallel
        await Promise.all(deviceIds.map(id => this.deleteDevice(id)));
        
        // Clear the devices set in Redis
        await this.redisClient.del(DEVICES_SET_KEY);
        
        logInfo(`Deleted ${deviceIds.length} devices`);
    }

    public async listDevices(): Promise<Partial<Device>[]> {
        const deviceIds = await this.redisClient.smembers(DEVICES_SET_KEY);
        const devices: Partial<Device>[] = [];
        for (const id of deviceIds) {
            const deviceData = await this.redisClient.hgetall(`${DEVICE_KEY_PREFIX}${id}`);
            const device: Partial<Device> = {
                id,
                status: deviceData.status as Device['status'],
                createdAt: parseInt(deviceData.createdAt),
                lastSeen: parseInt(deviceData.lastSeen),
            };
            
            // Include phone number and name if they exist
            if (deviceData.phoneNumber) {
                device.phoneNumber = deviceData.phoneNumber;
            }
            if (deviceData.clientName) {
                device.clientName = deviceData.clientName;
            }
            
            devices.push(device);
        }
        return devices;
    }

    public async restoreDevicesFromRedis(): Promise<void> {
        logInfo('Restoring devices from Redis...');
        const deviceIds = await this.redisClient.smembers(DEVICES_SET_KEY);
        
        logInfo(`Found ${deviceIds.length} devices to restore`);
        
        for (const deviceId of deviceIds) {
            try {
                const deviceData = await this.redisClient.hgetall(`${DEVICE_KEY_PREFIX}${deviceId}`);
                
                if (!deviceData.id) {
                    logError(`No device data found for ${deviceId}, skipping`);
                    continue;
                }

                // Create WhatsApp client with existing auth data
                const client = new Client({
                    authStrategy: new LocalAuth({
                        clientId: deviceId,
                        // @ts-ignore
                        store: this.redisStore,
                    }),
                    puppeteer: {
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    },
                });

                const device: Device = {
                    id: deviceId,
                    client,
                    status: 'initializing', // Will update when client connects
                    createdAt: parseInt(deviceData.createdAt),
                    lastSeen: parseInt(deviceData.lastSeen),
                    phoneNumber: deviceData.phoneNumber || undefined,
                    clientName: deviceData.clientName || undefined,
                };

                this.devices.set(deviceId, device);
                this.attachEventListeners(device);

                // Initialize the client
                client.initialize().catch(err => {
                    logError(`Failed to restore device ${this.getDeviceDisplayId(device)}`, err);
                    device.status = 'error';
                    this.updateDeviceInRedis(device);
                    emitDeviceState(deviceId, 'error');
                });

                logInfo(`Device ${this.getDeviceDisplayId(device)} restoration initiated`);
            } catch (err: any) {
                logError(`Error restoring device ${deviceId}:`, err);
            }
        }
    }

    private attachEventListeners(device: Device): void {
        const { client, id } = device;
        const healthService = DeviceHealthService.getInstance();

        client.on('qr', async (qr) => {
            logInfo(`QR code generated for device ${this.getDeviceDisplayId(device)}`);
            device.status = 'qr';
            device.qrCode = qr;
            device.lastSeen = Date.now();
            this.updateDeviceInRedis(device);
            emitQRCode(id, qr);
            
            // Log health activity
            await healthService.logActivity(id, {
                timestamp: Date.now(),
                action: 'qr_generated',
                success: true
            });
        });

        client.on('ready', async () => {
            try {
                // Extract phone number and name when device is ready
                const clientInfo = client.info;
                const phoneNumber = (clientInfo as any)?.wid?.user;
                const clientName = (clientInfo as any)?.pushname || (clientInfo as any)?.me?.name;
                
                device.phoneNumber = phoneNumber || undefined;
                device.clientName = clientName || undefined;
                
                logInfo(`Device ${this.getDeviceDisplayId(device)} is ready`);
                device.status = 'ready';
                device.lastSeen = Date.now();
                await this.updateDeviceInRedis(device);
                emitDeviceReady(id);
                
                // Start warmup phase for new devices
                await healthService.startWarmupPhase(id);
                await healthService.logActivity(id, {
                    timestamp: Date.now(),
                    action: 'connected',
                    success: true
                });
            } catch (err) {
                logError(`Error extracting device info for ${id}`, err);
                logInfo(`Device ${id} is ready`);
                device.status = 'ready';
                device.lastSeen = Date.now();
                await this.updateDeviceInRedis(device);
                emitDeviceReady(id);
                
                // Still start warmup and log activity
                await healthService.startWarmupPhase(id);
                await healthService.logActivity(id, {
                    timestamp: Date.now(),
                    action: 'connected',
                    success: true
                });
            }
        });

        client.on('authenticated', async () => {
            logInfo(`Device ${this.getDeviceDisplayId(device)} is authenticated`);
            device.lastSeen = Date.now();
            this.updateDeviceInRedis(device);
            
            // Get phone number and client name if available
            try {
                const clientInfo = client.info;
                const phoneNumber = (clientInfo as any)?.wid?.user || 'unknown';
                const clientName = (clientInfo as any)?.pushname || 'WhatsApp Client';
                emitDeviceAuthenticated(id, phoneNumber, clientName);
            } catch (err: any) {
                logError(`Failed to get client info for device ${this.getDeviceDisplayId(device)}`, err);
                emitDeviceAuthenticated(id, 'unknown', 'WhatsApp Client');
            }
            
            // Log health activity
            await healthService.logActivity(id, {
                timestamp: Date.now(),
                action: 'authenticated',
                success: true
            });
        });

        client.on('message', async (message) => {
            // Log message reception at debug level to reduce noise
            logger.debug(`Message received on device ${this.getDeviceDisplayId(device)} from ${message.from}: ${message.body?.substring(0, 100)}${message.body?.length > 100 ? '...' : ''}`);
            device.lastSeen = Date.now();
            this.updateDeviceInRedis(device);
            emitMessage(id, message);
            
            // Track message for analytics
            try {
                const chat = await message.getChat();
                const analyticsService = new AnalyticsService();
                await analyticsService.trackMessage(id, message, chat);
            } catch (error) {
                logger.error(`Failed to track message for analytics on device ${this.getDeviceDisplayId(device)}:`, error);
            }
        });

        client.on('disconnected', async (reason) => {
            logInfo(`Device ${this.getDeviceDisplayId(device)} disconnected: ${reason}`);
            device.status = 'disconnected';
            device.lastSeen = Date.now();
            this.updateDeviceInRedis(device);
            emitDeviceDisconnected(id, reason);
            
            // Log health activity
            await healthService.logActivity(id, {
                timestamp: Date.now(),
                action: 'disconnected',
                success: false,
                error: reason
            });
        });

        client.on('change_state', (state) => {
            logInfo(`Device ${this.getDeviceDisplayId(device)} state changed: ${state}`);
            device.lastSeen = Date.now();
            this.updateDeviceInRedis(device);
            emitDeviceState(id, state);
        });
    }

    private async updateDeviceInRedis(device: Device): Promise<void> {
        const deviceData: any = {
            id: device.id,
            status: device.status,
            createdAt: device.createdAt.toString(),
            lastSeen: device.lastSeen.toString(),
        };
        
        // Only include phone number and name if they exist
        if (device.phoneNumber) {
            deviceData.phoneNumber = device.phoneNumber;
        }
        if (device.clientName) {
            deviceData.clientName = device.clientName;
        }
        
        await this.redisClient.hset(`${DEVICE_KEY_PREFIX}${device.id}`, deviceData);
    }
}

