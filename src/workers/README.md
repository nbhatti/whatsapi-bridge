# Sync Worker

The Sync Worker is a periodic background process that handles message synchronization from Redis queues to downstream storage systems.

## Features

- **Distributed Locking**: Uses Redis `SETNX` with expiry to prevent concurrent workers
- **Atomic Operations**: Uses `RPOPLPUSH` for safe message transfer
- **Rollback Support**: Automatically rolls back failed operations
- **Multiple Storage Backends**: Supports PostgreSQL, file storage, and webhooks
- **Configurable Intervals**: Environment-based configuration
- **Comprehensive Logging**: Winston integration with structured logging
- **Event Emission**: Emits `sync_success` and `sync_error` events

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SYNC_INTERVAL_MS` | `60000` | Sync interval in milliseconds |
| `SYNC_LOCK_EXPIRY_MS` | `300000` | Lock expiry time in milliseconds |
| `SYNC_BATCH_SIZE` | `100` | Maximum messages per batch |
| `SYNC_RETRY_ATTEMPTS` | `3` | Number of retry attempts |
| `SYNC_RETRY_DELAY_MS` | `5000` | Delay between retries |

### Storage Configuration

#### PostgreSQL
```env
POSTGRES_URL=postgresql://user:pass@localhost:5432/whatsapp
# OR
DATABASE_URL=postgresql://user:pass@localhost:5432/whatsapp
```

#### File Storage
```env
SYNC_FILE_PATH=./data/sync
```

#### Webhook
```env
SYNC_WEBHOOK_URL=https://your-webhook.example.com/messages
```

## Usage

### 1. Standalone Process

Run the sync worker as a standalone Node.js process:

```bash
# Development mode
npm run sync:dev

# Production mode (requires build)
npm run build
npm run sync:start:js
```

### 2. PM2 Process Manager

Use the provided PM2 ecosystem configuration:

```bash
# Start with PM2
pm2 start ecosystem.sync.config.js

# Monitor
pm2 status
pm2 logs whatsapp-sync-worker

# Stop
pm2 stop whatsapp-sync-worker
```

### 3. Programmatic Usage

```typescript
import { createSyncWorker, SyncWorker } from './workers/syncWorker';
import { getRedisClient } from './config/redis';

// Create and start worker
const worker = createSyncWorker();
worker.start();

// Stop worker
await worker.stop();
```

### 4. Custom Configuration

```typescript
import { SyncWorker, FileWriter, WebhookWriter } from './workers/syncWorker';

const customConfig = {
  syncInterval: 30000, // 30 seconds
  batchSize: 50
};

const customWriters = [
  new FileWriter('./custom/path'),
  new WebhookWriter('https://api.example.com/webhook')
];

const worker = new SyncWorker(undefined, customConfig, customWriters);
worker.start();
```

## How It Works

1. **Lock Acquisition**: Worker attempts to acquire a distributed lock using `SETNX whatsapp:syncLock`
2. **Queue Processing**: 
   - Moves messages from `whatsapp:in` to `tmp:in` using `RPOPLPUSH`
   - Moves messages from `whatsapp:out` to `tmp:out` using `RPOPLPUSH`
   - Processes messages in batches
3. **Storage Write**: Writes batched messages to all configured downstream storage systems
4. **Cleanup**: On success, deletes temporary queues; on failure, rolls back messages
5. **Lock Release**: Releases the distributed lock

## Storage Implementations

### PostgreSQL Writer
- Batch writes messages to PostgreSQL database
- Requires `POSTGRES_URL` or `DATABASE_URL` environment variable
- TODO: Implement actual PostgreSQL batch write logic

### File Writer
- Writes messages to JSONL (JSON Lines) files
- One file per day per queue type
- Format: `messages_{in|out}_YYYY-MM-DD.jsonl`

### Webhook Writer
- Sends HTTP POST requests to configured webhook URL
- Includes message batch, queue type, timestamp, and count
- 10-second timeout for webhook requests

## Events

The sync worker emits the following events:

```typescript
worker.on('sync_success', (data) => {
  // { processedCount, duration, inProcessed, outProcessed }
});

worker.on('sync_error', (data) => {
  // { error, stack }
});

worker.on('worker_started', (data) => {
  // { processId, config }
});

worker.on('worker_stopped', (data) => {
  // { processId }
});
```

## Error Handling

- **Connection Errors**: Logs Redis connection issues and continues
- **Storage Errors**: Rolls back messages to original queues
- **Lock Conflicts**: Gracefully skips processing when another worker is active
- **Parse Errors**: Handles non-JSON messages by wrapping them with metadata

## Monitoring

### Logs
- All operations are logged using Winston
- Structured logging with timestamps and metadata
- Separate log levels for different operations

### Status Monitoring
```typescript
const status = worker.getStatus();
// { isRunning, processId, config }
```

### Manual Sync
```typescript
await worker.manualSync(); // Trigger immediate sync
```

## Production Considerations

1. **Single Instance**: Only run one worker instance per environment due to distributed locking
2. **Lock Expiry**: Set appropriate lock expiry time (default 5 minutes)
3. **Monitoring**: Monitor worker logs and status
4. **Resource Limits**: Configure memory limits in PM2
5. **Error Alerts**: Set up alerts for `sync_error` events
6. **Storage Capacity**: Monitor downstream storage capacity

## Scaling

While the sync worker uses distributed locking to prevent conflicts, you can:

1. **Horizontal Scaling**: Run workers across multiple servers (lock prevents conflicts)
2. **Queue Partitioning**: Implement separate workers for different message types
3. **Time-based Partitioning**: Run different workers for different time ranges

## Troubleshooting

### Common Issues

1. **Worker Not Starting**: Check Redis connection and environment variables
2. **Messages Not Processing**: Verify queue names and Redis connection
3. **Lock Conflicts**: Check if another worker instance is running
4. **Storage Failures**: Check downstream storage connectivity and permissions

### Debug Mode
```env
LOG_LEVEL=debug
```

### Queue Inspection
```bash
# Check queue lengths
redis-cli LLEN whatsapp:in
redis-cli LLEN whatsapp:out

# Check lock status  
redis-cli GET whatsapp:syncLock

# View messages (without removing)
redis-cli LRANGE whatsapp:in 0 -1
```
