import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUsers, 
  FiCheckCircle, 
  FiHome, 
  FiCalendar, 
  FiAlertTriangle, 
  FiDollarSign, 
  FiPlus, 
  FiLayers, 
  FiTrendingUp 
} from 'react-icons/fi';
import guestService from '../../services/guestService';
import roomService from '../../services/roomService';
import bookingService from '../../services/bookingService';
import paymentService from '../../services/paymentService';
import Loader from '../../components/Loader/Loader';
import { useToast } from '../../context/ToastContext';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalGuests: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    todaysBookingsCount: 0,
    pendingPaymentsCount: 0,
    monthlyRevenue: 0
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [bookingStatusData, setBookingStatusData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [guests, rooms, bookings, payments] = await Promise.all([
          guestService.getAllGuests(),
          roomService.getAllRooms(),
          bookingService.getAllBookings(),
          paymentService.getAllPayments()
        ]);

        // 1. KPI Calculations
        const totalGuests = guests.length;
        const availableRooms = rooms.filter(r => r.status === 'AVAILABLE').length;
        const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED').length;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysBookings = bookings.filter(b => b.checkInDate === todayStr || b.checkOutDate === todayStr || b.status === 'CHECKED_IN');
        const todaysBookingsCount = todaysBookings.length;

        const pendingPayments = payments.filter(p => p.status === 'PENDING');
        const pendingPaymentsCount = pendingPayments.length;

        const monthlyRevenue = payments
          .filter(p => p.status === 'PAID')
          .reduce((sum, p) => sum + p.amount, 0);

        setStats({
          totalGuests,
          availableRooms,
          occupiedRooms,
          todaysBookingsCount,
          pendingPaymentsCount,
          monthlyRevenue
        });

        // 2. Recent Bookings Table (limit to last 5, enriched with guest/room names)
        const sortedBookings = [...bookings]
          .sort((a, b) => b.id - a.id)
          .slice(0, 5)
          .map(b => {
            const guestObj = guests.find(g => g.id === b.guestId);
            const roomObj = rooms.find(r => r.id === b.roomId);
            return {
              ...b,
              guestName: guestObj ? guestObj.name : `Guest #${b.guestId}`,
              roomNumber: roomObj ? roomObj.roomNumber : `Room #${b.roomId}`,
              roomType: roomObj ? roomObj.type : 'N/A'
            };
          });
        setRecentBookings(sortedBookings);

        // 3. Status Chart calculations (Pie/Donut data)
        const statuses = ['CHECKED_IN', 'CONFIRMED', 'CHECKED_OUT', 'CANCELLED'];
        const statusCounts = statuses.reduce((acc, status) => {
          acc[status] = bookings.filter(b => b.status === status).length;
          return acc;
        }, {});
        
        setBookingStatusData([
          { name: 'Checked In', value: statusCounts['CHECKED_IN'] || 0, color: '#3b82f6' },
          { name: 'Confirmed', value: statusCounts['CONFIRMED'] || 0, color: '#10b981' },
          { name: 'Checked Out', value: statusCounts['CHECKED_OUT'] || 0, color: '#64748b' },
          { name: 'Cancelled', value: statusCounts['CANCELLED'] || 0, color: '#ef4444' }
        ]);

        // 4. Revenue Bar Chart mock distribution (by month)
        // Draw 6 months of revenue up to current
        setRevenueData([
          { month: 'Feb', amount: 3400 },
          { month: 'Mar', amount: 4200 },
          { month: 'Apr', amount: 5100 },
          { month: 'May', amount: 4800 },
          { month: 'Jun', amount: 6200 },
          { month: 'Jul', amount: monthlyRevenue || 2300 }
        ]);

      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
        showToast('Error fetching dashboard statistics.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showToast]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CHECKED_IN': return <span className="badge badge-info">Checked In</span>;
      case 'CONFIRMED': return <span className="badge badge-success">Confirmed</span>;
      case 'CHECKED_OUT': return <span className="badge badge-warning">Checked Out</span>;
      case 'CANCELLED': return <span className="badge badge-danger">Cancelled</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  if (loading) {
    return <Loader overlay={false} />;
  }

  // Helper for donut chart calculations
  const totalBookings = bookingStatusData.reduce((sum, d) => sum + d.value, 0);
  let accumulatedAngle = 0;

  // Max value for revenue scaling in SVG Bar Chart
  const maxRevenue = Math.max(...revenueData.map(d => d.amount), 1000);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Welcome back to Grand Enterprise Admin Dashboard.
          </p>
        </div>
        
        {/* Quick actions panel */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/bookings')}>
            <FiCalendar /> View Bookings
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/bookings?action=new')}>
            <FiPlus /> New Booking
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="card-grid">
        {/* Card 1: Guests */}
        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Total Guests</span>
            <div className="card-icon-container" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#3b82f6' }}>
              <FiUsers />
            </div>
          </div>
          <div className="card-value">{stats.totalGuests}</div>
          <div className="card-desc" style={{ color: 'var(--success)' }}>
            <FiTrendingUp /> <span>Active database</span>
          </div>
        </div>

        {/* Card 2: Available Rooms */}
        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Available Rooms</span>
            <div className="card-icon-container" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <FiCheckCircle />
            </div>
          </div>
          <div className="card-value">{stats.availableRooms}</div>
          <div className="card-desc">
            <span>Ready for occupancy</span>
          </div>
        </div>

        {/* Card 3: Occupied Rooms */}
        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Occupied Rooms</span>
            <div className="card-icon-container" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <FiHome />
            </div>
          </div>
          <div className="card-value">{stats.occupiedRooms}</div>
          <div className="card-desc">
            <span>Guests checked-in</span>
          </div>
        </div>

        {/* Card 4: Today's Bookings */}
        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Today's Activity</span>
            <div className="card-icon-container" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <FiCalendar />
            </div>
          </div>
          <div className="card-value">{stats.todaysBookingsCount}</div>
          <div className="card-desc">
            <span>Bookings active today</span>
          </div>
        </div>

        {/* Card 5: Pending Payments */}
        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Pending Payments</span>
            <div className="card-icon-container" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <FiAlertTriangle />
            </div>
          </div>
          <div className="card-value">{stats.pendingPaymentsCount}</div>
          <div className="card-desc" style={{ color: 'var(--danger-text)' }}>
            <span>Awaiting settlements</span>
          </div>
        </div>

        {/* Card 6: Monthly Revenue */}
        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Gross Revenue</span>
            <div className="card-icon-container" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <FiDollarSign />
            </div>
          </div>
          <div className="card-value">${stats.monthlyRevenue.toFixed(2)}</div>
          <div className="card-desc" style={{ color: 'var(--success)' }}>
            <FiTrendingUp /> <span>Cumulative earnings</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Revenue Bar Chart */}
        <div className="chart-container">
          <div className="chart-title">
            <span>Monthly Revenue ($)</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Last 6 Months</span>
          </div>
          <div className="chart-wrapper">
            <svg width="100%" height="240" viewBox="0 0 500 240" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="180" x2="480" y2="180" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="210" x2="480" y2="210" stroke="#cbd5e1" strokeWidth="1.5" />
              
              {/* Bars */}
              {revenueData.map((d, i) => {
                const barWidth = 32;
                const barSpacing = (440 / revenueData.length);
                const x = 50 + i * barSpacing + (barSpacing - barWidth) / 2;
                const barHeight = (d.amount / maxRevenue) * 160;
                const y = 210 - barHeight;

                return (
                  <g key={d.month}>
                    {/* Hover text showing value */}
                    <text 
                      x={x + barWidth / 2} 
                      y={y - 8} 
                      textAnchor="middle" 
                      fill="var(--text-color)" 
                      fontSize="10" 
                      fontWeight="600"
                    >
                      ${d.amount}
                    </text>
                    {/* The Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill="url(#barGradient)"
                    />
                    {/* Month Label */}
                    <text 
                      x={x + barWidth / 2} 
                      y="230" 
                      textAnchor="middle" 
                      fill="var(--text-secondary)" 
                      fontSize="11" 
                      fontWeight="500"
                    >
                      {d.month}
                    </text>
                  </g>
                );
              })}
              
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Booking Status Pie Chart */}
        <div className="chart-container">
          <div className="chart-title">Booking Proportions</div>
          <div className="chart-wrapper" style={{ flexDirection: 'column', height: 'auto', gap: '1.25rem', padding: '1rem 0' }}>
            {totalBookings === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No data available</div>
            ) : (
              <>
                {/* SVG Donut */}
                <svg width="140" height="140" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4.2" />
                  {bookingStatusData.map((d) => {
                    if (d.value === 0) return null;
                    const percentage = (d.value / totalBookings) * 100;
                    const strokeDashArray = `${percentage} ${100 - percentage}`;
                    const strokeDashOffset = 100 - accumulatedAngle;
                    accumulatedAngle += percentage;
                    
                    return (
                      <circle
                        key={d.name}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke={d.color}
                        strokeWidth="4.2"
                        strokeDasharray={strokeDashArray}
                        strokeDashoffset={strokeDashOffset}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Count */}
                <div style={{ position: 'absolute', top: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>{totalBookings}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bookings</span>
                </div>

                {/* Legend */}
                <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                  {bookingStatusData.map((d) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: d.color, display: 'inline-block' }}></span>
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}:</span>
                      <strong style={{ marginLeft: 'auto' }}>{d.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="table-container">
        <div style={{ padding: '1.25rem 1.5rem', fontWeight: '600', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Recent Bookings</span>
          <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => navigate('/bookings')}>
            View All
          </button>
        </div>
        
        {recentBookings.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No bookings recorded yet.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Type</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id}>
                  <td><strong>#{b.id}</strong></td>
                  <td>{b.guestName}</td>
                  <td>{b.roomNumber}</td>
                  <td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.roomType}</span></td>
                  <td>{b.checkInDate}</td>
                  <td>{b.checkOutDate}</td>
                  <td><strong>${b.totalAmount.toFixed(2)}</strong></td>
                  <td>{getStatusBadge(b.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
