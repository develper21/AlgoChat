import express from 'express';
import Joi from 'joi';
import User from '../models/User.js';
import Role from '../models/Role.js';
import AuditLog from '../models/AuditLog.js';
import Meeting from '../models/Meeting.js';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import { logUserAction, logSecurityEvent } from '../middleware/audit.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

// Permission checking middleware
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user.hasPermission(resource, action)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        code: 'PERMISSION_ERROR'
      });
    }
  };
};

// Validation schemas
const createUserSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(8),
  roles: Joi.array().items(Joi.string()).default(['user']),
  primaryRole: Joi.string(),
  department: Joi.string().optional(),
  manager: Joi.string().optional(),
  employeeId: Joi.string().optional(),
  title: Joi.string().optional(),
  phone: Joi.string().optional(),
  location: Joi.string().optional(),
  isActive: Joi.boolean().default(true),
  notifications: Joi.object({
    email: Joi.boolean().default(true),
    push: Joi.boolean().default(true),
    meetingReminders: Joi.boolean().default(true),
    messageNotifications: Joi.boolean().default(true)
  }).optional()
});

const updateUserSchema = Joi.object({
  name: Joi.string().optional().min(1).max(100),
  email: Joi.string().optional().email(),
  roles: Joi.array().items(Joi.string()).optional(),
  primaryRole: Joi.string().optional(),
  department: Joi.string().optional(),
  manager: Joi.string().optional(),
  employeeId: Joi.string().optional(),
  title: Joi.string().optional(),
  phone: Joi.string().optional(),
  location: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  isSuspended: Joi.boolean().optional(),
  suspensionReason: Joi.string().optional(),
  notifications: Joi.object({
    email: Joi.boolean(),
    push: Joi.boolean(),
    meetingReminders: Joi.boolean(),
    messageNotifications: Joi.boolean()
  }).optional()
});

const createRoleSchema = Joi.object({
  name: Joi.string().required().min(1).max(50),
  displayName: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(500),
  permissions: Joi.array().items(Joi.object({
    resource: Joi.string().required(),
    actions: Joi.array().items(Joi.string()).required(),
    conditions: Joi.object().optional()
  })).required(),
  isActive: Joi.boolean().default(true)
});

const updateRoleSchema = Joi.object({
  displayName: Joi.string().optional().min(1).max(100),
  description: Joi.string().optional().max(500),
  permissions: Joi.array().items(Joi.object({
    resource: Joi.string().required(),
    actions: Joi.array().items(Joi.string()).required(),
    conditions: Joi.object().optional()
  })).optional(),
  isActive: Joi.boolean().optional()
});

// Dashboard Analytics
router.get('/dashboard', requirePermission('reports', 'read'), async (req, res) => {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const suspendedUsers = await User.countDocuments({ isSuspended: true });
    const newUsers30Days = await User.countDocuments({ 
      createdAt: { $gte: last30Days } 
    });
    const onlineUsers = await User.countDocuments({ isOnline: true });

    // Meeting statistics
    const totalMeetings = await Meeting.countDocuments();
    const activeMeetings = await Meeting.countDocuments({ isActive: true });
    const meetings30Days = await Meeting.countDocuments({ 
      createdAt: { $gte: last30Days } 
    });
    const meetings7Days = await Meeting.countDocuments({ 
      createdAt: { $gte: last7Days } 
    });

    // Message statistics
    const totalMessages = await Message.countDocuments();
    const messages30Days = await Message.countDocuments({ 
      createdAt: { $gte: last30Days } 
    });
    const messages7Days = await Message.countDocuments({ 
      createdAt: { $gte: last7Days } 
    });

    // Room statistics
    const totalRooms = await Room.countDocuments();
    const activeRooms = await Room.countDocuments({ 
      lastMessageAt: { $gte: last7Days } 
    });

    // Role statistics
    const totalRoles = await Role.countDocuments();
    const systemRoles = await Role.countDocuments({ isSystem: true });
    const customRoles = totalRoles - systemRoles;

    // Department statistics
    const departmentStats = await User.aggregate([
      { $match: { department: { $exists: true, $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Recent activity
    const recentActivity = await AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user', 'name email avatar');

    // Security events
    const securityEvents = await AuditLog.getSecurityEvents({
      limit: 10,
      startDate: last7Days
    });

    // User growth over time
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          new30Days: newUsers30Days,
          online: onlineUsers,
          growth: userGrowth
        },
        meetings: {
          total: totalMeetings,
          active: activeMeetings,
          total30Days: meetings30Days,
          total7Days: meetings7Days
        },
        messages: {
          total: totalMessages,
          total30Days: messages30Days,
          total7Days: messages7Days
        },
        rooms: {
          total: totalRooms,
          active: activeRooms
        },
        roles: {
          total: totalRoles,
          system: systemRoles,
          custom: customRoles
        },
        departments: departmentStats,
        recentActivity,
        securityEvents
      }
    });

    await logUserAction(req.user, 'read', 'dashboard', {
      metadata: { action: 'view_dashboard' }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      code: 'DASHBOARD_ERROR'
    });
  }
});

// User Management
router.get('/users', requirePermission('users', 'read'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      role, 
      department, 
      isActive, 
      isSuspended,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.roles = { $in: [role] };
    }

    if (department) {
      query.department = department;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (isSuspended !== undefined) {
      query.isSuspended = isSuspended === 'true';
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .populate('roles primaryRole manager', 'name displayName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: users.length,
          overall: total
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      code: 'USERS_FETCH_ERROR'
    });
  }
});

router.post('/users', requirePermission('users', 'create'), async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
        code: 'EMAIL_EXISTS'
      });
    }

    // Validate roles
    const roleObjects = await Role.find({ name: { $in: value.roles } });
    if (roleObjects.length !== value.roles.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more roles are invalid',
        code: 'INVALID_ROLES'
      });
    }

    // Create user
    const user = new User({
      ...value,
      roles: roleObjects.map(role => role._id),
      primaryRole: value.primaryRole || roleObjects[0]._id
    });

    await user.save();
    await user.populate('roles primaryRole manager', 'name displayName email');

    // Log security event
    await logSecurityEvent('user_created', req.user, {
      resourceId: user._id,
      resourceName: user.name,
      changes: { roles: value.roles }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      code: 'USER_CREATE_ERROR'
    });
  }
});

router.put('/users/:userId', requirePermission('users', 'update'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const oldValues = {
      roles: user.roles,
      primaryRole: user.primaryRole,
      isActive: user.isActive,
      isSuspended: user.isSuspended
    };

    // Validate roles if provided
    if (value.roles) {
      const roleObjects = await Role.find({ name: { $in: value.roles } });
      if (roleObjects.length !== value.roles.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more roles are invalid',
          code: 'INVALID_ROLES'
        });
      }
      value.roles = roleObjects.map(role => role._id);
    }

    // Handle suspension
    if (value.isSuspended && !user.isSuspended) {
      value.suspendedAt = new Date();
      value.suspendedBy = req.user._id;
      value.suspensionReason = value.suspensionReason || 'Suspended by administrator';
    } else if (!value.isSuspended && user.isSuspended) {
      value.suspendedAt = null;
      value.suspendedBy = null;
      value.suspensionReason = null;
    }

    Object.assign(user, value);
    await user.save();
    await user.populate('roles primaryRole manager', 'name displayName email');

    // Log changes
    await logUserAction(req.user, 'update', 'users', {
      resourceId: user._id,
      resourceName: user.name,
      oldValue: oldValues,
      newValue: {
        roles: user.roles,
        primaryRole: user.primaryRole,
        isActive: user.isActive,
        isSuspended: user.isSuspended
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      code: 'USER_UPDATE_ERROR'
    });
  }
});

router.delete('/users/:userId', requirePermission('users', 'delete'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Prevent deletion of super admin
    if (user.hasPermission('system', 'manage')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system administrator',
        code: 'CANNOT_DELETE_ADMIN'
      });
    }

    await User.findByIdAndDelete(userId);

    // Log security event
    await logSecurityEvent('user_deleted', req.user, {
      resourceId: user._id,
      resourceName: user.name
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      code: 'USER_DELETE_ERROR'
    });
  }
});

// Role Management
router.get('/roles', requirePermission('roles', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const skip = (page - 1) * limit;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const roles = await Role.find(query)
      .sort({ priority: -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Role.countDocuments(query);

    res.json({
      success: true,
      data: {
        roles,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: roles.length,
          overall: total
        }
      }
    });

  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      code: 'ROLES_FETCH_ERROR'
    });
  }
});

router.post('/roles', requirePermission('roles', 'create'), async (req, res) => {
  try {
    const { error, value } = createRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if role name already exists
    const existingRole = await Role.findOne({ name: value.name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role name already exists',
        code: 'ROLE_EXISTS'
      });
    }

    const role = new Role({
      ...value,
      createdBy: req.user._id
    });

    await role.save();

    // Log security event
    await logSecurityEvent('role_created', req.user, {
      resourceId: role._id,
      resourceName: role.displayName,
      changes: { permissions: value.permissions }
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });

  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      code: 'ROLE_CREATE_ERROR'
    });
  }
});

router.put('/roles/:roleId', requirePermission('roles', 'update'), async (req, res) => {
  try {
    const { roleId } = req.params;
    const { error, value } = updateRoleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }

    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify system roles',
        code: 'CANNOT_MODIFY_SYSTEM_ROLE'
      });
    }

    const oldPermissions = role.permissions;
    Object.assign(role, value, { updatedBy: req.user._id });
    await role.save();

    // Log changes
    await logUserAction(req.user, 'update', 'roles', {
      resourceId: role._id,
      resourceName: role.displayName,
      oldValue: { permissions: oldPermissions },
      newValue: { permissions: role.permissions }
    });

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });

  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      code: 'ROLE_UPDATE_ERROR'
    });
  }
});

router.delete('/roles/:roleId', requirePermission('roles', 'delete'), async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }

    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system roles',
        code: 'CANNOT_DELETE_SYSTEM_ROLE'
      });
    }

    await Role.findByIdAndDelete(roleId);

    // Log security event
    await logSecurityEvent('role_deleted', req.user, {
      resourceId: role._id,
      resourceName: role.displayName
    });

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      code: 'ROLE_DELETE_ERROR'
    });
  }
});

// Audit Logs
router.get('/audit', requirePermission('audit', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      user,
      action,
      resource,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    if (user) {
      query.user = user;
    }

    if (action) {
      query.action = action;
    }

    if (resource) {
      query.resource = resource;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
        { resourceName: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name email avatar');

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: logs.length,
          overall: total
        }
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      code: 'AUDIT_LOGS_ERROR'
    });
  }
});

// System Settings
router.get('/settings', requirePermission('settings', 'read'), async (req, res) => {
  try {
    // This would typically fetch from a settings collection
    const settings = {
      system: {
        name: 'AlgoChat Enterprise',
        version: '2.0.0',
        maintenance: false,
        registrationEnabled: true,
        ssoEnabled: false,
        maxUsers: 1000,
        storageQuota: '100GB'
      },
      security: {
        passwordMinLength: 8,
        passwordRequireSpecial: true,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        lockoutDuration: 2,
        twoFactorRequired: false
      },
      features: {
        meetings: true,
        recording: true,
        screenShare: true,
        fileUpload: true,
        messageHistory: true,
        analytics: true
      },
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        smtpConfigured: true
      }
    };

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      code: 'SETTINGS_ERROR'
    });
  }
});

export default router;
