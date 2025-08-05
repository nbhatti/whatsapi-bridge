import { Device, DeviceStatus } from './device.types';
import { Message } from './message.types';

// Generic API response structure
export interface ApiResponse<T = null> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Specific API responses
export type CreateDeviceResponse = ApiResponse<{ 
    id: string; 
    status: DeviceStatus;
    qrCode?: string; 
}>;

export type ListDevicesResponse = ApiResponse<Partial<Device>[]>;

export type SendMessageResponse = ApiResponse<Message>;

export type JoinGroupResponse = ApiResponse<{ 
    groupId: string; 
    status: string; 
}>;

export interface SendMessageDto {
    number: string;
    message: string;
}

export interface JoinGroupDto {
    inviteLink: string;
}

// Add other DTOs for different actions

