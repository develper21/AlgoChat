import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'algochat-backend' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // Access log file
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, stack }) => {
        let log = `${timestamp} ${level}: ${message}`;
        if (stack) {
          log += `\n${stack}`;
        }
        return log;
      })
    )
  }));
}

// Custom logging methods for AlgoChat
class Logger {
  static info(message, meta = {}) {
    logger.info(message, meta);
  }

  static error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    };
    logger.error(message, errorMeta);
  }

  static warn(message, meta = {}) {
    logger.warn(message, meta);
  }

  static debug(message, meta = {}) {
    logger.debug(message, meta);
  }

  static http(message, meta = {}) {
    logger.http(message, meta);
  }

  // Specific logging methods for different actions
  static userAction(userId, action, details = {}) {
    logger.info('User Action', {
      userId,
      action,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  static messageEvent(messageId, event, details = {}) {
    logger.info('Message Event', {
      messageId,
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  static roomEvent(roomId, event, details = {}) {
    logger.info('Room Event', {
      roomId,
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  static socketEvent(socketId, event, details = {}) {
    logger.info('Socket Event', {
      socketId,
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  static apiRequest(req, res, responseTime) {
    logger.http('API Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?._id
    });
  }

  static securityEvent(event, details = {}) {
    logger.warn('Security Event', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  static performanceEvent(operation, duration, details = {}) {
    logger.info('Performance', {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  static databaseQuery(query, duration, details = {}) {
    logger.debug('Database Query', {
      query,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  static cacheOperation(operation, key, hit = null, duration = null) {
    logger.debug('Cache Operation', {
      operation,
      key,
      hit,
      duration: duration ? `${duration}ms` : null,
      timestamp: new Date().toISOString()
    });
  }

  static errorReport(error, context = {}) {
    logger.error('Error Report', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      },
      context,
      timestamp: new Date().toISOString()
    });
  }

  // System events
  static systemEvent(event, details = {}) {
    logger.info('System Event', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  // Get logger stats
  static getStats() {
    return {
      level: logger.level,
      transports: logger.transports.length,
      logsDir
    };
  }

  // Query logs
  static async queryLogs(options = {}) {
    const {
      level = null,
      startTime = null,
      endTime = null,
      limit = 100,
      offset = 0
    } = options;

    try {
      const logFile = path.join(logsDir, 'combined.log');
      const content = await fs.readFile(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      let logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Apply filters
      if (level) {
        logs = logs.filter(log => log.level === level);
      }

      if (startTime) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(startTime));
      }

      if (endTime) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(endTime));
      }

      // Apply pagination
      const paginatedLogs = logs.slice(offset, offset + limit);

      return {
        logs: paginatedLogs,
        total: logs.length,
        hasMore: offset + limit < logs.length
      };
    } catch (error) {
      logger.error('Failed to query logs', error);
      return { logs: [], total: 0, hasMore: false };
    }
  }
}

export default Logger;
