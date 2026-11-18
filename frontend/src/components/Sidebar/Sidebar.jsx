import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiGrid, 
  FiUsers, 
  FiLayers, 
  FiCalendar, 
  FiCreditCard, 
  FiBell, 
  FiLogOut 
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <FiGrid /> },
    { name: 'Guests', path: '/guests', icon: <FiUsers /> },
    { name: 'Rooms', path: '/rooms', icon: <FiLayers /> },
    { name: 'Bookings', path: '/bookings', icon: <FiCalendar /> },
    { name: 'Payments', path: '/payments', icon: <FiCreditCard /> },
    { name: 'Notifications', path: '/notifications', icon: <FiBell /> }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <FiLayers style={{ color: 'var(--primary-color)' }} />
        <span>Grand Enterprise</span>
      </div>
      
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.name} className="sidebar-item">
            <NavLink 
              to={item.path} 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      
      <div className="sidebar-footer">
        <button 
          className="sidebar-link" 
          onClick={logout} 
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
        >
          <span className="sidebar-link-icon"><FiLogOut /></span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
