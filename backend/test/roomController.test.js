import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import cacheService from '../services/cacheService.js';

describe('Room Controller Tests', () => {
  let authToken;
  let testUser;
  let testRoom;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/test');
    
    // Initialize cache for testing
    await cacheService.connect();
  });

  afterAll(async () => {
    // Clean up database
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    
    // Disconnect cache
    await cacheService.disconnect();
  });

  beforeEach(async () => {
    // Clean up collections
    await User.deleteMany({});
    await Room.deleteMany({});
    await Message.deleteMany({});
    
    // Clear cache
    await cacheService.flushAll();
  });

  describe('POST /api/rooms', () => {
    beforeEach(async () => {
      // Create and authenticate test user
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      authToken = response.body.token;
    });

    it('should create a new group room', async () => {
      const roomData = {
        name: 'Test Group',
        isGroup: true,
        memberIds: []
      };

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData)
        .expect(201);

      expect(response.body.name).toBe(roomData.name);
      expect(response.body.isGroup).toBe(true);
      expect(response.body.members).toHaveLength(1);
      expect(response.body.members[0]._id).toBe(testUser._id.toString());
    });

    it('should create a 1:1 room', async () => {
      // Create another user
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });

      const roomData = {
        isGroup: false,
        memberIds: [otherUser._id.toString()]
      };

      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData)
        .expect(201);

      expect(response.body.isGroup).toBe(false);
      expect(response.body.members).toHaveLength(2);
    });

    it('should return 400 for group room without name', async () => {
      const roomData = {
        isGroup: true,
        memberIds: []
      };

      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const roomData = {
        name: 'Test Group',
        isGroup: true
      };

      await request(app)
        .post('/api/rooms')
        .send(roomData)
        .expect(401);
    });
  });

  describe('GET /api/rooms', () => {
    beforeEach(async () => {
      // Create and authenticate test user
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      authToken = response.body.token;

      // Create test rooms
      testRoom = await Room.create({
        name: 'Test Room',
        isGroup: true,
        members: [testUser._id]
      });
    });

    it('should get user rooms', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]._id).toBe(testRoom._id.toString());
    });

    it('should cache room list', async () => {
      // First request
      await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check if cached
      const cached = await cacheService.getUserRooms(testUser._id.toString());
      expect(cached).toBeTruthy();
      expect(cached).toHaveLength(1);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/rooms')
        .expect(401);
    });
  });

  describe('GET /api/rooms/:roomId/messages', () => {
    beforeEach(async () => {
      // Create and authenticate test user
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      authToken = response.body.token;

      // Create test room
      testRoom = await Room.create({
        name: 'Test Room',
        isGroup: true,
        members: [testUser._id]
      });

      // Create test messages
      for (let i = 0; i < 25; i++) {
        await Message.create({
          room: testRoom._id,
          sender: testUser._id,
          text: `Test message ${i + 1}`
        });
      }
    });

    it('should get room messages with pagination', async () => {
      const response = await request(app)
        .get(`/api/rooms/${testRoom._id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.messages).toHaveLength(10);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.total).toBe(25);
      expect(response.body.pagination.hasMore).toBe(true);
    });

    it('should get second page of messages', async () => {
      const response = await request(app)
        .get(`/api/rooms/${testRoom._id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 2, limit: 10 })
        .expect(200);

      expect(response.body.messages).toHaveLength(10);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.hasMore).toBe(true);
    });

    it('should limit maximum messages per page', async () => {
      const response = await request(app)
        .get(`/api/rooms/${testRoom._id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 200 }) // Try to request more than max
        .expect(200);

      expect(response.body.messages).toHaveLength(25); // All messages
      expect(response.body.pagination.limit).toBe(100); // Limited to max
    });

    it('should return 404 for non-existent room', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/rooms/${fakeId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 for non-member', async () => {
      // Create another user
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@example.com',
          password: 'password123'
        });
      
      const otherToken = loginResponse.body.token;

      await request(app)
        .get(`/api/rooms/${testRoom._id}/messages`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should cache messages', async () => {
      // First request
      await request(app)
        .get(`/api/rooms/${testRoom._id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Check if cached
      const cached = await cacheService.getRoomMessages(testRoom._id.toString());
      expect(cached).toBeTruthy();
      expect(cached.messages).toHaveLength(10);
    });
  });

  describe('Message Pagination Edge Cases', () => {
    beforeEach(async () => {
      // Create and authenticate test user
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      authToken = response.body.token;

      // Create test room
      testRoom = await Room.create({
        name: 'Test Room',
        isGroup: true,
        members: [testUser._id]
      });
    });

    it('should handle empty room', async () => {
      const response = await request(app)
        .get(`/api/rooms/${testRoom._id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.messages).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.hasMore).toBe(false);
    });

    it('should handle before parameter', async () => {
      // Create messages with specific timestamps
      const baseTime = new Date('2024-01-01T00:00:00Z');
      
      for (let i = 0; i < 10; i++) {
        await Message.create({
          room: testRoom._id,
          sender: testUser._id,
          text: `Message ${i + 1}`,
          createdAt: new Date(baseTime.getTime() + i * 60000) // 1 minute apart
        });
      }

      const beforeTime = new Date(baseTime.getTime() + 5 * 60000); // Before message 6
      
      const response = await request(app)
        .get(`/api/rooms/${testRoom._id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ before: beforeTime.toISOString() })
        .expect(200);

      expect(response.body.messages).toHaveLength(5); // Messages 1-5
    });
  });
});
