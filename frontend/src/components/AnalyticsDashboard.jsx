import React, { useState, useEffect } from 'react';
import { FaChartLine, FaUsers, FaDatabase, FaServer, FaDownload, FaCalendar } from 'react-icons/fa';
import analyticsService from '../services/analyticsService.js';

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    usage: {},
    engagement: {},
    storage: {},
    performance: {},
    realTime: {}
  });
  const [dateRange, setDateRange] = useState({
    period: 'daily',
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadRealTimeData, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [usage, engagement, storage, performance, realTime] = await Promise.all([
        analyticsService.getUsageAnalytics(dateRange.period, dateRange.startDate, dateRange.endDate),
        analyticsService.getEngagementMetrics(dateRange.period, dateRange.startDate, dateRange.endDate),
        analyticsService.getStorageUsage(),
        analyticsService.getPerformanceMetrics('hour', 24),
        analyticsService.getRealTimeStats()
      ]);

      setData({ usage, engagement, storage, performance, realTime });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeData = async () => {
    try {
      const realTime = await analyticsService.getRealTimeStats();
      setData(prev => ({ ...prev, realTime }));
    } catch (error) {
      console.error('Error loading real-time data:', error);
    }
  };

  const handleExport = async (format) => {
    try {
      const exportData = await analyticsService.exportAnalytics(dateRange.period, format);
      if (exportData) {
        // Handle download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${dateRange.period}-${Date.now()}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1><FaChartLine /> Analytics Dashboard</h1>
        
        <div className="dashboard-controls">
          <div className="date-range-selector">
            <FaCalendar />
            <select 
              value={dateRange.period} 
              onChange={(e) => setDateRange(prev => ({ ...prev, period: e.target.value }))}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div className="export-controls">
            <button onClick={() => handleExport('json')} className="export-btn">
              <FaDownload /> Export JSON
            </button>
            <button onClick={() => handleExport('csv')} className="export-btn">
              <FaDownload /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'usage' ? 'active' : ''}`}
          onClick={() => setActiveTab('usage')}
        >
          <FaUsers /> Usage
        </button>
        <button 
          className={`tab-btn ${activeTab === 'engagement' ? 'active' : ''}`}
          onClick={() => setActiveTab('engagement')}
        >
          Engagement
        </button>
        <button 
          className={`tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          <FaDatabase /> Storage
        </button>
        <button 
          className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <FaServer /> Performance
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab data={data} realTime={data.realTime} formatNumber={formatNumber} />
        )}
        
        {activeTab === 'usage' && (
          <UsageTab data={data.usage} formatNumber={formatNumber} />
        )}
        
        {activeTab === 'engagement' && (
          <EngagementTab data={data.engagement} formatNumber={formatNumber} />
        )}
        
        {activeTab === 'storage' && (
          <StorageTab data={data.storage} formatBytes={formatBytes} />
        )}
        
        {activeTab === 'performance' && (
          <PerformanceTab data={data.performance} />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ data, realTime, formatNumber }) => (
  <div className="overview-tab">
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-header">
          <h3>Active Users</h3>
          <FaUsers className="metric-icon" />
        </div>
        <div className="metric-value">{formatNumber(realTime.activeUsers)}</div>
        <div className="metric-change positive">+12% from last period</div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <h3>Messages Today</h3>
          <FaChartLine className="metric-icon" />
        </div>
        <div className="metric-value">{formatNumber(data.usage.summary?.totalMessages || 0)}</div>
        <div className="metric-change positive">+8% from yesterday</div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <h3>Storage Used</h3>
          <FaDatabase className="metric-icon" />
        </div>
        <div className="metric-value">{data.storage.total ? formatBytes(data.storage.total) : '0 B'}</div>
        <div className="metric-change neutral">Stable</div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <h3>Server Uptime</h3>
          <FaServer className="metric-icon" />
        </div>
        <div className="metric-value">{data.performance.summary?.uptime || '99.9'}%</div>
        <div className="metric-change positive">Excellent</div>
      </div>
    </div>

    <div className="charts-section">
      <div className="chart-container">
        <h3>User Activity Trend</h3>
        <div className="chart-placeholder">
          {/* Chart implementation would go here */}
          <p>📊 User activity chart</p>
        </div>
      </div>

      <div className="chart-container">
        <h3>Feature Usage</h3>
        <div className="feature-usage">
          {Object.entries(data.engagement.featureUsage || {}).map(([feature, count]) => (
            <div key={feature} className="feature-stat">
              <span className="feature-name">{feature}</span>
              <span className="feature-count">{formatNumber(count)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Usage Tab Component
const UsageTab = ({ data, formatNumber }) => (
  <div className="usage-tab">
    <div className="usage-stats">
      <div className="stat-group">
        <h3>User Statistics</h3>
        <div className="stat-item">
          <span>Total Active Users</span>
          <span>{formatNumber(data.summary?.totalActiveUsers || 0)}</span>
        </div>
        <div className="stat-item">
          <span>New Users</span>
          <span>{formatNumber(data.summary?.totalMessages || 0)}</span>
        </div>
        <div className="stat-item">
          <span>Average Messages/Day</span>
          <span>{formatNumber(data.summary?.averageMessagesPerDay || 0)}</span>
        </div>
      </div>

      <div className="stat-group">
        <h3>Message Statistics</h3>
        <div className="stat-item">
          <span>Total Messages</span>
          <span>{formatNumber(data.summary?.totalMessages || 0)}</span>
        </div>
        <div className="stat-item">
          <span>Text Messages</span>
          <span>{formatNumber(data.summary?.totalMessages || 0)}</span>
        </div>
        <div className="stat-item">
          <span>File Messages</span>
          <span>{formatNumber(data.summary?.totalFiles || 0)}</span>
        </div>
      </div>
    </div>

    <div className="usage-chart">
      <h3>Usage Over Time</h3>
      <div className="chart-placeholder">
        <p>📈 Usage trend chart</p>
      </div>
    </div>
  </div>
);

// Engagement Tab Component
const EngagementTab = ({ data, formatNumber }) => (
  <div className="engagement-tab">
    <div className="engagement-metrics">
      <div className="metric-card">
        <h3>Average Session Duration</h3>
        <div className="metric-value">{data.engagement?.averageSessionDuration || 0} min</div>
      </div>

      <div className="metric-card">
        <h3>Bounce Rate</h3>
        <div className="metric-value">{data.engagement?.bounceRate || 0}%</div>
      </div>

      <div className="metric-card">
        <h3>Retention Rate</h3>
        <div className="metric-value">{data.engagement?.retentionRate || 0}%</div>
      </div>

      <div className="metric-card">
        <h3>Engagement Score</h3>
        <div className="metric-value">{data.engagement?.engagementScore || 0}/100</div>
      </div>
    </div>

    <div className="user-activity">
      <h3>User Activity</h3>
      <div className="activity-stats">
        <div className="activity-item">
          <span>Active Users</span>
          <span>{formatNumber(data.userActivity?.activeUsers || 0)}</span>
        </div>
        <div className="activity-item">
          <span>New Users</span>
          <span>{formatNumber(data.userActivity?.newUsers || 0)}</span>
        </div>
        <div className="activity-item">
          <span>Returning Users</span>
          <span>{formatNumber(data.userActivity?.returningUsers || 0)}</span>
        </div>
      </div>
    </div>
  </div>
);

// Storage Tab Component
const StorageTab = ({ data, formatBytes }) => (
  <div className="storage-tab">
    <div className="storage-overview">
      <div className="storage-total">
        <h3>Total Storage Used</h3>
        <div className="storage-value">{formatBytes(data.total || 0)}</div>
      </div>

      <div className="storage-breakdown">
        <h3>Storage by Type</h3>
        {Object.entries(data.byType || {}).map(([type, size]) => (
          <div key={type} className="storage-type">
            <span className="type-name">{type}</span>
            <span className="type-size">{formatBytes(size)}</span>
            <div className="type-bar">
              <div 
                className="type-fill" 
                style={{ width: `${(size / data.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="storage-projections">
      <h3>Storage Projections</h3>
      <div className="projection-item">
        <span>Next Month</span>
        <span>{formatBytes(data.projections?.nextMonth || 0)}</span>
      </div>
      <div className="projection-item">
        <span>Next Quarter</span>
        <span>{formatBytes(data.projections?.nextQuarter || 0)}</span>
      </div>
      <div className="projection-item">
        <span>Next Year</span>
        <span>{formatBytes(data.projections?.nextYear || 0)}</span>
      </div>
    </div>
  </div>
);

// Performance Tab Component
const PerformanceTab = ({ data }) => (
  <div className="performance-tab">
    <div className="performance-overview">
      <div className="metric-card">
        <h3>Average Response Time</h3>
        <div className="metric-value">{data.summary?.averageResponseTime || 0}ms</div>
      </div>

      <div className="metric-card">
        <h3>Server Uptime</h3>
        <div className="metric-value">{data.summary?.uptime || 0}%</div>
      </div>

      <div className="metric-card">
        <h3>Error Rate</h3>
        <div className="metric-value">{data.summary?.errorRate || 0}%</div>
      </div>

      <div className="metric-card">
        <h3>Active Connections</h3>
        <div className="metric-value">{data.current?.sockets?.connected || 0}</div>
      </div>
    </div>

    <div className="performance-alerts">
      <h3>Active Alerts</h3>
      {data.alerts?.length > 0 ? (
        data.alerts.map((alert, index) => (
          <div key={index} className={`alert ${alert.severity}`}>
            <span className="alert-message">{alert.message}</span>
            <span className="alert-time">{new Date(alert.triggeredAt).toLocaleString()}</span>
          </div>
        ))
      ) : (
        <p>No active alerts</p>
      )}
    </div>
  </div>
);

export default AnalyticsDashboard;
