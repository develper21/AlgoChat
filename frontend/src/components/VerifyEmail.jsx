import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../api/auth.js';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(true);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Invalid verification link. Please check your email for the correct link.');
      return;
    }

    const verify = async () => {
      setLoading(true);
      try {
        const response = await verifyEmail({ token });
        setMessage(response.message);
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to verify email');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, navigate]);

  if (!tokenValid) {
    return (
      <div className="auth-shell">
        <div className="auth-card elevated">
          <div className="auth-card-header">
            <h2>Invalid Verification Link</h2>
          </div>
          <p className="auth-error">{error}</p>
          <p>
            <Link to="/register">Create a new account</Link> or <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="hero-badge">Algonive Verification</div>
        <h1>Verifying your email...</h1>
        <p>
          Please wait while we verify your email address.
        </p>
      </div>
      <div className="auth-card elevated">
        <div className="auth-card-header">
          <p className="eyebrow">Email Verification</p>
          <h2>Confirming your account</h2>
        </div>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="spinner"></div>
            <p>Verifying your email address...</p>
          </div>
        )}
        
        {message && (
          <div>
            <p className="auth-success">{message}</p>
            <p>You will be redirected to the login page shortly.</p>
          </div>
        )}
        
        {error && (
          <div>
            <p className="auth-error">{error}</p>
            <p>
              <Link to="/resend-verification">Resend verification email</Link>
            </p>
          </div>
        )}
        
        <p>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
