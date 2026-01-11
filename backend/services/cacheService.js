import Redis from 'ioredis';

class CacheService {
  constructor() {
    this.redis = null;
    this.connected = false;
    this.defaultTTL = 3600; // 1 hour
  }

  async connect() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      this.redis.on('connect', () => {
        console.log('Redis connected');
        this.connected = true;
      });

      this.redis.on('error', (err) => {
        console.error('Redis connection error:', err);
        this.connected = false;
      });

      this.redis.on('close', () => {
        console.log('Redis connection closed');
        this.connected = false;
      });

      await this.redis.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.connected = false;
    }
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.disconnect();
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected && this.redis;
  }

  // Generic cache methods
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected()) return false;
    
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async get(key) {
    if (!this.isConnected()) return null;
    
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async del(key) {
    if (!this.isConnected()) return false;
    
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected()) return false;
    
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Specific cache methods for AlgoChat
  async cacheRoomMessages(roomId, messages, ttl = 1800) { // 30 minutes
    const key = `room:${roomId}:messages`;
    return await this.set(key, messages, ttl);
  }

  async getRoomMessages(roomId) {
    const key = `room:${roomId}:messages`;
    return await this.get(key);
  }

  async invalidateRoomMessages(roomId) {
    const key = `room:${roomId}:messages`;
    return await this.del(key);
  }

  async cacheUserRooms(userId, rooms, ttl = 3600) { // 1 hour
    const key = `user:${userId}:rooms`;
    return await this.set(key, rooms, ttl);
  }

  async getUserRooms(userId) {
    const key = `user:${userId}:rooms`;
    return await this.get(key);
  }

  async invalidateUserRooms(userId) {
    const key = `user:${userId}:rooms`;
    return await this.del(key);
  }

  async cacheUser(userId, userData, ttl = 3600) { // 1 hour
    const key = `user:${userId}`;
    return await this.set(key, userData, ttl);
  }

  async getUser(userId) {
    const key = `user:${userId}`;
    return await this.get(key);
  }

  async invalidateUser(userId) {
    const key = `user:${userId}`;
    return await this.del(key);
  }

  // Cache for online users
  async setOnlineUser(userId, socketId, ttl = 300) { // 5 minutes
    const key = `online:${userId}`;
    return await this.set(key, { socketId, lastSeen: new Date() }, ttl);
  }

  async getOnlineUser(userId) {
    const key = `online:${userId}`;
    return await this.get(key);
  }

  async removeOnlineUser(userId) {
    const key = `online:${userId}`;
    return await this.del(key);
  }

  // Cache for rate limiting
  async setRateLimit(identifier, count, ttl = 60) { // 1 minute
    const key = `ratelimit:${identifier}`;
    return await this.set(key, count, ttl);
  }

  async getRateLimit(identifier) {
    const key = `ratelimit:${identifier}`;
    return await this.get(key);
  }

  // Clear all cache (use with caution)
  async flushAll() {
    if (!this.isConnected()) return false;
    
    try {
      await this.redis.flushall();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Get cache statistics
  async getInfo() {
    if (!this.isConnected()) return null;
    
    try {
      const info = await this.redis.info();
      return info;
    } catch (error) {
      console.error('Cache info error:', error);
      return null;
    }
  }
}

export default new CacheService();
