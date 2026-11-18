import React from 'react';
import Modal from './Modal';

export const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Are you sure?', 
  message = 'This action cannot be undone.', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'danger' 
}) => {
  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose}>
        {cancelText}
      </button>
      <button 
        className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {confirmText}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
        {message}
      </p>
    </Modal>
  );
};

export default ConfirmationDialog;
