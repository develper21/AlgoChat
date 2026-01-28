import User from '../models/User.js';
import Role from '../models/Role.js';

// Helper function to check if user has permission
export const hasPermission = (user, permission) => {
  if (!user) return false;
  
  // Parse permission string (e.g., 'analytics:read' -> resource='analytics', action='read')
  const [resource, action] = permission.split(':');
  return user.hasPermission(resource, action);
};

// Middleware to check if user has required permission
export const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Check if user has the required permission
      if (!req.user.hasPermission(resource, action)) {
        // Log failed permission check
        await logPermissionCheck(req.user, resource, action, false);
        
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            required: `${resource}:${action}`,
            userPermissions: req.user.effectivePermissions
          }
        });
      }

      // Log successful permission check
      await logPermissionCheck(req.user, resource, action, true);
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

// Middleware to check if user has any of the required permissions
export const checkAnyPermission = (resource, actions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      if (!req.user.hasAnyPermission(resource, actions)) {
        await logPermissionCheck(req.user, resource, actions.join('|'), false);
        
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            required: actions.map(action => `${resource}:${action}`),
            userPermissions: req.user.effectivePermissions
          }
        });
      }

      await logPermissionCheck(req.user, resource, actions.join('|'), true);
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

// Middleware to check if user has all required permissions
export const checkAllPermissions = (resource, actions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      if (!req.user.hasAllPermissions(resource, actions)) {
        await logPermissionCheck(req.user, resource, actions.join('&'), false);
        
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            required: actions.map(action => `${resource}:${action}`),
            userPermissions: req.user.effectivePermissions
          }
        });
      }

      await logPermissionCheck(req.user, resource, actions.join('&'), true);
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

// Middleware to check if user has specific role
export const checkRole = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      const hasRole = req.user.roles.some(role => role.name === roleName);
      
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: `Role '${roleName}' required`,
          code: 'ROLE_REQUIRED',
          details: {
            requiredRole: roleName,
            userRoles: req.user.roles.map(role => role.name)
          }
        });
      }

      next();

    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role check failed',
        code: 'ROLE_ERROR'
      });
    }
  };
};

// Middleware to check if user has any of the specified roles
export const checkAnyRole = (roleNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      const hasAnyRole = req.user.roles.some(role => roleNames.includes(role.name));
      
      if (!hasAnyRole) {
        return res.status(403).json({
          success: false,
          message: 'One of the required roles needed',
          code: 'ROLES_REQUIRED',
          details: {
            requiredRoles: roleNames,
            userRoles: req.user.roles.map(role => role.name)
          }
        });
      }

      next();

    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role check failed',
        code: 'ROLE_ERROR'
      });
    }
  };
};

// Middleware to check if user is admin or higher
export const requireAdmin = checkAnyRole(['admin', 'superadmin']);

// Middleware to check if user is moderator or higher
export const requireModerator = checkAnyRole(['moderator', 'admin', 'superadmin']);

// Middleware to check if user is super admin
export const requireSuperAdmin = checkRole('superadmin');

// Middleware to check resource ownership or admin access
export const checkOwnershipOrAdmin = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Admin users can access any resource
      if (req.user.isAdmin) {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID required',
          code: 'RESOURCE_ID_REQUIRED'
        });
      }

      // Check if user owns the resource
      const resource = await resourceModel.findById(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Check ownership based on resource type
      let isOwner = false;
      
      if (resource.user) {
        // Direct ownership
        isOwner = resource.user.toString() === req.user._id.toString();
      } else if (resource.host) {
        // Meeting ownership
        isOwner = resource.host.toString() === req.user._id.toString();
      } else if (resource.sender) {
        // Message ownership
        isOwner = resource.sender.toString() === req.user._id.toString();
      } else if (resource.members) {
        // Room membership
        isOwner = resource.members.includes(req.user._id);
      }

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - not owner',
          code: 'ACCESS_DENIED'
        });
      }

      // Attach resource to request for later use
      req.resource = resource;
      next();

    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Ownership check failed',
        code: 'OWNERSHIP_ERROR'
      });
    }
  };
};

// Middleware to check department access
export const checkDepartmentAccess = (action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Admin users can access any department
      if (req.user.isAdmin) {
        return next();
      }

      // For non-admin users, check if they can access their own department
      const targetDepartment = req.params.department || req.body.department;
      
      if (targetDepartment && targetDepartment !== req.user.department) {
        // Check if user has permission to access other departments
        if (!req.user.hasPermission('users', 'manage')) {
          return res.status(403).json({
            success: false,
            message: 'Cannot access other departments',
            code: 'DEPARTMENT_ACCESS_DENIED'
          });
        }
      }

      next();

    } catch (error) {
      console.error('Department access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Department access check failed',
        code: 'DEPARTMENT_ACCESS_ERROR'
      });
    }
  };
};

// Helper function to log permission checks
async function logPermissionCheck(user, resource, action, success) {
  try {
    const AuditLog = require('../models/AuditLog.js').default;
    
    await AuditLog.log({
      user: user._id,
      userEmail: user.email,
      userName: user.name,
      action: 'permission_check',
      resource: 'system',
      metadata: {
        permissionRequired: `${resource}:${action}`,
        success,
        userPermissions: user.effectivePermissions,
        userRoles: user.roles.map(role => role.name)
      },
      status: success ? 'success' : 'failure',
      ip: 'system' // This would be set in the actual request
    });
  } catch (error) {
    console.error('Failed to log permission check:', error);
  }
}

// Function to create permission-based middleware for custom resources
export const createResourcePermission = (resourceName, permissions = {}) => {
  return (req, res, next) => {
    const method = req.method.toLowerCase();
    const requiredPermission = permissions[method] || `${resourceName}:read`;
    
    return checkPermission(resourceName, requiredPermission)(req, res, next);
  };
};

// Function to check if user can perform action on specific resource
export const canPerformAction = async (user, resource, action, resourceId = null) => {
  try {
    // Check basic permission
    if (!user.hasPermission(resource, action)) {
      return { allowed: false, reason: 'Insufficient permissions' };
    }

    // If resourceId is provided, check additional constraints
    if (resourceId) {
      // Add resource-specific logic here
      // For example, check if user is owner, member, etc.
    }

    return { allowed: true };
  } catch (error) {
    console.error('Permission check error:', error);
    return { allowed: false, reason: 'Permission check failed' };
  }
};

// Middleware to rate limit based on user role
export const roleBasedRateLimit = (limits = {}) => {
  const defaultLimits = {
    guest: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    user: { requests: 1000, windowMs: 15 * 60 * 1000 }, // 1000 requests per 15 minutes
    manager: { requests: 5000, windowMs: 15 * 60 * 1000 }, // 5000 requests per 15 minutes
    moderator: { requests: 10000, windowMs: 15 * 60 * 1000 }, // 10000 requests per 15 minutes
    admin: { requests: 50000, windowMs: 15 * 60 * 1000 }, // 50000 requests per 15 minutes
    superadmin: { requests: 100000, windowMs: 15 * 60 * 1000 } // 100000 requests per 15 minutes
  };

  return (req, res, next) => {
    if (!req.user) {
      return next(); // Skip rate limiting for unauthenticated requests (handled by other middleware)
    }

    // Get user's highest priority role
    const userRole = req.user.roles.reduce((highest, role) => {
      return role.priority > (highest?.priority || 0) ? role : highest;
    }, null);

    const roleName = userRole?.name || 'user';
    const limit = limits[roleName] || defaultLimits[roleName] || defaultLimits.user;

    // Apply rate limiting based on role
    // This would integrate with your rate limiting middleware
    req.rateLimit = limit;
    next();
  };
};
