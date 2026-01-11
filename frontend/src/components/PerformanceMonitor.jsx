import React, { useState, useEffect } from 'react';
import { FaServer, FaMemory, FaNetworkWired, FaDatabase, FaExclamationTriangle } from 'react-icons/fa';
import analyticsService from '../services/analyticsService.js';

const PerformanceMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('hour');
  const [performanceData, setPerformanceData] = useState({
    current: {},
    historical: [],
    alerts: [],
    summary: {}
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadPerformanceData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadPerformanceData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [period, autoRefresh]);

  const loadPerformanceData = async () => {
    try {
      const data = await analyticsService.getPerformanceMetrics(period, 100);
      setPerformanceData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading performance data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (value, type) => {
    switch (type) {
      case 'cpu':
        if (value > 80) return '#dc3545'; // red
        if (value > 60) return '#ffc107'; // yellow
        return '#28a745'; // green
      case 'memory':
        if (value > 90) return '#dc3545';
        if (value > 70) return '#ffc107';
        return '#28a745';
      case 'responseTime':
        if (value > 1000) return '#dc3545';
        if (value > 500) return '#ffc107';
        return '#28a745';
      case 'uptime':
        if (value < 95) return '#dc3545';
        if (value < 99) return '#ffc107';
        return '#28a745';
      default:
        return '#28a745';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="performance-monitor loading">
        <div className="loading-spinner"></div>
        <p>Loading performance data...</p>
      </div>
    );
  }

  const current = performanceData.current || {};

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h2><FaServer /> Performance Monitor</h2>
        
        <div className="monitor-controls">
          <div className="period-selector">
            <label>Period:</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="minute">Minute</option>
              <option value="hour">Hour</option>
              <option value="day">Day</option>
            </select>
          </div>
          
          <div className="auto-refresh-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto Refresh
            </label>
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="real-time-metrics">
        <h3>Real-time Metrics</h3>
        <div className="metrics-grid">
          {/* CPU Usage */}
          <div className="metric-card">
            <div className="metric-header">
              <FaServer className="metric-icon" />
              <h4>CPU Usage</h4>
            </div>
            <div className="metric-value">
              <span 
                style={{ color: getStatusColor(current.cpu?.usage || 0, 'cpu') }}
              >
                {current.cpu?.usage || 0}%
              </span>
            </div>
            <div className="metric-details">
              <div className="detail-item">
                <span>Load Average:</span>
                <span>{current.cpu?.loadAverage?.[0] || 0}</span>
              </div>
              <div className="detail-item">
                <span>Cores:</span>
                <span>{current.cpu?.cores || 0}</span>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="metric-card">
            <div className="metric-header">
              <FaMemory className="metric-icon" />
              <h4>Memory Usage</h4>
            </div>
            <div className="metric-value">
              <span 
                style={{ color: getStatusColor(current.memory?.usagePercentage || 0, 'memory') }}
              >
                {current.memory?.usagePercentage || 0}%
              </span>
            </div>
            <div className="metric-details">
              <div className="detail-item">
                <span>Used:</span>
                <span>{formatBytes(current.memory?.used || 0)}</span>
              </div>
              <div className="detail-item">
                <span>Total:</span>
                <span>{formatBytes(current.memory?.total || 0)}</span>
              </div>
            </div>
            <div className="memory-bar">
              <div 
                className="memory-fill" 
                style={{ 
                  width: `${current.memory?.usagePercentage || 0}%`,
                  backgroundColor: getStatusColor(current.memory?.usagePercentage || 0, 'memory')
                }}
              />
            </div>
          </div>

          {/* Network Performance */}
          <div className="metric-card">
            <div className="metric-header">
              <FaNetworkWired className="metric-icon" />
              <h4>Network</h4>
            </div>
            <div className="metric-value">
              <span 
                style={{ color: getStatusColor(current.network?.responseTime || 0, 'responseTime') }}
              >
                {current.network?.responseTime || 0}ms
              </span>
            </div>
            <div className="metric-details">
              <div className="detail-item">
                <span>Requests/s:</span>
                <span>{current.network?.throughput || 0}</span>
              </div>
              <div className="detail-item">
                <span>Error Rate:</span>
                <span>{current.network?.errorRate || 0}%</span>
              </div>
            </div>
          </div>

          {/* Database Performance */}
          <div className="metric-card">
            <div className="metric-header">
              <FaDatabase className="metric-icon" />
              <h4>Database</h4>
            </div>
            <div className="metric-value">
              <span>{current.database?.queryTime || 0}ms</span>
            </div>
            <div className="metric-details">
              <div className="detail-item">
                <span>Connections:</span>
                <span>{current.database?.connections || 0}</span>
              </div>
              <div className="detail-item">
                <span>Active:</span>
                <span>{current.database?.activeConnections || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Metrics */}
      <div className="application-metrics">
        <h3>Application Metrics</h3>
        <div className="app-metrics-grid">
          <div className="app-metric">
            <h4>Active Users</h4>
            <div className="metric-value">{current.application?.activeUsers || 0}</div>
          </div>
          <div className="app-metric">
            <h4>Active Rooms</h4>
            <div className="metric-value">{current.application?.activeRooms || 0}</div>
          </div>
          <div className="app-metric">
            <h4>Messages/sec</h4>
            <div className="metric-value">{current.application?.messagesPerSecond || 0}</div>
          </div>
          <div className="app-metric">
            <h4>Socket Connections</h4>
            <div className="metric-value">{current.sockets?.connected || 0}</div>
          </div>
        </div>
      </div>

      {/* Performance Alerts */}
      <div className="performance-alerts">
        <h3><FaExclamationTriangle /> Active Alerts</h3>
        {performanceData.alerts?.length > 0 ? (
          <div className="alerts-list">
            {performanceData.alerts.map((alert, index) => (
              <div 
                key={index} 
                className="alert-item"
                style={{ borderLeftColor: getAlertSeverityColor(alert.severity) }}
              >
                <div className="alert-header">
                  <span 
                    className="alert-severity"
                    style={{ color: getAlertSeverityColor(alert.severity) }}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="alert-time">
                    {new Date(alert.triggeredAt).toLocaleString()}
                  </span>
                </div>
                <div className="alert-message">{alert.message}</div>
                {alert.resolvedAt && (
                  <div className="alert-resolved">
                    Resolved: {new Date(alert.resolvedAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-alerts">
            <FaExclamationTriangle />
            <p>No active alerts</p>
          </div>
        )}
      </div>

      {/* Historical Performance */}
      <div className="historical-performance">
        <h3>Historical Performance</h3>
        <div className="performance-chart">
          <div className="chart-placeholder">
            <p>📈 Performance trend chart would be displayed here</p>
            <p>Showing {performanceData.historical?.length || 0} data points</p>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="performance-summary">
        <h3>Performance Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span>Average Response Time</span>
            <span>{performanceData.summary?.averageResponseTime || 0}ms</span>
          </div>
          <div className="summary-item">
            <span>Server Uptime</span>
            <span 
              style={{ color: getStatusColor(performanceData.summary?.uptime || 0, 'uptime') }}
            >
              {performanceData.summary?.uptime || 0}%
            </span>
          </div>
          <div className="summary-item">
            <span>Error Rate</span>
            <span>{performanceData.summary?.errorRate || 0}%</span>
          </div>
          <div className="summary-item">
            <span>Cache Hit Rate</span>
            <span>{current.cache?.hitRate || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
