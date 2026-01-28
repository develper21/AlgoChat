import React, { useState, useEffect } from 'react';
import { FiUsers, FiSettings, FiActivity, FiShield, FiDatabase, FiTrendingUp, FiCalendar, FiMessageSquare, FiVideo, FiEye, FiEdit, FiTrash2, FiPlus, FiSearch, FiFilter, FiDownload, FiUpload, FiLock, FiUnlock, FiUserCheck, FiUserX } from 'react-icons/fi';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'roles') {
      fetchRoles();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('algonive_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('algonive_token');
      const params = new URLSearchParams({
        search: searchTerm,
        ...filters
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('algonive_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.data.roles);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('algonive_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/audit`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action, userId, userData = {}) => {
    try {
      const token = localStorage.getItem('algonive_token');
      let url = `${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`;
      let method = 'PUT';

      if (action === 'delete') {
        method = 'DELETE';
      } else if (action === 'suspend') {
        userData.isSuspended = true;
      } else if (action === 'unsuspend') {
        userData.isSuspended = false;
      } else if (action === 'activate') {
        userData.isActive = true;
      } else if (action === 'deactivate') {
        userData.isActive = false;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: method !== 'DELETE' ? JSON.stringify(userData) : undefined
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const renderDashboard = () => {
    if (!dashboardData) {
      return <div className="loading">Loading dashboard...</div>;
    }

    const { users, meetings, messages, rooms, roles, departments, recentActivity, securityEvents } = dashboardData;

    return (
      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon users">
              <FiUsers />
            </div>
            <div className="stat-info">
              <h3>{users.total}</h3>
              <p>Total Users</p>
              <span className="stat-change">+{users.new30Days} this month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon meetings">
              <FiVideo />
            </div>
            <div className="stat-info">
              <h3>{meetings.total}</h3>
              <p>Total Meetings</p>
              <span className="stat-change">{meetings.active} active</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon messages">
              <FiMessageSquare />
            </div>
            <div className="stat-info">
              <h3>{messages.total.toLocaleString()}</h3>
              <p>Total Messages</p>
              <span className="stat-change">+{messages.total7Days} this week</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon rooms">
              <FiDatabase />
            </div>
            <div className="stat-info">
              <h3>{rooms.total}</h3>
              <p>Total Rooms</p>
              <span className="stat-change">{rooms.active} active</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>User Activity</h3>
            <div className="activity-chart">
              {/* Simple activity visualization */}
              {users.growth?.map((day, index) => (
                <div key={index} className="activity-bar">
                  <div className="bar" style={{ height: `${(day.count / 10) * 100}%` }}></div>
                  <span className="day-label">{day._id}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Department Distribution</h3>
            <div className="department-list">
              {departments?.map((dept, index) => (
                <div key={index} className="department-item">
                  <span>{dept._id}</span>
                  <div className="dept-bar">
                    <div className="bar-fill" style={{ width: `${(dept.count / users.total) * 100}%` }}></div>
                    <span>{dept.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {recentActivity?.slice(0, 5).map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-user">
                    <img src={activity.user?.avatar || '/default-avatar.png'} alt="" />
                    <span>{activity.user?.name}</span>
                  </div>
                  <div className="activity-details">
                    <span className="activity-action">{activity.action}</span>
                    <span className="activity-resource">{activity.resource}</span>
                    <span className="activity-time">{new Date(activity.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Security Events</h3>
            <div className="security-events">
              {securityEvents?.slice(0, 5).map((event, index) => (
                <div key={index} className={`security-event ${event.status}`}>
                  <div className="event-icon">
                    <FiShield />
                  </div>
                  <div className="event-details">
                    <span className="event-action">{event.action}</span>
                    <span className="event-user">{event.userName}</span>
                    <span className="event-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="users-content">
      <div className="content-header">
        <h2>User Management</h2>
        <div className="header-actions">
          <div className="search-bar">
            <FiSearch />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <FiPlus /> Add User
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <select onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
          <option value="">All Roles</option>
          {roles.map(role => (
            <option key={role._id} value={role.name}>{role.displayName}</option>
          ))}
        </select>
        <select onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select onChange={(e) => setFilters({ ...filters, isSuspended: e.target.value })}>
          <option value="">Suspension</option>
          <option value="true">Suspended</option>
          <option value="false">Not Suspended</option>
        </select>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Department</th>
              <th>Status</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="user-cell">
                    <img src={user.avatar || '/default-avatar.png'} alt="" />
                    <span>{user.name}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <div className="roles-cell">
                    {user.roles?.map(role => (
                      <span key={role._id} className="role-badge">{role.displayName}</span>
                    ))}
                  </div>
                </td>
                <td>{user.department || '-'}</td>
                <td>
                  <div className="status-cell">
                    <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {user.isSuspended && <span className="status suspended">Suspended</span>}
                  </div>
                </td>
                <td>{user.lastSeen ? new Date(user.lastSeen).toLocaleDateString() : 'Never'}</td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => { setSelectedUser(user); setShowEditModal(true); }}>
                      <FiEdit />
                    </button>
                    {user.isSuspended ? (
                      <button onClick={() => handleUserAction('unsuspend', user._id)}>
                        <FiUnlock />
                      </button>
                    ) : (
                      <button onClick={() => handleUserAction('suspend', user._id)}>
                        <FiLock />
                      </button>
                    )}
                    <button onClick={() => handleUserAction('delete', user._id)} className="danger">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRoles = () => (
    <div className="roles-content">
      <div className="content-header">
        <h2>Role Management</h2>
        <button className="btn btn-primary">
          <FiPlus /> Add Role
        </button>
      </div>

      <div className="roles-grid">
        {roles.map(role => (
          <div key={role._id} className="role-card">
            <div className="role-header">
              <h3>{role.displayName}</h3>
              <span className={`role-type ${role.isSystem ? 'system' : 'custom'}`}>
                {role.isSystem ? 'System' : 'Custom'}
              </span>
            </div>
            <p>{role.description}</p>
            <div className="role-permissions">
              <h4>Permissions:</h4>
              <div className="permissions-list">
                {Object.entries(role.permissionSummary || {}).map(([resource, actions]) => (
                  <div key={resource} className="permission-group">
                    <span className="resource">{resource}:</span>
                    <span className="actions">{actions.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="role-stats">
              <span>{role.userCount || 0} users</span>
              <span>Priority: {role.priority}</span>
            </div>
            <div className="role-actions">
              <button><FiEdit /></button>
              {!role.isSystem && <button className="danger"><FiTrash2 /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="audit-content">
      <div className="content-header">
        <h2>Audit Logs</h2>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <FiDownload /> Export Logs
          </button>
        </div>
      </div>

      <div className="audit-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log._id}>
                <td>
                  <div className="user-cell">
                    <img src={log.user?.avatar || '/default-avatar.png'} alt="" />
                    <span>{log.userName}</span>
                  </div>
                </td>
                <td>
                  <span className="action-badge">{log.action}</span>
                </td>
                <td>{log.resourceName || log.resource}</td>
                <td>{log.ip}</td>
                <td>
                  <span className={`status ${log.status}`}>{log.status}</span>
                </td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>
                  <button className="btn btn-sm">
                    <FiEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-sidebar">
        <h2>Admin Panel</h2>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FiActivity /> Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers /> Users
          </button>
          <button
            className={`nav-item ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <FiShield /> Roles
          </button>
          <button
            className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <FiDatabase /> Audit Logs
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FiSettings /> Settings
          </button>
        </nav>
      </div>

      <div className="dashboard-main">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'roles' && renderRoles()}
        {activeTab === 'audit' && renderAudit()}
        {activeTab === 'settings' && (
          <div className="settings-content">
            <h2>System Settings</h2>
            <p>Settings management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
