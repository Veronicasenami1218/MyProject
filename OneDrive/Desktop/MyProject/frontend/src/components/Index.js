import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AuthDropdown from './AuthDropdown';
import AddResourceModal from './AddResourceModal';
import QuickCheckoutModal from './QuickCheckoutModal';

const Index = () => {
  const [resources, setResources] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportTypeFilter, setReportTypeFilter] = useState('All');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  const reportChartRef = useRef(null);
  let reportChart = null;

  useEffect(() => {
    loadData();
    checkUserPermissions();
    initializeSampleData();
  }, []);

  const loadData = () => {
    const resourcesData = JSON.parse(localStorage.getItem('resourcesData') || '[]');
    const logsData = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    setResources(resourcesData);
    setActivityLogs(logsData);
  };

  const checkUserPermissions = () => {
    const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
    setCurrentUser(user);
    setIsAdmin(user && user.email && user.email.endsWith('@chessinslumsafrica.com'));
  };

  const initializeSampleData = () => {
    const resourcesData = JSON.parse(localStorage.getItem('resourcesData') || '[]');
    const logsData = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    
    if (resourcesData.length === 0) {
      const sampleResources = [
        { id: 1, name: 'Laptop', type: 'Electronics', quantity: 5, location: 'IT Department', status: 'Available' },
        { id: 2, name: 'Projector', type: 'Electronics', quantity: 2, location: 'Conference Room', status: 'Available' },
        { id: 3, name: 'Office Chair', type: 'Furniture', quantity: 1, location: 'Storage', status: 'Needs Repair' },
        { id: 4, name: 'Printer', type: 'Electronics', quantity: 3, location: 'Office', status: 'Checked Out' },
        { id: 5, name: 'Desk', type: 'Furniture', quantity: 0, location: 'Storage', status: 'Available' }
      ];
      localStorage.setItem('resourcesData', JSON.stringify(sampleResources));
      setResources(sampleResources);
    }
    
    if (logsData.length === 0) {
      const sampleLogs = [
        { id: 1, user: 'John Doe', activity: 'Check Out', resourceName: 'Laptop', dateTime: new Date().toLocaleString(), details: 'Checked out laptop for meeting' },
        { id: 2, user: 'Jane Smith', activity: 'Check In', resourceName: 'Projector', dateTime: new Date().toLocaleString(), details: 'Returned projector after presentation' },
        { id: 3, user: 'Mike Johnson', activity: 'Add', resourceName: 'New Chair', dateTime: new Date().toLocaleString(), details: 'Added new office chair to inventory' }
      ];
      localStorage.setItem('activityLogs', JSON.stringify(sampleLogs));
      setActivityLogs(sampleLogs);
    }
  };

  const logActivity = (activity, resourceName, details, quantity = null) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      dateTime: new Date().toLocaleString(),
      resourceName: resourceName,
      activity: activity,
      user: currentUser?.firstName || currentUser?.email || 'Unknown User',
      details: details,
      quantity: quantity
    };

    const newLogs = [logEntry, ...activityLogs];
    setActivityLogs(newLogs);
    localStorage.setItem('activityLogs', JSON.stringify(newLogs));
    
    console.log('Activity logged:', logEntry);
    return logEntry;
  };

  const handleAddResource = (resourceData) => {
    const newResource = {
      id: Date.now(),
      name: resourceData.resourceName,
      type: resourceData.resourceType,
      quantity: parseInt(resourceData.resourceQuantity),
      location: resourceData.resourceLocation,
      status: resourceData.resourceStatus,
      description: resourceData.resourceDescription || '',
      dateAdded: new Date().toISOString()
    };
    
    const newResources = [...resources, newResource];
    setResources(newResources);
    localStorage.setItem('resourcesData', JSON.stringify(newResources));
    
    logActivity('Add', newResource.name, `Added ${newResource.quantity} ${newResource.name} (${newResource.type}) to ${newResource.location}`, newResource.quantity);
    
    setShowAddResourceModal(false);
  };

  const handleCheckout = (checkoutData) => {
    const resource = resources.find(r => r.id === parseInt(checkoutData.resourceId));
    if (!resource) return;

    const newQuantity = resource.quantity - parseInt(checkoutData.quantity);
    const newStatus = newQuantity === 0 ? 'Checked Out' : resource.status;
    
    const updatedResource = { ...resource, quantity: newQuantity, status: newStatus };
    const newResources = resources.map(r => r.id === resource.id ? updatedResource : r);
    
    setResources(newResources);
    localStorage.setItem('resourcesData', JSON.stringify(newResources));
    
    logActivity('Check Out', resource.name, `Checked out ${checkoutData.quantity} ${resource.name} for ${checkoutData.purpose}`, checkoutData.quantity);
    
    setShowCheckoutModal(false);
  };

  const handleDeleteResource = (resourceId) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    const newResources = resources.filter(r => r.id !== resourceId);
    setResources(newResources);
    localStorage.setItem('resourcesData', JSON.stringify(newResources));
    
    logActivity('Delete', resource.name, `Deleted ${resource.name} from inventory`);
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchTerm === '' || 
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.quantity.toString().includes(searchTerm);
    
    const matchesType = typeFilter === 'All Types' || resource.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const resourceTypes = Array.from(new Set(resources.map(r => r.type)));

  return (
    <div className="index-container">
      <header className="index-header">
        <div className="header-content">
          <h1>Resource Inventory Management System</h1>
          <AuthDropdown />
        </div>
      </header>

      <main className="index-main">
        {/* Search and Filter Section */}
        <section className="search-filter-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All Types">All Types</option>
              {resourceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddResourceModal(true)}
            >
              Add Resource
            </button>
          )}
        </section>

        {/* Resources Table */}
        <section className="resources-section">
          <h2>Resources</h2>
          <div className="table-container">
            <table className="resources-table">
              <thead>
                <tr>
                  <th>Resource Name</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map(resource => (
                  <tr key={resource.id}>
                    <td>{resource.name}</td>
                    <td>{resource.type}</td>
                    <td>{resource.quantity}</td>
                    <td>{resource.location}</td>
                    <td>
                      <span className={`status ${resource.status.toLowerCase().replace(' ', '-')}`}>
                        {resource.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => {
                            setSelectedResource(resource);
                            setShowCheckoutModal(true);
                          }}
                          disabled={resource.quantity === 0}
                        >
                          Check Out
                        </button>
                        {isAdmin && (
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleDeleteResource(resource.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Activity Logs Section */}
        <section className="activity-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {activityLogs.slice(0, 10).map(log => (
              <div key={log.id} className="activity-item">
                <div className="activity-header">
                  <span className="activity-user">{log.user}</span>
                  <span className="activity-time">{log.dateTime}</span>
                </div>
                <div className="activity-content">
                  <span className="activity-action">{log.activity}</span>
                  <span className="activity-resource">{log.resourceName}</span>
                </div>
                <div className="activity-details">{log.details}</div>
              </div>
            ))}
          </div>
          <Link to="/view-log" className="btn btn-secondary">
            View All Activity
          </Link>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <Link to="/dashboard" className="action-card">
              <h3>Dashboard</h3>
              <p>View system overview and statistics</p>
            </Link>
            <Link to="/report" className="action-card">
              <h3>Reports</h3>
              <p>Generate and view reports</p>
            </Link>
            <Link to="/view-log" className="action-card">
              <h3>Activity Log</h3>
              <p>View detailed activity history</p>
            </Link>
          </div>
        </section>
      </main>

      {/* Modals */}
      {showAddResourceModal && (
        <AddResourceModal
          onClose={() => setShowAddResourceModal(false)}
          onSubmit={handleAddResource}
        />
      )}

      {showCheckoutModal && selectedResource && (
        <QuickCheckoutModal
          resource={selectedResource}
          onClose={() => {
            setShowCheckoutModal(false);
            setSelectedResource(null);
          }}
          onSubmit={handleCheckout}
        />
      )}
    </div>
  );
};

export default Index; 