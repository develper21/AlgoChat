import rateLimit from 'express-rate-limit';
import { MongoStore } from 'rate-limit-mongo';
import mongoose from 'mongoose';

// MongoDB store for rate limiting
const store = new MongoStore({
  uri: process.env.MONGO_URI,
  collectionName: 'rate-limits',
  expireTimeMs: 15 * 60 * 1000, // 15 minutes
  errorHandler: console.error
});

// General API rate limiter
export const generalLimiter = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (stricter)
export const authLimiter = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    message: 'Too many authentication attempts. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    message: 'Too many password reset requests. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email verification rate limiter
export const emailVerificationLimiter = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 verification requests per hour
  message: {
    message: 'Too many verification requests. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Message sending rate limiter
export const messageLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each user to 30 messages per minute
  keyGenerator: (req) => req.user?._id || req.ip,
  message: {
    message: 'Too many messages. Please wait before sending more.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  store,
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each user to 10 uploads per 10 minutes
  keyGenerator: (req) => req.user?._id || req.ip,
  message: {
    message: 'Too many file uploads. Please wait before uploading more.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Room creation rate limiter
export const roomCreationLimiter = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each user to 5 rooms per hour
  keyGenerator: (req) => req.user?._id || req.ip,
  message: {
    message: 'Too many room creation attempts. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Socket.IO rate limiting middleware
export const socketRateLimiter = (socket, next) => {
  const clientIp = socket.handshake.address;
  const userId = socket.user?._id;
  
  // Create a simple in-memory store for socket events
  if (!global.socketRateLimits) {
    global.socketRateLimits = new Map();
  }
  
  const key = userId || clientIp;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxEvents = 100; // Max 100 events per minute
  
  if (!global.socketRateLimits.has(key)) {
    global.socketRateLimits.set(key, { count: 0, resetTime: now + windowMs });
  }
  
  const userLimit = global.socketRateLimits.get(key);
  
  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + windowMs;
  }
  
  userLimit.count++;
  
  if (userLimit.count > maxEvents) {
    return next(new Error('Rate limit exceeded for socket events'));
  }
  
  next();
};
