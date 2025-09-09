document.addEventListener('DOMContentLoaded', function() {
  // --- Reporting and Analytics for report.html ---
  const reportChartCanvas = document.getElementById('reportChart');
  let reportChart = null;
  const STOCK_THRESHOLD = 1;
  const reportTypeSelect = document.getElementById('reportTypeSelect');
  const reportContent = document.getElementById('reportContent');
  let monthlyUsageChart = null;

  // Load resource data from localStorage (if available)
  function getResourceData() {
    const data = JSON.parse(localStorage.getItem('resourcesData') || '[]');
    return data;
  }

  function renderMonthlyUsageReport() {
    // Get logs from localStorage and apply filters
    const allLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const logs = allLogs;
    
    // Group by month and resource
    const usage = {};
    const monthTotals = {};
    const monthCheckIns = {};
    logs.forEach(log => {
      if (log.activity === 'Check Out' || log.activity === 'Check In') {
        const date = new Date(log.dateTime);
        const month = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        const key = month + '|' + log.resourceName;
        if (!usage[key]) {
          usage[key] = { month, resource: log.resourceName, checkOut: 0, checkIn: 0 };
        }
        if (log.activity === 'Check Out') {
          usage[key].checkOut += log.quantity || 1;
          monthTotals[month] = (monthTotals[month] || 0) + (log.quantity || 1);
        }
        if (log.activity === 'Check In') {
          usage[key].checkIn += log.quantity || 1;
          monthCheckIns[month] = (monthCheckIns[month] || 0) + (log.quantity || 1);
        }
      }
    });
    // Convert to array and sort by month
    const usageArr = Object.values(usage).sort((a, b) => a.month.localeCompare(b.month));
    // Build table
    let html = '<table style="width:100%;margin-top:1em;"><thead><tr><th>Month</th><th>Resource</th><th>Check Outs</th><th>Check Ins</th></tr></thead><tbody>';
    if (usageArr.length === 0) {
      html += '<tr><td colspan="4" style="text-align:center;">No usage data available.</td></tr>';
    } else {
      usageArr.forEach(row => {
        html += `<tr><td>${row.month}</td><td>${row.resource}</td><td>${row.checkOut}</td><td>${row.checkIn}</td></tr>`;
      });
    }
    html += '</tbody></table>';
    html += '<canvas id="monthlyUsageChart" style="max-width:600px;margin-top:2em;"></canvas>';
    reportContent.innerHTML = '<h3>Monthly Usage Report</h3>' + html;

    // Render Chart.js line chart for total check-outs and check-ins per month
    const ctx = document.getElementById('monthlyUsageChart').getContext('2d');
    const months = Array.from(new Set([...Object.keys(monthTotals), ...Object.keys(monthCheckIns)])).sort();
    const totals = months.map(m => monthTotals[m] || 0);
    const checkIns = months.map(m => monthCheckIns[m] || 0);
    if (monthlyUsageChart) monthlyUsageChart.destroy();
    monthlyUsageChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Total Check Outs',
            data: totals,
            borderColor: '#4a4e69',
            backgroundColor: 'rgba(74,78,105,0.15)',
            fill: true,
            tension: 0.2
          },
          {
            label: 'Total Check Ins',
            data: checkIns,
            borderColor: '#2a9d8f',
            backgroundColor: 'rgba(42,157,143,0.10)',
            fill: true,
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: 'Check Outs and Check Ins per Month' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  function renderUtilizationRateReport() {
    // Get resource data
    const data = JSON.parse(localStorage.getItem('resourcesData') || '[]');
    let total = 0;
    let checkedOut = 0;
    let available = 0;
    data.forEach(item => {
      total += item.quantity || 0;
      // If you have a status field, use it; otherwise, estimate checked out as 0 if available, or all checked out if 0
      if (item.status === 'Checked Out') {
        checkedOut += item.quantity || 0;
      } else {
        available += item.quantity || 0;
      }
    });
    // Fallback: if no status, assume all are available
    if (checkedOut === 0 && available === 0) {
      available = total;
    }
    const html = `
      <div style="max-width:400px;margin:2em auto;">
        <canvas id="utilizationRateChart"></canvas>
      </div>
      <div style="text-align:center;font-size:1.1em;">
        <b>Total Resources:</b> ${total}<br>
        <b>Checked Out:</b> ${checkedOut}<br>
        <b>Available:</b> ${available}
      </div>
    `;
    reportContent.innerHTML = '<h3>Resource Utilization Rate</h3>' + html;
    const ctx = document.getElementById('utilizationRateChart').getContext('2d');
    if (window.utilizationRateChart) window.utilizationRateChart.destroy();
    window.utilizationRateChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Checked Out', 'Available'],
        datasets: [{
          data: [checkedOut, available],
          backgroundColor: ['#e76f51', '#2a9d8f'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'bottom' },
          title: { display: true, text: 'Checked Out vs. Available' }
        }
      }
    });
  }

  function renderUtilizationByResourceReport() {
    // Get resource data
    const data = JSON.parse(localStorage.getItem('resourcesData') || '[]');
    const labels = data.map(item => item.name);
    const checkedOut = data.map(item => (item.totalQuantity || item.quantity || 0) - (item.quantity || 0));
    const available = data.map(item => item.quantity || 0);
    const html = `
      <div style="max-width:700px;margin:2em auto;">
        <canvas id="utilizationByResourceChart"></canvas>
      </div>
    `;
    reportContent.innerHTML = '<h3>Resource Utilization by Resource</h3>' + html;
    const ctx = document.getElementById('utilizationByResourceChart').getContext('2d');
    if (window.utilizationByResourceChart) window.utilizationByResourceChart.destroy();
    window.utilizationByResourceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Checked Out',
            data: checkedOut,
            backgroundColor: '#e76f51'
          },
          {
            label: 'Available',
            data: available,
            backgroundColor: '#2a9d8f'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Checked Out vs. Available by Resource' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  function renderStockSummaryReport() {
    const data = JSON.parse(localStorage.getItem('resourcesData') || '[]');
    let html = `<table style="width:100%;margin-top:1em;"><thead><tr><th>Name</th><th>Type</th><th>Available</th><th>Total</th></tr></thead><tbody>`;
    if (data.length === 0) {
      html += '<tr><td colspan="4" style="text-align:center;">No resources available.</td></tr>';
    } else {
      data.forEach(item => {
        const lowStock = (item.quantity || 0) <= STOCK_THRESHOLD;
        html += `<tr${lowStock ? ' style="color:#b00020;font-weight:bold;"' : ''}><td>${item.name}</td><td>${item.type}</td><td>${item.quantity || 0}</td><td>${item.totalQuantity !== undefined ? item.totalQuantity : ''}</td></tr>`;
      });
    }
    html += '</tbody></table>';
    html += '<canvas id="stockSummaryChart" style="max-width:700px;margin-top:2em;"></canvas>';
    reportContent.innerHTML = '<h3>Stock Summary Report</h3>' + html;
    // Bar chart of available quantity per resource
    const ctx = document.getElementById('stockSummaryChart').getContext('2d');
    const labels = data.map(item => item.name);
    const available = data.map(item => item.quantity || 0);
    if (window.stockSummaryChart) window.stockSummaryChart.destroy();
    window.stockSummaryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Available Quantity',
          data: available,
          backgroundColor: available.map(qty => qty <= STOCK_THRESHOLD ? '#b00020' : '#4a4e69')
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Available Quantity per Resource' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  function renderCheckinCheckoutReport() {
    // Get logs from localStorage and apply filters
    const allLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const logs = allLogs;
    const checkinCheckoutLogs = logs.filter(log => log.activity === 'Check In' || log.activity === 'Check Out');
    
    // Summary statistics
    const totalCheckouts = checkinCheckoutLogs.filter(log => log.activity === 'Check Out').length;
    const totalCheckins = checkinCheckoutLogs.filter(log => log.activity === 'Check In').length;
    const totalCheckoutQty = checkinCheckoutLogs.filter(log => log.activity === 'Check Out').reduce((sum, log) => sum + (log.quantity || 1), 0);
    const totalCheckinQty = checkinCheckoutLogs.filter(log => log.activity === 'Check In').reduce((sum, log) => sum + (log.quantity || 1), 0);
    
    let html = `
      <div style="margin-bottom: 2em;">
        <h4>Summary Statistics</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1em; margin-bottom: 1em;">
          <div style="background: #f8f9fa; padding: 1em; border-radius: 8px;">
            <strong>Total Check-outs:</strong> ${totalCheckouts} (${totalCheckoutQty} items)
          </div>
          <div style="background: #f8f9fa; padding: 1em; border-radius: 8px;">
            <strong>Total Check-ins:</strong> ${totalCheckins} (${totalCheckinQty} items)
          </div>
        </div>
      </div>
    `;
    
    // Detailed activity table
    html += `
      <h4>Detailed Activity Log</h4>
      <table style="width: 100%; margin-top: 1em;">
        <thead><tr><th>Date/Time</th><th>User</th><th>Resource</th><th>Action</th><th>Quantity</th><th>Details</th></tr></thead>
        <tbody>
    `;
    
    if (checkinCheckoutLogs.length === 0) {
      html += '<tr><td colspan="6" style="text-align: center;">No check-in/check-out activity found.</td></tr>';
    } else {
      // Sort by date (newest first)
      checkinCheckoutLogs
        .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
        .forEach(log => {
          const date = new Date(log.dateTime).toLocaleString();
          const actionColor = log.activity === 'Check Out' ? '#e76f51' : '#2a9d8f';
          html += `
            <tr>
              <td>${date}</td>
              <td>${log.user}</td>
              <td>${log.resourceName}</td>
              <td style="color: ${actionColor}; font-weight: bold;">${log.activity}</td>
              <td>${log.quantity || 1}</td>
              <td>${log.details || ''}</td>
            </tr>
          `;
        });
    }
    
    html += '</tbody></table>';
    // Add stacked bar chart for check-ins vs check-outs per resource
    const resourceNames = [...new Set(checkinCheckoutLogs.map(log => log.resourceName))];
    const checkOuts = resourceNames.map(name => checkinCheckoutLogs.filter(log => log.resourceName === name && log.activity === 'Check Out').reduce((sum, log) => sum + (log.quantity || 1), 0));
    const checkIns = resourceNames.map(name => checkinCheckoutLogs.filter(log => log.resourceName === name && log.activity === 'Check In').reduce((sum, log) => sum + (log.quantity || 1), 0));
    html += '<div style="max-width:700px;margin:2em auto;"><canvas id="checkinCheckoutChart"></canvas></div>';
    reportContent.innerHTML = '<h3>Check-in/Check-out Report</h3>' + html;
    const ctx = document.getElementById('checkinCheckoutChart').getContext('2d');
    if (window.checkinCheckoutChart) window.checkinCheckoutChart.destroy();
    window.checkinCheckoutChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: resourceNames,
        datasets: [
          {
            label: 'Check Outs',
            data: checkOuts,
            backgroundColor: '#4a4e69'
          },
          {
            label: 'Check Ins',
            data: checkIns,
            backgroundColor: '#2a9d8f'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Check-ins vs Check-outs per Resource' }
        },
        scales: {
          x: { stacked: true },
          y: { beginAtZero: true, stacked: true }
        }
      }
    });
  }

  function renderDistributionReport() {
    const data = JSON.parse(localStorage.getItem('resourcesData') || '[]');
    const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    
    // Get current distribution by location from recent check-in/check-out activities
    const locationDistribution = {};
    const userDistribution = {};
    const typeDistribution = {};
    
    // Initialize type distribution from current resources
    data.forEach(item => {
      if (!typeDistribution[item.type]) {
        typeDistribution[item.type] = { total: 0, available: 0, checkedOut: 0 };
      }
      typeDistribution[item.type].total += item.totalQuantity || item.quantity || 0;
      typeDistribution[item.type].available += item.quantity || 0;
      typeDistribution[item.type].checkedOut += (item.totalQuantity || item.quantity || 0) - (item.quantity || 0);
    });
    
    // Analyze recent check-in/check-out logs for location and user distribution
    const recentLogs = logs
      .filter(log => log.activity === 'Check In' || log.activity === 'Check Out')
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
      .slice(0, 50); // Last 50 activities
    
    recentLogs.forEach(log => {
      // Extract location from details or use default
      let location = 'Unknown';
      if (log.details) {
        const locationMatch = log.details.match(/Location: ([^)]*)/);
        if (locationMatch) location = locationMatch[1];
        else if (log.details.includes('from location:')) {
          const match = log.details.match(/from location: ([^)]*)/);
          if (match) location = match[1];
        }
      }
      
      if (!locationDistribution[location]) {
        locationDistribution[location] = { checkouts: 0, checkins: 0, resources: new Set() };
      }
      locationDistribution[location].resources.add(log.resourceName);
      if (log.activity === 'Check Out') {
        locationDistribution[location].checkouts++;
      } else {
        locationDistribution[location].checkins++;
      }
      
      // User distribution
      if (!userDistribution[log.user]) {
        userDistribution[log.user] = { checkouts: 0, checkins: 0, resources: new Set() };
      }
      userDistribution[log.user].resources.add(log.resourceName);
      if (log.activity === 'Check Out') {
        userDistribution[log.user].checkouts++;
      } else {
        userDistribution[log.user].checkins++;
      }
    });
    
    let html = `
      <div style="margin-bottom: 2em;">
        <h4>Resource Distribution Summary</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1em; margin-bottom: 1em;">
          <div style="background: #f8f9fa; padding: 1em; border-radius: 8px;">
            <strong>Total Resources:</strong> ${data.length} types<br>
            <strong>Total Items:</strong> ${data.reduce((sum, item) => sum + (item.totalQuantity || item.quantity || 0), 0)}
          </div>
          <div style="background: #f8f9fa; padding: 1em; border-radius: 8px;">
            <strong>Active Locations:</strong> ${Object.keys(locationDistribution).length}<br>
            <strong>Active Users:</strong> ${Object.keys(userDistribution).length}
          </div>
        </div>
      </div>
    `;
    
    // Resource Type Distribution
    html += `
      <h4>Distribution by Resource Type</h4>
      <table style="width: 100%; margin-top: 1em;">
        <thead><tr><th>Resource Type</th><th>Total</th><th>Available</th><th>Checked Out</th><th>Utilization %</th></tr></thead>
        <tbody>
    `;
    
    Object.entries(typeDistribution).forEach(([type, stats]) => {
      const utilization = stats.total > 0 ? Math.round((stats.checkedOut / stats.total) * 100) : 0;
      html += `
        <tr>
          <td>${type}</td>
          <td>${stats.total}</td>
          <td>${stats.available}</td>
          <td>${stats.checkedOut}</td>
          <td>${utilization}%</td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    
    // Location Distribution
    if (Object.keys(locationDistribution).length > 0) {
      html += `
        <h4>Distribution by Location</h4>
        <table style="width: 100%; margin-top: 1em;">
          <thead><tr><th>Location</th><th>Check-outs</th><th>Check-ins</th><th>Unique Resources</th></tr></thead>
          <tbody>
      `;
      
      Object.entries(locationDistribution)
        .sort((a, b) => b[1].resources.size - a[1].resources.size)
        .forEach(([location, stats]) => {
          html += `
            <tr>
              <td>${location}</td>
              <td>${stats.checkouts}</td>
              <td>${stats.checkins}</td>
              <td>${stats.resources.size}</td>
            </tr>
          `;
        });
      
      html += '</tbody></table>';
    }
    
    // User Distribution
    if (Object.keys(userDistribution).length > 0) {
      html += `
        <h4>Distribution by User</h4>
        <table style="width: 100%; margin-top: 1em;">
          <thead><tr><th>User</th><th>Check-outs</th><th>Check-ins</th><th>Unique Resources</th></tr></thead>
          <tbody>
      `;
      
      Object.entries(userDistribution)
        .sort((a, b) => b[1].resources.size - a[1].resources.size)
        .forEach(([user, stats]) => {
          html += `
            <tr>
              <td>${user}</td>
              <td>${stats.checkouts}</td>
              <td>${stats.checkins}</td>
              <td>${stats.resources.size}</td>
            </tr>
          `;
        });
      
      html += '</tbody></table>';
    }
    
    // Add pie chart for resource type distribution
    const typeLabels = Object.keys(typeDistribution);
    const typeTotals = typeLabels.map(type => typeDistribution[type].total);
    html += '<div style="max-width:500px;margin:2em auto;"><canvas id="typeDistributionChart"></canvas></div>';
    reportContent.innerHTML = '<h3>Resource Distribution Report</h3>' + html;
    const ctx = document.getElementById('typeDistributionChart').getContext('2d');
    if (window.typeDistributionChart) window.typeDistributionChart.destroy();
    window.typeDistributionChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: typeLabels,
        datasets: [{
          data: typeTotals,
          backgroundColor: typeLabels.map((_, i) => `hsl(${i * 360 / typeLabels.length}, 60%, 60%)`)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'bottom' },
          title: { display: true, text: 'Resource Type Distribution' }
        }
      }
    });
  }

  function renderDamageLossReport() {
    // Get logs from localStorage and apply filters
    const allLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const logs = allLogs;
    const data = JSON.parse(localStorage.getItem('resourcesData') || '[]');
    
    // Filter for damage, loss, and retirement activities
    const damageLossLogs = logs.filter(log => 
      log.activity === 'Damage Report' || 
      log.activity === 'Loss Report' || 
      log.activity === 'Retire Resource' ||
      log.details?.toLowerCase().includes('damaged') ||
      log.details?.toLowerCase().includes('lost') ||
      log.details?.toLowerCase().includes('broken') ||
      log.details?.toLowerCase().includes('retired')
    );
    
    // Summary statistics
    const damageReports = damageLossLogs.filter(log => 
      log.activity === 'Damage Report' || 
      log.details?.toLowerCase().includes('damaged') ||
      log.details?.toLowerCase().includes('broken')
    );
    
    const lossReports = damageLossLogs.filter(log => 
      log.activity === 'Loss Report' || 
      log.details?.toLowerCase().includes('lost')
    );
    
    const retirementReports = damageLossLogs.filter(log => 
      log.activity === 'Retire Resource' || 
      log.details?.toLowerCase().includes('retired')
    );
    
    // Calculate total quantity affected
    const totalDamagedQty = damageReports.reduce((sum, log) => sum + (log.quantity || 1), 0);
    const totalLostQty = lossReports.reduce((sum, log) => sum + (log.quantity || 1), 0);
    const totalRetiredQty = retirementReports.reduce((sum, log) => sum + (log.quantity || 1), 0);
    
    let html = `
      <div style="margin-bottom: 2em;">
        <h4>Damage/Loss Summary</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1em; margin-bottom: 1em;">
          <div style="background: #fff3cd; padding: 1em; border-radius: 8px; border-left: 4px solid #ffc107;">
            <strong>Damaged Items:</strong> ${damageReports.length} incidents (${totalDamagedQty} items)
          </div>
          <div style="background: #f8d7da; padding: 1em; border-radius: 8px; border-left: 4px solid #dc3545;">
            <strong>Lost Items:</strong> ${lossReports.length} incidents (${totalLostQty} items)
          </div>
          <div style="background: #d1ecf1; padding: 1em; border-radius: 8px; border-left: 4px solid #17a2b8;">
            <strong>Retired Items:</strong> ${retirementReports.length} incidents (${totalRetiredQty} items)
          </div>
        </div>
      </div>
    `;
    
    // Detailed incidents table
    html += `
      <h4>Detailed Incidents</h4>
      <table style="width: 100%; margin-top: 1em;">
        <thead><tr><th>Date/Time</th><th>User</th><th>Resource</th><th>Type</th><th>Quantity</th><th>Details</th><th>Status</th></tr></thead>
        <tbody>
    `;
    
    if (damageLossLogs.length === 0) {
      html += '<tr><td colspan="7" style="text-align: center;">No damage, loss, or retirement incidents found.</td></tr>';
    } else {
      // Sort by date (newest first)
      damageLossLogs
        .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
        .forEach(log => {
          const date = new Date(log.dateTime).toLocaleString();
          
          // Determine incident type and styling
          let incidentType = 'Other';
          let statusColor = '#6c757d';
          
          if (log.activity === 'Damage Report' || log.details?.toLowerCase().includes('damaged') || log.details?.toLowerCase().includes('broken')) {
            incidentType = 'Damage';
            statusColor = '#ffc107';
          } else if (log.activity === 'Loss Report' || log.details?.toLowerCase().includes('lost')) {
            incidentType = 'Loss';
            statusColor = '#dc3545';
          } else if (log.activity === 'Retire Resource' || log.details?.toLowerCase().includes('retired')) {
            incidentType = 'Retirement';
            statusColor = '#17a2b8';
          }
          
          // Determine status based on activity and details
          let status = 'Reported';
          if (log.details?.toLowerCase().includes('repaired')) status = 'Repaired';
          else if (log.details?.toLowerCase().includes('replaced')) status = 'Replaced';
          else if (log.details?.toLowerCase().includes('found')) status = 'Found';
          else if (log.details?.toLowerCase().includes('retired')) status = 'Retired';
          
          html += `
            <tr>
              <td>${date}</td>
              <td>${log.user}</td>
              <td>${log.resourceName}</td>
              <td style="color: ${statusColor}; font-weight: bold;">${incidentType}</td>
              <td>${log.quantity || 1}</td>
              <td>${log.details || ''}</td>
              <td style="color: ${statusColor};">${status}</td>
            </tr>
          `;
        });
    }
    
    html += '</tbody></table>';
    
    // Resource type breakdown
    const typeBreakdown = {};
    damageLossLogs.forEach(log => {
      const resource = data.find(item => item.name === log.resourceName);
      const type = resource ? resource.type : 'Unknown';
      if (!typeBreakdown[type]) {
        typeBreakdown[type] = { damage: 0, loss: 0, retirement: 0 };
      }
      
      if (log.activity === 'Damage Report' || log.details?.toLowerCase().includes('damaged') || log.details?.toLowerCase().includes('broken')) {
        typeBreakdown[type].damage++;
      } else if (log.activity === 'Loss Report' || log.details?.toLowerCase().includes('lost')) {
        typeBreakdown[type].loss++;
      } else if (log.activity === 'Retire Resource' || log.details?.toLowerCase().includes('retired')) {
        typeBreakdown[type].retirement++;
      }
    });
    
    if (Object.keys(typeBreakdown).length > 0) {
      html += `
        <h4>Breakdown by Resource Type</h4>
        <table style="width: 100%; margin-top: 1em;">
          <thead><tr><th>Resource Type</th><th>Damage Incidents</th><th>Loss Incidents</th><th>Retirement Incidents</th><th>Total</th></tr></thead>
          <tbody>
      `;
      
      Object.entries(typeBreakdown).forEach(([type, stats]) => {
        const total = stats.damage + stats.loss + stats.retirement;
        html += `
          <tr>
            <td>${type}</td>
            <td>${stats.damage}</td>
            <td>${stats.loss}</td>
            <td>${stats.retirement}</td>
            <td><strong>${total}</strong></td>
          </tr>
        `;
      });
      
      html += '</tbody></table>';
    }
    
    // Add bar chart for incidents by type
    const typeLabels = Object.keys(typeBreakdown);
    const damageCounts = typeLabels.map(type => typeBreakdown[type].damage);
    const lossCounts = typeLabels.map(type => typeBreakdown[type].loss);
    const retirementCounts = typeLabels.map(type => typeBreakdown[type].retirement);
    html += '<div style="max-width:700px;margin:2em auto;"><canvas id="damageLossChart"></canvas></div>';
    reportContent.innerHTML = '<h3>Damage/Loss Report</h3>' + html;
    const ctx = document.getElementById('damageLossChart').getContext('2d');
    if (window.damageLossChart) window.damageLossChart.destroy();
    window.damageLossChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: typeLabels,
        datasets: [
          { label: 'Damage', data: damageCounts, backgroundColor: '#ffc107' },
          { label: 'Loss', data: lossCounts, backgroundColor: '#dc3545' },
          { label: 'Retirement', data: retirementCounts, backgroundColor: '#17a2b8' }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Incidents by Resource Type' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  function renderProgramSpecificReport() {
    const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    
    // Filter for check-out activities that might have program information
    const programLogs = logs.filter(log => 
      log.activity === 'Check Out' && 
      log.details && 
      (log.details.toLowerCase().includes('program') || 
       log.details.toLowerCase().includes('project') || 
       log.details.toLowerCase().includes('event') || 
       log.details.toLowerCase().includes('class') || 
       log.details.toLowerCase().includes('workshop'))
    );
    
    // Extract program information
    const programData = {};
    
    programLogs.forEach(log => {
      let programName = 'General Use';
      
      // Try to extract program name from details
      if (log.details) {
        if (log.details.toLowerCase().includes('program:')) {
          const match = log.details.match(/program:\s*([^,)]*)/i);
          if (match) programName = match[1].trim();
        } else if (log.details.toLowerCase().includes('project:')) {
          const match = log.details.match(/project:\s*([^,)]*)/i);
          if (match) programName = match[1].trim();
        } else if (log.details.toLowerCase().includes('for:')) {
          const match = log.details.match(/for:\s*([^,)]*)/i);
          if (match) programName = match[1].trim();
        }
      }
      
      if (!programData[programName]) {
        programData[programName] = {
          checkouts: 0,
          resources: new Set(),
          users: new Set()
        };
      }
      
      programData[programName].resources.add(log.resourceName);
      programData[programName].users.add(log.user);
      programData[programName].checkouts++;
    });
    
    let html = `
      <div style="margin-bottom: 2em;">
        <h4>Program-Specific Usage Summary</h4>
        <div style="background: #f8f9fa; padding: 1em; border-radius: 8px;">
          <strong>Total Programs:</strong> ${Object.keys(programData).length}<br>
          <strong>Total Program Activities:</strong> ${programLogs.length}
        </div>
      </div>
    `;
    
    // Program breakdown table
    html += `
      <h4>Program Usage Breakdown</h4>
      <table style="width: 100%; margin-top: 1em;">
        <thead><tr><th>Program/Project</th><th>Check-outs</th><th>Unique Resources</th><th>Unique Users</th><th>Resources Used</th></tr></thead>
        <tbody>
    `;
    
    if (Object.keys(programData).length === 0) {
      html += '<tr><td colspan="5" style="text-align: center;">No program-specific usage data found.</td></tr>';
    } else {
      Object.entries(programData)
        .sort((a, b) => b[1].checkouts - a[1].checkouts)
        .forEach(([program, stats]) => {
          html += `
            <tr>
              <td><strong>${program}</strong></td>
              <td>${stats.checkouts}</td>
              <td>${stats.resources.size}</td>
              <td>${stats.users.size}</td>
              <td>${Array.from(stats.resources).join(', ') || 'None'}</td>
            </tr>
          `;
        });
    }
    
    html += '</tbody></table>';
    
    // Recent program activities
    if (programLogs.length > 0) {
      html += `
        <h4>Recent Program Activities</h4>
        <table style="width: 100%; margin-top: 1em;">
          <thead><tr><th>Date/Time</th><th>User</th><th>Resource</th><th>Program/Project</th><th>Details</th></tr></thead>
          <tbody>
      `;
      
      programLogs
        .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
        .slice(0, 10)
        .forEach(log => {
          const date = new Date(log.dateTime).toLocaleString();
          let programName = 'General Use';
          
          if (log.details) {
            if (log.details.toLowerCase().includes('program:')) {
              const match = log.details.match(/program:\s*([^,)]*)/i);
              if (match) programName = match[1].trim();
            } else if (log.details.toLowerCase().includes('project:')) {
              const match = log.details.match(/project:\s*([^,)]*)/i);
              if (match) programName = match[1].trim();
            } else if (log.details.toLowerCase().includes('for:')) {
              const match = log.details.match(/for:\s*([^,)]*)/i);
              if (match) programName = match[1].trim();
            }
          }
          
          html += `
            <tr>
              <td>${date}</td>
              <td>${log.user}</td>
              <td>${log.resourceName}</td>
              <td>${programName}</td>
              <td>${log.details || ''}</td>
            </tr>
          `;
        });
      
      html += '</tbody></table>';
    }
    
    // Add bar chart for check-outs per program
    const programLabels = Object.keys(programData);
    const programCheckouts = programLabels.map(name => programData[name].checkouts);
    html += '<div style="max-width:700px;margin:2em auto;"><canvas id="programUsageChart"></canvas></div>';
    reportContent.innerHTML = '<h3>Program-Specific Report</h3>' + html;
    const ctx = document.getElementById('programUsageChart').getContext('2d');
    if (window.programUsageChart) window.programUsageChart.destroy();
    window.programUsageChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: programLabels,
        datasets: [{
          label: 'Check-outs',
          data: programCheckouts,
          backgroundColor: '#4a4e69'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Check-outs per Program' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  function renderReport(type) {
    switch(type) {
      case 'monthly-usage':
        renderMonthlyUsageReport();
        break;
      case 'stock-summary':
        renderStockSummaryReport();
        break;
      case 'checkin-checkout':
        renderCheckinCheckoutReport();
        break;
      case 'distribution':
        renderDistributionReport();
        break;
      case 'damage-loss':
        renderDamageLossReport();
        break;
      case 'program-specific':
        renderProgramSpecificReport();
        break;
      case 'utilization-rate':
        renderUtilizationRateReport();
        break;
      case 'utilization-by-resource':
        renderUtilizationByResourceReport();
        break;
      default:
        reportContent.innerHTML = '<p>Select a report type above.</p>';
    }
  }

  reportTypeSelect.addEventListener('change', function() {
    renderReport(this.value);
  });

  // Render default report on load
  renderReport(reportTypeSelect.value);

  // Export to Excel
  document.getElementById('exportExcelBtn').addEventListener('click', function() {
    const table = reportContent.querySelector('table');
    if (!table) {
      alert('No table to export!');
      return;
    }
    const wb = XLSX.utils.table_to_book(table, {sheet: 'Report'});
    XLSX.writeFile(wb, 'report.xlsx');
  });

  // Export to PDF
  document.getElementById('exportPdfBtn').addEventListener('click', function() {
    html2canvas(reportContent).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf.jsPDF({orientation: 'landscape', unit: 'pt', format: 'a4'});
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Scale image to fit page
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const x = (pageWidth - imgWidth * ratio) / 2;
      const y = 20;
      pdf.addImage(imgData, 'PNG', x, y, imgWidth * ratio, imgHeight * ratio);
      pdf.save('report.pdf');
    });
  });
});
