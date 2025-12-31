import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth.js';

const Login = ({ onSuccess, isAuthed }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthed) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginUser(form);
      onSuccess(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="hero-badge">Algonive Access</div>
        <h1>Reconnect with your entire organization.</h1>
        <p>
          Secure single-sign-on experience for Algonive Collaboration Cloud. Designed for
          high-touch enterprise teams.
        </p>
      </div>
      <form className="auth-card elevated" onSubmit={handleSubmit}>
        <div className="auth-card-header">
          <p className="eyebrow">Algonive Control Plane</p>
          <h2>Welcome back.</h2>
          <span>Sign in to resume this session.</span>
        </div>
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
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <div className="form-actions">
          <label className="remember-toggle">
            <input type="checkbox" />
            <span>Keep me signed in</span>
          </label>
          <button type="button" className="link-button">
            Forgot password?
          </button>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Authenticating…' : 'Enter workspace'}
        </button>
        <p>
          Need a seat? <Link to="/register">Request access</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
