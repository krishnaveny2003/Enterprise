import React, { useState, useEffect } from 'react';
import { FiSliders, FiPlus, FiEdit2, FiTrash2, FiHome, FiSettings, FiGrid, FiDollarSign } from 'react-icons/fi';
import roomService from '../../services/roomService';
import Loader from '../../components/Loader/Loader';
import Modal from '../../components/Modals/Modal';
import ConfirmationDialog from '../../components/Modals/ConfirmationDialog';
import { useToast } from '../../context/ToastContext';

export const Room = () => {
  const { showToast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form state
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'SINGLE',
    pricePerNight: '',
    status: 'AVAILABLE',
    amenities: '',
    maxGuests: 1,
    floorNumber: 1,
    description: ''
  });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getAllRooms();
      setRooms(data);
    } catch (err) {
      showToast('Failed to fetch rooms catalog.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Filter logic
  const filteredRooms = rooms.filter(room => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      room.roomNumber?.toLowerCase().includes(searchLower) ||
      room.description?.toLowerCase().includes(searchLower) ||
      room.amenities?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'ALL' || room.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || room.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleOpenAddForm = () => {
    setSelectedRoom(null);
    setFormData({
      roomNumber: '',
      type: 'SINGLE',
      pricePerNight: '',
      status: 'AVAILABLE',
      amenities: '',
      maxGuests: 1,
      floorNumber: 1,
      description: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (room) => {
    setSelectedRoom(room);
    setFormData({
      roomNumber: room.roomNumber || '',
      type: room.type || 'SINGLE',
      pricePerNight: room.pricePerNight || '',
      status: room.status || 'AVAILABLE',
      amenities: room.amenities || '',
      maxGuests: room.maxGuests || 1,
      floorNumber: room.floorNumber || 1,
      description: room.description || ''
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (room) => {
    setSelectedRoom(room);
    setIsDeleteOpen(true);
  };

  const handleStatusToggle = async (room) => {
    const nextStatusMap = {
      'AVAILABLE': 'OCCUPIED',
      'OCCUPIED': 'MAINTENANCE',
      'MAINTENANCE': 'AVAILABLE'
    };
    const nextStatus = nextStatusMap[room.status] || 'AVAILABLE';

    try {
      await roomService.updateRoomStatus(room.id, nextStatus);
      showToast(`Room #${room.roomNumber} marked as ${nextStatus.toLowerCase().replace('_', ' ')}.`, 'success');
      fetchRooms();
    } catch (err) {
      showToast('Failed to update room availability.', 'error');
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        pricePerNight: parseFloat(formData.pricePerNight),
        maxGuests: parseInt(formData.maxGuests),
        floorNumber: parseInt(formData.floorNumber)
      };

      if (selectedRoom) {
        await roomService.updateRoom(selectedRoom.id, payload);
        showToast('Room details updated successfully.', 'success');
      } else {
        await roomService.addRoom(payload);
        showToast('New room added to catalog successfully.', 'success');
      }
      setIsFormOpen(false);
      fetchRooms();
    } catch (err) {
      showToast('Operation failed. Check values.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRoom) return;
    try {
      await roomService.deleteRoom(selectedRoom.id);
      showToast('Room removed from catalog successfully.', 'success');
      fetchRooms();
    } catch (err) {
      showToast('Failed to remove room.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE': return <span className="badge badge-success">Available</span>;
      case 'OCCUPIED': return <span className="badge badge-danger">Occupied</span>;
      case 'MAINTENANCE': return <span className="badge badge-warning">Maintenance</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Room Catalog</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Configure hotel rooms, price configurations, and availability states.
          </p>
        </div>
        
        <button className="btn btn-primary" onClick={handleOpenAddForm}>
          <FiPlus /> Add Room
        </button>
      </div>

      {/* Filters and Search */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by room #, details, amenities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <select 
            className="form-control" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <select 
            className="form-control" 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="ALL">All Types</option>
            <option value="SINGLE">Single Room</option>
            <option value="DOUBLE">Double Room</option>
            <option value="DELUXE">Deluxe Room</option>
            <option value="SUITE">Premium Suite</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader overlay={false} />
      ) : (
        <>
          {filteredRooms.length === 0 ? (
            <div className="table-container" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No rooms found matching filters.
            </div>
          ) : (
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {filteredRooms.map((room) => (
                <div key={room.id} className="card" style={{ padding: 0, justifyContent: 'space-between' }}>
                  
                  {/* Card Header Illustration */}
                  <div style={{ 
                    height: '110px', 
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', 
                    color: 'white', 
                    padding: '1.25rem',
                    position: 'relative',
                    borderTopLeftRadius: 'var(--radius-md)',
                    borderTopRightRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '0.05em' }}>
                        ROOM {room.roomNumber}
                      </span>
                      <span style={{ opacity: 0.85, fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                        {room.type}
                      </span>
                    </div>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.9 }}>
                      Floor {room.floorNumber} • Max {room.maxGuests} Guests
                    </div>
                    
                    {/* Floating Status Badge */}
                    <div style={{ position: 'absolute', bottom: '-12px', right: '16px' }}>
                      {getStatusBadge(room.status)}
                    </div>
                  </div>

                  {/* Room Details */}
                  <div style={{ padding: '1.25rem', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Price per Night</span>
                      <span style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--primary-color)' }}>
                        ${room.pricePerNight?.toFixed(2)}
                      </span>
                    </div>

                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--text-secondary)', 
                      lineHeight: '1.4', 
                      height: '56px',
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {room.description || 'No description provided.'}
                    </p>

                    {room.amenities && (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        {room.amenities.split(',').map((am) => (
                          <span key={am} style={{ 
                            fontSize: '0.7rem', 
                            padding: '0.15rem 0.4rem', 
                            backgroundColor: 'var(--bg-color)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '4px',
                            color: 'var(--text-secondary)'
                          }}>
                            {am.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div style={{ 
                    padding: '1rem 1.25rem', 
                    borderTop: '1px solid var(--border-color)', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-color)',
                    borderBottomLeftRadius: 'var(--radius-md)',
                    borderBottomRightRadius: 'var(--radius-md)'
                  }}>
                    {/* Status Toggler */}
                    <button 
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }} 
                      onClick={() => handleStatusToggle(room)}
                      title="Rotate status"
                    >
                      <FiSettings /> Status
                    </button>
                    
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        title="Edit Room"
                        onClick={() => handleOpenEditForm(room)}
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        title="Remove Room"
                        onClick={() => handleOpenDelete(room)}
                        style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-light)', borderColor: 'transparent' }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedRoom ? `Edit Room Details (#${selectedRoom.id})` : 'Add New Room'}
      >
        <form onSubmit={handleSubmitForm}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Room Type</label>
              <select 
                className="form-control" 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="SINGLE">Single Room</option>
                <option value="DOUBLE">Double Room</option>
                <option value="DELUXE">Deluxe Room</option>
                <option value="SUITE">Premium Suite</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price per Night ($)</label>
              <input 
                type="number" 
                step="0.01"
                className="form-control" 
                value={formData.pricePerNight}
                onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Availability Status</label>
              <select 
                className="form-control" 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Max Occupancy (Guests)</label>
              <input 
                type="number" 
                className="form-control" 
                value={formData.maxGuests}
                onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Floor Number</label>
              <input 
                type="number" 
                className="form-control" 
                value={formData.floorNumber}
                onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amenities (Comma separated)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Wi-Fi, AC, Minibar, Safe, Ocean View"
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Description</label>
            <textarea 
              className="form-control" 
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Room
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Room from Inventory"
        message={`Are you sure you want to delete Room #${selectedRoom?.roomNumber}? Existing bookings for this room will remain, but the room itself will be completely removed from the catalog.`}
        confirmText="Remove Room"
      />

    </div>
  );
};

export default Room;
