import React, { useState, useEffect, useRef } from 'react';
import '../style.css';
import AuthDropdown from './AuthDropdown';

const REPORT_TYPES = [
  { value: 'monthly-usage', label: 'Monthly Usage Report' },
  { value: 'stock-summary', label: 'Stock Summary Report' },
  { value: 'checkin-checkout', label: 'Check-in/Check-out Report' },
  { value: 'distribution', label: 'Resource Distribution Report' },
  { value: 'damage-loss', label: 'Damage/Loss Report' },
  { value: 'program-specific', label: 'Program-specific Report' },
  { value: 'utilization-rate', label: 'Resource Utilization Rate' },
  { value: 'utilization-by-resource', label: 'Resource Utilization by Resource' },
];

const Report = () => {
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value);
  const [reportContent, setReportContent] = useState(null);
  const chartRef = useRef(null);

  // Placeholder: Load data from localStorage
  const getResourceData = () => JSON.parse(localStorage.getItem('resourcesData') || '[]');
  const getActivityLogs = () => JSON.parse(localStorage.getItem('activityLogs') || '[]');

  useEffect(() => {
    // TODO: Migrate and call report rendering logic based on reportType
    setReportContent(<div style={{marginTop: '2em'}}>Report content for <b>{REPORT_TYPES.find(r => r.value === reportType)?.label}</b> will appear here.</div>);
  }, [reportType]);

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
          <a href="/reports" className="active">Reports</a>
          <a href="/viewlog">View Log</a>
          <AuthDropdown />
        </nav>
      </header>
      <main>
        <section>
          <h2>Reports</h2>
          <label htmlFor="reportTypeSelect"><b>Select Report Type:</b></label>
          <select
            id="reportTypeSelect"
            value={reportType}
            onChange={e => setReportType(e.target.value)}
          >
            {REPORT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <div style={{ margin: '1em 0' }}>
            <button id="exportExcelBtn">Export to Excel</button>
            <button id="exportPdfBtn">Export to PDF</button>
          </div>
          <div id="reportContent" style={{ marginTop: '2em' }}>
            {reportContent}
          </div>
        </section>
      </main>
      <footer>
        <p>Copyright 2025 Resource Inventory System</p>
      </footer>
    </div>
  );
};

export default Report; 