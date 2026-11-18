import React, { useState, useEffect } from 'react';
import { FiBell, FiMail, FiSmartphone, FiTrash2, FiCheckSquare, FiPlus, FiSend } from 'react-icons/fi';
import notificationService from '../../services/notificationService';
import guestService from '../../services/guestService';
import bookingService from '../../services/bookingService';
import Loader from '../../components/Loader/Loader';
import Modal from '../../components/Modals/Modal';
import ConfirmationDialog from '../../components/Modals/ConfirmationDialog';
import { useToast } from '../../context/ToastContext';

export const Notification = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [guests, setGuests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals state
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    guestId: '',
    bookingId: '',
    type: 'EMAIL', // EMAIL or SMS
    subject: '',
    message: '',
    recipientEmail: '',
    recipientPhone: '',
    category: 'GENERAL'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notifsData, guestsData, bookingsData] = await Promise.all([
        notificationService.getAllNotifications(),
        guestService.getAllGuests(),
        bookingService.getAllBookings()
      ]);

      // Enrich notification records with Guest names
      const enriched = notifsData.map(n => {
        const guestObj = guestsData.find(g => g.id === n.guestId);
        return {
          ...n,
          guestName: guestObj ? guestObj.name : `Guest #${n.guestId}`
        };
      });

      setNotifications(enriched);
      setGuests(guestsData);
      
      // Filter bookings to associate
      setBookings(bookingsData);

      // Count unread
      const unread = enriched.filter(n => !n.read).length;
      setUnreadCount(unread);

    } catch (err) {
      showToast('Failed to fetch communications records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update recipient email/phone when guest is chosen
  useEffect(() => {
    if (formData.guestId && guests.length > 0) {
      const selectedGuest = guests.find(g => g.id === parseInt(formData.guestId));
      if (selectedGuest) {
        setFormData(prev => ({
          ...prev,
          recipientEmail: selectedGuest.email || '',
          recipientPhone: selectedGuest.phone || ''
        }));
      }
    }
  }, [formData.guestId, guests]);

  const handleOpenSendModal = () => {
    setFormData({
      guestId: guests[0]?.id || '',
      bookingId: '',
      type: 'EMAIL',
      subject: '',
      message: '',
      recipientEmail: guests[0]?.email || '',
      recipientPhone: guests[0]?.phone || '',
      category: 'GENERAL'
    });
    setIsSendOpen(true);
  };

  const handleMarkAsRead = (id) => {
    notificationService.markAsRead(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    // Recalculate unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
    showToast('Notification marked as read.', 'info');
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead(notifications);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    showToast('All notifications marked as read.', 'success');
  };

  const handleOpenDelete = (notif) => {
    setSelectedNotif(notif);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedNotif) return;
    try {
      await notificationService.deleteNotification(selectedNotif.id);
      showToast('Communication log deleted successfully.', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to delete notification.', 'error');
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        guestId: parseInt(formData.guestId),
        bookingId: formData.bookingId ? parseInt(formData.bookingId) : null
      };

      if (formData.type === 'EMAIL') {
        await notificationService.sendEmailNotification({
          guestId: payload.guestId,
          bookingId: payload.bookingId,
          subject: payload.subject,
          message: payload.message,
          recipientEmail: payload.recipientEmail,
          category: payload.category
        });
      } else {
        await notificationService.sendSmsNotification({
          guestId: payload.guestId,
          bookingId: payload.bookingId,
          subject: payload.subject,
          message: payload.message,
          recipientPhone: payload.recipientPhone,
          category: payload.category
        });
      }

      showToast(`Notification sent successfully via ${formData.type.toLowerCase()}.`, 'success');
      setIsSendOpen(false);
      fetchData();
    } catch (err) {
      showToast('Failed to send notification request.', 'error');
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'BOOKING_CONFIRMATION':
      case 'BOOKING_CANCELLATION':
        return '#3b82f6';
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_REFUND':
        return '#10b981';
      case 'CHECK_IN_REMINDER':
      case 'CHECK_OUT_REMINDER':
        return '#8b5cf6';
      default:
        return '#64748b';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Communications Desk</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Review outbox logs of Email & SMS notifications dispatched to hotel guests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={handleMarkAllAsRead}>
              <FiCheckSquare /> Mark All Read
            </button>
          )}
          <button className="btn btn-primary" onClick={handleOpenSendModal}>
            <FiPlus /> Dispatch Alert
          </button>
        </div>
      </div>

      {loading ? (
        <Loader overlay={false} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Outbox list */}
          {notifications.length === 0 ? (
            <div className="table-container" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No communications logs found.
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className="card" 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'flex-start', 
                  gap: '1.25rem',
                  padding: '1.25rem',
                  borderLeft: `4px solid ${n.read ? 'transparent' : 'var(--primary-color)'}`,
                  backgroundColor: n.read ? 'var(--card-bg)' : 'var(--primary-light)'
                }}
              >
                {/* Icon indicator */}
                <div style={{ 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: n.type === 'EMAIL' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: n.type === 'EMAIL' ? '#3b82f6' : '#10b981',
                  fontSize: '1.25rem',
                  display: 'flex'
                }}>
                  {n.type === 'EMAIL' ? <FiMail /> : <FiSmartphone />}
                </div>

                {/* Body Content */}
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                      {n.subject}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.5rem 0 0.75rem 0' }}>
                    <span style={{ 
                      fontSize: '0.68rem', 
                      fontWeight: '700', 
                      color: 'white', 
                      backgroundColor: getCategoryColor(n.category), 
                      padding: '0.15rem 0.5rem', 
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      {n.category.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Recipient: <strong>{n.guestName}</strong> ({n.type === 'EMAIL' ? n.recipientEmail : n.recipientPhone})
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-color)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    {n.message}
                  </p>
                </div>

                {/* Action Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span className={`badge ${n.status === 'SENT' ? 'badge-success' : n.status === 'FAILED' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                    {n.status}
                  </span>
                  
                  <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                    {!n.read && (
                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        title="Mark as Read"
                        onClick={() => handleMarkAsRead(n.id)}
                        style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                      >
                        <FiCheckSquare />
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary btn-icon-only" 
                      title="Delete Log"
                      onClick={() => handleOpenDelete(n)}
                      style={{ fontSize: '0.8rem', padding: '0.4rem', color: 'var(--danger-text)', backgroundColor: 'var(--danger-light)', borderColor: 'transparent' }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}

        </div>
      )}

      {/* Dispatch Alert Modal */}
      <Modal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        title="Dispatch Custom Communication Alert"
      >
        <form onSubmit={handleSendNotification}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Recipient Guest</label>
              <select 
                className="form-control" 
                value={formData.guestId}
                onChange={(e) => setFormData({ ...formData, guestId: e.target.value })}
                required
              >
                {guests.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Link to Reservation (Optional)</label>
              <select 
                className="form-control" 
                value={formData.bookingId}
                onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
              >
                <option value="">No Associated Booking</option>
                {bookings
                  .filter(b => b.guestId === parseInt(formData.guestId))
                  .map(b => (
                    <option key={b.id} value={b.id}>Booking #{b.id} (Room {b.roomNumber})</option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Transmission Channel</label>
              <select 
                className="form-control" 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="EMAIL">Send via Email</option>
                <option value="SMS">Send via SMS</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Message Category</label>
              <select 
                className="form-control" 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="GENERAL">General Notice</option>
                <option value="BOOKING_CONFIRMATION">Booking Confirmation</option>
                <option value="BOOKING_CANCELLATION">Booking Cancellation</option>
                <option value="PAYMENT_SUCCESS">Payment Success Receipt</option>
                <option value="CHECK_IN_REMINDER">Check-In Reminder</option>
                <option value="CHECK_OUT_REMINDER">Check-Out Survey</option>
              </select>
            </div>
          </div>

          {/* Recipient Details display */}
          <div className="form-group">
            <label className="form-label">
              {formData.type === 'EMAIL' ? 'Recipient Email Address' : 'Recipient Phone Number'}
            </label>
            {formData.type === 'EMAIL' ? (
              <input 
                type="email" 
                className="form-control" 
                value={formData.recipientEmail}
                onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                required
              />
            ) : (
              <input 
                type="text" 
                className="form-control" 
                value={formData.recipientPhone}
                onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                required
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Subject / Header</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Reservation Confirmation details"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Message Body</label>
            <textarea 
              className="form-control" 
              rows="4" 
              placeholder="Write your email/SMS content here..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSendOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <FiSend /> Dispatch Now
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Communication Log"
        message="Are you sure you want to delete this communication record from the outbox? This is a permanent audit action and cannot be undone."
        confirmText="Delete Record"
      />

    </div>
  );
};

export default Notification;
