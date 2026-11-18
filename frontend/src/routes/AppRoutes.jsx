import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader/Loader';

// Layout
import MainLayout from '../layouts/MainLayout';

// Pages
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard';
import Guest from '../pages/Guest/Guest';
import Room from '../pages/Room/Room';
import Booking from '../pages/Booking/Booking';
import Payment from '../pages/Payment/Payment';
import Notification from '../pages/Notification/Notification';

// Route Guard Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader overlay={true} />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Route */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />

      {/* Protected Routes under MainLayout */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="guests" element={<Guest />} />
        <Route path="rooms" element={<Room />} />
        <Route path="bookings" element={<Booking />} />
        <Route path="payments" element={<Payment />} />
        <Route path="notifications" element={<Notification />} />
      </Route>

      {/* Wildcard Fallback */}
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
      />
    </Routes>
  );
};

export default AppRoutes;
