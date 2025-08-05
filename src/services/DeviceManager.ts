
import { Client, LocalAuth } from 'whatsapp-web.js';
import { getRedisClient } from '../config/redis';
import { logError, logInfo } from '../config/logger';
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
import fs from 'fs';
import path from 'path';

const DEVICES_SET_KEY = 'devices';
const DEVICE_KEY_PREFIX = 'device:';
const AUTH_KEY_PREFIX = 'auth:';

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
            devices.push({
                id,
                status: deviceData.status as Device['status'],
                createdAt: parseInt(deviceData.createdAt),
                lastSeen: parseInt(deviceData.lastSeen),
            });
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
                };

                this.devices.set(deviceId, device);
                this.attachEventListeners(device);

                // Initialize the client
                client.initialize().catch(err => {
                    logError(`Failed to restore device ${deviceId}`, err);
                    device.status = 'error';
                    this.updateDeviceInRedis(device);
                    emitDeviceState(deviceId, 'error');
                });

                logInfo(`Device ${deviceId} restoration initiated`);
            } catch (err: any) {
                logError(`Error restoring device ${deviceId}:`, err);
            }
        }
    }

    private attachEventListeners(device: Device): void {
        const { client, id } = device;

        client.on('qr', (qr) => {
            logInfo(`QR code for device ${id}: ${qr}`);
            device.status = 'qr';
            device.qrCode = qr;
            device.lastSeen = Date.now();
            this.updateDeviceInRedis(device);
            emitQRCode(id, qr);
        });

        client.on('ready', () => {
            logInfo(`Device ${id} is ready`);
            device.status = 'ready';
            device.lastSeen = Date.now();
            this.updateDeviceInRedis(device);
            emitDeviceReady(id);
        });

        client.on('authenticated', () => {
            logInfo(`Device ${id} is authenticated`);
            device.lastSeen = Date.now();
            this.updateDeviceInRedis(device);
            
            // Get phone number and client name if available
            try {
                const clientInfo = client.info;
                const phoneNumber = (clientInfo as any)?.wid?.user || 'unknown';
                const clientName = (clientInfo as any)?.pushname || 'WhatsApp Client';
                emitDeviceAuthenticated(id, phoneNumber, clientName);
            } catch (err: any) {
                logError(`Failed to get client info for device ${id}`, err);
                emitDeviceAuthenticated(id, 'unknown', 'WhatsApp Client');
            }
        });

        client.on('message', (message) => {
            logInfo(`Message received on device ${id}: ${message.body}`);
            device.lastSeen = Date.now();
            this.updateDeviceInRedis(device);
            emitMessage(id, message);
        });

        client.on('disconnected', (reason) => {
            logInfo(`Device ${id} disconnected: ${reason}`);
            device.status = 'disconnected';
            device.lastSeen = Date.now();
            this.updateDeviceInRedis(device);
            emitDeviceDisconnected(id, reason);
        });

        client.on('change_state', (state) => {
            logInfo(`Device ${id} state changed: ${state}`);
            device.lastSeen = Date.now();
            this.updateDeviceInRedis(device);
            emitDeviceState(id, state);
        });
    }

    private async updateDeviceInRedis(device: Device): Promise<void> {
        await this.redisClient.hset(`${DEVICE_KEY_PREFIX}${device.id}`, {
            id: device.id,
            status: device.status,
            createdAt: device.createdAt.toString(),
            lastSeen: device.lastSeen.toString(),
        });
    }
}

