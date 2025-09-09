import React, { useEffect, useState, useRef } from 'react';
import '../style.css';
import AddResourceModal from './AddResourceModal';
import QuickCheckoutModal from './QuickCheckoutModal';
import GenerateReportModal from './GenerateReportModal';
import ExportDataModal from './ExportDataModal';
import AuthDropdown from './AuthDropdown';

const Dashboard = () => {
  // State for dashboard stats
  const [stats, setStats] = useState({
    totalResources: 0,
    lowStockCount: 0,
    checkedOutCount: 0,
    activeUsers: 0,
  });

  // State for modals
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showQuickCheckoutModal, setShowQuickCheckoutModal] = useState(false);
  const [showGenerateReportModal, setShowGenerateReportModal] = useState(false);
  const [showExportDataModal, setShowExportDataModal] = useState(false);

  // State for activity feed
  const [activityFeed, setActivityFeed] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Refs for charts
  const resourceTypeChartRef = useRef(null);
  const usageTrendChartRef = useRef(null);

  // Get data from localStorage
  const getResourceData = () => {
    return JSON.parse(localStorage.getItem('resourcesData') || '[]');
  };

  const getActivityLogs = () => {
    return JSON.parse(localStorage.getItem('activityLogs') || '[]');
  };

  // Initialize sample data if none exists
  const initializeSampleData = () => {
    const resourcesData = getResourceData();
    const activityLogs = getActivityLogs();
    
    if (resourcesData.length === 0) {
      const sampleResources = [
        { name: 'Laptop', type: 'Electronics', quantity: 5, location: 'IT Department', status: 'Available' },
        { name: 'Projector', type: 'Electronics', quantity: 2, location: 'Conference Room', status: 'Available' },
        { name: 'Office Chair', type: 'Furniture', quantity: 1, location: 'Storage', status: 'Needs Repair' },
        { name: 'Printer', type: 'Electronics', quantity: 3, location: 'Office', status: 'Checked Out' },
        { name: 'Desk', type: 'Furniture', quantity: 0, location: 'Storage', status: 'Available' }
      ];
      localStorage.setItem('resourcesData', JSON.stringify(sampleResources));
      console.log('Sample resources data initialized');
    }
    
    if (activityLogs.length === 0) {
      const sampleLogs = [
        { user: 'John Doe', action: 'Check Out', item: 'Laptop', timestamp: new Date().toISOString() },
        { user: 'Jane Smith', action: 'Check In', item: 'Projector', timestamp: new Date().toISOString() },
        { user: 'Mike Johnson', action: 'Add', item: 'New Chair', timestamp: new Date().toISOString() }
      ];
      localStorage.setItem('activityLogs', JSON.stringify(sampleLogs));
      console.log('Sample activity logs initialized');
    }
  };

  // Get previous stats for trend calculation
  const getPreviousStats = () => {
    return JSON.parse(localStorage.getItem('dashboardPrevStats') || '{}');
  };

  const setPreviousStats = (stats) => {
    localStorage.setItem('dashboardPrevStats', JSON.stringify(stats));
  };

  // Update dashboard stats
  const updateDashboardStats = () => {
    const data = getResourceData();
    const logs = getActivityLogs();
    const totalResources = data.length;
    const lowStockCount = data.filter(item => item.quantity <= 1).length;
    const checkedOutCount = data.filter(item => item.status === 'Checked Out').length;
    const activeUsers = new Set(logs.map(log => log.user)).size;

    console.log('Dashboard stats:', { totalResources, lowStockCount, checkedOutCount, activeUsers });

    // Get previous stats for trend calculation
    const prevStats = getPreviousStats();

    // Calculate trends
    const trends = {
      totalResources: calculateTrend(totalResources, prevStats.totalResources),
      lowStockCount: calculateTrend(lowStockCount, prevStats.lowStockCount),
      checkedOutCount: calculateTrend(checkedOutCount, prevStats.checkedOutCount),
      activeUsers: calculateTrend(activeUsers, prevStats.activeUsers),
    };

    setStats({
      totalResources,
      lowStockCount,
      checkedOutCount,
      activeUsers,
    });

    // Save current stats for next time
    setPreviousStats({
      totalResources,
      lowStockCount,
      checkedOutCount,
      activeUsers
    });

    return trends;
  };

  // Calculate trend indicator
  const calculateTrend = (current, previous) => {
    if (previous === undefined) return { symbol: '–', class: 'neutral' };
    if (current > previous) return { symbol: '▲', class: 'up' };
    if (current < previous) return { symbol: '▼', class: 'down' };
    return { symbol: '–', class: 'neutral' };
  };

  // Show alert function
  const showAlert = (message, type = 'info') => {
    const newAlert = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    setAlerts(prev => [...prev, newAlert]);
    
    // Auto-remove alert after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== newAlert.id));
    }, 5000);
  };

  // Update activity feed
  const updateActivityFeed = () => {
    const logs = getActivityLogs();
    const recentLogs = logs.slice(-10).reverse(); // Get last 10 logs, newest first
    setActivityFeed(recentLogs);
  };

  // Initialize dashboard
  useEffect(() => {
    initializeSampleData();
    updateDashboardStats();
    updateActivityFeed();
    
    // Set up interval to refresh stats every 30 seconds
    const interval = setInterval(() => {
      updateDashboardStats();
      updateActivityFeed();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle resource addition
  const handleAddResource = (resourceData) => {
    const resources = getResourceData();
    const newResource = {
      id: Date.now().toString(),
      name: resourceData.resourceName,
      type: resourceData.resourceType,
      quantity: parseInt(resourceData.resourceQuantity),
      location: resourceData.resourceLocation,
      status: resourceData.resourceStatus,
      description: resourceData.resourceDescription || '',
      dateAdded: new Date().toISOString()
    };
    
    resources.push(newResource);
    localStorage.setItem('resourcesData', JSON.stringify(resources));
    
    // Add activity log
    const logs = getActivityLogs();
    const newLog = {
      dateTime: new Date().toISOString(),
      resourceName: newResource.name,
      activity: 'Add',
      user: 'Dashboard User',
      details: `Added ${newResource.quantity} ${newResource.name} (${newResource.type}) to ${newResource.location}`,
      quantity: newResource.quantity
    };
    logs.push(newLog);
    localStorage.setItem('activityLogs', JSON.stringify(logs));
    
    console.log('Resource added:', newResource);
    showAlert(`Successfully added ${newResource.name}`, 'success');
    
    // Update dashboard
    updateDashboardStats();
    updateActivityFeed();
    setShowAddResourceModal(false);
  };

  // Handle quick checkout
  const handleQuickCheckout = (checkoutData) => {
    const resources = getResourceData();
    const resource = resources.find(r => r.name === checkoutData.resourceName);
    
    if (!resource) {
      showAlert('Resource not found', 'error');
      return;
    }
    
    if (resource.quantity < checkoutData.quantity) {
      showAlert(`Insufficient quantity. Available: ${resource.quantity}`, 'error');
      return;
    }
    
    // Update resource quantity
    resource.quantity -= checkoutData.quantity;
    if (resource.quantity === 0) {
      resource.status = 'Out of Stock';
    }
    
    localStorage.setItem('resourcesData', JSON.stringify(resources));
    
    // Add activity log
    const logs = getActivityLogs();
    const newLog = {
      dateTime: new Date().toISOString(),
      resourceName: resource.name,
      activity: 'Check Out',
      user: checkoutData.userName || 'Dashboard User',
      details: `Checked out ${checkoutData.quantity} ${resource.name} for ${checkoutData.purpose}`,
      quantity: checkoutData.quantity
    };
    logs.push(newLog);
    localStorage.setItem('activityLogs', JSON.stringify(logs));
    
    showAlert(`Successfully checked out ${checkoutData.quantity} ${resource.name}`, 'success');
    
    // Update dashboard
    updateDashboardStats();
    updateActivityFeed();
    setShowQuickCheckoutModal(false);
  };

  return (
    <div>
      <header>
        <a href="/">
          <img src="/CISA logo png_1@4x (2).png" alt="Logo" className="site-logo" />
        </a>
        <h1>Resource Inventory System</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/dashboard" className="active">Dashboard</a>
          <a href="/reports">Reports</a>
          <a href="/viewlog">View Log</a>
          <AuthDropdown />
        </nav>
      </header>
      
      <main>
        {/* Dashboard Overview Section */}
        <section id="dashboardOverview" style={{ marginBottom: '2em' }}>
          <h2>Dashboard Overview</h2>
          <div className="stats-container">
            <div className="stat-card stat-bg-blue">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <h3>{stats.totalResources} <span className="trend neutral">–</span></h3>
                <p>Total Resources</p>
              </div>
            </div>
            <div className="stat-card stat-bg-red">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h3>{stats.lowStockCount} <span className="trend neutral">–</span></h3>
                <p>Low Stock Alerts</p>
              </div>
            </div>
            <div className="stat-card stat-bg-purple">
              <div className="stat-icon">📤</div>
              <div className="stat-content">
                <h3>{stats.checkedOutCount} <span className="trend neutral">–</span></h3>
                <p>Checked Out Items</p>
              </div>
            </div>
            <div className="stat-card stat-bg-green">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{stats.activeUsers} <span className="trend neutral">–</span></h3>
                <p>Active Users</p>
              </div>
            </div>
          </div>
          
          <div className="quick-actions">
            <button 
              className="action-btn primary"
              onClick={() => setShowAddResourceModal(true)}
            >
              ➕ Add Resource
            </button>
            <button 
              className="action-btn"
              onClick={() => setShowQuickCheckoutModal(true)}
            >
              📤 Quick Check Out
            </button>
            <button 
              className="action-btn"
              onClick={() => setShowGenerateReportModal(true)}
            >
              📊 Generate Report
            </button>
            <button 
              className="action-btn"
              onClick={() => setShowExportDataModal(true)}
            >
              📥 Export Data
            </button>
          </div>
          
          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="alerts-section">
              <h3>⚠️ Alerts & Notifications</h3>
              <div id="alertsContainer">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert alert-${alert.type}`}>
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Recent Activity Section */}
        <section id="recentActivity" style={{ marginBottom: '2em' }}>
          <h2>Recent Activity</h2>
          <div className="activity-feed">
            {activityFeed.length > 0 ? (
              activityFeed.map((activity, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-time">
                    {new Date(activity.timestamp || activity.dateTime).toLocaleString()}
                  </span>
                  <span className="activity-text">
                    {activity.details || `${activity.user} ${activity.action} ${activity.item}`}
                  </span>
                </div>
              ))
            ) : (
              <div className="activity-item">
                <span className="activity-time">Just now</span>
                <span className="activity-text">System initialized. Welcome to Resource Inventory System!</span>
              </div>
            )}
          </div>
        </section>

        {/* Charts Section */}
        <section id="chartsSection" style={{ marginBottom: '2em' }}>
          <h2>Analytics & Charts</h2>
          <div className="charts-container">
            <div className="chart-card">
              <h3>Resource Type Distribution</h3>
              <canvas ref={resourceTypeChartRef} id="resourceTypeChart"></canvas>
            </div>
            <div className="chart-card">
              <h3>Usage Trends</h3>
              <canvas ref={usageTrendChartRef} id="usageTrendChart"></canvas>
            </div>
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
      
      {showQuickCheckoutModal && (
        <QuickCheckoutModal 
          onClose={() => setShowQuickCheckoutModal(false)}
          onSubmit={handleQuickCheckout}
          resources={getResourceData()}
        />
      )}
      
      {showGenerateReportModal && (
        <GenerateReportModal 
          onClose={() => setShowGenerateReportModal(false)}
          resources={getResourceData()}
          activityLogs={getActivityLogs()}
        />
      )}
      
      {showExportDataModal && (
        <ExportDataModal 
          onClose={() => setShowExportDataModal(false)}
          resources={getResourceData()}
          activityLogs={getActivityLogs()}
        />
      )}
    </div>
  );
};

export default Dashboard; 