import winston, { format, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import chalk from 'chalk';
import { inspect } from 'util';

// Create logs directory at the project root
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Determine log level from environment or default to 'info'
const logLevel = process.env.LOG_LEVEL || 'info';
const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

// Custom log formats
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
    perf: 7    // Performance metrics
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'gray',
    perf: 'brightBlue'
  }
};

// Add custom colors to winston
winston.addColors(customLevels.colors);

// Custom formatter for performance logs
const perfFormat = format((info) => {
  if (info.level === 'perf') {
    const { duration, operation, ...rest } = info;
    info.message = `${operation || 'Operation'} completed in ${duration}ms`;
    info.metadata = rest;
  }
  return info;
});

// Custom format for pretty console output
const prettyConsoleFormat = format.printf(({ level, message, timestamp, ...metadata }) => {
  // Extract important metadata for special display
  const { requestId, duration, operation, service, userId, ...restMetadata } = metadata;
  
  // Generate colorized output
  let output = '';
  
  // Timestamp
  output += chalk.gray(`[${timestamp}] `);
  
  // Log level with color
  const levelColors = {
    error: chalk.red.bold,
    warn: chalk.yellow.bold,
    info: chalk.green.bold,
    http: chalk.magenta.bold,
    verbose: chalk.cyan.bold,
    debug: chalk.blue.bold,
    silly: chalk.gray.bold,
    perf: chalk.blue.bold
  };
  
  const colorizeLevel = levelColors[level as keyof typeof levelColors] || chalk.white.bold;
  output += `${colorizeLevel(level.toUpperCase().padEnd(7))} `;
  
  // Service name if available
  if (service && service !== 'hockey-pool-api') {
    output += chalk.cyan(`[${service}] `);
  }
  
  // Request ID if available for tracing
  if (requestId) {
    output += chalk.gray(`(${(requestId as string).substring(0, 8)}) `);
  }
  
  // User ID if available
  if (userId) {
    output += chalk.yellow(`👤 ${userId} `);
  }
  
  // Performance metrics
  if (level === 'perf' && duration) {
    const durationNum = parseFloat(duration as string);
    let durationColor = chalk.green;
    if (durationNum > 1000) durationColor = chalk.red;
    else if (durationNum > 300) durationColor = chalk.yellow;
    
    output += chalk.blue(`${operation || 'Operation'} `) + 
              `completed in ${durationColor(`${durationNum.toFixed(2)}ms`)} `;
  }
  
  // Main message
  output += `${chalk.white(message)} `;
  
  // Add any remaining metadata
  if (Object.keys(restMetadata).length > 0) {
    const metaString = inspect(restMetadata, { colors: true, depth: 4, compact: true });
    output += `\n  ${chalk.gray(metaString)}`;
  }
  
  return output;
});

// File format (structured JSON logging)
const fileFormat = format.combine(
  format.timestamp(),
  format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'service'] }),
  format.json()
);

// Host information for logs
const hostInfo = {
  hostname: os.hostname(),
  platform: os.platform(),
  release: os.release(),
  cpus: os.cpus().length,
  memory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + 'GB',
};

// Shared transport options for file rotation
const rotateOptions = {
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
  datePattern: 'YYYY-MM-DD',
  dirname: logsDir,
};

// Create main logger with enhanced features
export const logger: Logger = winston.createLogger({
  levels: customLevels.levels,
  level: logLevel,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    perfFormat(),
    fileFormat
  ),
  defaultMeta: { 
    service: 'hockey-pool-api',
    env,
    host: isProduction ? hostInfo : undefined
  },
  transports: [
    // Combined log
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'combined-%DATE%.log',
    }) as unknown as winston.transport,
    
    // Error log
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'error-%DATE%.log',
      level: 'error',
    }) as unknown as winston.transport,
    
    // Performance log
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'performance-%DATE%.log',
      level: 'perf',
    }) as unknown as winston.transport,
    
    // HTTP log (for API calls)
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'http-%DATE%.log',
      level: 'http',
    }) as unknown as winston.transport
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'exceptions-%DATE%.log',
    }) as unknown as winston.transport
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'rejections-%DATE%.log',
    }) as unknown as winston.transport
  ],
  exitOnError: false
});

// Add console transport for non-production environments
if (!isProduction) {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize({ all: true }),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      prettyConsoleFormat
    ),
    handleExceptions: true
  }));
} else {
  // Add simpler console transport for production to show in Docker logs
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.json()
    ),
    handleExceptions: true
  }));
}

// Create specialized email logger with enhanced features
export const emailLogger: Logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.EMAIL_LOG_LEVEL || 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    fileFormat
  ),
  defaultMeta: { service: 'email-service', env },
  transports: [
    // Email logs
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'email-%DATE%.log',
    }) as unknown as winston.transport,
    
    // Email debug logs
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'email-debug-%DATE%.log',
      level: 'debug',
    }) as unknown as winston.transport,
    
    // Email errors to general error log too
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'error-%DATE%.log',
      level: 'error',
    }) as unknown as winston.transport
  ],
  exitOnError: false
});

// Add console transport for email logger in non-production
if (!isProduction) {
  emailLogger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize({ all: true }),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ level, message, timestamp, ...metadata }) => {
        const { requestId, service, ...rest } = metadata;
        
        let output = chalk.gray(`[${timestamp}] `);
        output += `${chalk.magentaBright.bold(level.toUpperCase().padEnd(7))} `;
        output += `${chalk.cyan('[EMAIL]')} `;
        
        if (requestId) {
          output += chalk.gray(`(${(requestId as string).substring(0, 8)}) `);
        }
        
        output += `${chalk.white(message)} `;
        
        if (Object.keys(rest).length > 0) {
          const metaString = inspect(rest, { colors: true, depth: 4, compact: true });
          output += `\n  ${chalk.gray(metaString)}`;
        }
        
        return output;
      })
    )
  }));
}

// Create an API logger for HTTP requests
export const apiLogger: Logger = winston.createLogger({
  levels: customLevels.levels,
  level: 'http',
  format: format.combine(
    format.timestamp(),
    fileFormat
  ),
  defaultMeta: { service: 'api-service', env },
  transports: [
    new DailyRotateFile({
      ...rotateOptions,
      filename: 'api-%DATE%.log',
    }) as unknown as winston.transport
  ],
  exitOnError: false
});

// Add console transport for API logger in non-production
if (!isProduction) {
  apiLogger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize({ all: true }),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ level, message, timestamp, ...metadata }) => {
        const { method, url, status, responseTime, ip, userAgent, requestId, userId } = metadata;
        
        let output = chalk.gray(`[${timestamp}] `);
        output += `${chalk.magenta.bold('HTTP')} `;
        
        // Request method with color
        const methodColors = {
          GET: chalk.green,
          POST: chalk.yellow,
          PUT: chalk.blue,
          DELETE: chalk.red,
          PATCH: chalk.cyan
        };
        const methodColor = methodColors[(method as string)] || chalk.white;
        output += methodColor.bold(`${(method as string).padEnd(6)} `);
        
        // Status code with color
        let statusColor = chalk.green;
        if ((status as number) >= 500) statusColor = chalk.red;
        else if ((status as number) >= 400) statusColor = chalk.yellow;
        else if ((status as number) >= 300) statusColor = chalk.cyan;
        
        output += statusColor.bold(`${status} `);
        
        // Response time with color
        let timeColor = chalk.green;
        const time = parseFloat(responseTime as string);
        if (time > 1000) timeColor = chalk.red;
        else if (time > 500) timeColor = chalk.yellow;
        
        output += timeColor(`${time.toFixed(2)}ms `);
        
        // URL
        output += chalk.white(`${url} `);
        
        // Add request ID if available
        if (requestId) {
          output += chalk.gray(`(${(requestId as string).substring(0, 8)}) `);
        }
        
        // Add user ID if available
        if (userId) {
          output += chalk.yellow(`👤 ${userId}`);
        }
        
        // Add IP address as a new line
        if (ip) {
          output += `\n  ${chalk.gray(`IP: ${ip}`)}`;
        }
        
        // Add user agent as a new line
        if (userAgent) {
          output += `\n  ${chalk.gray(`UA: ${userAgent}`)}`;
        }
        
        return output;
      })
    )
  }));
} else {
  // Add simpler console transport for API logger in production
  apiLogger.add(new winston.transports.Console({
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.json()
    ),
    handleExceptions: true
  }));
}

// Generate request ID for tracking
export const generateRequestId = (): string => {
  return uuidv4();
};

// Performance timer with enhanced metrics
export const createPerformanceTimer = (operation?: string, metadata: Record<string, any> = {}) => {
  const start = process.hrtime();
  const requestId = metadata.requestId || generateRequestId();
  
  return {
    end: () => {
      const diff = process.hrtime(start);
      const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // in milliseconds
      
      logger.log('perf', {
        operation,
        duration,
        requestId,
        ...metadata,
        timestamp: new Date().toISOString()
      });
      
      return duration;
    },
    checkpoint: (checkpointName: string) => {
      const diff = process.hrtime(start);
      const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // in milliseconds
      
      logger.log('perf', {
        operation: operation ? `${operation}:${checkpointName}` : checkpointName,
        duration,
        checkpoint: true,
        requestId,
        ...metadata,
        timestamp: new Date().toISOString()
      });
      
      return duration;
    }
  };
};

// Log middleware request details
export const logRequest = (req, res, next) => {
  const start = process.hrtime();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Add request ID to request object for use in downstream handlers
  req.requestId = requestId;
  
  // Set request ID in response headers for client tracking
  res.setHeader('X-Request-ID', requestId);
  
  // Log request start
  apiLogger.http(`${req.method} ${req.url} started`, {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    requestId,
    userId: req.user?.id,
    query: req.query,
    contentType: req.headers['content-type']
  });
  
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const responseTime = (diff[0] * 1e9 + diff[1]) / 1e6; // in milliseconds
    
    const level = res.statusCode >= 400 ? 'warn' : 'http';
    
    apiLogger.log(level, `${req.method} ${req.url} completed`, {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime,
      contentLength: res.getHeader('content-length'),
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      requestId,
      userId: req.user?.id
    });
  });
  
  next();
};

// Enhanced error logging
export const logError = (err, req, res, next) => {
  const requestId = req.requestId || generateRequestId();
  
  logger.error(`Error processing request: ${err.message}`, {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    },
    requestId,
    userId: req.user?.id,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
  });
  
  next(err);
};

// Initialize logger
logger.info('Logger initialized', {
  level: logger.level,
  environment: env,
  host: hostInfo,
  timestamp: new Date().toISOString()
});
