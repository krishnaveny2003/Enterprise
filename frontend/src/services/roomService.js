import api from './api';

export const roomService = {
  getAllRooms: async () => {
    const response = await api.get('/rooms');
    return response.data;
  },

  getRoomById: async (id) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  getRoomByNumber: async (roomNumber) => {
    const response = await api.get(`/rooms/number/${roomNumber}`);
    return response.data;
  },

  addRoom: async (roomData) => {
    const response = await api.post('/rooms', roomData);
    return response.data;
  },

  updateRoom: async (id, roomData) => {
    const response = await api.put(`/rooms/${id}`, roomData);
    return response.data;
  },

  deleteRoom: async (id) => {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  },

  getAvailableRooms: async () => {
    const response = await api.get('/rooms/available');
    return response.data;
  },

  getRoomsByType: async (type) => {
    const response = await api.get(`/rooms/type/${type}`);
    return response.data;
  },

  updateRoomStatus: async (id, status) => {
    const response = await api.patch(`/rooms/${id}/status?status=${status}`);
    return response.data;
  }
};

export default roomService;
