import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiEdit2, FiXCircle, FiCheck, FiLogOut, FiCalendar } from 'react-icons/fi';
import bookingService from '../../services/bookingService';
import guestService from '../../services/guestService';
import roomService from '../../services/roomService';
import Loader from '../../components/Loader/Loader';
import Modal from '../../components/Modals/Modal';
import ConfirmationDialog from '../../components/Modals/ConfirmationDialog';
import { useToast } from '../../context/ToastContext';

export const Booking = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // Form states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formData, setFormData] = useState({
    guestId: '',
    roomId: '',
    checkInDate: '',
    checkOutDate: '',
    guestsCount: 1,
    specialRequests: '',
    status: 'CONFIRMED'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, guestsData, roomsData] = await Promise.all([
        bookingService.getAllBookings(),
        guestService.getAllGuests(),
        roomService.getAllRooms()
      ]);
      
      // Enrich bookings with guest and room info
      const enrichedBookings = bookingsData.map(b => {
        const guestObj = guestsData.find(g => g.id === b.guestId);
        const roomObj = roomsData.find(r => r.id === b.roomId);
        return {
          ...b,
          guestName: guestObj ? guestObj.name : `Guest #${b.guestId}`,
          guestEmail: guestObj ? guestObj.email : '',
          roomNumber: roomObj ? roomObj.roomNumber : `Room #${b.roomId}`,
          roomType: roomObj ? roomObj.type : 'N/A'
        };
      });

      setBookings(enrichedBookings);
      setGuests(guestsData);
      setRooms(roomsData);
    } catch (err) {
      showToast('Failed to fetch bookings list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to URL parameters (e.g. ?action=new from Dashboard)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new' && !loading && guests.length > 0 && rooms.length > 0) {
      handleOpenAddForm();
      // Remove query parameter to prevent reopening on reload
      navigate('/bookings', { replace: true });
    }
  }, [location.search, loading, guests.length, rooms.length]);

  // Filters logic
  const filteredBookings = bookings.filter(b => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      b.guestName?.toLowerCase().includes(searchLower) ||
      b.roomNumber?.toLowerCase().includes(searchLower) ||
      b.id.toString().includes(searchLower);

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Modal Triggers
  const handleOpenAddForm = () => {
    setSelectedBooking(null);
    setFormData({
      guestId: guests[0]?.id || '',
      roomId: rooms.filter(r => r.status === 'AVAILABLE')[0]?.id || rooms[0]?.id || '',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
      guestsCount: 1,
      specialRequests: '',
      status: 'CONFIRMED'
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (booking) => {
    setSelectedBooking(booking);
    setFormData({
      guestId: booking.guestId || '',
      roomId: booking.roomId || '',
      checkInDate: booking.checkInDate || '',
      checkOutDate: booking.checkOutDate || '',
      guestsCount: booking.guestsCount || 1,
      specialRequests: booking.specialRequests || '',
      status: booking.status || 'CONFIRMED'
    });
    setIsFormOpen(true);
  };

  const handleOpenCancel = (booking) => {
    setSelectedBooking(booking);
    setIsCancelOpen(true);
  };

  // Status transitions
  const handleCheckIn = async (id) => {
    try {
      await bookingService.updateBookingStatus(id, 'CHECKED_IN');
      showToast('Guest checked in successfully.', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to complete check-in.', 'error');
    }
  };

  const handleCheckOut = async (id) => {
    try {
      await bookingService.updateBookingStatus(id, 'CHECKED_OUT');
      showToast('Guest checked out successfully.', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to complete check-out.', 'error');
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        guestId: parseInt(formData.guestId),
        roomId: parseInt(formData.roomId),
        guestsCount: parseInt(formData.guestsCount)
      };

      if (selectedBooking) {
        await bookingService.updateBooking(selectedBooking.id, payload);
        showToast('Booking updated successfully.', 'success');
      } else {
        await bookingService.createBooking(payload);
        showToast('New booking registered successfully.', 'success');
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      showToast('Operation failed. Check values.', 'error');
    }
  };

  const handleCancelConfirm = async () => {
    if (!selectedBooking) return;
    try {
      await bookingService.cancelBooking(selectedBooking.id);
      showToast('Reservation cancelled successfully.', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to cancel reservation.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CHECKED_IN': return <span className="badge badge-info">Checked In</span>;
      case 'CONFIRMED': return <span className="badge badge-success">Confirmed</span>;
      case 'CHECKED_OUT': return <span className="badge badge-warning">Checked Out</span>;
      case 'CANCELLED': return <span className="badge badge-danger">Cancelled</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Reservations & Bookings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Book rooms, perform guest check-in/check-out, and maintain reservation histories.
          </p>
        </div>
        
        <button className="btn btn-primary" onClick={handleOpenAddForm}>
          <FiPlus /> New Booking
        </button>
      </div>

      {/* Filters and search */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon"><FiSearch /></span>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by Guest name, Room number, Booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <select 
            className="form-control" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: '160px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader overlay={false} />
      ) : (
        <div className="table-container">
          {filteredBookings.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No reservations found matching filters.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Guest Name</th>
                  <th>Room #</th>
                  <th>Room Type</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id}>
                    <td><strong>#{b.id}</strong></td>
                    <td>
                      <div><strong>{b.guestName}</strong></div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.guestEmail}</div>
                    </td>
                    <td><strong>{b.roomNumber}</strong></td>
                    <td><span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{b.roomType}</span></td>
                    <td>{b.checkInDate}</td>
                    <td>{b.checkOutDate}</td>
                    <td><strong>${b.totalAmount?.toFixed(2)}</strong></td>
                    <td>{getStatusBadge(b.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        
                        {/* Quick Check-in */}
                        {b.status === 'CONFIRMED' && (
                          <button 
                            className="btn btn-secondary btn-icon-only" 
                            title="Check In Guest"
                            onClick={() => handleCheckIn(b.id)}
                            style={{ color: 'var(--success-text)', backgroundColor: 'var(--success-light)', borderColor: 'transparent' }}
                          >
                            <FiCheck />
                          </button>
                        )}

                        {/* Quick Check-out */}
                        {b.status === 'CHECKED_IN' && (
                          <button 
                            className="btn btn-secondary btn-icon-only" 
                            title="Check Out Guest"
                            onClick={() => handleCheckOut(b.id)}
                            style={{ color: 'var(--warning-text)', backgroundColor: 'var(--warning-light)', borderColor: 'transparent' }}
                          >
                            <FiLogOut />
                          </button>
                        )}

                        {/* Edit and cancel shortcuts */}
                        {b.status !== 'CHECKED_OUT' && b.status !== 'CANCELLED' && (
                          <>
                            <button 
                              className="btn btn-secondary btn-icon-only" 
                              title="Edit Booking"
                              onClick={() => handleOpenEditForm(b)}
                            >
                              <FiEdit2 />
                            </button>
                            <button 
                              className="btn btn-secondary btn-icon-only" 
                              title="Cancel Reservation"
                              onClick={() => handleOpenCancel(b)}
                              style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-light)', borderColor: 'transparent' }}
                            >
                              <FiXCircle />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add / Edit Booking Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedBooking ? `Modify Reservation (#${selectedBooking.id})` : 'Create New Booking'}
      >
        <form onSubmit={handleSubmitForm}>
          <div className="form-group">
            <label className="form-label">Select Guest</label>
            <select 
              className="form-control" 
              value={formData.guestId}
              onChange={(e) => setFormData({ ...formData, guestId: e.target.value })}
              required
            >
              {guests.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.email})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Select Room</label>
              <select 
                className="form-control" 
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                required
              >
                {/* When creating, show available rooms primarily */}
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} - {r.type} (${r.pricePerNight}/night) [{r.status}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Guests</label>
              <input 
                type="number" 
                className="form-control" 
                value={formData.guestsCount}
                onChange={(e) => setFormData({ ...formData, guestsCount: e.target.value })}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Check-in Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={formData.checkInDate}
                onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Check-out Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={formData.checkOutDate}
                onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reservation Status</label>
            <select 
              className="form-control" 
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Special Demands / Requests</label>
            <textarea 
              className="form-control" 
              rows="2"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              placeholder="e.g. Vegetarian breakfast, extra keys, early check-in, etc."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Booking
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation */}
      <ConfirmationDialog 
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Hotel Booking"
        message={`Are you sure you want to cancel booking reservation #${selectedBooking?.id} for "${selectedBooking?.guestName}"? Room #${selectedBooking?.roomNumber} will be released immediately.`}
        confirmText="Cancel Reservation"
      />

    </div>
  );
};

export default Booking;
