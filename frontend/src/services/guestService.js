import api from './api';

export const guestService = {
  getAllGuests: async () => {
    const response = await api.get('/guests');
    return response.data;
  },

  getGuestById: async (id) => {
    const response = await api.get(`/guests/${id}`);
    return response.data;
  },

  registerGuest: async (guestData) => {
    const response = await api.post('/guests', guestData);
    return response.data;
  },

  updateGuest: async (id, guestData) => {
    const response = await api.put(`/guests/${id}`, guestData);
    return response.data;
  },

  deleteGuest: async (id) => {
    const response = await api.delete(`/guests/${id}`);
    return response.data;
  },

  getLoyaltyPoints: async (id) => {
    const response = await api.get(`/guests/${id}/loyalty-points`);
    return response.data;
  },

  addLoyaltyPoints: async (id, points) => {
    const response = await api.post(`/guests/${id}/loyalty-points`, { points });
    return response.data;
  }
};

export default guestService;
