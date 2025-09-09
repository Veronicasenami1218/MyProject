import React, { useState, useEffect } from 'react';
import '../style.css';
import AuthDropdown from './AuthDropdown';

const ACTIVITY_TYPES = [
  'All Activities',
  'Check Out',
  'Check In',
  'Add Resource',
  'Edit Resource',
  'Delete Resource',
];

const ViewLog = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('All Activities');

  useEffect(() => {
    // Load logs from localStorage
    const savedLogs = localStorage.getItem('activityLogs');
    setLogs(savedLogs ? JSON.parse(savedLogs) : []);
  }, []);

  // Filter and search logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      searchTerm === '' ||
      (log.resourceName && log.resourceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.activity && log.activity.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.user && log.user.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.dateTime && log.dateTime.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter =
      activityFilter === 'All Activities' ||
      log.activity === activityFilter;
    return matchesSearch && matchesFilter;
  });

  // Export logs as CSV
  const exportLogs = () => {
    if (logs.length === 0) {
      alert('No logs to export!');
      return;
    }
    const headers = ['Date/Time', 'Resource Name', 'Activity', 'User', 'Details', 'Quantity'];
    const csvRows = [headers.join(',')];
    logs.forEach(log => {
      const row = [
        log.dateTime,
        log.resourceName,
        log.activity,
        log.user,
        log.details,
        log.quantity || ''
      ].map(field => `"${field}"`).join(',');
      csvRows.push(row);
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resource_activity_logs.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear all logs
  const clearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      localStorage.removeItem('activityLogs');
      setLogs([]);
    }
  };

  // Refresh logs
  const refreshLogs = () => {
    const savedLogs = localStorage.getItem('activityLogs');
    setLogs(savedLogs ? JSON.parse(savedLogs) : []);
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
          <a href="/dashboard">Dashboard</a>
          <a href="/reports">Reports</a>
          <a href="/viewlog" className="active">View Log</a>
          <AuthDropdown />
        </nav>
      </header>
      <main>
        <section id="logSection">
          <h2>Resource Activity Log</h2>
          <div>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <select
              value={activityFilter}
              onChange={e => setActivityFilter(e.target.value)}
            >
              {ACTIVITY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <button onClick={refreshLogs} style={{ marginLeft: '10px' }}>Refresh Logs</button>
            <button onClick={exportLogs} style={{ marginLeft: '10px' }}>Export Logs</button>
            <button onClick={clearLogs} style={{ marginLeft: '10px' }}>Clear All Logs</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Resource Name</th>
                <th>Activity</th>
                <th>User</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No activity logs found. Start using the system to see logs here.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={idx}>
                    <td>{log.dateTime}</td>
                    <td>{log.resourceName}</td>
                    <td>{log.activity}</td>
                    <td>{log.user}</td>
                    <td>{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>
      <footer>
        <p>Copyright 2025 Resource Inventory System</p>
      </footer>
    </div>
  );
};

export default ViewLog; 