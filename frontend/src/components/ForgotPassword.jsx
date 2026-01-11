import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth.js';

const ForgotPassword = () => {
  const [form, setForm] = useState({ email: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await forgotPassword(form);
      setMessage(response.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="hero-badge">Algonive Recovery</div>
        <h1>Reset your password.</h1>
        <p>
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      <form className="auth-card elevated" onSubmit={handleSubmit}>
        <div className="auth-card-header">
          <p className="eyebrow">Password Recovery</p>
          <h2>Forgot Password?</h2>
          <span>We'll help you get back into your account.</span>
        </div>
        
        {message && <p className="auth-success">{message}</p>}
        {error && <p className="auth-error">{error}</p>}
        
        <label htmlFor="email">Work Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@algonive.com"
          value={form.email}
          onChange={handleChange}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Sending reset link…' : 'Send reset link'}
        </button>
        
        <p>
          Remember your password? <Link to="/login">Back to login</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;
