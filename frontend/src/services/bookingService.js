import api from './api';

export const bookingService = {
  getAllBookings: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  getBookingDetails: async (id) => {
    const response = await api.get(`/bookings/${id}/details`);
    return response.data;
  },

  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  updateBooking: async (id, bookingData) => {
    const response = await api.put(`/bookings/${id}`, bookingData);
    return response.data;
  },

  cancelBooking: async (id) => {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  },

  getBookingsByGuest: async (guestId) => {
    const response = await api.get(`/bookings/guest/${guestId}`);
    return response.data;
  },

  getBookingsByStatus: async (status) => {
    const response = await api.get(`/bookings/status/${status}`);
    return response.data;
  },

  updateBookingStatus: async (id, status) => {
    const response = await api.patch(`/bookings/${id}/status?status=${status}`);
    return response.data;
  }
};

export default bookingService;
