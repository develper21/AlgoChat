import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AnalyticsService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth interceptor
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('algonive_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Track custom events
  async trackEvent(eventData) {
    try {
      const response = await this.api.post('/analytics/events', eventData);
      return response.data;
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  // Get usage analytics
  async getUsageAnalytics(period = 'daily', startDate, endDate) {
    try {
      const params = new URLSearchParams({ period });
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await this.api.get(`/analytics/usage?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting usage analytics:', error);
      return { stats: [], summary: {}, trends: {} };
    }
  }

  // Get engagement metrics
  async getEngagementMetrics(period = 'daily', startDate, endDate) {
    try {
      const params = new URLSearchParams({ period });
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await this.api.get(`/analytics/engagement?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      return { engagement: {}, userActivity: {}, featureUsage: {} };
    }
  }

  // Get storage usage
  async getStorageUsage() {
    try {
      const response = await this.api.get('/analytics/storage');
      return response.data.data;
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return { total: 0, byType: {}, growth: [], distribution: [] };
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(period = 'hour', limit = 100) {
    try {
      const response = await this.api.get(`/analytics/performance?period=${period}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return { current: {}, historical: [], alerts: [], summary: {} };
    }
  }

  // Get user activity reports
  async getUserActivityReports(userId, period = 'daily', startDate, endDate) {
    try {
      const params = new URLSearchParams({ period });
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await this.api.get(`/analytics/users/${userId}/activity?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting user activity reports:', error);
      return { activities: [], summary: {}, patterns: {}, engagement: {} };
    }
  }

  // Get comprehensive analytics report
  async getAnalyticsReport(period = 'monthly', startDate, endDate) {
    try {
      const params = new URLSearchParams({ period });
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await this.api.get(`/analytics/report?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting analytics report:', error);
      return { error: 'Failed to generate report' };
    }
  }

  // Get real-time statistics
  async getRealTimeStats() {
    try {
      const response = await this.api.get('/analytics/realtime');
      return response.data.data;
    } catch (error) {
      console.error('Error getting real-time stats:', error);
      return { activeUsers: 0, activeRooms: 0, messagesPerSecond: 0, currentConnections: 0 };
    }
  }

  // Get top users by activity
  async getTopUsers(period = 'daily', limit = 10) {
    try {
      const response = await this.api.get(`/analytics/users/top?period=${period}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting top users:', error);
      return [];
    }
  }

  // Get room analytics
  async getRoomAnalytics(roomId, period = 'daily', startDate, endDate) {
    try {
      const params = new URLSearchParams({ period });
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await this.api.get(`/analytics/rooms/${roomId}/analytics?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting room analytics:', error);
      return [];
    }
  }

  // Export analytics data
  async exportAnalytics(period = 'daily', format = 'json') {
    try {
      const response = await this.api.get(`/analytics/export?period=${period}&format=${format}`);
      return response.data;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      return null;
    }
  }

  // Helper method to track page views
  async trackPageView(page, metadata = {}) {
    return this.trackEvent({
      eventType: 'page_view',
      userId: localStorage.getItem('algonive_user') ? JSON.parse(localStorage.getItem('algonive_user'))?._id : 'anonymous',
      sessionId: sessionStorage.getItem('sessionId') || 'unknown',
      metadata: { page, ...metadata },
      userAgent: navigator.userAgent,
      device: this.getDeviceInfo()
    });
  }

  // Helper method to track feature usage
  async trackFeatureUsage(feature, metadata = {}) {
    return this.trackEvent({
      eventType: 'feature_used',
      userId: localStorage.getItem('algonive_user') ? JSON.parse(localStorage.getItem('algonive_user'))?._id : 'anonymous',
      sessionId: sessionStorage.getItem('sessionId') || 'unknown',
      metadata: { feature, ...metadata },
      userAgent: navigator.userAgent,
      device: this.getDeviceInfo()
    });
  }

  // Get device information
  getDeviceInfo() {
    const userAgent = navigator.userAgent;
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
}

export default new AnalyticsService();
