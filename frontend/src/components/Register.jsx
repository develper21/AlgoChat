import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth.js';

const Register = ({ onSuccess, isAuthed }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      const data = await registerUser(form);
      onSuccess(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell reverse">
      <div className="auth-hero">
        <div className="hero-badge alt">Algonive Invites</div>
        <h1>Provision a new workspace identity.</h1>
        <p>
          Create a secure Algonive profile to collaborate across programs, squads, and innovation
          pods in real time.
        </p>
      </div>
      <form className="auth-card elevated" onSubmit={handleSubmit}>
        <div className="auth-card-header">
          <p className="eyebrow">Provisioning Deck</p>
          <h2>Request a seat.</h2>
          <span>We just need a few details to get you live.</span>
        </div>
        {error && <p className="auth-error">{error}</p>}
        <label htmlFor="name">Full name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Jordan Rivers"
          value={form.name}
          onChange={handleChange}
          required
        />
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
          placeholder="Choose a secure password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Provisioning…' : 'Activate workspace'}
        </button>
        <p>
          Already credentialed? <Link to="/login">Return to console</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
