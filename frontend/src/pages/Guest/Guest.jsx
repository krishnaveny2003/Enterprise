import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiGift } from 'react-icons/fi';
import guestService from '../../services/guestService';
import Loader from '../../components/Loader/Loader';
import Modal from '../../components/Modals/Modal';
import ConfirmationDialog from '../../components/Modals/ConfirmationDialog';
import { useToast } from '../../context/ToastContext';

export const Guest = () => {
  const { showToast } = useToast();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search, Filter, Pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);

  // Form states
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    loyaltyPoints: 0
  });

  const [loyaltyPointsToAdd, setLoyaltyPointsToAdd] = useState(50);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const data = await guestService.getAllGuests();
      setGuests(data);
    } catch (err) {
      showToast('Failed to fetch guests list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  // Filter and search logic
  const filteredGuests = guests.filter(guest => {
    const searchLower = search.toLowerCase();
    return (
      guest.name?.toLowerCase().includes(searchLower) ||
      guest.email?.toLowerCase().includes(searchLower) ||
      guest.phone?.includes(searchLower) ||
      guest.address?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const totalItems = filteredGuests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGuests = filteredGuests.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1); // Reset page on search
  }, [search]);

  // Form Actions
  const handleOpenAddForm = () => {
    setSelectedGuest(null);
    setFormData({ name: '', email: '', phone: '', address: '', loyaltyPoints: 0 });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (guest) => {
    setSelectedGuest(guest);
    setFormData({
      name: guest.name || '',
      email: guest.email || '',
      phone: guest.phone || '',
      address: guest.address || '',
      loyaltyPoints: guest.loyaltyPoints || 0
    });
    setIsFormOpen(true);
  };

  const handleOpenDetails = (guest) => {
    setSelectedGuest(guest);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (guest) => {
    setSelectedGuest(guest);
    setIsDeleteOpen(true);
  };

  const handleOpenLoyalty = (guest) => {
    setSelectedGuest(guest);
    setLoyaltyPointsToAdd(50);
    setIsLoyaltyOpen(true);
  };

  // Submit operations
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (selectedGuest) {
        await guestService.updateGuest(selectedGuest.id, formData);
        showToast('Guest details updated successfully.', 'success');
      } else {
        await guestService.registerGuest(formData);
        showToast('New guest registered successfully.', 'success');
      }
      setIsFormOpen(false);
      fetchGuests();
    } catch (err) {
      showToast('Operation failed. Please review values.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedGuest) return;
    try {
      await guestService.deleteGuest(selectedGuest.id);
      showToast('Guest deleted successfully.', 'success');
      fetchGuests();
    } catch (err) {
      showToast('Failed to delete guest.', 'error');
    }
  };

  const handleAddLoyaltyPoints = async () => {
    if (!selectedGuest) return;
    try {
      await guestService.addLoyaltyPoints(selectedGuest.id, loyaltyPointsToAdd);
      showToast(`Added ${loyaltyPointsToAdd} loyalty points to guest.`, 'success');
      setIsLoyaltyOpen(false);
      fetchGuests();
    } catch (err) {
      showToast('Failed to add loyalty points.', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Guest Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Register new guests, view check-in details, and track loyalty point stats.
          </p>
        </div>
        
        <button className="btn btn-primary" onClick={handleOpenAddForm}>
          <FiPlus /> Add Guest
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon"><FiSearch /></span>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by name, email, phone, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Found {totalItems} total guests
        </div>
      </div>

      {loading ? (
        <Loader overlay={false} />
      ) : (
        <div className="table-container">
          {paginatedGuests.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No guests found matching your search criteria.
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Loyalty Points</th>
                    <th>Location</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGuests.map((guest) => (
                    <tr key={guest.id}>
                      <td><strong>#{guest.id}</strong></td>
                      <td><strong>{guest.name}</strong></td>
                      <td>{guest.email}</td>
                      <td>{guest.phone}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                          <FiGift /> {guest.loyaltyPoints} pts
                        </span>
                      </td>
                      <td><span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{guest.address}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary btn-icon-only" 
                            title="Add Loyalty Points"
                            onClick={() => handleOpenLoyalty(guest)}
                            style={{ color: 'var(--warning-text)', backgroundColor: 'var(--warning-light)', borderColor: 'transparent' }}
                          >
                            <FiGift />
                          </button>
                          <button 
                            className="btn btn-secondary btn-icon-only" 
                            title="View Details"
                            onClick={() => handleOpenDetails(guest)}
                          >
                            <FiEye />
                          </button>
                          <button 
                            className="btn btn-secondary btn-icon-only" 
                            title="Edit Details"
                            onClick={() => handleOpenEditForm(guest)}
                          >
                            <FiEdit2 />
                          </button>
                          <button 
                            className="btn btn-secondary btn-icon-only" 
                            title="Remove Account"
                            onClick={() => handleOpenDelete(guest)}
                            style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-light)', borderColor: 'transparent' }}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="pagination">
                  <span className="pagination-info">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} guests
                  </span>
                  <div className="pagination-buttons">
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add / Edit Guest Form Modal */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        title={selectedGuest ? `Edit Guest Details (#${selectedGuest.id})` : 'Register New Guest'}
      >
        <form onSubmit={handleSubmitForm}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Loyalty Points</label>
            <input 
              type="number" 
              className="form-control" 
              value={formData.loyaltyPoints}
              onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })}
              min="0"
              disabled={!!selectedGuest} // Loyalty points handled via specific actions for existing guests
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Postal / Billing Address</label>
            <textarea 
              className="form-control" 
              rows="3"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Guest Details View Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Guest Details Profile"
      >
        {selectedGuest && (
          <div>
            <div className="detail-row">
              <span className="detail-label">Guest ID:</span>
              <span className="detail-value">#{selectedGuest.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Full Name:</span>
              <span className="detail-value" style={{ fontWeight: '700' }}>{selectedGuest.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email Address:</span>
              <span className="detail-value">{selectedGuest.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone Number:</span>
              <span className="detail-value">{selectedGuest.phone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Loyalty Points Balance:</span>
              <span className="detail-value" style={{ color: 'var(--primary-color)', fontWeight: '700' }}>
                {selectedGuest.loyaltyPoints} pts
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Physical Address:</span>
              <span className="detail-value">{selectedGuest.address || 'N/A'}</span>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setIsDetailsOpen(false)}>
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Loyalty Points Addition Modal */}
      <Modal
        isOpen={isLoyaltyOpen}
        onClose={() => setIsLoyaltyOpen(false)}
        title={`Award Loyalty Points: ${selectedGuest?.name}`}
      >
        <div className="form-group">
          <label className="form-label">Points to award:</label>
          <input 
            type="number" 
            className="form-control" 
            value={loyaltyPointsToAdd}
            onChange={(e) => setLoyaltyPointsToAdd(parseInt(e.target.value) || 0)}
            min="1"
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsLoyaltyOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddLoyaltyPoints}>Award Points</button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Guest Account"
        message={`Are you sure you want to delete the account for "${selectedGuest?.name}"? All associated reservations and payments will stay in database but loyalty details will be lost.`}
        confirmText="Delete Account"
      />
    </div>
  );
};

export default Guest;
