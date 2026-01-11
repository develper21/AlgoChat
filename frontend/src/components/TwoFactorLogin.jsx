import React, { useState } from 'react';
import { verifyTwoFactor } from '../api/twoFactor.js';

const TwoFactorLogin = ({ email, onVerificationSuccess, onCancel }) => {
  const [method, setMethod] = useState('totp'); // totp or backup
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code) {
      setError('Please enter a code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await verifyTwoFactor(email, method === 'totp' ? code : null, method === 'backup' ? code : null);
      onVerificationSuccess(method === 'totp' ? { twoFactorToken: code } : { backupCode: code });
    } catch (error) {
      setError(error.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
        
        <p className="text-sm text-gray-600 mb-6">
          Enter the verification code from your authenticator app or use a backup code.
        </p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Method Selection */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMethod('totp')}
              className={`flex-1 px-3 py-2 rounded-lg border ${
                method === 'totp' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Authenticator App
            </button>
            <button
              type="button"
              onClick={() => setMethod('backup')}
              className={`flex-1 px-3 py-2 rounded-lg border ${
                method === 'backup' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Backup Code
            </button>
          </div>

          {/* Code Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {method === 'totp' ? '6-digit code' : '8-character backup code'}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
              placeholder={method === 'totp' ? '000000' : 'XXXXXXXX'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={method === 'totp' ? 6 : 8}
              autoFocus
            />
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500">
            {method === 'totp' ? (
              <p>Open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code.</p>
            ) : (
              <p>Enter one of your 8-character backup codes. Each code can only be used once.</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !code}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorLogin;
