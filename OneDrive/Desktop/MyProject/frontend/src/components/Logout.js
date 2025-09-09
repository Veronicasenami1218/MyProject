import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [sessionDuration, setSessionDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
      const loginTime = localStorage.getItem('loginTime') || new Date().toISOString();
      
      if (currentUser) {
        setUserInfo(currentUser);
        
        // Calculate session duration
        const loginDate = new Date(loginTime);
        const now = new Date();
        const duration = Math.floor((now - loginDate) / 1000 / 60); // minutes
        setSessionDuration(formatDuration(duration));
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      navigate('/login');
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    setLoading(true);
    
    try {
      // Call backend logout
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        }
      });
      
      // Clear local storage
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('loginTime');
      
      // Redirect to home
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if backend call fails
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('loginTime');
      navigate('/');
    }
  };

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="logout-container">
      <div className="logout-card">
        <div className="logout-header">
          <h2>Confirm Logout</h2>
          <p>Are you sure you want to log out?</p>
        </div>

        <div className="user-info">
          <h3>Current Session</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>User:</label>
              <span>{userInfo.firstName || userInfo.email || 'User'}</span>
            </div>
            <div className="info-item">
              <label>Role:</label>
              <span>{userInfo.role || 'User'}</span>
            </div>
            <div className="info-item">
              <label>Session Duration:</label>
              <span>{sessionDuration}</span>
            </div>
          </div>
        </div>

        <div className="logout-actions">
          <button 
            onClick={handleCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            onClick={handleLogout}
            className="btn btn-danger"
            disabled={loading}
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logout; 