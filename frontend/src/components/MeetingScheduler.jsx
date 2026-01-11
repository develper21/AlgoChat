import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiUsers, FiRepeat, FiPlus, FiEdit2, FiTrash2, FiVideo } from 'react-icons/fi';
import './MeetingScheduler.css';

const MeetingScheduler = ({
  meetings,
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  currentUser
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [view, setView] = useState('list'); // list, calendar, week
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledFor: '',
    duration: 60,
    maxParticipants: 100,
    accessType: 'private',
    password: '',
    category: 'general',
    tags: [],
    isRecurring: false,
    recurringPattern: {
      type: 'weekly',
      interval: 1,
      endDate: ''
    },
    settings: {
      allowScreenShare: true,
      allowRecording: false,
      allowChat: true,
      waitingRoom: false,
      muteParticipantsOnEntry: false,
      videoOffOnEntry: false
    }
  });

  const categories = [
    { value: 'general', label: 'General', color: '#6c757d' },
    { value: 'business', label: 'Business', color: '#007bff' },
    { value: 'education', label: 'Education', color: '#28a745' },
    { value: 'personal', label: 'Personal', color: '#ffc107' },
    { value: 'health', label: 'Health', color: '#dc3545' }
  ];

  useEffect(() => {
    if (editingMeeting) {
      setFormData({
        title: editingMeeting.title || '',
        description: editingMeeting.description || '',
        scheduledFor: editingMeeting.scheduledFor ? 
          new Date(editingMeeting.scheduledFor).toISOString().slice(0, 16) : '',
        duration: editingMeeting.duration || 60,
        maxParticipants: editingMeeting.maxParticipants || 100,
        accessType: editingMeeting.accessType || 'private',
        password: editingMeeting.password || '',
        category: editingMeeting.category || 'general',
        tags: editingMeeting.tags || [],
        isRecurring: editingMeeting.isRecurring || false,
        recurringPattern: editingMeeting.recurringPattern || {
          type: 'weekly',
          interval: 1,
          endDate: ''
        },
        settings: {
          allowScreenShare: editingMeeting.allowScreenShare !== false,
          allowRecording: editingMeeting.allowRecording || false,
          allowChat: editingMeeting.allowChat !== false,
          waitingRoom: editingMeeting.waitingRoom || false,
          muteParticipantsOnEntry: editingMeeting.muteParticipantsOnEntry || false,
          videoOffOnEntry: editingMeeting.videoOffOnEntry || false
        }
      });
      setShowCreateForm(true);
    }
  }, [editingMeeting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const meetingData = {
        ...formData,
        scheduledFor: formData.scheduledFor ? new Date(formData.scheduledFor) : null,
        meetingType: formData.scheduledFor ? 'scheduled' : 'instant'
      };

      if (editingMeeting) {
        await onUpdateMeeting(editingMeeting._id, meetingData);
        setEditingMeeting(null);
      } else {
        await onCreateMeeting(meetingData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving meeting:', error);
      alert('Failed to save meeting');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduledFor: '',
      duration: 60,
      maxParticipants: 100,
      accessType: 'private',
      password: '',
      category: 'general',
      tags: [],
      isRecurring: false,
      recurringPattern: {
        type: 'weekly',
        interval: 1,
        endDate: ''
      },
      settings: {
        allowScreenShare: true,
        allowRecording: false,
        allowChat: true,
        waitingRoom: false,
        muteParticipantsOnEntry: false,
        videoOffOnEntry: false
      }
    });
    setShowCreateForm(false);
    setEditingMeeting(null);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : '#6c757d';
  };

  const getUpcomingMeetings = () => {
    const now = new Date();
    return meetings.filter(meeting => 
      meeting.status === 'scheduled' && 
      new Date(meeting.scheduledFor) > now
    ).sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  };

  const getTodayMeetings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduledFor);
      return meetingDate >= today && meetingDate < tomorrow;
    });
  };

  const getWeekMeetings = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduledFor);
      return meetingDate >= weekStart && meetingDate < weekEnd;
    });
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
  };

  const handleDelete = async (meetingId) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      try {
        await onDeleteMeeting(meetingId);
      } catch (error) {
        console.error('Error deleting meeting:', error);
        alert('Failed to delete meeting');
      }
    }
  };

  const upcomingMeetings = getUpcomingMeetings();
  const todayMeetings = getTodayMeetings();
  const weekMeetings = getWeekMeetings();

  return (
    <div className="meeting-scheduler">
      <div className="scheduler-header">
        <h2>Meeting Scheduler</h2>
        <div className="header-actions">
          <div className="view-switcher">
            <button
              className={`view-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              List
            </button>
            <button
              className={`view-btn ${view === 'today' ? 'active' : ''}`}
              onClick={() => setView('today')}
            >
              Today
            </button>
            <button
              className={`view-btn ${view === 'week' ? 'active' : ''}`}
              onClick={() => setView('week')}
            >
              Week
            </button>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="create-meeting-btn"
          >
            <FiPlus /> Schedule Meeting
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="meeting-form-overlay">
          <div className="meeting-form">
            <div className="form-header">
              <h3>{editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}</h3>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Meeting Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter meeting title"
                  />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter meeting description"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData({...formData, scheduledFor: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Participants</label>
                  <input
                    type="number"
                    min="2"
                    max="1000"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Access Type</label>
                  <select
                    value={formData.accessType}
                    onChange={(e) => setFormData({...formData, accessType: e.target.value})}
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
              </div>

              {formData.accessType !== 'public' && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Optional password"
                  />
                </div>
              )}

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                  />
                  Recurring Meeting
                </label>
              </div>

              {formData.isRecurring && (
                <div className="recurring-options">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Repeat</label>
                      <select
                        value={formData.recurringPattern.type}
                        onChange={(e) => setFormData({
                          ...formData,
                          recurringPattern: {
                            ...formData.recurringPattern,
                            type: e.target.value
                          }
                        })}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Every</label>
                      <input
                        type="number"
                        min="1"
                        max={formData.recurringPattern.type === 'monthly' ? 12 : 52}
                        value={formData.recurringPattern.interval}
                        onChange={(e) => setFormData({
                          ...formData,
                          recurringPattern: {
                            ...formData.recurringPattern,
                            interval: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={formData.recurringPattern.endDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurringPattern: {
                          ...formData.recurringPattern,
                          endDate: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Meeting Settings</label>
                <div className="settings-grid">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.settings.allowScreenShare}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          allowScreenShare: e.target.checked
                        }
                      })}
                    />
                    Allow Screen Sharing
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.settings.allowRecording}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          allowRecording: e.target.checked
                        }
                      })}
                    />
                    Allow Recording
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.settings.allowChat}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          allowChat: e.target.checked
                        }
                      })}
                    />
                    Allow Chat
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.settings.waitingRoom}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          waitingRoom: e.target.checked
                        }
                      })}
                    />
                    Waiting Room
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.settings.muteParticipantsOnEntry}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          muteParticipantsOnEntry: e.target.checked
                        }
                      })}
                    />
                    Mute on Entry
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.settings.videoOffOnEntry}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          videoOffOnEntry: e.target.checked
                        }
                      })}
                    />
                    Video Off on Entry
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="scheduler-content">
        {view === 'list' && (
          <div className="meetings-list">
            <div className="section">
              <h3>Upcoming Meetings</h3>
              {upcomingMeetings.length === 0 ? (
                <p className="no-meetings">No upcoming meetings scheduled</p>
              ) : (
                <div className="meetings-grid">
                  {upcomingMeetings.map(meeting => (
                    <MeetingCard
                      key={meeting._id}
                      meeting={meeting}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      getCategoryColor={getCategoryColor}
                      formatDateTime={formatDateTime}
                      formatDuration={formatDuration}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'today' && (
          <div className="meetings-list">
            <div className="section">
              <h3>Today's Meetings</h3>
              {todayMeetings.length === 0 ? (
                <p className="no-meetings">No meetings scheduled for today</p>
              ) : (
                <div className="meetings-grid">
                  {todayMeetings.map(meeting => (
                    <MeetingCard
                      key={meeting._id}
                      meeting={meeting}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      getCategoryColor={getCategoryColor}
                      formatDateTime={formatDateTime}
                      formatDuration={formatDuration}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="meetings-list">
            <div className="section">
              <h3>This Week's Meetings</h3>
              {weekMeetings.length === 0 ? (
                <p className="no-meetings">No meetings scheduled for this week</p>
              ) : (
                <div className="meetings-grid">
                  {weekMeetings.map(meeting => (
                    <MeetingCard
                      key={meeting._id}
                      meeting={meeting}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      getCategoryColor={getCategoryColor}
                      formatDateTime={formatDateTime}
                      formatDuration={formatDuration}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MeetingCard = ({ meeting, onEdit, onDelete, getCategoryColor, formatDateTime, formatDuration, currentUser }) => {
  const isHost = meeting.host._id === currentUser._id;
  
  return (
    <div className="meeting-card">
      <div className="card-header">
        <div className="meeting-title">{meeting.title}</div>
        <div 
          className="category-indicator"
          style={{ backgroundColor: getCategoryColor(meeting.category) }}
        ></div>
      </div>
      
      {meeting.description && (
        <div className="meeting-description">{meeting.description}</div>
      )}
      
      <div className="meeting-details">
        <div className="detail-item">
          <FiCalendar />
          <span>{formatDateTime(meeting.scheduledFor)}</span>
        </div>
        <div className="detail-item">
          <FiClock />
          <span>{formatDuration(meeting.duration)}</span>
        </div>
        <div className="detail-item">
          <FiUsers />
          <span>{meeting.participants?.length || 0} / {meeting.maxParticipants}</span>
        </div>
        {meeting.isRecurring && (
          <div className="detail-item">
            <FiRepeat />
            <span>Recurring</span>
          </div>
        )}
      </div>

      <div className="meeting-status">
        <span className={`status-badge ${meeting.status}`}>
          {meeting.status}
        </span>
      </div>

      {isHost && (
        <div className="card-actions">
          <button onClick={() => onEdit(meeting)} className="action-btn edit-btn">
            <FiEdit2 />
          </button>
          <button onClick={() => onDelete(meeting._id)} className="action-btn delete-btn">
            <FiTrash2 />
          </button>
        </div>
      )}
    </div>
  );
};

export default MeetingScheduler;
