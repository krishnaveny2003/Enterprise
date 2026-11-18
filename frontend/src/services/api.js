import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// INITIAL MOCK DATA DEFINITIONS
const initialGuests = [
  { id: 1, name: 'John Doe', email: 'john.doe@gmail.com', phone: '+1 555-0199', loyaltyPoints: 120, address: 'New York, USA' },
  { id: 2, name: 'Sarah Jenkins', email: 'sarah.j@yahoo.com', phone: '+1 555-0143', loyaltyPoints: 340, address: 'London, UK' },
  { id: 3, name: 'Michael Chang', email: 'mchang@gmail.com', phone: '+86 139-1234', loyaltyPoints: 50, address: 'Beijing, China' },
  { id: 4, name: 'Emma Watson', email: 'emma@watson.co.uk', phone: '+44 7700-9000', loyaltyPoints: 450, address: 'Oxford, UK' },
  { id: 5, name: 'Carlos Santana', email: 'carlos@santanaband.com', phone: '+52 55-1234-5678', loyaltyPoints: 0, address: 'Guadalajara, Mexico' }
];

const initialRooms = [
  { id: 1, roomNumber: '101', type: 'SINGLE', pricePerNight: 80.00, status: 'AVAILABLE', maxGuests: 1, floorNumber: 1, description: 'Cozy single room with high speed Wi-Fi, desk, and garden view.', amenities: 'Wi-Fi, AC, TV, Desk' },
  { id: 2, roomNumber: '102', type: 'DOUBLE', pricePerNight: 120.00, status: 'OCCUPIED', maxGuests: 2, floorNumber: 1, description: 'Standard double room ideal for couples, modern bathroom.', amenities: 'Wi-Fi, AC, Minibar, TV' },
  { id: 3, roomNumber: '201', type: 'DELUXE', pricePerNight: 200.00, status: 'AVAILABLE', maxGuests: 3, floorNumber: 2, description: 'Spacious deluxe room with balcony, king size bed and lounge area.', amenities: 'Wi-Fi, AC, Balcony, Minibar, Safe' },
  { id: 4, roomNumber: '202', type: 'SUITE', pricePerNight: 350.00, status: 'AVAILABLE', maxGuests: 4, floorNumber: 2, description: 'Executive suite with private kitchen, jacuzzi, and panoramic sea views.', amenities: 'Wi-Fi, AC, Jacuzzi, Kitchen, Sea View, Balcony' },
  { id: 5, roomNumber: '301', type: 'SINGLE', pricePerNight: 85.00, status: 'MAINTENANCE', maxGuests: 1, floorNumber: 3, description: 'Single room under standard maintenance.', amenities: 'Wi-Fi, AC, TV' },
  { id: 6, roomNumber: '302', type: 'DOUBLE', pricePerNight: 125.00, status: 'AVAILABLE', maxGuests: 2, floorNumber: 3, description: 'Comfortable double room with city skyline views.', amenities: 'Wi-Fi, AC, TV, Coffee Maker' }
];

const initialBookings = [
  { id: 1, guestId: 1, roomId: 2, checkInDate: '2026-07-10', checkOutDate: '2026-07-15', status: 'CHECKED_IN', totalAmount: 600.00, guestsCount: 2, specialRequests: 'Near elevator, extra pillows' },
  { id: 2, guestId: 2, roomId: 4, checkInDate: '2026-07-18', checkOutDate: '2026-07-22', status: 'CONFIRMED', totalAmount: 1400.00, guestsCount: 2, specialRequests: 'Late arrival check-in' },
  { id: 3, guestId: 3, roomId: 1, checkInDate: '2026-07-05', checkOutDate: '2026-07-09', status: 'CHECKED_OUT', totalAmount: 320.00, guestsCount: 1, specialRequests: '' },
  { id: 4, guestId: 4, roomId: 3, checkInDate: '2026-07-12', checkOutDate: '2026-07-14', status: 'CANCELLED', totalAmount: 400.00, guestsCount: 2, specialRequests: 'High floor preferred' }
];

const initialPayments = [
  { id: 1, bookingId: 1, guestId: 1, amount: 600.00, paymentMethod: 'CREDIT_CARD', status: 'PAID', transactionId: 'TXN-982312-321', paymentDate: '2026-07-10T14:32:00.000Z' },
  { id: 2, bookingId: 2, guestId: 2, amount: 1400.00, paymentMethod: 'CREDIT_CARD', status: 'PENDING', transactionId: 'TXN-PENDING-432', paymentDate: null },
  { id: 3, bookingId: 3, guestId: 3, amount: 320.00, paymentMethod: 'CASH', status: 'PAID', transactionId: 'TXN-128472-881', paymentDate: '2026-07-09T10:15:00.000Z' },
  { id: 4, bookingId: 4, guestId: 4, amount: 400.00, paymentMethod: 'PAYPAL', status: 'REFUNDED', transactionId: 'TXN-REFUND-902', paymentDate: '2026-07-08T09:12:00.000Z' }
];

const initialNotifications = [
  { id: 1, guestId: 1, bookingId: 1, type: 'EMAIL', subject: 'Booking Confirmation', message: 'Hello John Doe, your booking for Room 102 has been checked in successfully from 2026-07-10 to 2026-07-15.', recipientEmail: 'john.doe@gmail.com', status: 'SENT', category: 'BOOKING_CONFIRMATION', sentAt: '2026-07-10T14:35:00.000Z' },
  { id: 2, guestId: 2, bookingId: 2, type: 'EMAIL', subject: 'Upcoming Reservation Reminder', message: 'Hello Sarah Jenkins, we look forward to hosting you on 2026-07-18 in our Premium Suite (Room 202). Please let us know if you have any special requirements.', recipientEmail: 'sarah.j@yahoo.com', status: 'SENT', category: 'CHECK_IN_REMINDER', sentAt: '2026-07-14T09:00:00.000Z' },
  { id: 3, guestId: 3, bookingId: 3, type: 'SMS', subject: 'Receipt Issued', message: 'Payment of $320.00 received for Booking #3. Thank you for staying at Enterprise Hotel!', recipientPhone: '+86 139-1234', status: 'SENT', category: 'PAYMENT_SUCCESS', sentAt: '2026-07-09T10:16:00.000Z' },
  { id: 4, guestId: 4, bookingId: 4, type: 'EMAIL', subject: 'Booking Cancellation Confirmed', message: 'Your booking reservation #4 has been cancelled and a refund of $400.00 has been issued to your original payment method.', recipientEmail: 'emma@watson.co.uk', status: 'SENT', category: 'BOOKING_CANCELLATION', sentAt: '2026-07-08T09:15:00.000Z' }
];

// Helper to initialize local storage mock DB if not present
const initMockDb = () => {
  if (!localStorage.getItem('mock_guests')) localStorage.setItem('mock_guests', JSON.stringify(initialGuests));
  if (!localStorage.getItem('mock_rooms')) localStorage.setItem('mock_rooms', JSON.stringify(initialRooms));
  if (!localStorage.getItem('mock_bookings')) localStorage.setItem('mock_bookings', JSON.stringify(initialBookings));
  if (!localStorage.getItem('mock_payments')) localStorage.setItem('mock_payments', JSON.stringify(initialPayments));
  if (!localStorage.getItem('mock_notifications')) localStorage.setItem('mock_notifications', JSON.stringify(initialNotifications));
};

initMockDb();

// Read operations helper
const getMockData = (key) => JSON.parse(localStorage.getItem(`mock_${key}`));
const saveMockData = (key, data) => localStorage.setItem(`mock_${key}`, JSON.stringify(data));

// INTERCEPT NETWORK ERRORS & EMULATE REST API
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if network error (backend offline) or explicitly 404/500 which we want to mock
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK';
    const isMockRoute = originalRequest.url.startsWith('/auth') || 
                        originalRequest.url.includes('/guests') || 
                        originalRequest.url.includes('/rooms') || 
                        originalRequest.url.includes('/bookings') || 
                        originalRequest.url.includes('/payments') || 
                        originalRequest.url.includes('/notifications');
                        
    if (isNetworkError && isMockRoute) {
      console.warn(`⚠️ API Server offline. Emulating request: ${originalRequest.method.toUpperCase()} ${originalRequest.url}`);
      
      const url = originalRequest.url;
      const method = originalRequest.method.toLowerCase();
      const body = originalRequest.data ? JSON.parse(originalRequest.data) : null;
      
      // Setup a simulated response
      let data = null;
      let status = 200;

      // ─── AUTHENTICATION MOCK ───
      if (url.includes('/auth/login')) {
        const { username, password } = body;
        if (username === 'admin@hotel.com' && password === 'admin123') {
          data = {
            token: 'mock-jwt-token-xyz-12345',
            user: { id: 1, name: 'Admin User', email: 'admin@hotel.com', role: 'ROLE_ADMIN' }
          };
          status = 200;
        } else {
          data = { error: 'Bad credentials', message: 'Invalid username or password' };
          status = 401;
        }
      }

      // ─── GUESTS CRUD MOCK ───
      else if (url.endsWith('/guests') || url.includes('/guests?')) {
        if (method === 'get') {
          data = getMockData('guests');
        } else if (method === 'post') {
          const guests = getMockData('guests');
          const newGuest = {
            ...body,
            id: guests.length > 0 ? Math.max(...guests.map(g => g.id)) + 1 : 1,
            loyaltyPoints: body.loyaltyPoints || 0
          };
          guests.push(newGuest);
          saveMockData('guests', guests);
          data = newGuest;
          status = 201;
        }
      } else if (url.match(/\/guests\/\d+$/)) {
        const id = parseInt(url.split('/').pop());
        const guests = getMockData('guests');
        const guestIndex = guests.findIndex(g => g.id === id);

        if (method === 'get') {
          data = guests[guestIndex];
          if (!data) status = 404;
        } else if (method === 'put') {
          if (guestIndex > -1) {
            guests[guestIndex] = { ...guests[guestIndex], ...body, id };
            saveMockData('guests', guests);
            data = guests[guestIndex];
          } else {
            status = 404;
          }
        } else if (method === 'delete') {
          if (guestIndex > -1) {
            guests.splice(guestIndex, 1);
            saveMockData('guests', guests);
            data = { message: `Guest with ID ${id} deleted successfully` };
          } else {
            status = 404;
          }
        }
      } else if (url.match(/\/guests\/\d+\/loyalty-points$/)) {
        const id = parseInt(url.split('/')[url.split('/').length - 2]);
        const guests = getMockData('guests');
        const guestIndex = guests.findIndex(g => g.id === id);
        
        if (guestIndex > -1) {
          if (method === 'get') {
            data = { guestId: id, loyaltyPoints: guests[guestIndex].loyaltyPoints };
          } else if (method === 'post') {
            const points = body.points || body.loyaltyPoints || 0;
            guests[guestIndex].loyaltyPoints += points;
            saveMockData('guests', guests);
            data = guests[guestIndex];
          }
        } else {
          status = 404;
        }
      }

      // ─── ROOMS CRUD MOCK ───
      else if (url.endsWith('/rooms') || url.includes('/rooms?')) {
        if (method === 'get') {
          data = getMockData('rooms');
        } else if (method === 'post') {
          const rooms = getMockData('rooms');
          const newRoom = {
            ...body,
            id: rooms.length > 0 ? Math.max(...rooms.map(r => r.id)) + 1 : 1,
            pricePerNight: parseFloat(body.pricePerNight),
            maxGuests: parseInt(body.maxGuests),
            floorNumber: parseInt(body.floorNumber),
            status: body.status || 'AVAILABLE'
          };
          rooms.push(newRoom);
          saveMockData('rooms', rooms);
          data = newRoom;
          status = 201;
        }
      } else if (url.endsWith('/rooms/available')) {
        const rooms = getMockData('rooms');
        data = rooms.filter(r => r.status === 'AVAILABLE');
      } else if (url.match(/\/rooms\/\d+$/)) {
        const id = parseInt(url.split('/').pop());
        const rooms = getMockData('rooms');
        const roomIndex = rooms.findIndex(r => r.id === id);

        if (method === 'get') {
          data = rooms[roomIndex];
          if (!data) status = 404;
        } else if (method === 'put') {
          if (roomIndex > -1) {
            rooms[roomIndex] = { ...rooms[roomIndex], ...body, id, pricePerNight: parseFloat(body.pricePerNight) };
            saveMockData('rooms', rooms);
            data = rooms[roomIndex];
          } else {
            status = 404;
          }
        } else if (method === 'delete') {
          if (roomIndex > -1) {
            rooms.splice(roomIndex, 1);
            saveMockData('rooms', rooms);
            data = { message: `Room with ID ${id} deleted successfully` };
          } else {
            status = 404;
          }
        }
      } else if (url.match(/\/rooms\/\d+\/status$/)) {
        const id = parseInt(url.split('/')[url.split('/').length - 2]);
        // Search params status
        const params = new URLSearchParams(url.split('?')[1]);
        const statusParam = params.get('status');
        const rooms = getMockData('rooms');
        const roomIndex = rooms.findIndex(r => r.id === id);
        
        if (roomIndex > -1 && statusParam) {
          rooms[roomIndex].status = statusParam;
          saveMockData('rooms', rooms);
          data = rooms[roomIndex];
        } else {
          status = 404;
        }
      }

      // ─── BOOKINGS CRUD MOCK ───
      else if (url.endsWith('/bookings') || url.includes('/bookings?')) {
        if (method === 'get') {
          data = getMockData('bookings');
        } else if (method === 'post') {
          const bookings = getMockData('bookings');
          const rooms = getMockData('rooms');
          
          const targetRoom = rooms.find(r => r.id === parseInt(body.roomId));
          
          // Calculate total amount
          const checkIn = new Date(body.checkInDate);
          const checkOut = new Date(body.checkOutDate);
          const nights = Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
          const price = targetRoom ? targetRoom.pricePerNight : 100;
          const totalAmount = nights * price;

          const newBooking = {
            ...body,
            id: bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1,
            roomId: parseInt(body.roomId),
            guestId: parseInt(body.guestId),
            totalAmount: totalAmount,
            status: body.status || 'CONFIRMED'
          };
          
          bookings.push(newBooking);
          saveMockData('bookings', bookings);
          
          // Auto-occupy room if checked in
          if (newBooking.status === 'CHECKED_IN' && targetRoom) {
            targetRoom.status = 'OCCUPIED';
            saveMockData('rooms', rooms);
          }

          // Create auto notification
          const notifications = getMockData('notifications');
          const guests = getMockData('guests');
          const guest = guests.find(g => g.id === newBooking.guestId);
          notifications.push({
            id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
            guestId: newBooking.guestId,
            bookingId: newBooking.id,
            type: 'EMAIL',
            subject: 'New Booking Registered',
            message: `Hello ${guest ? guest.name : 'Guest'}, your booking for Room ${targetRoom ? targetRoom.roomNumber : newBooking.roomId} from ${newBooking.checkInDate} to ${newBooking.checkOutDate} is confirmed. Total amount is $${newBooking.totalAmount}.`,
            recipientEmail: guest ? guest.email : 'guest@hotel.com',
            status: 'SENT',
            category: 'BOOKING_CONFIRMATION',
            sentAt: new Date().toISOString()
          });
          saveMockData('notifications', notifications);

          // Add a pending payment record
          const payments = getMockData('payments');
          payments.push({
            id: payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 1,
            bookingId: newBooking.id,
            guestId: newBooking.guestId,
            amount: totalAmount,
            paymentMethod: 'CREDIT_CARD',
            status: 'PENDING',
            transactionId: `TXN-PENDING-${newBooking.id}`,
            paymentDate: null
          });
          saveMockData('payments', payments);

          data = newBooking;
          status = 201;
        }
      } else if (url.match(/\/bookings\/\d+\/details$/)) {
        const id = parseInt(url.match(/\/bookings\/(\d+)\/details/)[1]);
        const bookings = getMockData('bookings');
        const booking = bookings.find(b => b.id === id);
        
        if (booking) {
          const guests = getMockData('guests');
          const rooms = getMockData('rooms');
          data = {
            ...booking,
            guest: guests.find(g => g.id === booking.guestId),
            room: rooms.find(r => r.id === booking.roomId)
          };
        } else {
          status = 404;
        }
      } else if (url.match(/\/bookings\/\d+$/)) {
        const id = parseInt(url.split('/').pop());
        const bookings = getMockData('bookings');
        const bookingIndex = bookings.findIndex(b => b.id === id);

        if (method === 'get') {
          data = bookings[bookingIndex];
          if (!data) status = 404;
        } else if (method === 'put') {
          if (bookingIndex > -1) {
            bookings[bookingIndex] = { ...bookings[bookingIndex], ...body, id };
            saveMockData('bookings', bookings);
            data = bookings[bookingIndex];
          } else {
            status = 404;
          }
        } else if (method === 'delete') {
          // Cancel booking
          if (bookingIndex > -1) {
            bookings[bookingIndex].status = 'CANCELLED';
            saveMockData('bookings', bookings);
            
            // Release the room
            const rooms = getMockData('rooms');
            const room = rooms.find(r => r.id === bookings[bookingIndex].roomId);
            if (room && room.status === 'OCCUPIED') {
              room.status = 'AVAILABLE';
              saveMockData('rooms', rooms);
            }
            
            data = bookings[bookingIndex];
          } else {
            status = 404;
          }
        }
      } else if (url.match(/\/bookings\/\d+\/status$/)) {
        const id = parseInt(url.split('/')[url.split('/').length - 2]);
        const params = new URLSearchParams(url.split('?')[1]);
        const statusParam = params.get('status');
        
        const bookings = getMockData('bookings');
        const bookingIndex = bookings.findIndex(b => b.id === id);
        
        if (bookingIndex > -1 && statusParam) {
          bookings[bookingIndex].status = statusParam;
          saveMockData('bookings', bookings);
          
          // Sync Room Status
          const rooms = getMockData('rooms');
          const room = rooms.find(r => r.id === bookings[bookingIndex].roomId);
          if (room) {
            if (statusParam === 'CHECKED_IN') {
              room.status = 'OCCUPIED';
            } else if (statusParam === 'CHECKED_OUT') {
              room.status = 'AVAILABLE';
              // Automatically mark the pending payment as PAID
              const payments = getMockData('payments');
              const payment = payments.find(p => p.bookingId === id);
              if (payment && payment.status === 'PENDING') {
                payment.status = 'PAID';
                payment.paymentDate = new Date().toISOString();
                payment.transactionId = `TXN-AUTO-${id}`;
                saveMockData('payments', payments);
              }
            }
            saveMockData('rooms', rooms);
          }
          data = bookings[bookingIndex];
        } else {
          status = 404;
        }
      }

      // ─── PAYMENTS MOCK ───
      else if (url.endsWith('/payments')) {
        if (method === 'get') {
          data = getMockData('payments');
        } else if (method === 'post') {
          const payments = getMockData('payments');
          const newPayment = {
            ...body,
            id: payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 1,
            paymentDate: new Date().toISOString(),
            status: 'PAID'
          };
          
          // Update the payment in DB if it was existing pending
          const pendingIdx = payments.findIndex(p => p.bookingId === parseInt(body.bookingId));
          if (pendingIdx > -1) {
            payments[pendingIdx] = { ...payments[pendingIdx], ...newPayment };
            data = payments[pendingIdx];
          } else {
            payments.push(newPayment);
            data = newPayment;
          }
          saveMockData('payments', payments);
          
          // Generate notification
          const notifications = getMockData('notifications');
          notifications.push({
            id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
            guestId: newPayment.guestId,
            bookingId: newPayment.bookingId,
            type: 'EMAIL',
            subject: 'Payment Successful',
            message: `Your payment of $${newPayment.amount} for Booking #${newPayment.bookingId} has been processed successfully. Transaction ID: ${newPayment.transactionId}`,
            recipientEmail: 'guest@hotel.com',
            status: 'SENT',
            category: 'PAYMENT_SUCCESS',
            sentAt: new Date().toISOString()
          });
          saveMockData('notifications', notifications);

          status = 201;
        }
      } else if (url.match(/\/payments\/\d+\/refund$/)) {
        const id = parseInt(url.split('/')[url.split('/').length - 2]);
        const payments = getMockData('payments');
        const paymentIndex = payments.findIndex(p => p.id === id);
        
        if (paymentIndex > -1) {
          payments[paymentIndex].status = 'REFUNDED';
          saveMockData('payments', payments);
          data = payments[paymentIndex];
        } else {
          status = 404;
        }
      } else if (url.match(/\/payments\/booking\/\d+\/summary$/)) {
        const bookingId = parseInt(url.split('/')[url.split('/').length - 2]);
        const payments = getMockData('payments');
        const bookingPayments = payments.filter(p => p.bookingId === bookingId);
        
        const totalPaid = bookingPayments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0);
        const totalPending = bookingPayments.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + p.amount, 0);
        
        data = {
          bookingId,
          payments: bookingPayments,
          totalPaid,
          totalPending,
          totalAmount: totalPaid + totalPending
        };
      }

      // ─── NOTIFICATIONS MOCK ───
      else if (url.endsWith('/notifications') || url.includes('/notifications?')) {
        if (method === 'get') {
          // notifications are stored as list
          const notifications = getMockData('notifications');
          data = {
            count: notifications.length,
            notifications
          };
        }
      } else if (url.endsWith('/notifications/email') || url.endsWith('/notifications/sms')) {
        if (method === 'post') {
          const notifications = getMockData('notifications');
          const isEmail = url.endsWith('email');
          const newNotif = {
            ...body,
            id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
            type: isEmail ? 'EMAIL' : 'SMS',
            status: 'SENT',
            sentAt: new Date().toISOString()
          };
          notifications.unshift(newNotif); // latest first
          saveMockData('notifications', notifications);
          data = {
            message: `${isEmail ? 'Email' : 'SMS'} notification sent successfully`,
            notification: newNotif
          };
          status = 201;
        }
      } else if (url.match(/\/notifications\/\w+$/)) { // match string IDs or number IDs
        const idStr = url.split('/').pop();
        const id = isNaN(idStr) ? idStr : parseInt(idStr);
        const notifications = getMockData('notifications');
        const notifIndex = notifications.findIndex(n => n.id === id);

        if (method === 'get') {
          if (notifIndex > -1) data = notifications[notifIndex];
          else status = 404;
        } else if (method === 'delete') {
          if (notifIndex > -1) {
            notifications.splice(notifIndex, 1);
            saveMockData('notifications', notifications);
            data = { message: 'Notification deleted successfully', id };
          } else {
            status = 404;
          }
        }
      }

      // Return simulated Axios Response
      if (status >= 200 && status < 300) {
        return Promise.resolve({
          data,
          status,
          statusText: 'OK',
          headers: {},
          config: originalRequest,
        });
      } else {
        return Promise.reject({
          response: {
            data,
            status,
            statusText: status === 401 ? 'Unauthorized' : 'Not Found',
            headers: {},
            config: originalRequest,
          },
          message: data.message || data.error || 'Mock API Request Failed'
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
