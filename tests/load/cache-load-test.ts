import { performance } from 'perf_hooks';
import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import { Redis } from 'ioredis';

/**
 * Load Test Configuration
 */
interface LoadTestConfig {
  targetTPS: number;
  durationSeconds: number;
  baseUrl: string;
  apiKey: string;
  redisUrl: string;
  memoryThresholdMB: number;
  maxMemoryUsageMB: number;
}

/**
 * Test Results Interface
 */
interface LoadTestResults {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughputTPS: number;
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
  };
  redisMemoryUsage: {
    initial: number;
    peak: number;
    final: number;
  };
  errors: string[];
  passed: boolean;
}

/**
 * Memory monitoring utility
 */
class MemoryMonitor {
  private redisClient: Redis;
  private processMemoryHistory: number[] = [];
  private redisMemoryHistory: number[] = [];
  private monitoring = false;

  constructor(redisUrl: string) {
    this.redisClient = new Redis(redisUrl);
  }

  async startMonitoring(intervalMs: number = 1000): Promise<void> {
    this.monitoring = true;
    this.processMemoryHistory = [];
    this.redisMemoryHistory = [];

    while (this.monitoring) {
      try {
        // Monitor process memory
        const processMemory = process.memoryUsage();
        this.processMemoryHistory.push(processMemory.heapUsed / 1024 / 1024); // Convert to MB

        // Monitor Redis memory
        const redisInfo = await this.redisClient.memory('usage', 'whatsapp:*');
        const redisMemoryMB = Array.isArray(redisInfo) ? redisInfo.reduce((a, b) => a + b, 0) / 1024 / 1024 : 0;
        this.redisMemoryHistory.push(redisMemoryMB);

        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (error) {
        console.error('Memory monitoring error:', error);
      }
    }
  }

  stopMonitoring(): void {
    this.monitoring = false;
  }

  getMemoryStats() {
    return {
      process: {
        initial: this.processMemoryHistory[0] || 0,
        peak: Math.max(...this.processMemoryHistory),
        final: this.processMemoryHistory[this.processMemoryHistory.length - 1] || 0,
        history: this.processMemoryHistory
      },
      redis: {
        initial: this.redisMemoryHistory[0] || 0,
        peak: Math.max(...this.redisMemoryHistory),
        final: this.redisMemoryHistory[this.redisMemoryHistory.length - 1] || 0,
        history: this.redisMemoryHistory
      }
    };
  }

  async close(): Promise<void> {
    this.stopMonitoring();
    await this.redisClient.quit();
  }
}

/**
 * Cache Load Tester
 */
class CacheLoadTester {
  private config: LoadTestConfig;
  private memoryMonitor: MemoryMonitor;
  private startTime: number = 0;
  private requestTimings: number[] = [];
  private errors: string[] = [];

  constructor(config: LoadTestConfig) {
    this.config = config;
    this.memoryMonitor = new MemoryMonitor(config.redisUrl);
  }

  /**
   * Generate mock message data for testing
   */
  private generateMockMessage(index: number) {
    return {
      messageId: `load-test-message-${index}-${Date.now()}`,
      chatId: `chat-${index % 100}@c.us`,
      sender: `sender-${index % 50}@c.us`,
      timestamp: Date.now(),
      type: 'text',
      content: `Load test message ${index} with some content to simulate real usage`,
      meta: {
        fromMe: Math.random() > 0.5,
        isGroup: Math.random() > 0.7,
        hasMedia: Math.random() > 0.8,
        isForwarded: Math.random() > 0.9,
        isReply: Math.random() > 0.85,
        mentionCount: Math.floor(Math.random() * 5),
        deviceId: `device-${index % 10}`
      }
    };
  }

  /**
   * Send a cache write request
   */
  private async sendCacheRequest(messageData: any): Promise<{ success: boolean; responseTime: number }> {
    const startTime = performance.now();
    
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/api/v1/cache/message`,
        { message: messageData },
        {
          headers: {
            'x-api-key': this.config.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      const responseTime = performance.now() - startTime;
      return { success: response.status === 200, responseTime };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.errors.push(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, responseTime };
    }
  }

  /**
   * Send cache read requests to verify data integrity
   */
  private async sendCacheReadRequest(): Promise<{ success: boolean; responseTime: number }> {
    const startTime = performance.now();
    
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/api/v1/cache/recent`,
        {
          headers: {
            'x-api-key': this.config.apiKey
          },
          params: { limit: 10 },
          timeout: 5000
        }
      );

      const responseTime = performance.now() - startTime;
      return { success: response.status === 200, responseTime };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.errors.push(`Read request failed: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, responseTime };
    }
  }

  /**
   * Execute load test with sustained TPS
   */
  async runLoadTest(): Promise<LoadTestResults> {
    console.log(`🚀 Starting load test: ${this.config.targetTPS} TPS for ${this.config.durationSeconds} seconds`);
    
    // Start memory monitoring
    const memoryMonitoringPromise = this.memoryMonitor.startMonitoring(500);

    this.startTime = performance.now();
    const intervalMs = 1000 / this.config.targetTPS;
    let requestCount = 0;
    let successCount = 0;
    let failCount = 0;

    // Calculate total requests needed
    const totalRequests = this.config.targetTPS * this.config.durationSeconds;

    // Function to send a single request
    const sendRequest = async () => {
      requestCount++;
      const messageData = this.generateMockMessage(requestCount);
      
      // Mix of write and read requests (90% write, 10% read)
      let result: { success: boolean; responseTime: number };
      if (Math.random() > 0.1) {
        result = await this.sendCacheRequest(messageData);
      } else {
        result = await this.sendCacheReadRequest();
      }

      this.requestTimings.push(result.responseTime);
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }

      // Log progress every 100 requests
      if (requestCount % 100 === 0) {
        const elapsed = (performance.now() - this.startTime) / 1000;
        const currentTPS = requestCount / elapsed;
        console.log(`Progress: ${requestCount}/${totalRequests} requests, Current TPS: ${currentTPS.toFixed(2)}, Success rate: ${((successCount / requestCount) * 100).toFixed(2)}%`);
      }
    };

    // Execute requests with controlled timing
    const requestPromises: Promise<void>[] = [];
    for (let i = 0; i < totalRequests; i++) {
      const delay = i * intervalMs;
      const requestPromise = new Promise<void>((resolve) => {
        setTimeout(async () => {
          await sendRequest();
          resolve();
        }, delay);
      });
      requestPromises.push(requestPromise);
    }

    // Wait for all requests to complete
    await Promise.all(requestPromises);

    // Stop memory monitoring
    this.memoryMonitor.stopMonitoring();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for monitoring to stop

    // Calculate results
    const endTime = performance.now();
    const totalDuration = (endTime - this.startTime) / 1000;
    const memoryStats = this.memoryMonitor.getMemoryStats();

    const results: LoadTestResults = {
      totalRequests: requestCount,
      successfulRequests: successCount,
      failedRequests: failCount,
      averageResponseTime: this.requestTimings.reduce((a, b) => a + b, 0) / this.requestTimings.length,
      maxResponseTime: Math.max(...this.requestTimings),
      minResponseTime: Math.min(...this.requestTimings),
      throughputTPS: requestCount / totalDuration,
      memoryUsage: {
        initial: memoryStats.process.initial,
        peak: memoryStats.process.peak,
        final: memoryStats.process.final
      },
      redisMemoryUsage: {
        initial: memoryStats.redis.initial,
        peak: memoryStats.redis.peak,
        final: memoryStats.redis.final
      },
      errors: [...new Set(this.errors)], // Deduplicate errors
      passed: false // Will be set based on criteria
    };

    // Determine if test passed
    results.passed = this.evaluateTestResults(results);

    await this.memoryMonitor.close();
    return results;
  }

  /**
   * Evaluate if test results meet success criteria
   */
  private evaluateTestResults(results: LoadTestResults): boolean {
    const criteria = [
      {
        name: 'Throughput',
        condition: results.throughputTPS >= this.config.targetTPS * 0.95, // Allow 5% tolerance
        message: `Achieved ${results.throughputTPS.toFixed(2)} TPS (target: ${this.config.targetTPS})`
      },
      {
        name: 'Success Rate',
        condition: (results.successfulRequests / results.totalRequests) >= 0.99, // 99% success rate
        message: `Success rate: ${((results.successfulRequests / results.totalRequests) * 100).toFixed(2)}%`
      },
      {
        name: 'Memory Usage',
        condition: results.memoryUsage.peak <= this.config.maxMemoryUsageMB,
        message: `Peak memory: ${results.memoryUsage.peak.toFixed(2)}MB (limit: ${this.config.maxMemoryUsageMB}MB)`
      },
      {
        name: 'Redis Memory',
        condition: results.redisMemoryUsage.peak <= this.config.memoryThresholdMB,
        message: `Peak Redis memory: ${results.redisMemoryUsage.peak.toFixed(2)}MB (limit: ${this.config.memoryThresholdMB}MB)`
      },
      {
        name: 'Average Response Time',
        condition: results.averageResponseTime <= 100, // 100ms average
        message: `Average response time: ${results.averageResponseTime.toFixed(2)}ms`
      }
    ];

    console.log('\\n📊 Test Criteria Evaluation:');
    let allPassed = true;

    criteria.forEach(criterion => {
      const status = criterion.condition ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${criterion.name}: ${criterion.message}`);
      if (!criterion.condition) {
        allPassed = false;
      }
    });

    return allPassed;
  }

  /**
   * Generate detailed test report
   */
  generateReport(results: LoadTestResults): string {
    const report = `
🔥 CACHE SERVICE LOAD TEST REPORT
==================================

📋 Test Configuration:
  Target TPS: ${this.config.targetTPS}
  Duration: ${this.config.durationSeconds} seconds
  Memory Limit: ${this.config.maxMemoryUsageMB}MB
  Redis Memory Limit: ${this.config.memoryThresholdMB}MB

📊 Test Results:
  Total Requests: ${results.totalRequests}
  Successful Requests: ${results.successfulRequests}
  Failed Requests: ${results.failedRequests}
  Success Rate: ${((results.successfulRequests / results.totalRequests) * 100).toFixed(2)}%
  
⚡ Performance Metrics:
  Achieved TPS: ${results.throughputTPS.toFixed(2)}
  Average Response Time: ${results.averageResponseTime.toFixed(2)}ms
  Min Response Time: ${results.minResponseTime.toFixed(2)}ms
  Max Response Time: ${results.maxResponseTime.toFixed(2)}ms

💾 Memory Usage:
  Process Memory:
    Initial: ${results.memoryUsage.initial.toFixed(2)}MB
    Peak: ${results.memoryUsage.peak.toFixed(2)}MB
    Final: ${results.memoryUsage.final.toFixed(2)}MB
  
  Redis Memory:
    Initial: ${results.redisMemoryUsage.initial.toFixed(2)}MB
    Peak: ${results.redisMemoryUsage.peak.toFixed(2)}MB
    Final: ${results.redisMemoryUsage.final.toFixed(2)}MB

${results.errors.length > 0 ? `
❌ Errors (${results.errors.length} unique):
${results.errors.slice(0, 10).map(error => `  • ${error}`).join('\\n')}
${results.errors.length > 10 ? `  ... and ${results.errors.length - 10} more errors` : ''}
` : '✅ No errors detected'}

🎯 Overall Result: ${results.passed ? '✅ PASSED' : '❌ FAILED'}
`;

    return report;
  }
}

/**
 * Main load test execution function
 */
async function runCacheLoadTest(): Promise<void> {
  const config: LoadTestConfig = {
    targetTPS: parseInt(process.env.LOAD_TEST_TPS || '500'),
    durationSeconds: parseInt(process.env.LOAD_TEST_DURATION || '60'),
    baseUrl: process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000',
    apiKey: process.env.API_KEY || 'test-api-key',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    memoryThresholdMB: parseInt(process.env.REDIS_MEMORY_THRESHOLD_MB || '256'),
    maxMemoryUsageMB: parseInt(process.env.MAX_MEMORY_USAGE_MB || '512')
  };

  console.log('🔧 Load Test Configuration:', config);

  const tester = new CacheLoadTester(config);

  try {
    // Wait for service to be ready
    console.log('🔍 Checking service health...');
    await axios.get(`${config.baseUrl}/health`, { timeout: 5000 });
    console.log('✅ Service is healthy, starting load test...');

    const results = await tester.runLoadTest();
    const report = tester.generateReport(results);

    console.log(report);

    // Exit with appropriate code
    process.exit(results.passed ? 0 : 1);

  } catch (error) {
    console.error('❌ Load test failed to start:', error);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  runCacheLoadTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { CacheLoadTester, LoadTestConfig, LoadTestResults, runCacheLoadTest };
