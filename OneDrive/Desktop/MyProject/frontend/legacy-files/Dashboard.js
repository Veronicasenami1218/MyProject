document.addEventListener('DOMContentLoaded', function() {
  const totalResourcesEl = document.getElementById('totalResources');
  const lowStockCountEl = document.getElementById('lowStockCount');
  const checkedOutCountEl = document.getElementById('checkedOutCount');
  const activeUsersEl = document.getElementById('activeUsers');

  // Modal elements
  const addResourceModal = document.getElementById('addResourceModal');
  const addResourceBtn = document.getElementById('addResourceBtn');
  const cancelAddResourceBtn = document.getElementById('cancelAddResource');
  const addResourceForm = document.getElementById('addResourceForm');

  // Checkout modal elements
  const quickCheckoutModal = document.getElementById('quickCheckoutModal');
  const quickCheckoutBtn = document.getElementById('quickCheckoutBtn');
  const cancelCheckoutBtn = document.getElementById('cancelCheckout');
  const quickCheckoutForm = document.getElementById('quickCheckoutForm');
  const checkoutResourceSelect = document.getElementById('checkoutResource');
  const checkoutQuantityInput = document.getElementById('checkoutQuantity');

  // Report modal elements
  const generateReportModal = document.getElementById('generateReportModal');
  const generateReportBtn = document.getElementById('generateReportBtn');
  const closeReportModal = document.getElementById('closeReportModal');
  const exportReportCSVBtn = document.getElementById('exportReportCSV');
  const exportReportPDFBtn = document.getElementById('exportReportPDF');
  const printReportBtn = document.getElementById('printReport');

  // Export data modal elements
  const exportDataModal = document.getElementById('exportDataModal');
  const exportDataBtn = document.getElementById('exportDataBtn');
  const cancelExportDataBtn = document.getElementById('cancelExportData');

  function getResourceData() {
    return JSON.parse(localStorage.getItem('resourcesData') || '[]');
  }
  function getActivityLogs() {
    return JSON.parse(localStorage.getItem('activityLogs') || '[]');
  }

  // Initialize sample data if none exists
  function initializeSampleData() {
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
  }

  function getPreviousStats() {
    return JSON.parse(localStorage.getItem('dashboardPrevStats') || '{}');
  }
  function setPreviousStats(stats) {
    localStorage.setItem('dashboardPrevStats', JSON.stringify(stats));
  }

  function updateDashboardStats() {
    const data = getResourceData();
    const logs = getActivityLogs();
    const totalResources = data.length;
    const lowStockCount = data.filter(item => item.quantity <= 1).length;
    const checkedOutCount = data.filter(item => item.status === 'Checked Out').length;
    const activeUsers = new Set(logs.map(log => log.user)).size;

    console.log('Dashboard stats:', { totalResources, lowStockCount, checkedOutCount, activeUsers });

    // Get previous stats
    const prevStats = getPreviousStats();

    // Helper to update trend
    function setTrend(elementId, current, previous) {
      const el = document.getElementById(elementId);
      if (!el) {
        console.log('Trend element not found:', elementId);
        return;
      }
      let trend = '';
      let trendClass = '';
      if (previous === undefined) {
        trend = '–';
        trendClass = 'neutral';
      } else if (current > previous) {
        trend = '▲';
        trendClass = 'up';
      } else if (current < previous) {
        trend = '▼';
        trendClass = 'down';
      } else {
        trend = '–';
        trendClass = 'neutral';
      }
      el.textContent = trend;
      el.className = 'trend ' + trendClass;
      console.log('Updated trend for', elementId, ':', trend, trendClass);
    }

    if (totalResourcesEl) totalResourcesEl.textContent = totalResources + ' ';
    if (lowStockCountEl) lowStockCountEl.textContent = lowStockCount + ' ';
    if (checkedOutCountEl) checkedOutCountEl.textContent = checkedOutCount + ' ';
    if (activeUsersEl) activeUsersEl.textContent = activeUsers + ' ';

    setTrend('totalResourcesTrend', totalResources, prevStats.totalResources);
    setTrend('lowStockCountTrend', lowStockCount, prevStats.lowStockCount);
    setTrend('checkedOutCountTrend', checkedOutCount, prevStats.checkedOutCount);
    setTrend('activeUsersTrend', activeUsers, prevStats.activeUsers);

    // Save current stats for next time
    setPreviousStats({
      totalResources,
      lowStockCount,
      checkedOutCount,
      activeUsers
    });
  }

  // Modal functions
  function showAddResourceModal() {
    addResourceModal.classList.add('active');
    document.getElementById('resourceName').focus();
  }

  function hideAddResourceModal() {
    addResourceModal.classList.remove('active');
    addResourceForm.reset();
  }

  function addResourceToStorage(resourceData) {
    const resources = getResourceData();
    const newResource = {
      id: Date.now().toString(), // Simple ID generation
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
    return newResource;
  }

  // Event listeners for modal
  if (addResourceBtn) {
    addResourceBtn.addEventListener('click', showAddResourceModal);
  }

  if (cancelAddResourceBtn) {
    cancelAddResourceBtn.addEventListener('click', hideAddResourceModal);
  }

  // Close modal when clicking outside
  if (addResourceModal) {
    addResourceModal.addEventListener('click', function(e) {
      if (e.target === addResourceModal) {
        hideAddResourceModal();
      }
    });
  }

  // Handle form submission
  if (addResourceForm) {
    addResourceForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(addResourceForm);
      const resourceData = {
        resourceName: formData.get('resourceName'),
        resourceType: formData.get('resourceType'),
        resourceQuantity: formData.get('resourceQuantity'),
        resourceLocation: formData.get('resourceLocation'),
        resourceStatus: formData.get('resourceStatus'),
        resourceDescription: formData.get('resourceDescription')
      };
      
      try {
        addResourceToStorage(resourceData);
        hideAddResourceModal();
        updateDashboardStats();
        
        // Show success message
        showAlert('Resource added successfully!', 'success');
        
        // Update activity feed
        updateActivityFeed();
        
      } catch (error) {
        console.error('Error adding resource:', error);
        showAlert('Error adding resource. Please try again.', 'error');
      }
    });
  }

  // Alert system
  function showAlert(message, type = 'info') {
    const alertsSection = document.getElementById('alertsSection');
    const alertsContainer = document.getElementById('alertsContainer');
    
    if (alertsSection && alertsContainer) {
      alertsSection.style.display = 'block';
      
      const alertItem = document.createElement('div');
      alertItem.className = 'alert-item';
      alertItem.style.borderLeftColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#ffc107';
      alertItem.textContent = message;
      
      alertsContainer.appendChild(alertItem);
      
      // Remove alert after 5 seconds
      setTimeout(() => {
        if (alertItem.parentNode) {
          alertItem.remove();
          if (alertsContainer.children.length === 0) {
            alertsSection.style.display = 'none';
          }
        }
      }, 5000);
    }
  }

  // Update activity feed
  function updateActivityFeed() {
    const activityFeed = document.getElementById('activityFeed');
    if (activityFeed) {
      const logs = getActivityLogs();
      const recentLogs = logs.slice(-5).reverse(); // Get last 5 logs
      
      activityFeed.innerHTML = '';
      
      recentLogs.forEach(log => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const time = new Date(log.dateTime).toLocaleString();
        activityItem.innerHTML = `
          <span class="activity-time">${time}</span>
          <span class="activity-text">${log.user} ${log.activity.toLowerCase()}ed ${log.resourceName}</span>
        `;
        
        activityFeed.appendChild(activityItem);
      });
    }
  }

  // Checkout modal functions
  function showQuickCheckoutModal() {
    populateCheckoutResourceSelect();
    quickCheckoutModal.classList.add('active');
    document.getElementById('checkoutUser').focus();
  }

  function hideQuickCheckoutModal() {
    quickCheckoutModal.classList.remove('active');
    quickCheckoutForm.reset();
  }

  function populateCheckoutResourceSelect() {
    if (!checkoutResourceSelect) return;
    
    const resources = getResourceData();
    const availableResources = resources.filter(resource => 
      resource.status === 'Available' && resource.quantity > 0
    );
    
    // Clear existing options except the first one
    checkoutResourceSelect.innerHTML = '<option value="">Select a resource to check out</option>';
    
    availableResources.forEach(resource => {
      const option = document.createElement('option');
      option.value = resource.id;
      option.textContent = `${resource.name} (${resource.type}) - ${resource.quantity} available at ${resource.location}`;
      option.dataset.quantity = resource.quantity;
      checkoutResourceSelect.appendChild(option);
    });
    
    if (availableResources.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No available resources to check out';
      option.disabled = true;
      checkoutResourceSelect.appendChild(option);
    }
  }

  function updateCheckoutQuantity() {
    const selectedOption = checkoutResourceSelect.selectedOptions[0];
    if (selectedOption && selectedOption.dataset.quantity) {
      const maxQuantity = parseInt(selectedOption.dataset.quantity);
      checkoutQuantityInput.max = maxQuantity;
      checkoutQuantityInput.placeholder = `Max: ${maxQuantity}`;
      
      // If current quantity is greater than max, reset it
      if (parseInt(checkoutQuantityInput.value) > maxQuantity) {
        checkoutQuantityInput.value = maxQuantity;
      }
    }
  }

  function processCheckout(checkoutData) {
    const resources = getResourceData();
    const resourceIndex = resources.findIndex(r => r.id === checkoutData.resourceId);
    
    if (resourceIndex === -1) {
      throw new Error('Resource not found');
    }
    
    const resource = resources[resourceIndex];
    const checkoutQuantity = parseInt(checkoutData.quantity);
    
    if (checkoutQuantity > resource.quantity) {
      throw new Error('Insufficient quantity available');
    }
    
    // Update resource quantity and status
    resource.quantity -= checkoutQuantity;
    if (resource.quantity === 0) {
      resource.status = 'Out of Stock';
    } else if (resource.quantity <= 1) {
      resource.status = 'Low Stock';
    }
    
    // Save updated resources
    localStorage.setItem('resourcesData', JSON.stringify(resources));
    
    // Add activity log
    const logs = getActivityLogs();
    const newLog = {
      dateTime: new Date().toISOString(),
      resourceName: resource.name,
      activity: 'Check Out',
      user: checkoutData.user,
      details: `Checked out ${checkoutQuantity} ${resource.name} for: ${checkoutData.details || 'General use'}`,
      quantity: checkoutQuantity
    };
    logs.push(newLog);
    localStorage.setItem('activityLogs', JSON.stringify(logs));
    
    console.log('Checkout processed:', { resource: resource.name, quantity: checkoutQuantity, user: checkoutData.user });
    return resource;
  }

  // Event listeners for checkout modal
  if (quickCheckoutBtn) {
    quickCheckoutBtn.addEventListener('click', showQuickCheckoutModal);
  }

  if (cancelCheckoutBtn) {
    cancelCheckoutBtn.addEventListener('click', hideQuickCheckoutModal);
  }

  // Close checkout modal when clicking outside
  if (quickCheckoutModal) {
    quickCheckoutModal.addEventListener('click', function(e) {
      if (e.target === quickCheckoutModal) {
        hideQuickCheckoutModal();
      }
    });
  }

  // Update quantity when resource selection changes
  if (checkoutResourceSelect) {
    checkoutResourceSelect.addEventListener('change', updateCheckoutQuantity);
  }

  // Handle checkout form submission
  if (quickCheckoutForm) {
    quickCheckoutForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(quickCheckoutForm);
      const checkoutData = {
        resourceId: formData.get('checkoutResource'),
        user: formData.get('checkoutUser'),
        quantity: formData.get('checkoutQuantity'),
        details: formData.get('checkoutDetails')
      };
      
      try {
        processCheckout(checkoutData);
        hideQuickCheckoutModal();
        updateDashboardStats();
        
        // Show success message
        showAlert('Resource checked out successfully!', 'success');
        
        // Update activity feed
        updateActivityFeed();
        
      } catch (error) {
        console.error('Error processing checkout:', error);
        showAlert(`Error: ${error.message}`, 'error');
      }
    });
  }

  // Report modal functions
  function showGenerateReportModal() {
    generateReportModal.classList.add('active');
    generateReport();
  }

  function hideGenerateReportModal() {
    generateReportModal.classList.remove('active');
  }

  function generateReport() {
    const resources = getResourceData();
    const logs = getActivityLogs();
    
    // Calculate statistics
    const totalResources = resources.length;
    const availableResources = resources.filter(r => r.status === 'Available').length;
    const checkedOutResources = resources.filter(r => r.status === 'Checked Out').length;
    const lowStockResources = resources.filter(r => r.quantity <= 1).length;
    const repairResources = resources.filter(r => r.status === 'Needs Repair').length;
    const activeUsers = new Set(logs.map(log => log.user)).size;
    
    // Update statistics in the report
    document.getElementById('reportTotalResources').textContent = totalResources;
    document.getElementById('reportAvailableResources').textContent = availableResources;
    document.getElementById('reportCheckedOutResources').textContent = checkedOutResources;
    document.getElementById('reportLowStockResources').textContent = lowStockResources;
    document.getElementById('reportRepairResources').textContent = repairResources;
    document.getElementById('reportActiveUsers').textContent = activeUsers;
    
    // Generate type distribution
    generateTypeDistribution(resources);
    
    // Generate activity summary
    generateActivitySummary(logs);
  }

  function generateTypeDistribution(resources) {
    const typeDistribution = document.getElementById('typeDistribution');
    const typeCounts = {};
    
    resources.forEach(resource => {
      typeCounts[resource.type] = (typeCounts[resource.type] || 0) + 1;
    });
    
    typeDistribution.innerHTML = '';
    
    if (Object.keys(typeCounts).length === 0) {
      typeDistribution.innerHTML = '<p>No resources found.</p>';
      return;
    }
    
    Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .forEach(([type, count]) => {
        const typeItem = document.createElement('div');
        typeItem.className = 'type-item';
        typeItem.innerHTML = `
          <div class="type-name">${type}</div>
          <div class="type-count">${count}</div>
        `;
        typeDistribution.appendChild(typeItem);
      });
  }

  function generateActivitySummary(logs) {
    const activitySummary = document.getElementById('activitySummary');
    const recentLogs = logs.slice(-10).reverse(); // Get last 10 logs
    
    activitySummary.innerHTML = '';
    
    if (recentLogs.length === 0) {
      activitySummary.innerHTML = '<p>No recent activity found.</p>';
      return;
    }
    
    recentLogs.forEach(log => {
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item-report';
      
      const time = new Date(log.dateTime).toLocaleString();
      activityItem.innerHTML = `
        <span class="activity-time-report">${time}</span>
        <span class="activity-text-report">${log.user} ${log.activity.toLowerCase()}ed ${log.resourceName}</span>
      `;
      
      activitySummary.appendChild(activityItem);
    });
  }

  function exportReportAsCSV() {
    const resources = getResourceData();
    const logs = getActivityLogs();
    
    // Create CSV content
    let csvContent = 'Resource Inventory Report\n\n';
    
    // Statistics section
    csvContent += 'Statistics\n';
    csvContent += 'Total Resources,' + resources.length + '\n';
    csvContent += 'Available,' + resources.filter(r => r.status === 'Available').length + '\n';
    csvContent += 'Checked Out,' + resources.filter(r => r.status === 'Checked Out').length + '\n';
    csvContent += 'Low Stock,' + resources.filter(r => r.quantity <= 1).length + '\n';
    csvContent += 'Needs Repair,' + resources.filter(r => r.status === 'Needs Repair').length + '\n';
    csvContent += 'Active Users,' + new Set(logs.map(log => log.user)).size + '\n\n';
    
    // Resources section
    csvContent += 'Resources\n';
    csvContent += 'Name,Type,Quantity,Location,Status,Description\n';
    resources.forEach(resource => {
      csvContent += `"${resource.name}","${resource.type}",${resource.quantity},"${resource.location}","${resource.status}","${resource.description || ''}"\n`;
    });
    
    csvContent += '\nRecent Activity\n';
    csvContent += 'DateTime,User,Activity,Resource,Details\n';
    logs.slice(-20).reverse().forEach(log => {
      csvContent += `"${log.dateTime}","${log.user}","${log.activity}","${log.resourceName}","${log.details || ''}"\n`;
    });
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resource_inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showAlert('Report exported as CSV successfully!', 'success');
  }

  function exportReportAsPDF() {
    // Check if jsPDF is available
    if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
      showAlert('PDF libraries not loaded. Using print dialog instead.', 'info');
      // Fallback to print functionality
      const reportContent = document.getElementById('reportContent');
      const originalDisplay = reportContent.style.display;
      reportContent.style.display = 'block';
      window.print();
      reportContent.style.display = originalDisplay;
      return;
    }

    // Proper PDF export using jsPDF and html2canvas
    const reportContent = document.getElementById('reportContent');
    
    // Show loading message
    showAlert('Generating PDF... Please wait.', 'info');
    
    // Create a temporary container for PDF generation
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '800px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '20px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '12px';
    tempContainer.style.lineHeight = '1.4';
    
    // Clone the report content
    const clonedContent = reportContent.cloneNode(true);
    
    // Add report header
    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.marginBottom = '30px';
    header.style.borderBottom = '2px solid #4a4e69';
    header.style.paddingBottom = '20px';
    header.innerHTML = `
      <h1 style="color: #4a4e69; margin: 0; font-size: 24px;">Resource Inventory Report</h1>
      <p style="color: #6c757d; margin: 10px 0 0 0;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    `;
    tempContainer.appendChild(header);
    
    // Add cloned content
    tempContainer.appendChild(clonedContent);
    document.body.appendChild(tempContainer);
    
    // Generate PDF using html2canvas and jsPDF
    html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    }).then(canvas => {
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate scaling to fit the page
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;
      
      // Center the image on the page
      const x = (pageWidth - scaledWidth) / 2;
      const y = 10;
      
      // Add the image to PDF
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
      
      // Add page numbers if content spans multiple pages
      const totalPages = Math.ceil(scaledHeight / pageHeight);
      if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(10);
          pdf.setTextColor(100);
          pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10);
        }
      }
      
      // Save the PDF
      const fileName = `resource_inventory_report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      showAlert('PDF exported successfully!', 'success');
    }).catch(error => {
      // Remove temporary container on error
      if (tempContainer.parentNode) {
        document.body.removeChild(tempContainer);
      }
      console.error('Error generating PDF:', error);
      showAlert('Error generating PDF. Using print dialog instead.', 'error');
      
      // Fallback to print functionality
      const reportContent = document.getElementById('reportContent');
      const originalDisplay = reportContent.style.display;
      reportContent.style.display = 'block';
      window.print();
      reportContent.style.display = originalDisplay;
    });
  }

  function printReport() {
    const reportContent = document.getElementById('reportContent');
    const originalDisplay = reportContent.style.display;
    
    // Show only the report content
    reportContent.style.display = 'block';
    
    // Print the report
    window.print();
    
    // Restore original display
    reportContent.style.display = originalDisplay;
    
    showAlert('Report sent to printer!', 'success');
  }

  // Event listeners for report modal
  if (generateReportBtn) {
    generateReportBtn.addEventListener('click', showGenerateReportModal);
  }

  if (closeReportModal) {
    closeReportModal.addEventListener('click', hideGenerateReportModal);
  }

  // Close report modal when clicking outside
  if (generateReportModal) {
    generateReportModal.addEventListener('click', function(e) {
      if (e.target === generateReportModal) {
        hideGenerateReportModal();
      }
    });
  }

  // Export event listeners
  if (exportReportCSVBtn) {
    exportReportCSVBtn.addEventListener('click', exportReportAsCSV);
  }

  if (exportReportPDFBtn) {
    exportReportPDFBtn.addEventListener('click', exportReportAsPDF);
  }

  if (printReportBtn) {
    printReportBtn.addEventListener('click', printReport);
  }

  // Export data modal functions
  function showExportDataModal() {
    exportDataModal.classList.add('active');
    updateDataSummary();
  }

  function hideExportDataModal() {
    exportDataModal.classList.remove('active');
  }

  function updateDataSummary() {
    const resources = getResourceData();
    const logs = getActivityLogs();
    const dataSummary = document.getElementById('dataSummary');
    
    if (!dataSummary) return;
    
    const totalResources = resources.length;
    const totalLogs = logs.length;
    const activeUsers = new Set(logs.map(log => log.user)).size;
    const availableResources = resources.filter(r => r.status === 'Available').length;
    const lowStockResources = resources.filter(r => r.quantity <= 1).length;
    
    dataSummary.innerHTML = `
      <div class="data-summary-item">
        <span class="data-summary-label">Total Resources:</span>
        <span class="data-summary-value highlight">${totalResources}</span>
      </div>
      <div class="data-summary-item">
        <span class="data-summary-label">Available Resources:</span>
        <span class="data-summary-value highlight">${availableResources}</span>
      </div>
      <div class="data-summary-item">
        <span class="data-summary-label">Low Stock Items:</span>
        <span class="data-summary-value warning">${lowStockResources}</span>
      </div>
      <div class="data-summary-item">
        <span class="data-summary-label">Activity Logs:</span>
        <span class="data-summary-value">${totalLogs}</span>
      </div>
      <div class="data-summary-item">
        <span class="data-summary-label">Active Users:</span>
        <span class="data-summary-value">${activeUsers}</span>
      </div>
      <div class="data-summary-item">
        <span class="data-summary-label">Estimated File Size:</span>
        <span class="data-summary-value">${calculateEstimatedSize(resources, logs)} KB</span>
      </div>
    `;
  }

  function calculateEstimatedSize(resources, logs) {
    const resourcesSize = JSON.stringify(resources).length;
    const logsSize = JSON.stringify(logs).length;
    const totalSize = resourcesSize + logsSize;
    return Math.round(totalSize / 1024 * 10) / 10; // Convert to KB with 1 decimal place
  }

  function exportData() {
    const exportResources = document.getElementById('exportResources').checked;
    const exportActivityLogs = document.getElementById('exportActivityLogs').checked;
    const exportStatistics = document.getElementById('exportStatistics').checked;
    const exportFormat = document.querySelector('input[name="exportFormat"]:checked').value;
    const includeHeaders = document.getElementById('includeHeaders').checked;
    const includeTimestamps = document.getElementById('includeTimestamps').checked;
    const formatDates = document.getElementById('formatDates').checked;
    
    if (!exportResources && !exportActivityLogs && !exportStatistics) {
      showAlert('Please select at least one data type to export.', 'error');
      return;
    }
    
    const resources = getResourceData();
    const logs = getActivityLogs();
    const stats = getPreviousStats();
    
    let exportContent = '';
    let fileName = `resource_inventory_export_${new Date().toISOString().split('T')[0]}`;
    
    switch (exportFormat) {
      case 'csv':
        exportContent = generateCSVExport(resources, logs, stats, exportResources, exportActivityLogs, exportStatistics, includeHeaders, includeTimestamps, formatDates);
        fileName += '.csv';
        break;
      case 'json':
        exportContent = generateJSONExport(resources, logs, stats, exportResources, exportActivityLogs, exportStatistics, includeTimestamps, formatDates);
        fileName += '.json';
        break;
      case 'txt':
        exportContent = generateTXTExport(resources, logs, stats, exportResources, exportActivityLogs, exportStatistics, includeTimestamps, formatDates);
        fileName += '.txt';
        break;
    }
    
    // Download the file
    const blob = new Blob([exportContent], { 
      type: exportFormat === 'json' ? 'application/json' : 
            exportFormat === 'csv' ? 'text/csv' : 'text/plain' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showAlert(`Data exported successfully as ${exportFormat.toUpperCase()}!`, 'success');
    hideExportDataModal();
  }

  function generateCSVExport(resources, logs, stats, exportResources, exportActivityLogs, exportStatistics, includeHeaders, includeTimestamps, formatDates) {
    let csvContent = '';
    
    if (exportStatistics && includeHeaders) {
      csvContent += 'STATISTICS\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Resources,${resources.length}\n`;
      csvContent += `Available Resources,${resources.filter(r => r.status === 'Available').length}\n`;
      csvContent += `Checked Out Resources,${resources.filter(r => r.status === 'Checked Out').length}\n`;
      csvContent += `Low Stock Items,${resources.filter(r => r.quantity <= 1).length}\n`;
      csvContent += `Needs Repair,${resources.filter(r => r.status === 'Needs Repair').length}\n`;
      csvContent += `Active Users,${new Set(logs.map(log => log.user)).size}\n`;
      csvContent += `Total Activity Logs,${logs.length}\n\n`;
    }
    
    if (exportResources) {
      if (includeHeaders) {
        csvContent += 'RESOURCES\n';
        csvContent += 'ID,Name,Type,Quantity,Location,Status,Description,Date Added\n';
      }
      resources.forEach(resource => {
        const dateAdded = formatDates ? new Date(resource.dateAdded).toLocaleDateString() : resource.dateAdded;
        csvContent += `"${resource.id || ''}","${resource.name}","${resource.type}",${resource.quantity},"${resource.location}","${resource.status}","${resource.description || ''}","${dateAdded}"\n`;
      });
      csvContent += '\n';
    }
    
    if (exportActivityLogs) {
      if (includeHeaders) {
        csvContent += 'ACTIVITY LOGS\n';
        csvContent += 'DateTime,User,Activity,Resource,Details,Quantity\n';
      }
      logs.forEach(log => {
        const dateTime = formatDates ? new Date(log.dateTime).toLocaleString() : log.dateTime;
        csvContent += `"${dateTime}","${log.user}","${log.activity}","${log.resourceName}","${log.details || ''}",${log.quantity || ''}\n`;
      });
    }
    
    return csvContent;
  }

  function generateJSONExport(resources, logs, stats, exportResources, exportActivityLogs, exportStatistics, includeTimestamps, formatDates) {
    const exportData = {
      exportInfo: {
        generatedAt: includeTimestamps ? new Date().toISOString() : undefined,
        format: 'JSON',
        version: '1.0'
      }
    };
    
    if (exportStatistics) {
      exportData.statistics = {
        totalResources: resources.length,
        availableResources: resources.filter(r => r.status === 'Available').length,
        checkedOutResources: resources.filter(r => r.status === 'Checked Out').length,
        lowStockItems: resources.filter(r => r.quantity <= 1).length,
        needsRepair: resources.filter(r => r.status === 'Needs Repair').length,
        activeUsers: new Set(logs.map(log => log.user)).size,
        totalActivityLogs: logs.length,
        previousStats: stats
      };
    }
    
    if (exportResources) {
      exportData.resources = resources.map(resource => ({
        ...resource,
        dateAdded: formatDates ? new Date(resource.dateAdded).toLocaleDateString() : resource.dateAdded
      }));
    }
    
    if (exportActivityLogs) {
      exportData.activityLogs = logs.map(log => ({
        ...log,
        dateTime: formatDates ? new Date(log.dateTime).toLocaleString() : log.dateTime
      }));
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  function generateTXTExport(resources, logs, stats, exportResources, exportActivityLogs, exportStatistics, includeTimestamps, formatDates) {
    let txtContent = 'RESOURCE INVENTORY SYSTEM - DATA EXPORT\n';
    txtContent += '='.repeat(50) + '\n\n';
    
    if (includeTimestamps) {
      txtContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    }
    
    if (exportStatistics) {
      txtContent += 'STATISTICS\n';
      txtContent += '-'.repeat(20) + '\n';
      txtContent += `Total Resources: ${resources.length}\n`;
      txtContent += `Available Resources: ${resources.filter(r => r.status === 'Available').length}\n`;
      txtContent += `Checked Out Resources: ${resources.filter(r => r.status === 'Checked Out').length}\n`;
      txtContent += `Low Stock Items: ${resources.filter(r => r.quantity <= 1).length}\n`;
      txtContent += `Needs Repair: ${resources.filter(r => r.status === 'Needs Repair').length}\n`;
      txtContent += `Active Users: ${new Set(logs.map(log => log.user)).size}\n`;
      txtContent += `Total Activity Logs: ${logs.length}\n\n`;
    }
    
    if (exportResources) {
      txtContent += 'RESOURCES\n';
      txtContent += '-'.repeat(20) + '\n';
      resources.forEach((resource, index) => {
        const dateAdded = formatDates ? new Date(resource.dateAdded).toLocaleDateString() : resource.dateAdded;
        txtContent += `${index + 1}. ${resource.name} (${resource.type})\n`;
        txtContent += `   Quantity: ${resource.quantity}\n`;
        txtContent += `   Location: ${resource.location}\n`;
        txtContent += `   Status: ${resource.status}\n`;
        if (resource.description) {
          txtContent += `   Description: ${resource.description}\n`;
        }
        txtContent += `   Date Added: ${dateAdded}\n\n`;
      });
    }
    
    if (exportActivityLogs) {
      txtContent += 'ACTIVITY LOGS\n';
      txtContent += '-'.repeat(20) + '\n';
      logs.forEach((log, index) => {
        const dateTime = formatDates ? new Date(log.dateTime).toLocaleString() : log.dateTime;
        txtContent += `${index + 1}. ${dateTime}\n`;
        txtContent += `   User: ${log.user}\n`;
        txtContent += `   Activity: ${log.activity}\n`;
        txtContent += `   Resource: ${log.resourceName}\n`;
        if (log.details) {
          txtContent += `   Details: ${log.details}\n`;
        }
        if (log.quantity) {
          txtContent += `   Quantity: ${log.quantity}\n`;
        }
        txtContent += '\n';
      });
    }
    
    return txtContent;
  }

  // Event listeners for export data modal
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', showExportDataModal);
  }

  if (cancelExportDataBtn) {
    cancelExportDataBtn.addEventListener('click', hideExportDataModal);
  }

  // Close export data modal when clicking outside
  if (exportDataModal) {
    exportDataModal.addEventListener('click', function(e) {
      if (e.target === exportDataModal) {
        hideExportDataModal();
      }
    });
  }

  // Export data button event listener
  const exportDataSubmitBtn = document.getElementById('exportDataBtn');
  if (exportDataSubmitBtn) {
    exportDataSubmitBtn.addEventListener('click', exportData);
  }

  // Update data summary when options change
  const exportOptions = ['exportResources', 'exportActivityLogs', 'exportStatistics'];
  exportOptions.forEach(optionId => {
    const element = document.getElementById(optionId);
    if (element) {
      element.addEventListener('change', updateDataSummary);
    }
  });

  // Initialize sample data first
  initializeSampleData();
  
  // Then update dashboard
  updateDashboardStats();
  updateActivityFeed();
  
  // Debug Chart.js loading
  console.log('Checking Chart.js availability...');
  console.log('typeof Chart:', typeof Chart);
  console.log('window.Chart:', window.Chart);
  
  // Check if Chart.js is loaded with retry mechanism
  function checkAndInitializeCharts() {
    console.log('Attempting to initialize charts...');
    console.log('Chart.js available:', typeof Chart !== 'undefined');
    
    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not loaded!');
      showAlert('Chart.js library failed to load. Charts will not be displayed.', 'error');
    } else {
      console.log('Chart.js loaded successfully');
      // Initialize charts
      initializeCharts();
    }
  }
  
  // Try to initialize charts after a short delay to allow CDN to load
  setTimeout(checkAndInitializeCharts, 1000);
  
  // Also try again after 3 seconds as a fallback
  setTimeout(checkAndInitializeCharts, 3000);
  
  // Final attempt after 5 seconds
  setTimeout(checkAndInitializeCharts, 5000);
  
  window.addEventListener('storage', updateDashboardStats);

  // Chart functions
  function initializeCharts() {
    createResourceTypeChart();
    createUsageTrendChart();
  }

  function createResourceTypeChart() {
    try {
      const ctx = document.getElementById('resourceTypeChart');
      if (!ctx) {
        console.log('Resource type chart canvas not found');
        return;
      }

      const resources = getResourceData();
      const typeData = processResourceTypeData(resources);

      console.log('Creating resource type chart with data:', typeData);

      if (window.resourceTypeChart && typeof window.resourceTypeChart.destroy === 'function') {
        window.resourceTypeChart.destroy();
      }

      window.resourceTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: typeData.labels,
          datasets: [{
            data: typeData.values,
            backgroundColor: [
              '#4a90e2', // Blue
              '#e74c3c', // Red
              '#f39c12', // Orange
              '#27ae60', // Green
              '#8e44ad', // Purple
              '#34495e', // Dark Blue
              '#e67e22', // Carrot
              '#16a085'  // Green Sea
            ],
            borderWidth: 2,
            borderColor: '#fff',
            hoverBorderWidth: 3,
            hoverBorderColor: '#4a4e69'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          },
          animation: {
            animateRotate: true,
            animateScale: true
          }
        }
      });
      console.log('Resource type chart created successfully');
    } catch (error) {
      console.error('Error creating resource type chart:', error);
    }
  }

  function createUsageTrendChart() {
    try {
      const ctx = document.getElementById('usageTrendChart');
      if (!ctx) {
        console.log('Usage trend chart canvas not found');
        return;
      }

      const logs = getActivityLogs();
      const trendData = processUsageTrendData(logs);

      console.log('Creating usage trend chart with data:', trendData);

      if (window.usageTrendChart && typeof window.usageTrendChart.destroy === 'function') {
        window.usageTrendChart.destroy();
      }

      window.usageTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: trendData.labels,
          datasets: [{
            label: 'Check Outs',
            data: trendData.checkouts,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }, {
            label: 'Check Ins',
            data: trendData.checkins,
            borderColor: '#27ae60',
            backgroundColor: 'rgba(39, 174, 96, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 15
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Last 7 Days'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Number of Activities'
              },
              beginAtZero: true
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });
      console.log('Usage trend chart created successfully');
    } catch (error) {
      console.error('Error creating usage trend chart:', error);
    }
  }

  function processResourceTypeData(resources) {
    const typeCounts = {};
    
    resources.forEach(resource => {
      typeCounts[resource.type] = (typeCounts[resource.type] || 0) + 1;
    });

    const labels = Object.keys(typeCounts);
    const values = Object.values(typeCounts);

    return { labels, values };
  }

  function processUsageTrendData(logs) {
    const last7Days = [];
    const today = new Date();
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    const checkouts = new Array(7).fill(0);
    const checkins = new Array(7).fill(0);

    logs.forEach(log => {
      const logDate = log.dateTime.split('T')[0];
      const dayIndex = last7Days.indexOf(logDate);
      
      if (dayIndex !== -1) {
        if (log.activity === 'Check Out') {
          checkouts[dayIndex]++;
        } else if (log.activity === 'Check In') {
          checkins[dayIndex]++;
        }
      }
    });

    const labels = last7Days.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      labels,
      checkouts,
      checkins
    };
  }

  function updateCharts() {
    createResourceTypeChart();
    createUsageTrendChart();
  }

  // Store the original function
  const originalUpdateDashboardStats = updateDashboardStats;
  
  // Override the function to include chart updates
  updateDashboardStats = function() {
    originalUpdateDashboardStats();
    updateCharts();
  };
});