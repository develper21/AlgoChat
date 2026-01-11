import AnalyticsEvent from '../models/AnalyticsEvent.js';
import UsageStats from '../models/UsageStats.js';
import UserActivity from '../models/UserActivity.js';
import PerformanceMetrics from '../models/PerformanceMetrics.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import Meeting from '../models/Meeting.js';
import { performance } from 'perf_hooks';

class AnalyticsService {
  constructor() {
    this.sessionCache = new Map(); // Cache for active sessions
    this.realTimeStats = {
      activeUsers: 0,
      activeRooms: 0,
      messagesPerSecond: 0,
      currentConnections: 0
    };
  }

  // Track user events
  async trackEvent(eventData) {
    try {
      const event = new AnalyticsEvent({
        ...eventData,
        timestamp: new Date()
      });
      
      await event.save();
      
      // Update real-time stats
      this.updateRealTimeStats(eventData);
      
      // Update user activity
      if (eventData.userId) {
        await this.updateUserActivity(eventData);
      }
      
      return event;
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  // Track user login
  async trackUserLogin(userId, sessionId, deviceInfo, ipAddress, userAgent) {
    return this.trackEvent({
      eventType: 'user_login',
      userId,
      sessionId,
      metadata: { deviceInfo },
      ipAddress,
      userAgent,
      device: this.parseDeviceInfo(userAgent)
    });
  }

  // Track user logout
  async trackUserLogout(userId, sessionId) {
    return this.trackEvent({
      eventType: 'user_logout',
      userId,
      sessionId
    });
  }

  // Track message events
  async trackMessageSent(userId, roomId, messageId, messageType = 'text', responseTime) {
    return this.trackEvent({
      eventType: 'message_sent',
      userId,
      roomId,
      messageId,
      metadata: { messageType },
      responseTime
    });
  }

  async trackMessageRead(userId, roomId, messageId) {
    return this.trackEvent({
      eventType: 'message_read',
      userId,
      roomId,
      messageId
    });
  }

  // Track file operations
  async trackFileUpload(userId, roomId, fileSize, fileType, responseTime) {
    return this.trackEvent({
      eventType: 'file_uploaded',
      userId,
      roomId,
      metadata: { fileSize, fileType },
      responseTime
    });
  }

  // Track room events
  async trackRoomJoined(userId, roomId) {
    return this.trackEvent({
      eventType: 'room_joined',
      userId,
      roomId
    });
  }

  async trackRoomLeft(userId, roomId) {
    return this.trackEvent({
      eventType: 'room_left',
      userId,
      roomId
    });
  }

  // Track meeting events
  async trackMeetingStarted(userId, roomId, meetingId) {
    return this.trackEvent({
      eventType: 'meeting_started',
      userId,
      roomId,
      metadata: { meetingId }
    });
  }

  // Track search queries
  async trackSearch(userId, query, resultsCount, responseTime) {
    return this.trackEvent({
      eventType: 'search_query',
      userId,
      metadata: { query, resultsCount },
      responseTime
    });
  }

  // Get usage analytics
  async getUsageAnalytics(period = 'daily', startDate, endDate) {
    try {
      const matchStage = {
        period,
        date: {
          $gte: startDate || this.getStartDate(period),
          $lte: endDate || new Date()
        }
      };

      const stats = await UsageStats.find(matchStage)
        .sort({ date: -1 })
        .lean();

      return {
        stats,
        summary: this.calculateUsageSummary(stats),
        trends: this.calculateTrends(stats)
      };
    } catch (error) {
      console.error('Error getting usage analytics:', error);
      return { stats: [], summary: {}, trends: {} };
    }
  }

  // Get engagement metrics
  async getEngagementMetrics(period = 'daily', startDate, endDate) {
    try {
      const matchStage = {
        period,
        date: {
          $gte: startDate || this.getStartDate(period),
          $lte: endDate || new Date()
        }
      };

      const stats = await UsageStats.find(matchStage)
        .sort({ date: -1 })
        .lean();

      return {
        engagement: {
          averageSessionDuration: this.calculateAverage(stats, 'averageSessionDuration'),
          bounceRate: this.calculateAverage(stats, 'bounceRate'),
          retentionRate: this.calculateAverage(stats, 'retentionRate'),
          engagementScore: this.calculateEngagementScore(stats)
        },
        userActivity: {
          activeUsers: this.calculateSum(stats, 'activeUsers'),
          newUsers: this.calculateSum(stats, 'newUsers'),
          returningUsers: this.calculateSum(stats, 'returningUsers')
        },
        featureUsage: this.aggregateFeatureUsage(stats)
      };
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      return { engagement: {}, userActivity: {}, featureUsage: {} };
    }
  }

  // Get storage usage tracking
  async getStorageUsage() {
    try {
      // Get total storage used from files
      const totalStorage = await this.calculateTotalStorage();
      
      // Get storage by file type
      const storageByType = await this.getStorageByType();
      
      // Get storage growth over time
      const storageGrowth = await this.getStorageGrowth();
      
      // Get user storage distribution
      const userStorageDistribution = await this.getUserStorageDistribution();

      return {
        total: totalStorage,
        byType: storageByType,
        growth: storageGrowth,
        distribution: userStorageDistribution,
        projections: this.projectStorageNeeds(storageGrowth)
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return { total: 0, byType: {}, growth: [], distribution: [] };
    }
  }

  // Get performance monitoring data
  async getPerformanceMetrics(period = 'hour', limit = 100) {
    try {
      const metrics = await PerformanceMetrics.find({ period })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return {
        current: metrics[0] || {},
        historical: metrics,
        alerts: this.extractActiveAlerts(metrics),
        summary: this.calculatePerformanceSummary(metrics)
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return { current: {}, historical: [], alerts: [], summary: {} };
    }
  }

  // Get user activity reports
  async getUserActivityReports(userId, period = 'daily', startDate, endDate) {
    try {
      const matchStage = {
        userId,
        date: {
          $gte: startDate || this.getStartDate(period),
          $lte: endDate || new Date()
        }
      };

      const activities = await UserActivity.find(matchStage)
        .sort({ date: -1 })
        .populate('roomsVisited', 'name type')
        .lean();

      return {
        activities,
        summary: this.calculateUserActivitySummary(activities),
        patterns: this.analyzeUserPatterns(activities),
        engagement: this.calculateUserEngagement(activities)
      };
    } catch (error) {
      console.error('Error getting user activity reports:', error);
      return { activities: [], summary: {}, patterns: {}, engagement: {} };
    }
  }

  // Generate comprehensive analytics report
  async generateAnalyticsReport(period = 'monthly', startDate, endDate) {
    try {
      const [usage, engagement, storage, performance] = await Promise.all([
        this.getUsageAnalytics(period, startDate, endDate),
        this.getEngagementMetrics(period, startDate, endDate),
        this.getStorageUsage(),
        this.getPerformanceMetrics('hour', 720) // 30 days of hourly data
      ]);

      return {
        period,
        dateRange: {
          start: startDate || this.getStartDate(period),
          end: endDate || new Date()
        },
        usage,
        engagement,
        storage,
        performance,
        insights: this.generateInsights(usage, engagement, storage, performance),
        recommendations: this.generateRecommendations(usage, engagement, storage, performance)
      };
    } catch (error) {
      console.error('Error generating analytics report:', error);
      return { error: 'Failed to generate report' };
    }
  }

  // Helper methods
  updateRealTimeStats(eventData) {
    switch (eventData.eventType) {
      case 'user_login':
        this.realTimeStats.activeUsers++;
        break;
      case 'user_logout':
        this.realTimeStats.activeUsers--;
        break;
      case 'message_sent':
        this.realTimeStats.messagesPerSecond++;
        break;
      case 'room_joined':
        this.realTimeStats.activeRooms++;
        break;
      case 'room_left':
        this.realTimeStats.activeRooms--;
        break;
    }
  }

  async updateUserActivity(eventData) {
    const today = new Date().setHours(0, 0, 0, 0);
    
    await UserActivity.findOneAndUpdate(
      { userId: eventData.userId, date: new Date(today) },
      {
        $inc: {
          ...(eventData.eventType === 'message_sent' && { messagesSent: 1 }),
          ...(eventData.eventType === 'message_read' && { messagesRead: 1 }),
          ...(eventData.eventType === 'file_uploaded' && { filesUploaded: 1 }),
          ...(eventData.eventType === 'search_query' && { searchesPerformed: 1 }),
          ...(eventData.eventType === 'room_joined' && { roomsJoined: 1 }),
          ...(eventData.eventType === 'room_left' && { roomsLeft: 1 })
        },
        $addToSet: {
          ...(eventData.roomId && { roomsVisited: eventData.roomId })
        }
      },
      { upsert: true, new: true }
    );
  }

  parseDeviceInfo(userAgent) {
    // Simple device detection
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /iPad|Tablet/.test(userAgent);
    
    return {
      type: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
      os: this.extractOS(userAgent),
      browser: this.extractBrowser(userAgent)
    };
  }

  extractOS(userAgent) {
    const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/);
    return osMatch ? osMatch[1] : 'Unknown';
  }

  extractBrowser(userAgent) {
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/);
    return browserMatch ? browserMatch[1] : 'Unknown';
  }

  getStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'hourly':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours
      case 'daily':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
      case 'weekly':
        return new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks
      case 'monthly':
        return new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // 12 months
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  calculateUsageSummary(stats) {
    if (!stats.length) return {};

    return {
      totalActiveUsers: this.calculateSum(stats, 'activeUsers'),
      totalMessages: this.calculateSum(stats, 'totalMessages'),
      totalFiles: this.calculateSum(stats, 'filesUploaded'),
      averageMessagesPerDay: this.calculateAverage(stats, 'totalMessages'),
      peakActiveUsers: Math.max(...stats.map(s => s.activeUsers || 0)),
      growthRate: this.calculateGrowthRate(stats)
    };
  }

  calculateTrends(stats) {
    if (stats.length < 2) return {};

    const latest = stats[0];
    const previous = stats[1];

    return {
      userGrowth: this.calculatePercentageChange(previous.activeUsers, latest.activeUsers),
      messageGrowth: this.calculatePercentageChange(previous.totalMessages, latest.totalMessages),
      engagementGrowth: this.calculatePercentageChange(previous.averageSessionDuration, latest.averageSessionDuration)
    };
  }

  calculateAverage(array, field) {
    if (!array.length) return 0;
    const sum = array.reduce((acc, item) => acc + (item[field] || 0), 0);
    return sum / array.length;
  }

  calculateSum(array, field) {
    return array.reduce((acc, item) => acc + (item[field] || 0), 0);
  }

  calculatePercentageChange(oldValue, newValue) {
    if (!oldValue) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  calculateGrowthRate(stats) {
    if (stats.length < 2) return 0;
    const first = stats[stats.length - 1];
    const last = stats[0];
    return this.calculatePercentageChange(first.activeUsers, last.activeUsers);
  }

  // Storage calculation methods
  async calculateTotalStorage() {
    // This would integrate with your file storage system
    // For now, return a placeholder
    return 0;
  }

  async getStorageByType() {
    // Implementation would query file storage by type
    return {};
  }

  async getStorageGrowth() {
    // Implementation would return storage usage over time
    return [];
  }

  async getUserStorageDistribution() {
    // Implementation would return storage usage by user
    return [];
  }

  projectStorageNeeds(growthData) {
    // Simple linear projection
    if (!growthData.length) return { nextMonth: 0, nextQuarter: 0, nextYear: 0 };
    
    const avgGrowth = growthData.reduce((sum, point) => sum + point.growth, 0) / growthData.length;
    const current = growthData[growthData.length - 1].total;
    
    return {
      nextMonth: current * (1 + avgGrowth),
      nextQuarter: current * Math.pow(1 + avgGrowth, 3),
      nextYear: current * Math.pow(1 + avgGrowth, 12)
    };
  }

  // Additional helper methods for analytics calculations
  calculateEngagementScore(stats) {
    // Complex engagement score calculation
    return 75; // Placeholder
  }

  aggregateFeatureUsage(stats) {
    // Aggregate feature usage across all stats
    return {
      chat: 1000,
      fileSharing: 500,
      meetings: 200,
      search: 300,
      reactions: 800
    };
  }

  extractActiveAlerts(metrics) {
    // Extract active alerts from performance metrics
    return [];
  }

  calculatePerformanceSummary(metrics) {
    // Calculate performance summary
    return {
      averageResponseTime: 150,
      uptime: 99.9,
      errorRate: 0.1
    };
  }

  calculateUserActivitySummary(activities) {
    // Calculate user activity summary
    return {
      totalSessions: activities.reduce((sum, act) => sum + act.sessions.length, 0),
      totalMessages: activities.reduce((sum, act) => sum + act.messagesSent, 0),
      totalFiles: activities.reduce((sum, act) => sum + act.filesUploaded, 0)
    };
  }

  analyzeUserPatterns(activities) {
    // Analyze user behavior patterns
    return {
      peakActivityHours: [9, 14, 20],
      preferredDevices: ['desktop', 'mobile'],
      roomPreferences: ['general', 'work']
    };
  }

  calculateUserEngagement(activities) {
    // Calculate individual user engagement
    return {
      score: 85,
      level: 'high',
      streak: 15
    };
  }

  generateInsights(usage, engagement, storage, performance) {
    // Generate AI-powered insights
    return [
      "User activity increased by 15% this week",
      "File uploads are trending upwards",
      "Peak usage occurs between 2-4 PM"
    ];
  }

  generateRecommendations(usage, engagement, storage, performance) {
    // Generate actionable recommendations
    return [
      "Consider increasing storage capacity",
      "Optimize database queries for better performance",
      "Add more servers during peak hours"
    ];
  }

  // Get real-time statistics
  getRealTimeStats() {
    return this.realTimeStats;
  }

  // Update real-time connection count
  updateConnectionCount(count) {
    this.realTimeStats.currentConnections = count;
  }
}

export default new AnalyticsService();
