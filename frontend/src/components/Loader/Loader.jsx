import React from 'react';

export const Loader = ({ overlay = true }) => {
  if (overlay) {
    return (
      <div className="spinner-overlay">
        <div className="spinner"></div>
      </div>
    );
  }
  
  return <div className="spinner" style={{ margin: '2rem auto' }}></div>;
};

export default Loader;
