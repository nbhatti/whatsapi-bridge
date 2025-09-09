# Backup and Log Rotation Setup

This document describes the comprehensive backup and log rotation system implemented for the WhatsApp API service.

## Overview

The system implements three main components:
1. **PostgreSQL nightly backups** with S3 upload
2. **Redis snapshot backups** alongside database backups
3. **Automatic log rotation** for API logs and Docker container logs

## Components Implemented

### 1. PostgreSQL Backup System

#### Files Created:
- `/scripts/postgres-backup.sh` - PostgreSQL backup script
- `/scripts/backup-runner.sh` - Main orchestrator script
- `/scripts/backup-management.sh` - Management and monitoring script

#### Features:
- Nightly `pg_dump` exports to `/backups/postgres`
- Automatic compression with gzip
- S3 upload integration (configurable)
- 7-day local retention policy
- Backup validation and logging
- Webhook notifications support

#### Configuration:
```bash
DB_HOST=whatsapi_postgres
DB_PORT=5432
DB_NAME=whatsapi
DB_USER=whatsapi
DB_PASS=whatsapi
S3_BUCKET=whatsapi-backups
```

### 2. Redis Backup System

#### Files Created:
- `/scripts/redis-backup.sh` - Redis backup script

#### Features:
- Redis `BGSAVE` command to create snapshots
- Copies RDB files alongside PostgreSQL backups
- S3 upload support
- 7-day local retention policy
- Compatible with Redis persistence settings

#### Redis Configuration:
```conf
# Enhanced Redis configuration (redis.conf)
save 900 1        # Save after 900 sec if at least 1 key changed
save 300 10       # Save after 300 sec if at least 10 keys changed  
save 60 10000     # Save after 60 sec if at least 10000 keys changed
appendonly yes    # Enable AOF persistence
appendfilename "appendonly.aof"
```

### 3. Enhanced Application Logging

#### Files Created:
- `logger.js` - Winston-based logging configuration
- Updated `index.js` - Application with enhanced logging
- `winston-daily-rotate-file` package added

#### Log Types:
- **Application logs**: `logs/application-YYYY-MM-DD.log`
- **Error logs**: `logs/error-YYYY-MM-DD.log` (30-day retention)
- **Access logs**: `logs/access-YYYY-MM-DD.log`
- **Security logs**: `logs/security-YYYY-MM-DD.log` (30-day retention)

#### Log Rotation Features:
- Daily rotation with date suffixes
- Automatic compression after rotation
- Configurable retention periods
- Size-based rotation (20MB max per file)
- Structured JSON logging for better parsing

### 4. Docker Container Log Rotation

#### Files Created:
- `/etc/logrotate.d/docker-containers` - Docker log rotation config
- `/etc/logrotate.d/whatsapi-logs` - Application log rotation config

#### Configuration:
```
# Docker containers
/var/lib/docker/containers/*/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 644 root root
}

# Application logs
/root/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 root root
}
```

### 5. Automated Scheduling

#### Files Created:
- `/etc/cron.d/whatsapi-backup` - Cron configuration

#### Schedule:
```cron
# Daily backup at 2:00 AM
0 2 * * * root /scripts/backup-runner.sh >> /var/log/backup.log 2>&1

# Weekly cleanup at 3:00 AM on Sundays
0 3 * * 0 root find /var/log -name "*backup*.log" -mtime +30 -delete
```

### 6. Docker Compose Integration

#### Updated Services:
- **Logging configuration** for all containers
- **Backup service container** with dedicated Dockerfile
- **Volume mounts** for logs and backups
- **Environment variable** templates

#### New Volumes:
```yaml
volumes:
  redis_data:
  postgres_data:
  backup_data:    # New backup storage volume
```

## Usage

### Manual Backup Commands

```bash
# Run full backup (PostgreSQL + Redis)
/scripts/backup-runner.sh

# PostgreSQL only
/scripts/postgres-backup.sh

# Redis only  
/scripts/redis-backup.sh

# Backup management
/scripts/backup-management.sh list
/scripts/backup-management.sh monitor
/scripts/backup-management.sh test-restore --file backup_file.gz
```

### Docker Deployment

```bash
# Build and start with backup service
docker-compose up -d

# Check backup service logs
docker logs whatsapi_backup

# View application logs
docker logs whatsapi_app
```

### Environment Configuration

Create `.env` file with:
```env
# S3 Configuration
S3_BUCKET=whatsapi-backups
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1

# API Configuration
API_KEY=your-secure-api-key-here
LOG_LEVEL=info
```

## Monitoring and Maintenance

### Backup Health Checks

```bash
# Check backup status
/scripts/backup-management.sh monitor

# List recent backups
/scripts/backup-management.sh list --date $(date +%Y%m%d)

# Test backup integrity
/scripts/backup-management.sh test-restore --file latest_backup.sql.gz
```

### Log Monitoring

- Application logs: `tail -f logs/application-$(date +%Y-%m-%d).log`
- Error logs: `tail -f logs/error-$(date +%Y-%m-%d).log`
- Security logs: `tail -f logs/security-$(date +%Y-%m-%d).log`

### S3 Integration

Backups are automatically uploaded to S3 with organized paths:
```
s3://whatsapi-backups/
├── postgres/
│   └── 2024/01/10/postgres_backup_20240110_020001.sql.gz
└── redis/
    └── 2024/01/10/redis_backup_20240110_020001.rdb.gz
```

## Security Considerations

1. **API keys** are logged securely (partial masking)
2. **Database passwords** are stored in environment variables
3. **S3 credentials** use IAM roles when possible
4. **Log files** have restricted permissions (644)
5. **Security events** are logged separately for audit trails

## Recovery Procedures

### PostgreSQL Recovery:
```bash
# Create new database
createdb -h localhost -U whatsapi whatsapi_restored

# Restore from backup
zcat postgres_backup_20240110_020001.sql.gz | \
  psql -h localhost -U whatsapi -d whatsapi_restored
```

### Redis Recovery:
```bash
# Stop Redis service
systemctl stop redis

# Replace dump.rdb
zcat redis_backup_20240110_020001.rdb.gz > /var/lib/redis/dump.rdb

# Start Redis service
systemctl start redis
```

## Troubleshooting

### Common Issues:

1. **Backup failures**: Check `/var/log/backup.log` and container connectivity
2. **Log rotation not working**: Verify logrotate configuration and permissions
3. **S3 upload failures**: Check AWS credentials and bucket permissions
4. **Docker log issues**: Ensure Docker daemon has proper log driver configuration

### Debug Commands:

```bash
# Test database connectivity
pg_isready -h whatsapi_postgres -p 5432

# Test Redis connectivity
redis-cli -h whatsapi_redis ping

# Verify cron jobs
crontab -l
systemctl status cron

# Check log rotation
logrotate -d /etc/logrotate.d/whatsapi-logs
```

## Performance Impact

- **Backup operations**: Run during low-traffic hours (2:00 AM)
- **Log rotation**: Minimal impact, handled by system logrotate
- **Storage usage**: Compressed backups and automatic cleanup
- **Network usage**: S3 uploads are bandwidth-efficient with compression

This comprehensive setup ensures data safety, operational visibility, and automated maintenance for the WhatsApp API service.
