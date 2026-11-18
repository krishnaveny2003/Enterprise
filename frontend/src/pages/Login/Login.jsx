import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLayers, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader/Loader';

export const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('admin@hotel.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await login(username, password);
      showToast('Logged in successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid username or password.');
      showToast('Login failed. Please check credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {submitting && <Loader overlay={true} />}
      
      <div className="login-card">
        <div className="login-logo">
          <FiLayers />
        </div>
        <h2 className="login-title">Grand Enterprise</h2>
        <p className="login-subtitle">Hotel Management System Portal</p>
        
        {error && (
          <div className="login-error">
            <FiAlertTriangle />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Email Address</label>
            <input 
              type="email" 
              id="username" 
              className="form-control" 
              placeholder="e.g. admin@hotel.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              className="form-control" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            disabled={submitting}
          >
            Sign In to Dashboard
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Demo Credentials: admin@hotel.com / admin123</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
