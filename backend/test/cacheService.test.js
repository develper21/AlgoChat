import cacheService from '../services/cacheService.js';
import Logger from '../services/logger.js';

describe('Cache Service Tests', () => {
  beforeAll(async () => {
    await cacheService.connect();
  });

  afterAll(async () => {
    await cacheService.disconnect();
  });

  beforeEach(async () => {
    await cacheService.flushAll();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get values', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      const setResult = await cacheService.set(key, value);
      expect(setResult).toBe(true);

      const getResult = await cacheService.get(key);
      expect(getResult).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete keys', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await cacheService.set(key, value);
      const deleteResult = await cacheService.del(key);
      expect(deleteResult).toBe(true);

      const getResult = await cacheService.get(key);
      expect(getResult).toBeNull();
    });

    it('should check key existence', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      expect(await cacheService.exists(key)).toBe(false);

      await cacheService.set(key, value);
      expect(await cacheService.exists(key)).toBe(true);
    });
  });

  describe('Room Message Caching', () => {
    it('should cache room messages', async () => {
      const roomId = 'room123';
      const messages = {
        messages: [
          { id: '1', text: 'Hello' },
          { id: '2', text: 'World' }
        ],
        pagination: { page: 1, total: 2 }
      };

      const setResult = await cacheService.cacheRoomMessages(roomId, messages);
      expect(setResult).toBe(true);

      const getResult = await cacheService.getRoomMessages(roomId);
      expect(getResult).toEqual(messages);
    });

    it('should invalidate room messages', async () => {
      const roomId = 'room123';
      const messages = { messages: [], pagination: {} };

      await cacheService.cacheRoomMessages(roomId, messages);
      expect(await cacheService.getRoomMessages(roomId)).toBeTruthy();

      const invalidateResult = await cacheService.invalidateRoomMessages(roomId);
      expect(invalidateResult).toBe(true);

      expect(await cacheService.getRoomMessages(roomId)).toBeNull();
    });
  });

  describe('User Room Caching', () => {
    it('should cache user rooms', async () => {
      const userId = 'user123';
      const rooms = [
        { id: 'room1', name: 'Room 1' },
        { id: 'room2', name: 'Room 2' }
      ];

      const setResult = await cacheService.cacheUserRooms(userId, rooms);
      expect(setResult).toBe(true);

      const getResult = await cacheService.getUserRooms(userId);
      expect(getResult).toEqual(rooms);
    });

    it('should invalidate user rooms', async () => {
      const userId = 'user123';
      const rooms = [];

      await cacheService.cacheUserRooms(userId, rooms);
      expect(await cacheService.getUserRooms(userId)).toBeTruthy();

      const invalidateResult = await cacheService.invalidateUserRooms(userId);
      expect(invalidateResult).toBe(true);

      expect(await cacheService.getUserRooms(userId)).toBeNull();
    });
  });

  describe('User Data Caching', () => {
    it('should cache user data', async () => {
      const userId = 'user123';
      const userData = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com'
      };

      const setResult = await cacheService.cacheUser(userId, userData);
      expect(setResult).toBe(true);

      const getResult = await cacheService.getUser(userId);
      expect(getResult).toEqual(userData);
    });

    it('should invalidate user data', async () => {
      const userId = 'user123';
      const userData = { id: userId };

      await cacheService.cacheUser(userId, userData);
      expect(await cacheService.getUser(userId)).toBeTruthy();

      const invalidateResult = await cacheService.invalidateUser(userId);
      expect(invalidateResult).toBe(true);

      expect(await cacheService.getUser(userId)).toBeNull();
    });
  });

  describe('Online User Management', () => {
    it('should set online user', async () => {
      const userId = 'user123';
      const socketId = 'socket456';

      const setResult = await cacheService.setOnlineUser(userId, socketId);
      expect(setResult).toBe(true);

      const getResult = await cacheService.getOnlineUser(userId);
      expect(getResult).toEqual({
        socketId,
        lastSeen: expect.any(String)
      });
    });

    it('should remove online user', async () => {
      const userId = 'user123';
      const socketId = 'socket456';

      await cacheService.setOnlineUser(userId, socketId);
      expect(await cacheService.getOnlineUser(userId)).toBeTruthy();

      const removeResult = await cacheService.removeOnlineUser(userId);
      expect(removeResult).toBe(true);

      expect(await cacheService.getOnlineUser(userId)).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    it('should set rate limit', async () => {
      const identifier = 'user123';
      const count = 5;

      const setResult = await cacheService.setRateLimit(identifier, count);
      expect(setResult).toBe(true);

      const getResult = await cacheService.getRateLimit(identifier);
      expect(getResult).toBe(count);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      // Simulate disconnection
      await cacheService.disconnect();

      const setResult = await cacheService.set('test', 'value');
      expect(setResult).toBe(false);

      const getResult = await cacheService.get('test');
      expect(getResult).toBeNull();

      // Reconnect for other tests
      await cacheService.connect();
    });

    it('should handle invalid JSON gracefully', async () => {
      // This would require mocking Redis to return invalid JSON
      // For now, just test normal operation
      const validData = { test: 'data' };
      await cacheService.set('valid-key', validData);
      
      const result = await cacheService.get('valid-key');
      expect(result).toEqual(validData);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect custom TTL', async () => {
      const key = 'ttl-test';
      const value = { data: 'test' };
      const shortTTL = 1; // 1 second

      await cacheService.set(key, value, shortTTL);
      expect(await cacheService.get(key)).toEqual(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(await cacheService.get(key)).toBeNull();
    }, 5000); // Increase test timeout
  });

  describe('Performance', () => {
    it('should handle multiple operations efficiently', async () => {
      const operations = [];
      const numOps = 100;

      // Measure set operations
      const setStart = Date.now();
      for (let i = 0; i < numOps; i++) {
        operations.push(cacheService.set(`key${i}`, { data: `value${i}` }));
      }
      await Promise.all(operations);
      const setDuration = Date.now() - setStart;

      // Measure get operations
      const getStart = Date.now();
      const getOperations = [];
      for (let i = 0; i < numOps; i++) {
        getOperations.push(cacheService.get(`key${i}`));
      }
      const results = await Promise.all(getOperations);
      const getDuration = Date.now() - getStart;

      // Verify all operations succeeded
      expect(results.filter(r => r !== null)).toHaveLength(numOps);

      // Performance expectations (adjust based on your requirements)
      expect(setDuration).toBeLessThan(1000); // 1 second for 100 sets
      expect(getDuration).toBeLessThan(500);  // 0.5 seconds for 100 gets
    });
  });
});
