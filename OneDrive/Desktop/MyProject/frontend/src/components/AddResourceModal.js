import React, { useState } from 'react';

const AddResourceModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    resourceName: '',
    resourceType: '',
    resourceQuantity: '',
    resourceLocation: '',
    resourceStatus: 'Available',
    resourceDescription: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.resourceName || !formData.resourceType || !formData.resourceQuantity || !formData.resourceLocation) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseInt(formData.resourceQuantity) <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Resource</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} id="addResourceForm">
          <div className="form-group">
            <label htmlFor="resourceName">Resource Name *</label>
            <input
              type="text"
              id="resourceName"
              name="resourceName"
              value={formData.resourceName}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="resourceType">Resource Type *</label>
            <select
              id="resourceType"
              name="resourceType"
              value={formData.resourceType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Type</option>
              <option value="Electronics">Electronics</option>
              <option value="Furniture">Furniture</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Books">Books</option>
              <option value="Tools">Tools</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="resourceQuantity">Quantity *</label>
            <input
              type="number"
              id="resourceQuantity"
              name="resourceQuantity"
              value={formData.resourceQuantity}
              onChange={handleInputChange}
              min="1"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="resourceLocation">Location *</label>
            <input
              type="text"
              id="resourceLocation"
              name="resourceLocation"
              value={formData.resourceLocation}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="resourceStatus">Status</label>
            <select
              id="resourceStatus"
              name="resourceStatus"
              value={formData.resourceStatus}
              onChange={handleInputChange}
            >
              <option value="Available">Available</option>
              <option value="In Use">In Use</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="resourceDescription">Description</label>
            <textarea
              id="resourceDescription"
              name="resourceDescription"
              value={formData.resourceDescription}
              onChange={handleInputChange}
              rows="3"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary">
              Add Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResourceModal; 