import api from './api';

export const paymentService = {
  getAllPayments: async () => {
    const response = await api.get('/payments');
    return response.data;
  },

  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  getPaymentsByBooking: async (bookingId) => {
    const response = await api.get(`/payments/booking/${bookingId}`);
    return response.data;
  },

  getPaymentsByGuest: async (guestId) => {
    const response = await api.get(`/payments/guest/${guestId}`);
    return response.data;
  },

  getPaymentsByStatus: async (status) => {
    const response = await api.get(`/payments/status/${status}`);
    return response.data;
  },

  getPaymentSummary: async (bookingId) => {
    const response = await api.get(`/payments/booking/${bookingId}/summary`);
    return response.data;
  },

  processPayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  processRefund: async (id, reason) => {
    const response = await api.post(`/payments/${id}/refund`, { reason });
    return response.data;
  }
};

export default paymentService;
