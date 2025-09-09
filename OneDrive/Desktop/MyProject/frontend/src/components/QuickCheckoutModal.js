import React, { useState, useEffect } from 'react';

const QuickCheckoutModal = ({ onClose, onSubmit, resources }) => {
  const [formData, setFormData] = useState({
    resourceName: '',
    quantity: '',
    userName: '',
    purpose: '',
    expectedReturnDate: ''
  });

  const [selectedResource, setSelectedResource] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update selected resource when resource name changes
    if (name === 'resourceName') {
      const resource = resources.find(r => r.name === value);
      setSelectedResource(resource);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.resourceName || !formData.quantity || !formData.userName) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseInt(formData.quantity) <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    if (selectedResource && parseInt(formData.quantity) > selectedResource.quantity) {
      alert(`Insufficient quantity. Available: ${selectedResource.quantity}`);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Quick Check Out</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} id="quickCheckoutForm">
          <div className="form-group">
            <label htmlFor="checkoutResource">Resource *</label>
            <select
              id="checkoutResource"
              name="resourceName"
              value={formData.resourceName}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Resource</option>
              {resources
                .filter(resource => resource.quantity > 0 && resource.status !== 'Out of Stock')
                .map(resource => (
                  <option key={resource.id || resource.name} value={resource.name}>
                    {resource.name} ({resource.quantity} available)
                  </option>
                ))
              }
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="checkoutQuantity">Quantity *</label>
            <input
              type="number"
              id="checkoutQuantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              max={selectedResource ? selectedResource.quantity : undefined}
              required
            />
            {selectedResource && (
              <small>Available: {selectedResource.quantity}</small>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="checkoutUser">User Name *</label>
            <input
              type="text"
              id="checkoutUser"
              name="userName"
              value={formData.userName}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="checkoutPurpose">Purpose</label>
            <textarea
              id="checkoutPurpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              rows="2"
              placeholder="Brief description of intended use..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="expectedReturnDate">Expected Return Date</label>
            <input
              type="date"
              id="expectedReturnDate"
              name="expectedReturnDate"
              value={formData.expectedReturnDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary">
              Check Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickCheckoutModal; 