// Frontend error handling utilities
import React from 'react';

class AppError extends Error {
  constructor(message, code = null, statusCode = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

// Error message mapping
const ERROR_MESSAGES = {
  // Authentication errors
  AUTHENTICATION_ERROR: {
    INVALID_CREDENTIALS: 'Invalid email or password. Please check your credentials and try again.',
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
    TOKEN_INVALID: 'Invalid authentication token. Please log in again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.'
  },

  // Validation errors
  VALIDATION_ERROR: {
    INVALID_EMAIL: 'Please provide a valid email address.',
    INVALID_PASSWORD: 'Password must be at least 6 characters long.',
    REQUIRED_FIELD: 'This field is required.',
    INVALID_FORMAT: 'Invalid format provided.'
  },

  // Authorization errors
  AUTHORIZATION_ERROR: {
    ACCESS_DENIED: 'You do not have permission to access this resource.',
    ROOM_ACCESS_DENIED: 'You are not a member of this room.',
    MESSAGE_ACCESS_DENIED: 'You cannot access this message.'
  },

  // Not found errors
  NOT_FOUND: {
    USER_NOT_FOUND: 'User not found.',
    ROOM_NOT_FOUND: 'Room not found.',
    MESSAGE_NOT_FOUND: 'Message not found.',
    ROUTE_NOT_FOUND: 'The requested resource was not found.'
  },

  // Conflict errors
  CONFLICT: {
    EMAIL_EXISTS: 'This email is already registered.',
    ROOM_NAME_EXISTS: 'A room with this name already exists.'
  },

  // Rate limit errors
  RATE_LIMIT_EXCEEDED: {
    TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
    AUTH_LIMIT_EXCEEDED: 'Too many authentication attempts. Please try again later.',
    PASSWORD_RESET_LIMIT: 'Too many password reset requests. Please wait before trying again.'
  },

  // File upload errors
  FILE_UPLOAD_ERROR: {
    FILE_TOO_LARGE: 'File size exceeds the maximum limit (5MB).',
    INVALID_FILE_TYPE: 'Invalid file type. Only images are allowed.',
    UPLOAD_FAILED: 'File upload failed. Please try again.'
  },

  // Network errors
  NETWORK_ERROR: {
    CONNECTION_FAILED: 'Connection failed. Please check your internet connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.'
  }
};

// Get user-friendly error message
const getErrorMessage = (error) => {
  // If it's already a formatted error from our backend
  if (error.response?.data?.code) {
    const code = error.response.data.code;
    const message = error.response.data.message;

    // Try to get a more specific message
    const codePath = code.split('.');
    let specificMessage = ERROR_MESSAGES;

    for (const path of codePath) {
      specificMessage = specificMessage?.[path];
      if (!specificMessage) break;
    }

    return typeof specificMessage === 'string' ? specificMessage : message;
  }

  // Handle network errors
  if (error.code === 'NETWORK_ERROR') {
    return ERROR_MESSAGES.NETWORK_ERROR.CONNECTION_FAILED;
  }

  if (error.code === 'ECONNABORTED') {
    return ERROR_MESSAGES.NETWORK_ERROR.TIMEOUT;
  }

  if (error.code === 'ERR_NETWORK') {
    return ERROR_MESSAGES.NETWORK_ERROR.CONNECTION_FAILED;
  }

  // Handle HTTP status codes
  if (error.response?.status) {
    const status = error.response.status;

    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return ERROR_MESSAGES.AUTHENTICATION_ERROR.TOKEN_EXPIRED;
      case 403:
        return ERROR_MESSAGES.AUTHORIZATION_ERROR.ACCESS_DENIED;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND.ROUTE_NOT_FOUND;
      case 409:
        return 'Conflict with existing data. Please refresh and try again.';
      case 429:
        return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED.TOO_MANY_REQUESTS;
      case 500:
        return ERROR_MESSAGES.NETWORK_ERROR.SERVER_ERROR;
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return `Request failed with status ${status}. Please try again.`;
    }
  }

  // Default error message
  return error.message || 'An unexpected error occurred. Please try again.';
};

// Error severity levels
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Get error severity
const getErrorSeverity = (error) => {
  // Authentication errors are high severity
  if (error.response?.status === 401 || error.response?.data?.code?.includes('AUTH')) {
    return ERROR_SEVERITY.HIGH;
  }

  // Network errors are medium severity
  if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
    return ERROR_SEVERITY.MEDIUM;
  }

  // Server errors are high severity
  if (error.response?.status >= 500) {
    return ERROR_SEVERITY.HIGH;
  }

  // Rate limiting is low severity
  if (error.response?.status === 429) {
    return ERROR_SEVERITY.LOW;
  }

  // Default to medium
  return ERROR_SEVERITY.MEDIUM;
};

// Log error for debugging
const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    code: error.response?.data?.code,
    status: error.response?.status,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  console.error('Frontend Error:', errorInfo);

  // In production, you might want to send this to an error tracking service
  if (import.meta.env.PROD) {
    // Example: sendToErrorTrackingService(errorInfo);
  }
};

// Show user-friendly error notification
const showErrorNotification = (error, options = {}) => {
  const message = getErrorMessage(error);
  const severity = getErrorSeverity(error);

  // You can integrate with your preferred notification library
  // For now, we'll use a simple alert (you should replace this with a better UI)
  if (options.showToast !== false) {
    // Example with toast notification library:
    // toast.error(message, { duration: severity === ERROR_SEVERITY.LOW ? 3000 : 5000 });

    // Fallback to alert
    console.error('Error:', message);

    // You can dispatch an action to show error in your UI
    if (options.onError) {
      options.onError(message, severity);
    }
  }

  // Log the error for debugging
  logError(error, options.context);
};

// Handle API errors consistently
const handleApiError = (error, options = {}) => {
  showErrorNotification(error, options);

  // Handle specific cases
  if (error.response?.status === 401) {
    // Redirect to login if token expired
    if (options.onAuthError) {
      options.onAuthError();
    }
  }

  // Return formatted error for further handling
  return {
    message: getErrorMessage(error),
    severity: getErrorSeverity(error),
    code: error.response?.data?.code,
    status: error.response?.status
  };
};

// Retry mechanism for failed requests
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Don't retry on authentication errors or client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
};

// Error boundary component helper
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError(error, { errorInfo, component: 'ErrorBoundary' });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <p>We're sorry for the inconvenience. Please refresh the page and try again.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export {
  AppError,
  ERROR_MESSAGES,
  ERROR_SEVERITY,
  getErrorMessage,
  getErrorSeverity,
  logError,
  showErrorNotification,
  handleApiError,
  retryRequest,
  ErrorBoundary
};
