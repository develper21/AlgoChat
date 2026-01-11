import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/auth.js';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(true);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await resetPassword({ token, newPassword: form.newPassword });
      setMessage(response.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="auth-shell">
        <div className="auth-card elevated">
          <div className="auth-card-header">
            <h2>Invalid Reset Link</h2>
          </div>
          <p className="auth-error">{error}</p>
          <p>
            <Link to="/forgot-password">Request a new reset link</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="hero-badge">Algonive Security</div>
        <h1>Create a new password.</h1>
        <p>
          Choose a strong password for your Algonive account.
        </p>
      </div>
      <form className="auth-card elevated" onSubmit={handleSubmit}>
        <div className="auth-card-header">
          <p className="eyebrow">Password Reset</p>
          <h2>Set New Password</h2>
          <span>Enter your new password below.</span>
        </div>
        
        {message && <p className="auth-success">{message}</p>}
        {error && <p className="auth-error">{error}</p>}
        
        <label htmlFor="newPassword">New Password</label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          placeholder="Enter new password"
          value={form.newPassword}
          onChange={handleChange}
          required
        />
        
        <label htmlFor="confirmPassword">Confirm New Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
        
        <button type="submit" disabled={loading || message}>
          {loading ? 'Resetting password…' : 'Reset password'}
        </button>
        
        <p>
          <Link to="/login">Back to login</Link>
        </p>
      </form>
    </div>
  );
};

export default ResetPassword;
