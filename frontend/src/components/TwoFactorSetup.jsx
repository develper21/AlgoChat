import React, { useState } from 'react';
import { setupTwoFactor, enableTwoFactor, disableTwoFactor, generateNewBackupCodes } from '../api/twoFactor.js';

const TwoFactorSetup = ({ user, onClose, onToggle }) => {
  const [step, setStep] = useState('status'); // status, setup, verify, success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Setup state
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  
  // Disable state
  const [password, setPassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await setupTwoFactor();
      setSetupData(data);
      setBackupCodes(data.backupCodes);
      setStep('setup');
    } catch (error) {
      setError(error.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await enableTwoFactor(verificationCode, backupCodes);
      setSuccess('2FA enabled successfully!');
      setStep('success');
      onToggle();
    } catch (error) {
      setError(error.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await disableTwoFactor(password, disableCode);
      setSuccess('2FA disabled successfully!');
      setStep('success');
      onToggle();
    } catch (error) {
      setError(error.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewCodes = async () => {
    if (!password) {
      setError('Please enter your password to generate new backup codes');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await generateNewBackupCodes(password);
      setBackupCodes(data.backupCodes);
      setSuccess('New backup codes generated successfully!');
    } catch (error) {
      setError(error.message || 'Failed to generate backup codes');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const renderStatus = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
      
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${user.twoFactorEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="font-medium">
            2FA is {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Two-factor authentication adds an extra layer of security to your account.
        </p>
      </div>

      {user.twoFactorEnabled ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              Your account is protected with 2FA. Make sure to save your backup codes in a safe place.
            </p>
            <button
              onClick={() => setStep('setup')}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              View backup codes
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setStep('setup')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Manage Backup Codes
            </button>
            <button
              onClick={() => setStep('disable')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Disable 2FA
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Enable 2FA to protect your account with an additional verification step.
            </p>
          </div>
          
          <button
            onClick={handleSetup}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Enable 2FA'}
          </button>
        </div>
      )}
    </div>
  );

  const renderSetup = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Setup Two-Factor Authentication</h2>
      
      {step === 'setup' && (
        <div className="space-y-4">
          <div className="text-center">
            <img src={setupData.qrCode} alt="QR Code" className="mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium mb-2">Or enter this code manually:</p>
            <code className="text-sm bg-white p-2 rounded border block text-center">
              {setupData.secret}
            </code>
            <button
              onClick={() => copyToClipboard(setupData.secret)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-2"
            >
              Copy to clipboard
            </button>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium mb-2">Backup Codes</p>
            <p className="text-xs text-yellow-700 mb-3">
              Save these backup codes in a safe place. You can use them to access your account if you lose your device.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {backupCodes.map((code, index) => (
                <code key={index} className="bg-white p-2 rounded border text-center">
                  {code}
                </code>
              ))}
            </div>
            <button
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
              className="text-xs text-blue-600 hover:text-blue-800 mt-2"
            >
              Copy all codes
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Enter verification code:</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="6-digit code"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={6}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={loading || !verificationCode}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Enabling...' : 'Enable 2FA'}
            </button>
            <button
              onClick={() => setStep('status')}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'disable' && (
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Disabling 2FA will make your account less secure. Are you sure you want to continue?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Enter your password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Enter 2FA code (optional):</label>
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="6-digit code"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={6}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDisable}
              disabled={loading || !password}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
            <button
              onClick={() => setStep('status')}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSuccess = () => (
    <div className="p-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">Success!</h3>
      <p className="text-gray-600 mb-4">{success}</p>
      <button
        onClick={onClose}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Done
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-auto">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}
        
        {success && step !== 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm">
            {success}
          </div>
        )}

        {step === 'success' ? renderSuccess() : renderStatus()}
        
        {step === 'setup' && renderSetup()}
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TwoFactorSetup;
