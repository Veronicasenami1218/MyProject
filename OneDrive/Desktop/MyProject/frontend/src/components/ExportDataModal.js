import React from 'react';

const ExportDataModal = ({ onClose, resources, activityLogs }) => {
  // Placeholder for export logic
  // You can add CSV/JSON/TXT export logic here

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Data</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p>Data export functionality coming soon.</p>
          {/* Add export options, file format selectors, etc. here */}
        </div>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ExportDataModal; 