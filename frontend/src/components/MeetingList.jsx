import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiVideo, FiCalendar, FiUsers, FiLock, FiUnlock, FiClock, FiMoreVertical } from 'react-icons/fi';
import './MeetingList.css';

const MeetingList = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, scheduled, started, ended
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    scheduledFor: '',
    duration: 60,
    maxParticipants: 100,
    accessType: 'private',
    password: '',
    allowScreenShare: true,
    allowRecording: false,
    allowChat: true,
    category: 'general'
  });

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${process.env.REACT_APP_API_URL}/api/meetings/my-meetings`;
      
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMeetings(data.data.meetings);
      } else {
        console.error('Failed to fetch meetings');
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newMeeting,
          meetingType: newMeeting.scheduledFor ? 'scheduled' : 'instant'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateModal(false);
        setNewMeeting({
          title: '',
          description: '',
          scheduledFor: '',
          duration: 60,
          maxParticipants: 100,
          accessType: 'private',
          password: '',
          allowScreenShare: true,
          allowRecording: false,
          allowChat: true,
          category: 'general'
        });
        fetchMeetings();
        navigate(`/meeting/${data.data._id}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting');
    }
  };

  const joinMeeting = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/meetings/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          meetingId: joinCode,
          password: joinPassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowJoinModal(false);
        setJoinCode('');
        setJoinPassword('');
        navigate(`/meeting/${data.data.meeting._id}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to join meeting');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      alert('Failed to join meeting');
    }
  };

  const startMeeting = async (meetingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/meetings/${meetingId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchMeetings();
        navigate(`/meeting/${meetingId}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to start meeting');
      }
    } catch (error) {
      console.error('Error starting meeting:', error);
      alert('Failed to start meeting');
    }
  };

  const endMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to end this meeting?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/meetings/${meetingId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchMeetings();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to end meeting');
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
      alert('Failed to end meeting');
    }
  };

  const deleteMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchMeetings();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete meeting');
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      alert('Failed to delete meeting');
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Now';
    const d = new Date(date);
    return d.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'started': return '#28a745';
      case 'scheduled': return '#ffc107';
      case 'ended': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'business': return '#007bff';
      case 'education': return '#28a745';
      case 'personal': return '#ffc107';
      case 'health': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="meeting-list-loading">
        <div className="spinner"></div>
        <p>Loading meetings...</p>
      </div>
    );
  }

  return (
    <div className="meeting-list">
      <div className="meeting-list-header">
        <h1>Meetings</h1>
        <div className="header-actions">
          <button 
            onClick={() => setShowJoinModal(true)}
            className="btn btn-secondary"
          >
            <FiVideo /> Join Meeting
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <FiPlus /> Create Meeting
          </button>
        </div>
      </div>

      <div className="meeting-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Meetings
        </button>
        <button 
          className={`filter-btn ${filter === 'scheduled' ? 'active' : ''}`}
          onClick={() => setFilter('scheduled')}
        >
          Scheduled
        </button>
        <button 
          className={`filter-btn ${filter === 'started' ? 'active' : ''}`}
          onClick={() => setFilter('started')}
        >
          Active
        </button>
        <button 
          className={`filter-btn ${filter === 'ended' ? 'active' : ''}`}
          onClick={() => setFilter('ended')}
        >
          Ended
        </button>
      </div>

      <div className="meetings-grid">
        {meetings.length === 0 ? (
          <div className="no-meetings">
            <FiVideo size={48} />
            <h3>No meetings found</h3>
            <p>Create your first meeting or join an existing one</p>
          </div>
        ) : (
          meetings.map(meeting => (
            <div key={meeting._id} className="meeting-card">
              <div className="meeting-header">
                <div className="meeting-title">{meeting.title}</div>
                <div className="meeting-actions">
                  <button className="action-btn">
                    <FiMoreVertical />
                  </button>
                </div>
              </div>
              
              {meeting.description && (
                <div className="meeting-description">{meeting.description}</div>
              )}
              
              <div className="meeting-meta">
                <div className="meta-item">
                  <FiCalendar />
                  <span>{formatTime(meeting.scheduledFor)}</span>
                </div>
                <div className="meta-item">
                  <FiUsers />
                  <span>{meeting.participants?.length || 0} / {meeting.maxParticipants}</span>
                </div>
                <div className="meta-item">
                  {meeting.accessType === 'private' ? <FiLock /> : <FiUnlock />}
                  <span>{meeting.accessType}</span>
                </div>
                {meeting.duration && (
                  <div className="meta-item">
                    <FiClock />
                    <span>{meeting.duration} min</span>
                  </div>
                )}
              </div>

              <div className="meeting-badges">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(meeting.status) }}
                >
                  {meeting.status}
                </span>
                <span 
                  className="category-badge"
                  style={{ backgroundColor: getCategoryColor(meeting.category) }}
                >
                  {meeting.category}
                </span>
              </div>

              <div className="meeting-footer">
                <div className="meeting-id">ID: {meeting.meetingId}</div>
                <div className="meeting-actions-footer">
                  {meeting.status === 'scheduled' && (
                    <button 
                      onClick={() => startMeeting(meeting._id)}
                      className="btn btn-success btn-sm"
                    >
                      Start
                    </button>
                  )}
                  {meeting.status === 'started' && (
                    <button 
                      onClick={() => navigate(`/meeting/${meeting._id}`)}
                      className="btn btn-primary btn-sm"
                    >
                      Join
                    </button>
                  )}
                  {meeting.status === 'started' && meeting.host._id === localStorage.getItem('userId') && (
                    <button 
                      onClick={() => endMeeting(meeting._id)}
                      className="btn btn-danger btn-sm"
                    >
                      End
                    </button>
                  )}
                  {meeting.status !== 'started' && meeting.host._id === localStorage.getItem('userId') && (
                    <button 
                      onClick={() => deleteMeeting(meeting._id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Meeting</h2>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={createMeeting} className="modal-body">
              <div className="form-group">
                <label>Meeting Title *</label>
                <input
                  type="text"
                  required
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                  placeholder="Enter meeting title"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                  placeholder="Enter meeting description"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Scheduled For</label>
                  <input
                    type="datetime-local"
                    value={newMeeting.scheduledFor}
                    onChange={(e) => setNewMeeting({...newMeeting, scheduledFor: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={newMeeting.duration}
                    onChange={(e) => setNewMeeting({...newMeeting, duration: parseInt(e.target.value)})}
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
                    value={newMeeting.maxParticipants}
                    onChange={(e) => setNewMeeting({...newMeeting, maxParticipants: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Access Type</label>
                  <select
                    value={newMeeting.accessType}
                    onChange={(e) => setNewMeeting({...newMeeting, accessType: e.target.value})}
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
              </div>

              {newMeeting.accessType !== 'public' && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={newMeeting.password}
                    onChange={(e) => setNewMeeting({...newMeeting, password: e.target.value})}
                    placeholder="Optional password"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Category</label>
                <select
                  value={newMeeting.category}
                  onChange={(e) => setNewMeeting({...newMeeting, category: e.target.value})}
                >
                  <option value="general">General</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                </select>
              </div>

              <div className="form-group">
                <label>Features</label>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newMeeting.allowScreenShare}
                      onChange={(e) => setNewMeeting({...newMeeting, allowScreenShare: e.target.checked})}
                    />
                    Allow Screen Sharing
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={newMeeting.allowRecording}
                      onChange={(e) => setNewMeeting({...newMeeting, allowRecording: e.target.checked})}
                    />
                    Allow Recording
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={newMeeting.allowChat}
                      onChange={(e) => setNewMeeting({...newMeeting, allowChat: e.target.checked})}
                    />
                    Allow Chat
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Meeting Modal */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Join Meeting</h2>
              <button onClick={() => setShowJoinModal(false)}>×</button>
            </div>
            <form onSubmit={joinMeeting} className="modal-body">
              <div className="form-group">
                <label>Meeting Code *</label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter meeting code"
                />
              </div>
              
              <div className="form-group">
                <label>Password (if required)</label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Enter meeting password"
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Join Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingList;
