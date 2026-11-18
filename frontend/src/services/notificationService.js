import api from './api';

const READ_NOTIFICATIONS_KEY = 'read_notification_ids';

const getReadIds = () => {
  const ids = localStorage.getItem(READ_NOTIFICATIONS_KEY);
  return ids ? JSON.parse(ids) : [];
};

export const notificationService = {
  getAllNotifications: async () => {
    const response = await api.get('/notifications');
    // Notifications might come as an array or { count, notifications }
    const notificationsList = response.data.notifications || response.data || [];
    
    // Add read status
    const readIds = getReadIds();
    const mapped = notificationsList.map(n => ({
      ...n,
      read: readIds.includes(n.id)
    }));

    return mapped;
  },

  getNotificationById: async (id) => {
    const response = await api.get(`/notifications/${id}`);
    const readIds = getReadIds();
    return {
      ...response.data,
      read: readIds.includes(response.data.id)
    };
  },

  getNotificationsByGuest: async (guestId) => {
    const response = await api.get(`/notifications/guest/${guestId}`);
    const list = response.data.notifications || response.data || [];
    const readIds = getReadIds();
    return list.map(n => ({
      ...n,
      read: readIds.includes(n.id)
    }));
  },

  sendEmailNotification: async (notifData) => {
    // Expected body: { guestId, bookingId, subject, message, recipientEmail, category }
    const response = await api.post('/notifications/email', notifData);
    return response.data;
  },

  sendSmsNotification: async (notifData) => {
    // Expected body: { guestId, bookingId, subject, message, recipientPhone, category }
    const response = await api.post('/notifications/sms', notifData);
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    
    // Clean up local read status if present
    const readIds = getReadIds();
    const updatedIds = readIds.filter(item => item !== id);
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(updatedIds));
    
    return response.data;
  },

  // Client-side local status management
  markAsRead: (id) => {
    const readIds = getReadIds();
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readIds));
    }
    return true;
  },

  markAllAsRead: (notifications) => {
    const readIds = getReadIds();
    notifications.forEach(n => {
      if (!readIds.includes(n.id)) {
        readIds.push(n.id);
      }
    });
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readIds));
    return true;
  }
};

export default notificationService;
