import React, { useState, useEffect } from 'react';
import { FaUser, FaChartLine, FaClock, FaFile, FaComments } from 'react-icons/fa';
import analyticsService from '../services/analyticsService.js';

const UserActivityReport = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [activityData, setActivityData] = useState({
    activities: [],
    summary: {},
    patterns: {},
    engagement: {}
  });

  useEffect(() => {
    loadActivityData();
  }, [userId, period]);

  const loadActivityData = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getUserActivityReports(userId, period);
      setActivityData(data);
    } catch (error) {
      console.error('Error loading user activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="user-activity-report loading">
        <div className="loading-spinner"></div>
        <p>Loading activity data...</p>
      </div>
    );
  }

  return (
    <div className="user-activity-report">
      <div className="report-header">
        <h2><FaUser /> User Activity Report</h2>
        
        <div className="report-controls">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="period-selector"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-header">
            <FaComments className="card-icon" />
            <h3>Messages</h3>
          </div>
          <div className="card-value">{activityData.summary?.totalMessages || 0}</div>
          <div className="card-subtitle">Sent</div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <FaFile className="card-icon" />
            <h3>Files</h3>
          </div>
          <div className="card-value">{activityData.summary?.totalFiles || 0}</div>
          <div className="card-subtitle">Uploaded</div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <FaClock className="card-icon" />
            <h3>Session Time</h3>
          </div>
          <div className="card-value">{formatDuration(activityData.summary?.totalSessions || 0)}</div>
          <div className="card-subtitle">Total</div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <FaChartLine className="card-icon" />
            <h3>Engagement</h3>
          </div>
          <div className="card-value">{activityData.engagement?.score || 0}</div>
          <div className="card-subtitle">Score</div>
        </div>
      </div>

      {/* Activity Patterns */}
      <div className="activity-patterns">
        <h3>Activity Patterns</h3>
        <div className="patterns-grid">
          <div className="pattern-item">
            <h4>Peak Activity Hours</h4>
            <div className="peak-hours">
              {activityData.patterns?.peakActivityHours?.map(hour => (
                <span key={hour} className="hour-tag">{hour}:00</span>
              ))}
            </div>
          </div>

          <div className="pattern-item">
            <h4>Preferred Devices</h4>
            <div className="devices-list">
              {activityData.patterns?.preferredDevices?.map(device => (
                <span key={device} className="device-tag">{device}</span>
              ))}
            </div>
          </div>

          <div className="pattern-item">
            <h4>Room Preferences</h4>
            <div className="rooms-list">
              {activityData.patterns?.roomPreferences?.map(room => (
                <span key={room} className="room-tag">{room}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Activity */}
      <div className="daily-activity">
        <h3>Daily Activity</h3>
        <div className="activity-list">
          {activityData.activities?.slice(0, 10).map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-date">
                {formatDate(activity.date)}
              </div>
              
              <div className="activity-stats">
                <div className="stat">
                  <span className="stat-label">Messages</span>
                  <span className="stat-value">{activity.messagesSent}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Files</span>
                  <span className="stat-value">{activity.filesUploaded}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Sessions</span>
                  <span className="stat-value">{activity.sessions?.length || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Active Time</span>
                  <span className="stat-value">{formatDuration(activity.totalTimeActive)}</span>
                </div>
              </div>

              <div className="activity-engagement">
                <div className="engagement-score">
                  <span>Engagement</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${activity.engagementScore || 0}%` }}
                    />
                  </div>
                  <span className="score-value">{activity.engagementScore || 0}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Room Visits */}
      <div className="room-visits">
        <h3>Room Activity</h3>
        <div className="rooms-grid">
          {activityData.activities?.slice(0, 5).map((activity) => 
            activity.roomsVisited?.map((room) => (
              <div key={`${activity.date}-${room._id}`} className="room-visit">
                <div className="room-info">
                  <h4>{room.name}</h4>
                  <span className="room-type">{room.type}</span>
                </div>
                <div className="visit-date">{formatDate(activity.date)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserActivityReport;
