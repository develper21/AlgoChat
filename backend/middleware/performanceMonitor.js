import Logger from '../services/logger.js';

class PerformanceMonitor {
  constructor() {
    this.requestTimes = new Map();
    this.slowQueryThreshold = 100; // ms
    this.slowRequestThreshold = 2000; // ms
    this.memoryThreshold = 0.9; // 90%
  }

  // Middleware to monitor HTTP requests
  requestMonitor() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Store start time
      this.requestTimes.set(req.id || req.socket.remoteAddress, startTime);
      
      // Monitor response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const requestId = req.id || req.socket.remoteAddress;
        
        // Log request
        Logger.apiRequest(req, res, duration);
        
        // Log slow requests
        if (duration > this.slowRequestThreshold) {
          Logger.performanceEvent('slow_request', duration, {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            userId: req.user?._id
          });
        }
        
        // Clean up
        this.requestTimes.delete(requestId);
      });
      
      next();
    };
  }

  // Monitor database queries
  async databaseMonitor(operation, queryFn) {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      Logger.databaseQuery(operation, duration);
      
      if (duration > this.slowQueryThreshold) {
        Logger.performanceEvent('slow_database_query', duration, { operation });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Database query failed', error, { operation, duration });
      throw error;
    }
  }

  // Monitor system resources
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metrics = {
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
        heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    // Check for memory issues
    if (metrics.memory.heapUsagePercent > this.memoryThreshold * 100) {
      Logger.warn('High memory usage detected', metrics);
    }

    return metrics;
  }

  // Monitor Socket.IO performance
  socketMonitor(io) {
    io.on('connection', (socket) => {
      const startTime = Date.now();
      
      Logger.socketEvent(socket.id, 'connected', {
        userId: socket.user?._id,
        address: socket.handshake.address
      });

      // Monitor socket events
      const originalEmit = socket.emit;
      socket.emit = function(event, ...args) {
        const emitStart = Date.now();
        
        Logger.socketEvent(socket.id, 'emit', {
          event,
          argsCount: args.length,
          userId: socket.user?._id
        });

        const result = originalEmit.apply(this, [event, ...args]);
        
        const duration = Date.now() - emitStart;
        if (duration > 100) {
          Logger.performanceEvent('slow_socket_emit', duration, {
            event,
            socketId: socket.id
          });
        }
        
        return result;
      };

      socket.on('disconnect', (reason) => {
        const duration = Date.now() - startTime;
        
        Logger.socketEvent(socket.id, 'disconnected', {
          reason,
          duration: `${duration}ms`,
          userId: socket.user?._id
        });
      });
    });
  }

  // Monitor cache performance
  cacheMonitor() {
    return {
      get: async (key, getFn) => {
        const startTime = Date.now();
        
        try {
          const result = await getFn();
          const duration = Date.now() - startTime;
          
          Logger.cacheOperation('get', key, result !== null, duration);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          Logger.cacheOperation('get_error', key, false, duration);
          throw error;
        }
      },
      
      set: async (key, setFn) => {
        const startTime = Date.now();
        
        try {
          const result = await setFn();
          const duration = Date.now() - startTime;
          
          Logger.cacheOperation('set', key, true, duration);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          Logger.cacheOperation('set_error', key, false, duration);
          throw error;
        }
      }
    };
  }

  // Get performance report
  getPerformanceReport() {
    const metrics = this.getSystemMetrics();
    const now = Date.now();
    
    // Calculate active requests
    const activeRequests = Array.from(this.requestTimes.values())
      .filter(startTime => now - startTime < 30000) // Requests active in last 30s
      .length;

    return {
      system: metrics,
      requests: {
        active: activeRequests,
        slowThreshold: this.slowRequestThreshold
      },
      database: {
        slowThreshold: this.slowQueryThreshold
      },
      memory: {
        threshold: this.memoryThreshold * 100,
        warning: metrics.memory.heapUsagePercent > this.memoryThreshold * 100
      },
      timestamp: new Date().toISOString()
    };
  }

  // Health check endpoint
  healthCheck() {
    const report = this.getPerformanceReport();
    const healthy = !report.memory.warning && report.system.uptime > 0;
    
    return {
      status: healthy ? 'healthy' : 'unhealthy',
      ...report,
      checks: {
        memory: !report.memory.warning,
        uptime: report.system.uptime > 0,
        responsive: true
      }
    };
  }

  // Start periodic monitoring
  startMonitoring(interval = 60000) { // 1 minute
    this.monitoringInterval = setInterval(() => {
      const report = this.getPerformanceReport();
      
      Logger.systemEvent('performance_check', report);
      
      // Alert on issues
      if (report.memory.warning) {
        Logger.warn('Memory usage alert', {
          usage: report.system.memory.heapUsagePercent,
          threshold: report.memory.threshold
        });
      }
    }, interval);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

export default new PerformanceMonitor();
