class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

class FileUploadError extends AppError {
  constructor(message = 'File upload failed') {
    super(message, 400, 'FILE_UPLOAD_ERROR');
  }
}

// Error codes mapping
const ERROR_MESSAGES = {
  VALIDATION_ERROR: {
    INVALID_EMAIL: 'Please provide a valid email address',
    INVALID_PASSWORD: 'Password must be at least 6 characters long',
    REQUIRED_FIELD: 'This field is required',
    INVALID_FORMAT: 'Invalid format'
  },
  AUTHENTICATION_ERROR: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Your session has expired. Please log in again',
    TOKEN_INVALID: 'Invalid authentication token',
    UNAUTHORIZED: 'You are not authorized to perform this action'
  },
  AUTHORIZATION_ERROR: {
    ACCESS_DENIED: 'You do not have permission to access this resource',
    ROOM_ACCESS_DENIED: 'You are not a member of this room',
    MESSAGE_ACCESS_DENIED: 'You cannot access this message'
  },
  NOT_FOUND: {
    USER_NOT_FOUND: 'User not found',
    ROOM_NOT_FOUND: 'Room not found',
    MESSAGE_NOT_FOUND: 'Message not found'
  },
  CONFLICT: {
    EMAIL_EXISTS: 'This email is already registered',
    ROOM_NAME_EXISTS: 'A room with this name already exists'
  },
  RATE_LIMIT_EXCEEDED: {
    TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
    AUTH_LIMIT_EXCEEDED: 'Too many authentication attempts. Please try again later.',
    PASSWORD_RESET_LIMIT: 'Too many password reset requests. Please try again later.'
  },
  DATABASE_ERROR: {
    CONNECTION_FAILED: 'Database connection failed',
    OPERATION_FAILED: 'Database operation failed'
  },
  FILE_UPLOAD_ERROR: {
    FILE_TOO_LARGE: 'File size exceeds the maximum limit',
    INVALID_FILE_TYPE: 'Invalid file type',
    UPLOAD_FAILED: 'File upload failed'
  }
};

// Get specific error message
const getErrorMessage = (code, context = null) => {
  const codePath = code.split('.');
  let message = ERROR_MESSAGES;
  
  for (const path of codePath) {
    message = message?.[path];
    if (!message) break;
  }
  
  return typeof message === 'string' ? message : context || 'An error occurred';
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ConflictError(message);
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new NotFoundError(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new FileUploadError('File size too large');
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = new FileUploadError('Too many files');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new FileUploadError('Unexpected file field');
  }

  // Rate limit errors
  if (err.status === 429) {
    error = new RateLimitError(err.message);
  }

  // Default error
  if (!error.isOperational) {
    error = new AppError('Something went wrong', 500);
  }

  const response = {
    success: false,
    message: getErrorMessage(error.code, error.message),
    code: error.code
  };

  // Add field for validation errors
  if (error.field) {
    response.field = error.field;
  }

  // Add retry after for rate limit errors
  if (error.code === 'RATE_LIMIT_EXCEEDED' && err.retryAfter) {
    response.retryAfter = err.retryAfter;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

// Async error wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  FileUploadError,
  getErrorMessage,
  errorHandler,
  catchAsync
};
