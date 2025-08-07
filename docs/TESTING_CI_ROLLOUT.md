# Testing, CI & Rollout Strategy

This document outlines the comprehensive testing, continuous integration, and rollout strategy for the WhatsApp API Bridge cache service with Redis integration.

## 🧪 Testing Strategy

### Unit Tests with `redis-mock`

**Location**: `src/services/__tests__/messageCache.test.ts`, `src/lib/__tests__/redis.test.ts`

Our unit tests use `redis-mock` to provide a lightweight, in-memory Redis implementation for testing:

```bash
# Run unit tests
npm run test:unit

# Run unit tests with coverage
npm run test:coverage
```

**Key Features:**
- ✅ Complete Redis API compatibility
- ✅ No external Redis dependency for tests  
- ✅ Fast execution (in-memory)
- ✅ Isolated test environment
- ✅ Comprehensive error handling tests

**Test Coverage:**
- Cache operations (read/write)
- Memory management and list trimming
- Error handling and graceful degradation
- Concurrent operations
- Data integrity and serialization
- Performance edge cases

### Integration Tests with Real Redis

**Location**: `tests/integration/cache.test.ts`

Integration tests use real Redis instances via GitHub Actions services:

```bash
# Run integration tests (requires Redis)
npm run test:integration
```

**Features:**
- ✅ Uses `redis:alpine` service in CI
- ✅ Tests actual Redis connectivity
- ✅ Validates real-world scenarios
- ✅ Memory-constrained testing (256MB limit)

### Load Testing (500 TPS)

**Location**: `tests/load/cache-load-test.ts`

Comprehensive load testing to verify performance under high traffic:

```bash
# Quick load test (100 TPS, 30s)
npm run test:load:quick

# Full load test (500 TPS, 2min)  
npm run test:load:full

# Custom load test
LOAD_TEST_TPS=250 LOAD_TEST_DURATION=60 npm run test:load
```

**Load Test Metrics:**
- 🎯 **Target**: 500 TPS sustained
- 💾 **Memory Limit**: 512MB process, 256MB Redis
- ⚡ **Response Time**: <100ms average  
- ✅ **Success Rate**: >99%
- 📊 **Real-time monitoring**: Memory, latency, throughput

**Load Test Features:**
- Memory usage monitoring (Node.js + Redis)
- Concurrent request handling
- Mixed read/write operations (90/10 split)
- Automatic failure detection
- Performance regression detection

## 🔄 Continuous Integration

### GitHub Actions Pipeline

**File**: `.github/workflows/ci.yml`

Our CI pipeline includes comprehensive testing across multiple environments:

```yaml
# Matrix testing
strategy:
  matrix:
    node: ['22', '24']
    os: [ubuntu-latest, windows-latest, macos-latest]

services:
  redis:
    image: redis:alpine
    options: --memory=256m
```

**Pipeline Stages:**

1. **Quality & Security** 🔍
   - Code formatting (Prettier)
   - Linting (ESLint)
   - Security audit (npm audit)
   - Build verification

2. **Testing** 🧪
   - Unit tests with `redis-mock`
   - Integration tests with `redis:alpine`
   - Cross-platform compatibility
   - Coverage reporting (Codecov)

3. **Load Testing** 🚀
   - Automated 500 TPS load tests (main branch)
   - Quick 100 TPS tests (PRs)
   - Memory usage validation
   - Performance regression detection

4. **Docker & Security** 🐳
   - Multi-stage Docker builds
   - Security vulnerability scanning (Trivy)
   - Container health checks

5. **Performance Analysis** ⚡
   - Bundle size analysis
   - Performance metrics
   - Dependency auditing

### Redis Service Configuration

```yaml
redis:
  image: redis:alpine
  options: >-
    --health-cmd "redis-cli ping"
    --health-interval 10s
    --health-timeout 5s
    --health-retries 5
    --memory=256m  # Memory constraint for testing
```

## 🚀 Staging Deployment & Rollout

### Feature Flag Architecture

The Redis caching feature is controlled via the `REDIS_ENABLED` environment variable:

```bash
# Enable Redis caching (default)
REDIS_ENABLED=true

# Disable Redis caching (rollback)
REDIS_ENABLED=false
```

### Deployment Scripts

**Location**: `scripts/deploy-staging.sh`

```bash
# Deploy to staging with Redis enabled
npm run deploy:staging

# Deploy to staging without Redis  
npm run deploy:staging:no-redis

# Quick rollback (disables Redis)
npm run rollback:staging

# Check deployment status
npm run staging:status

# View logs
npm run staging:logs
```

### Staging Environment

**Configuration**: `config/staging/docker-compose.staging.yml`

**Services:**
- 🚀 **Application**: WhatsApp API Bridge
- 💾 **Redis**: Alpine-based, 512MB memory limit
- 📊 **Monitoring**: Prometheus + Grafana
- 🔍 **Redis Exporter**: Metrics collection
- 🌐 **Load Balancer**: Traefik with SSL

**Environment Variables:**
```bash
# Feature flag
REDIS_ENABLED=true

# Performance thresholds  
REDIS_MEMORY_THRESHOLD_MB=512
MAX_MEMORY_USAGE_MB=1024
SYNC_LAG_THRESHOLD_MS=1000
```

### Monitoring & Alerting

**Script**: `scripts/monitor-staging.ts`

```bash
# Start monitoring
npm run monitor:staging

# Custom monitoring duration
MONITOR_INTERVAL_MS=10000 npm run monitor:staging
```

**Monitoring Metrics:**

1. **Redis Memory Usage** 💾
   - Used memory tracking
   - Fragmentation ratio monitoring
   - Peak memory detection
   - Threshold alerting (512MB)

2. **Sync Lag Monitoring** ⏱️
   - Cache write/read latency
   - Average sync lag calculation  
   - Threshold detection (1000ms)
   - Historical trend analysis

3. **Application Health** 🏥
   - Endpoint health checks
   - Response time monitoring
   - Cache hit rate tracking
   - Uptime validation

**Alert Conditions:**
- 🚨 Redis memory > 512MB
- 🚨 Sync lag > 1000ms  
- 🚨 Memory fragmentation > 2.0x
- 🚨 Application unhealthy
- 🚨 Response time > 5000ms

### Rollback Strategy

**Immediate Rollback** (< 30 seconds):
```bash
# Automatic rollback via feature flag
npm run rollback:staging

# Manual rollback
REDIS_ENABLED=false docker-compose -f config/staging/docker-compose.staging.yml up -d
```

**Rollback Triggers:**
- Memory usage > 600MB (120% of threshold)
- Sync lag > 2000ms (200% of threshold)
- Application error rate > 1%
- Manual intervention required

**Rollback Process:**
1. Set `REDIS_ENABLED=false`
2. Restart application containers
3. Verify health endpoints
4. Monitor application stability
5. Preserve Redis data for investigation

## 📊 Success Metrics

### Load Test Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Throughput | ≥500 TPS | Sustained for 2+ minutes |
| Success Rate | ≥99% | HTTP 200 responses |
| Memory Usage | ≤512MB | Node.js process memory |
| Redis Memory | ≤256MB | Redis memory usage |
| Response Time | ≤100ms | Average response latency |
| Error Rate | <1% | Failed requests |

### Production Readiness Checklist

- ✅ Unit tests passing (100% coverage on cache service)
- ✅ Integration tests passing (real Redis)
- ✅ Load tests passing (500 TPS sustained)
- ✅ Memory usage within limits
- ✅ Security scan clean
- ✅ Performance benchmarks met
- ✅ Monitoring configured
- ✅ Rollback tested and verified
- ✅ Documentation complete

### Monitoring Dashboard

Access staging monitoring at:
- **Grafana**: http://localhost:3001 (admin/staging)
- **Prometheus**: http://localhost:9091  
- **Redis Metrics**: http://localhost:9122/metrics
- **Application Health**: http://localhost:3001/health

## 🛠️ Development Workflow

### Running Tests Locally

```bash
# Install dependencies
npm ci

# Start Redis for integration tests
docker-compose up redis -d

# Run all tests
npm test

# Run specific test suites
npm run test:unit         # Unit tests with redis-mock
npm run test:integration  # Integration tests with real Redis
npm run test:load:quick   # Quick load test (100 TPS)

# Generate coverage report
npm run test:coverage
```

### Local Staging Environment

```bash
# Start local staging environment
npm run deploy:staging

# Monitor the deployment
npm run monitor:staging

# Check status
npm run staging:status

# View logs  
npm run staging:logs

# Rollback if needed
npm run rollback:staging

# Cleanup
npm run staging:cleanup
```

### Debugging

```bash
# View application logs
npm run staging:logs

# View Redis logs  
npm run staging:logs redis-staging

# Check Redis memory info
docker-compose -f config/staging/docker-compose.staging.yml exec redis-staging redis-cli info memory

# Manual health check
curl -H "x-api-key: staging-api-key" http://localhost:3001/health
```

## 📚 Additional Resources

- [Jest Testing Documentation](https://jestjs.io/docs/getting-started)
- [Redis-Mock Documentation](https://github.com/yeahoffline/redis-mock)
- [GitHub Actions Guide](https://docs.github.com/en/actions)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Prometheus Monitoring](https://prometheus.io/docs/)

## 🤝 Contributing

When contributing to the testing infrastructure:

1. **Unit Tests**: Add tests for new cache functionality
2. **Integration Tests**: Update if Redis integration changes
3. **Load Tests**: Adjust thresholds if performance requirements change
4. **CI Pipeline**: Update if new testing requirements are added
5. **Documentation**: Update this document for any changes

**Test Naming Convention:**
```typescript
describe('FeatureName', () => {
  describe('method/operation', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});
```

**Commit Message Format:**
```
test: add unit tests for Redis key management

- Add comprehensive tests for key prefixing
- Include edge cases for empty keys
- Test cluster configuration parsing
- Verify error handling scenarios
```

This comprehensive testing, CI, and rollout strategy ensures reliable, performant, and safe deployment of the Redis caching feature while maintaining the ability to quickly rollback if issues arise.
