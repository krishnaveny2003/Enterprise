import React, { useState, useEffect } from 'react';
import { FiSearch, FiDollarSign, FiClock, FiFileText, FiRefreshCw, FiPrinter } from 'react-icons/fi';
import paymentService from '../../services/paymentService';
import guestService from '../../services/guestService';
import bookingService from '../../services/bookingService';
import Loader from '../../components/Loader/Loader';
import Modal from '../../components/Modals/Modal';
import { useToast } from '../../context/ToastContext';

export const Payment = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Invoice state
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Stats
  const [financials, setFinancials] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalRefunded: 0
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [paymentsData, guestsData, bookingsData] = await Promise.all([
        paymentService.getAllPayments(),
        guestService.getAllGuests(),
        bookingService.getAllBookings()
      ]);

      // Enrich payment history records
      const enriched = paymentsData.map(p => {
        const guestObj = guestsData.find(g => g.id === p.guestId);
        const bookingObj = bookingsData.find(b => b.id === p.bookingId);
        return {
          ...p,
          guestName: guestObj ? guestObj.name : `Guest #${p.guestId}`,
          guestEmail: guestObj ? guestObj.email : '',
          guestPhone: guestObj ? guestObj.phone : '',
          guestAddress: guestObj ? guestObj.address : 'N/A',
          bookingDetails: bookingObj ? `Room ${bookingObj.roomId} (${bookingObj.checkInDate} to ${bookingObj.checkOutDate})` : 'N/A',
          checkIn: bookingObj ? bookingObj.checkInDate : '',
          checkOut: bookingObj ? bookingObj.checkOutDate : ''
        };
      });

      setPayments(enriched);

      // Financial KPI Summaries
      const totalPaid = paymentsData.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
      const totalPending = paymentsData.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
      const totalRefunded = paymentsData.filter(p => p.status === 'REFUNDED').reduce((sum, p) => sum + p.amount, 0);
      
      setFinancials({ totalPaid, totalPending, totalRefunded });

    } catch (err) {
      showToast('Failed to compile payments reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleOpenInvoice = (payment) => {
    setSelectedInvoice(payment);
    setIsInvoiceOpen(true);
  };

  const handleProcessRefund = async (payment) => {
    try {
      await paymentService.processRefund(payment.id, 'Guest requested cancellation');
      showToast(`Refund issued for payment #${payment.id}.`, 'success');
      fetchPayments();
    } catch (err) {
      showToast('Failed to issue refund.', 'error');
    }
  };

  const handleProcessPayment = async (payment) => {
    try {
      await paymentService.processPayment({
        ...payment,
        status: 'PAID'
      });
      showToast(`Payment processed successfully for payment #${payment.id}.`, 'success');
      fetchPayments();
    } catch (err) {
      showToast('Failed to settle payment.', 'error');
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-invoice-area').innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Simple window print swap
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore React state cleanly
  };

  // Filters logic
  const filteredPayments = payments.filter(p => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      p.guestName?.toLowerCase().includes(searchLower) ||
      p.transactionId?.toLowerCase().includes(searchLower) ||
      p.bookingId.toString().includes(searchLower);

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID': return <span className="badge badge-success">Paid</span>;
      case 'PENDING': return <span className="badge badge-warning">Pending</span>;
      case 'REFUNDED': return <span className="badge badge-danger">Refunded</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Financial Ledger</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Audit payment logs, settled transaction histories, and pending invoice totals.
          </p>
        </div>
      </div>

      {/* Totals Summary Cards */}
      <div className="card-grid">
        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Settled Revenue</span>
            <div className="card-icon-container" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <FiDollarSign />
            </div>
          </div>
          <div className="card-value">${financials.totalPaid.toFixed(2)}</div>
          <div className="card-desc" style={{ color: 'var(--success)' }}>
            <span>Cleared bookings</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Outstanding Receivables</span>
            <div className="card-icon-container" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <FiClock />
            </div>
          </div>
          <div className="card-value">${financials.totalPending.toFixed(2)}</div>
          <div className="card-desc">
            <span>Awaiting check-outs</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Refunded Outflows</span>
            <div className="card-icon-container" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <FiRefreshCw />
            </div>
          </div>
          <div className="card-value">${financials.totalRefunded.toFixed(2)}</div>
          <div className="card-desc">
            <span>Cancelled reservations</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon"><FiSearch /></span>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by Guest name, Txn ID, Booking ID..."
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
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader overlay={false} />
      ) : (
        <div className="table-container">
          {filteredPayments.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No payments records found matching criteria.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Booking ID</th>
                  <th>Guest Name</th>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Settle Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td><strong>#{p.id}</strong></td>
                    <td><strong>#{p.bookingId}</strong></td>
                    <td>
                      <div><strong>{p.guestName}</strong></div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.guestEmail}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-color)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        {p.transactionId || 'AWAITING'}
                      </code>
                    </td>
                    <td><strong>${p.amount.toFixed(2)}</strong></td>
                    <td><span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>{p.paymentMethod}</span></td>
                    <td>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {/* Process Pending Settle */}
                        {p.status === 'PENDING' && (
                          <button 
                            className="btn btn-secondary btn-icon-only" 
                            title="Settle Payment"
                            onClick={() => handleProcessPayment(p)}
                            style={{ color: 'var(--success-text)', backgroundColor: 'var(--success-light)', borderColor: 'transparent' }}
                          >
                            <FiDollarSign />
                          </button>
                        )}
                        
                        {/* Process Refund */}
                        {p.status === 'PAID' && (
                          <button 
                            className="btn btn-secondary btn-icon-only" 
                            title="Issue Refund"
                            onClick={() => handleProcessRefund(p)}
                            style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-light)', borderColor: 'transparent' }}
                          >
                            <FiRefreshCw />
                          </button>
                        )}

                        {/* Invoice Generator */}
                        <button 
                          className="btn btn-secondary btn-icon-only" 
                          title="Generate Invoice"
                          onClick={() => handleOpenInvoice(p)}
                        >
                          <FiFileText />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invoice Generator Modal */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title="Invoice Sheet Viewer"
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setIsInvoiceOpen(false)}>Close View</button>
            <button className="btn btn-primary" onClick={handlePrint}><FiPrinter /> Print / PDF</button>
          </>
        )}
      >
        {selectedInvoice && (
          <div id="printable-invoice-area" style={{ fontFamily: 'var(--font-family)', color: '#333', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ddd', paddingBottom: '1.25rem' }}>
              <div>
                <h2 style={{ color: '#1e40af', margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>GRAND ENTERPRISE HOTEL</h2>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                  100 Hospitality Boulevard, Suite 500<br />
                  New York, NY 10001, USA<br />
                  billing@grandenterprise.com
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: '1.25rem' }}>INVOICE</h3>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                  <strong>Invoice:</strong> #{selectedInvoice.id}931<br />
                  <strong>Date:</strong> {new Date().toLocaleDateString()}<br />
                  <strong>Status:</strong> {selectedInvoice.status}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem 0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#999', display: 'block', fontWeight: '700' }}>Bill To:</span>
                <strong style={{ fontSize: '1rem', color: '#111' }}>{selectedInvoice.guestName}</strong>
                <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.15rem', lineHeight: '1.4' }}>
                  {selectedInvoice.guestEmail}<br />
                  {selectedInvoice.guestPhone}<br />
                  {selectedInvoice.guestAddress}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#999', display: 'block', fontWeight: '700' }}>Reservation:</span>
                <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.15rem' }}>
                  <strong>Booking ID:</strong> #{selectedInvoice.bookingId}<br />
                  <strong>Check In:</strong> {selectedInvoice.checkIn}<br />
                  <strong>Check Out:</strong> {selectedInvoice.checkOut}
                </p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Line Rate</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Tax (8%)</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <strong>Lodging Stay & Services</strong>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.15rem' }}>{selectedInvoice.bookingDetails}</div>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                    ${(selectedInvoice.amount * 0.926).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                    ${(selectedInvoice.amount * 0.074).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '700' }}>
                    ${selectedInvoice.amount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <div style={{ width: '220px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.85rem' }}>
                  <span>Subtotal:</span>
                  <span>${(selectedInvoice.amount * 0.926).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.85rem' }}>
                  <span>Sales Tax (8%):</span>
                  <span>${(selectedInvoice.amount * 0.074).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '1rem', fontWeight: '800', borderTop: '2px solid #ccc' }}>
                  <span style={{ color: '#111' }}>Total Amount:</span>
                  <span style={{ color: '#1e40af' }}>${selectedInvoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '3rem', borderTop: '1px solid #ddd', paddingTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#888' }}>
              Thank you for choosing Grand Enterprise Hotel. We hope to see you again soon!<br />
              Generated via the HMS Billing Ledger.
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Payment;
