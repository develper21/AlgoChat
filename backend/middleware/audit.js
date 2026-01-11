import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

// Middleware to log API requests
export const auditMiddleware = (options = {}) => {
  const {
    excludePaths = ['/health', '/metrics'],
    excludeMethods = ['GET'],
    logBody = false,
    logHeaders = false
  } = options;

  return async (req, res, next) => {
    // Skip excluded paths and methods
    if (excludePaths.some(path => req.path.startsWith(path)) ||
        excludeMethods.includes(req.method)) {
      return next();
    }

    const startTime = Date.now();
    const originalSend = res.send;
    let responseData;

    // Override res.send to capture response data
    res.send = function(data) {
      responseData = data;
      originalSend.call(this, data);
    };

    // Continue to next middleware
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const user = req.user;

        // Don't log if no user (except for login attempts)
        if (!user && !req.path.includes('/login') && !req.path.includes('/auth')) {
          return;
        }

        const auditData = {
          user: user?._id || null,
          userEmail: user?.email || 'anonymous',
          userName: user?.name || 'Anonymous',
          action: getActionFromMethod(req.method),
          resource: getResourceFromPath(req.path),
          resourceId: getResourceIdFromPath(req.path),
          resourceName: getResourceName(req),
          method: req.method,
          endpoint: req.path,
          userAgent: req.get('User-Agent'),
          ip: getClientIP(req),
          status: res.statusCode >= 400 ? 'failure' : 'success',
          errorMessage: responseData?.message || responseData?.error,
          errorCode: responseData?.code,
          sessionId: req.sessionID,
          duration,
          metadata: {
            statusCode: res.statusCode,
            contentType: res.get('Content-Type'),
            contentLength: res.get('Content-Length')
          }
        };

        // Add request body if enabled and sensitive data is filtered
        if (logBody && req.body) {
          auditData.changes = filterSensitiveData(req.body);
        }

        // Add headers if enabled
        if (logHeaders) {
          auditData.metadata.headers = filterSensitiveHeaders(req.headers);
        }

        // Add tags based on request characteristics
        auditData.tags = generateTags(req, res);

        await AuditLog.log(auditData);
      } catch (error) {
        console.error('Audit logging error:', error);
        // Don't break the application for audit errors
      }
    });

    next();
  };
};

// Helper function to get action from HTTP method
function getActionFromMethod(method) {
  const actionMap = {
    'GET': 'read',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete'
  };
  return actionMap[method] || 'unknown';
}

// Helper function to get resource from path
function getResourceFromPath(path) {
  const pathParts = path.split('/').filter(part => part && !part.match(/^[0-9a-fA-F]{24}$/));
  return pathParts[0] || 'unknown';
}

// Helper function to get resource ID from path
function getResourceIdFromPath(path) {
  const idMatch = path.match(/([0-9a-fA-F]{24})/);
  return idMatch ? idMatch[1] : null;
}

// Helper function to get resource name
function getResourceName(req) {
  const resource = getResourceFromPath(req.path);
  
  switch (resource) {
    case 'users':
      return req.body?.name || req.params?.userId || 'User';
    case 'meetings':
      return req.body?.title || req.params?.meetingId || 'Meeting';
    case 'rooms':
      return req.body?.name || req.params?.roomId || 'Room';
    case 'messages':
      return 'Message';
    case 'roles':
      return req.body?.displayName || req.params?.roleId || 'Role';
    default:
      return resource.charAt(0).toUpperCase() + resource.slice(1);
  }
}

// Helper function to get client IP
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
}

// Helper function to filter sensitive data
function filterSensitiveData(data) {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'credential',
    'ssn',
    'creditCard',
    'bankAccount'
  ];

  if (!data || typeof data !== 'object') {
    return data;
  }

  const filtered = Array.isArray(data) ? [] : {};

  Object.keys(data).forEach(key => {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
    
    if (isSensitive) {
      filtered[key] = '[REDACTED]';
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      filtered[key] = filterSensitiveData(data[key]);
    } else {
      filtered[key] = data[key];
    }
  });

  return filtered;
}

// Helper function to filter sensitive headers
function filterSensitiveHeaders(headers) {
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-session-id'
  ];

  const filtered = {};
  Object.keys(headers).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveHeaders.includes(lowerKey)) {
      filtered[key] = '[REDACTED]';
    } else {
      filtered[key] = headers[key];
    }
  });

  return filtered;
}

// Helper function to generate tags
function generateTags(req, res) {
  const tags = [];

  // Add method tag
  tags.push(req.method.toLowerCase());

  // Add status tag
  if (res.statusCode >= 200 && res.statusCode < 300) {
    tags.push('success');
  } else if (res.statusCode >= 400 && res.statusCode < 500) {
    tags.push('client_error');
  } else if (res.statusCode >= 500) {
    tags.push('server_error');
  }

  // Add resource tag
  const resource = getResourceFromPath(req.path);
  if (resource !== 'unknown') {
    tags.push(resource);
  }

  // Add special tags for certain actions
  if (req.path.includes('/login')) {
    tags.push('authentication');
  }
  if (req.path.includes('/admin')) {
    tags.push('admin');
  }
  if (req.path.includes('/sso')) {
    tags.push('sso');
  }

  return tags;
}

// Function to log specific user actions manually
export const logUserAction = async (user, action, resource, details = {}) => {
  return AuditLog.logUserAction(user, action, resource, details);
};

// Function to log security events
export const logSecurityEvent = async (event, user, details = {}) => {
  const securityDetails = {
    ...details,
    tags: [...(details.tags || []), 'security']
  };
  
  return AuditLog.logUserAction(user, event, 'system', securityDetails);
};

// Function to log data access
export const logDataAccess = async (user, resource, action, details = {}) => {
  const dataAccessDetails = {
    ...details,
    tags: [...(details.tags || []), 'data_access']
  };
  
  return AuditLog.logUserAction(user, action, resource, dataAccessDetails);
};

// Function to log compliance events
export const logComplianceEvent = async (user, event, details = {}) => {
  const complianceDetails = {
    ...details,
    tags: [...(details.tags || []), 'compliance']
  };
  
  return AuditLog.logUserAction(user, event, 'compliance', complianceDetails);
};

// Express middleware for specific route auditing
export const auditRoute = (action, resource, options = {}) => {
  return (req, res, next) => {
    const originalSend = res.send;
    let responseData;

    res.send = function(data) {
      responseData = data;
      originalSend.call(this, data);
    };

    res.on('finish', async () => {
      try {
        if (req.user) {
          await AuditLog.logUserAction(req.user, action, resource, {
            resourceId: getResourceIdFromPath(req.path),
            resourceName: getResourceName(req),
            method: req.method,
            endpoint: req.path,
            userAgent: req.get('User-Agent'),
            ip: getClientIP(req),
            status: res.statusCode >= 400 ? 'failure' : 'success',
            errorMessage: responseData?.message || responseData?.error,
            sessionId: req.sessionID,
            changes: options.logBody ? filterSensitiveData(req.body) : undefined,
            ...options
          });
        }
      } catch (error) {
        console.error('Route audit error:', error);
      }
    });

    next();
  };
};
