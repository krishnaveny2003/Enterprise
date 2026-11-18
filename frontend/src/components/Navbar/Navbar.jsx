import React, { useState, useEffect } from 'react';
import { FiMenu, FiBell, FiLogOut, FiSun, FiMoon } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Read notifications from LocalStorage to update unread badge
  useEffect(() => {
    const checkNotifications = () => {
      const allNotifsStr = localStorage.getItem('mock_notifications');
      const readIdsStr = localStorage.getItem('read_notification_ids');
      
      const allNotifs = allNotifsStr ? JSON.parse(allNotifsStr) : [];
      const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
      
      const unread = allNotifs.filter(n => !readIds.includes(n.id));
      setUnreadCount(unread.length);
    };

    checkNotifications();
    
    // Poll every 3 seconds to keep badge fresh
    const interval = setInterval(checkNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={onToggleSidebar}>
          <FiMenu />
        </button>
        <span className="navbar-title">HMS Management Portal</span>
      </div>

      <div className="navbar-right">
        {/* Theme Toggle */}
        <button 
          className="navbar-icon-btn" 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <FiMoon /> : <FiSun />}
        </button>

        {/* Notifications Icon with Badge */}
        <button 
          className="navbar-icon-btn" 
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          <FiBell />
          {unreadCount > 0 && <span className="navbar-badge">{unreadCount}</span>}
        </button>

        {/* User Profile */}
        <div className="navbar-profile">
          <div className="navbar-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="navbar-user-info">
            <span className="navbar-username">{user?.name || 'Admin User'}</span>
            <span className="navbar-userrole">{user?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Staff'}</span>
          </div>
        </div>

        {/* Quick Logout */}
        <button 
          className="navbar-icon-btn" 
          onClick={logout} 
          title="Logout"
          style={{ marginLeft: '0.25rem' }}
        >
          <FiLogOut />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
