module.exports = {
  apps: [
    {
      name: 'whatsapp-sync-worker',
      script: 'dist/workers/index.js',
      instances: 1, // Only run one instance due to distributed locking
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        SYNC_INTERVAL_MS: '60000', // 1 minute
        SYNC_LOCK_EXPIRY_MS: '300000', // 5 minutes
        SYNC_BATCH_SIZE: '100',
        SYNC_RETRY_ATTEMPTS: '3',
        SYNC_RETRY_DELAY_MS: '5000',
        // Uncomment and configure based on your needs:
        // POSTGRES_URL: 'postgresql://user:pass@localhost:5432/whatsapp',
        // SYNC_FILE_PATH: './data/sync',
        // SYNC_WEBHOOK_URL: 'https://your-webhook.example.com/messages'
      },
      env_development: {
        NODE_ENV: 'development',
        SYNC_INTERVAL_MS: '30000', // 30 seconds for development
        LOG_LEVEL: 'debug'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/sync-worker-error.log',
      out_file: './logs/sync-worker-out.log',
      log_file: './logs/sync-worker-combined.log',
      time: true
    }
  ]
};
