import React from 'react';
import { ERROR_SEVERITY } from '../utils/errorHandler.jsx';

const ErrorDisplay = ({ error, onClose, onRetry }) => {
  if (!error) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case ERROR_SEVERITY.MEDIUM:
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case ERROR_SEVERITY.HIGH:
        return 'bg-red-50 border-red-200 text-red-800';
      case ERROR_SEVERITY.CRITICAL:
        return 'bg-red-100 border-red-300 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return '⚠️';
      case ERROR_SEVERITY.MEDIUM:
        return '⚠️';
      case ERROR_SEVERITY.HIGH:
        return '❌';
      case ERROR_SEVERITY.CRITICAL:
        return '🚨';
      default:
        return 'ℹ️';
    }
  };

  const severity = error.severity || ERROR_SEVERITY.MEDIUM;
  const colorClass = getSeverityColor(severity);
  const icon = getSeverityIcon(severity);

  return (
    <div className={`fixed top-4 right-4 max-w-md p-4 rounded-lg border shadow-lg z-50 ${colorClass}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">
            {severity === ERROR_SEVERITY.CRITICAL ? 'Critical Error' : 'Error'}
          </h3>
          <p className="text-sm mt-1">{error.message}</p>

          {/* Show additional info for development */}
          {import.meta.env.DEV && error.code && (
            <p className="text-xs mt-1 opacity-75">Code: {error.code}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1 text-xs font-medium rounded bg-white bg-opacity-50 hover:bg-opacity-75 transition-colors"
              >
                Retry
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs font-medium rounded bg-white bg-opacity-50 hover:bg-opacity-75 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
