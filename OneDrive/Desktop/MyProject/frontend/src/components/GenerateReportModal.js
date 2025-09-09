import React from 'react';

const GenerateReportModal = ({ onClose, resources, activityLogs }) => {
  // Placeholder for report generation logic
  // You can add CSV/PDF export and summary logic here

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Generate Report</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p>Report generation functionality coming soon.</p>
          {/* Add report preview, export buttons, etc. here */}
        </div>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default GenerateReportModal; 