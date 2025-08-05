// Generic type for paginated responses
export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

// Generic type for key-value pairs
export interface KeyValuePair {
    [key: string]: any;
}

// Basic user information
export interface UserProfile {
    id: string;
    name: string;
    avatarUrl?: string;
    lastSeen?: number;
}

// Application-wide error structure
export interface AppError {
    code: number;
    message: string;
    details?: KeyValuePair;
}

// Enum for different environments
export enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}

// Sorting options
export interface SortOptions {
    field: string;
    direction: 'asc' | 'desc';
}

// Filtering options
export interface FilterOptions {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like';
    value: any;
}

