// ===== LOGGING SYSTEM =====
class ActivityLogger {
    constructor() {
        this.logs = this.loadLogs();
    }

    // Load logs from localStorage
    loadLogs() {
        const savedLogs = localStorage.getItem('activityLogs');
        return savedLogs ? JSON.parse(savedLogs) : [];
    }

    // Save logs to localStorage
    saveLogs() {
        localStorage.setItem('activityLogs', JSON.stringify(this.logs));
    }

    // Add a new log entry
    logActivity(activity, resourceName, user, details, quantity = null) {
        const logEntry = {
            id: Date.now() + Math.random(),
            dateTime: new Date().toLocaleString(),
            resourceName: resourceName,
            activity: activity,
            user: user || 'Unknown User',
            details: details,
            quantity: quantity
        };

        this.logs.unshift(logEntry); // Add to beginning of array
        this.saveLogs();
        
        console.log('Activity logged:', logEntry);
        return logEntry;
    }

    // Get all logs
    getAllLogs() {
        return this.logs;
    }

    // Get logs for a specific resource
    getLogsForResource(resourceName) {
        return this.logs.filter(log => log.resourceName === resourceName);
    }

    // Clear all logs
    clearLogs() {
        this.logs = [];
        this.saveLogs();
    }

    // Export logs as CSV
    exportLogs() {
        const headers = ['Date/Time', 'Resource Name', 'Activity', 'User', 'Details', 'Quantity'];
        const csvRows = [headers.join(',')];
        
        this.logs.forEach(log => {
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
        
        return csvRows.join('\n');
    }
}

// Initialize the logger
const activityLogger = new ActivityLogger();

// Helper function to get current user (you can enhance this later)
function getCurrentUser() {
    // For now, return a default user. You can implement user authentication later
    return localStorage.getItem('currentUser') || 'Admin';
}

// Helper function to prompt for user name
function promptForUser() {
    const user = prompt('Please enter your name:');
    if (user && user.trim()) {
        localStorage.setItem('currentUser', user.trim());
        return user.trim();
    }
    return getCurrentUser();
}

document.addEventListener('DOMContentLoaded', function() {
// Get elements
const addResourceBtn = document.getElementById('addResourceBtn');
const modalOverlay = document.getElementById('modalOverlay');
const cancelBtn = document.getElementById('cancelBtn');

// Admin check
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const isAdmin = currentUser && currentUser.email && currentUser.email.endsWith('@chessinslumsafrica.com');

// Hide Add Resource button for non-admins
if (addResourceBtn && !isAdmin) {
  addResourceBtn.style.display = 'none';
}

if (addResourceBtn) {
  addResourceBtn.addEventListener('click', function() {
    console.log('Add Resource button clicked'); // Debug log
    modalOverlay.classList.add('active');
  });
}

// Hide modal when Cancel is clicked
if (cancelBtn) {
  cancelBtn.addEventListener('click', function() {
    modalOverlay.classList.remove('active');
  });
}

// Optional: Hide modal when clicking outside the form
if (modalOverlay) {
  modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
    }
  });
}

// Live search filtering for resources
const searchInput = document.querySelector('input[placeholder="Search resources..."]');
const typeFilterSelect = document.querySelector('select');
const resourceTable = document.getElementById('resourcesTable');

function filterResources() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedType = typeFilterSelect.value;
  const rows = resourceTable.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 3) {
      const resourceName = cells[0].textContent.toLowerCase();
      const resourceType = cells[1].textContent;
      const resourceQuantity = cells[2].textContent.toLowerCase();
      // Check if row matches search term
      const matchesSearch = searchTerm === '' || 
        resourceName.includes(searchTerm) ||
        resourceType.toLowerCase().includes(searchTerm) ||
        resourceQuantity.includes(searchTerm);
      // Check if row matches type filter
      const matchesType = selectedType === 'All Types' || 
        resourceType === selectedType;
      // Show/hide row based on both filters
      if (matchesSearch && matchesType) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  });
}

// Add event listeners for search and type filter
if (searchInput) {
  searchInput.addEventListener('input', filterResources);
}
if (typeFilterSelect) {
  typeFilterSelect.addEventListener('change', filterResources);
}

// --- Reporting and Analytics ---
const reportsTableBody = document.getElementById('reportsTableBody');
const reportChartCanvas = document.getElementById('reportChart');
let reportChart = null;

// --- Report Filters ---
const reportTypeFilter = document.getElementById('reportTypeFilter');
const reportStartDate = document.getElementById('reportStartDate');
const reportEndDate = document.getElementById('reportEndDate');
const applyReportFiltersBtn = document.getElementById('applyReportFilters');

// Populate resource type filter dropdown
function populateReportTypeFilter() {
  const resourcesData = JSON.parse(localStorage.getItem('resourcesData') || '[]');
  const types = Array.from(new Set(resourcesData.map(r => r.type)));
  reportTypeFilter.innerHTML = '<option value="All">All Types</option>' +
    types.map(type => `<option value="${type}">${type}</option>`).join('');
}

// Filter logs by type and date range
function filterLogsForReport(logs, type, startDate, endDate) {
  return logs.filter(log => {
    let matchesType = (type === 'All' || log.resourceName === type || log.type === type || log.resourceType === type);
    let matchesDate = true;
    if (startDate) {
      const logDate = new Date(log.dateTime);
      const start = new Date(startDate);
      if (logDate < start) matchesDate = false;
    }
    if (endDate) {
      const logDate = new Date(log.dateTime);
      const end = new Date(endDate);
      // Add 1 day to endDate to make it inclusive
      end.setDate(end.getDate() + 1);
      if (logDate >= end) matchesDate = false;
    }
    return matchesType && matchesDate;
  });
}

function getResourceDataFiltered() {
  // Use logs for date filtering, but for type filtering, use resourcesData
  const resourcesData = JSON.parse(localStorage.getItem('resourcesData') || '[]');
  let filtered = resourcesData;
  const selectedType = reportTypeFilter ? reportTypeFilter.value : 'All';
  if (selectedType && selectedType !== 'All') {
    filtered = filtered.filter(r => r.type === selectedType);
    }
  return filtered;
}

function generateReport() {
  // Get filter values
  const selectedType = reportTypeFilter ? reportTypeFilter.value : 'All';
  const startDate = reportStartDate ? reportStartDate.value : '';
  const endDate = reportEndDate ? reportEndDate.value : '';

  // Get logs and filter by date/type
  let logs = activityLogger.getAllLogs();
  if (selectedType !== 'All' || startDate || endDate) {
    logs = filterLogsForReport(logs, selectedType, startDate, endDate);
  }

  // Get resource data and filter by type
  const data = getResourceDataFiltered();
  const typeStats = {};
  data.forEach(item => {
    if (!typeStats[item.type]) {
      typeStats[item.type] = { total: 0, count: 0, lowStock: 0 };
    }
    typeStats[item.type].total += item.quantity;
    typeStats[item.type].count += 1;
    if (item.quantity <= STOCK_THRESHOLD) typeStats[item.type].lowStock += 1;
  });

  // Update reports table
  reportsTableBody.innerHTML = '';
  Object.entries(typeStats).forEach(([type, stats]) => {
    const avg = stats.count ? (stats.total / stats.count).toFixed(2) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${type}</td>
      <td>${stats.total}</td>
      <td>${avg}</td>
      <td>${stats.lowStock}</td>
    `;
    reportsTableBody.appendChild(tr);
  });

  // Update chart
  const chartLabels = Object.keys(typeStats);
  const chartData = chartLabels.map(type => typeStats[type].total);
  if (reportChart) reportChart.destroy();
  reportChart = new Chart(reportChartCanvas, {
    type: 'bar',
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'Total Quantity',
        data: chartData,
        backgroundColor: 'rgba(74, 78, 105, 0.7)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Resource Quantities by Type' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function updateAllReports() {
  populateReportTypeFilter();
  generateReport();
}

// Set stock threshold
const STOCK_THRESHOLD = 1;

// Add event listeners for report filters
if (applyReportFiltersBtn) {
  applyReportFiltersBtn.addEventListener('click', generateReport);
}
if (reportTypeFilter) {
  reportTypeFilter.addEventListener('change', generateReport);
}
if (reportStartDate) {
  reportStartDate.addEventListener('change', generateReport);
}
if (reportEndDate) {
  reportEndDate.addEventListener('change', generateReport);
}

// Add Resource form submission
const form = document.querySelector('.form-container');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = form.querySelector('#name').value;
    const type = form.querySelector('#type').value;
    const quantity = parseInt(form.querySelector('#quantity').value, 10);
    // You can add more fields as needed
    const tbody = document.querySelector('table tbody');
    if (form.dataset.editing === 'true') {
      // Edit mode: update the existing row
      const rowIndex = parseInt(form.dataset.editRowIndex, 10);
      const row = tbody.children[rowIndex];
      if (row) {
        const oldQuantity = parseInt(row.children[2].textContent, 10);
        row.children[0].textContent = name;
        row.children[1].textContent = type;
        row.children[2].textContent = quantity;
        // Update totalQuantity if changed
        row.setAttribute('data-total-quantity', form.querySelector('#totalQuantity') ? parseInt(form.querySelector('#totalQuantity').value, 10) : quantity);
        // Log the edit activity
        const user = getCurrentUser();
        activityLogger.logActivity(
          'Edit Resource',
          name,
          user,
          `Updated quantity from ${oldQuantity} to ${quantity}`,
          quantity
        );
      }
      // Clear edit state
      delete form.dataset.editing;
      delete form.dataset.editRowIndex;
    } else {
      // Create new row
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td>${name}</td>
        <td>${type}</td>
        <td>${quantity}</td>
        <td>
          <button>Edit</button>
          <button>Delete</button>
          <button class="check-out-btn">Check Out</button>
          <button class="check-in-btn">Check In</button>
        </td>
        <td class="status-cell">Checked In</td>
      `;
      newRow.setAttribute('data-total-quantity', quantity);
      // Insert at the top
      tbody.insertBefore(newRow, tbody.firstChild);
      // Log the add activity
      const user = getCurrentUser();
      activityLogger.logActivity(
        'Add Resource',
        name,
        user,
        `Added new ${type} resource with quantity ${quantity}`,
        quantity
      );
      // Attach listeners to new buttons
      attachDeleteListeners();
      attachCheckListeners();
    }
    // Stock level alert
    if (quantity <= STOCK_THRESHOLD) {
      alert(`Low Stock Alert: The quantity for "${name}" is at or below the threshold (${STOCK_THRESHOLD}).`);
    }
    // Reset form and close modal
    form.reset();
    document.getElementById('modalOverlay').classList.remove('active');
    saveResourceDataToLocalStorage();
    updateAllReports();
  });
}

function saveResourceDataToLocalStorage() {
  const data = getResourceData();
  localStorage.setItem('resourcesData', JSON.stringify(data));
}

// Update reports after add/edit/delete
function attachDeleteListeners() {
  const deleteButtons = document.querySelectorAll('.actions-group button');
  deleteButtons.forEach(btn => {
    if (btn.textContent === 'Delete') {
      btn.onclick = function() {
        const row = btn.closest('tr');
        if (row) {
          const resourceName = row.children[0].textContent;
          const resourceType = row.children[1].textContent;
          const quantity = row.children[2].textContent;
          // Log the delete activity
          const user = getCurrentUser();
          activityLogger.logActivity(
            'Delete Resource',
            resourceName,
            user,
            `Deleted ${resourceType} resource with quantity ${quantity}`,
            parseInt(quantity, 10)
          );
          row.remove();
        }
        saveResourceDataToLocalStorage();
        updateAllReports();
      };
    }
  });
}

// --- Check-in/Check-out Modal and Logging ---
const checkModal = document.getElementById('checkModal');
const checkForm = document.getElementById('checkForm');
const checkModalTitle = document.getElementById('checkModalTitle');
const cancelCheckBtn = document.getElementById('cancelCheckBtn');
let currentCheckAction = null;
let currentCheckResource = null;

function openCheckModal(action, resourceRow) {
  currentCheckAction = action; // 'check-out' or 'check-in'
  currentCheckResource = resourceRow;
  checkModalTitle.textContent = action === 'check-out' ? 'Check Out Resource' : 'Check In Resource';
  checkForm.reset();
  checkModal.style.display = 'flex';
  // Show/hide fields based on action
  document.getElementById('checkPurposeGroup').style.display = (action === 'check-out') ? '' : 'none';
  document.getElementById('checkConditionGroup').style.display = (action === 'check-in') ? '' : 'none';
  document.getElementById('checkQtyLabel').textContent = action === 'check-out' ? 'Quantity to Check Out' : 'Quantity to Check In';
}

function closeCheckModal() {
  checkModal.style.display = 'none';
  currentCheckAction = null;
  currentCheckResource = null;
}

// Attach listeners to check-out and check-in buttons
function attachCheckListeners() {
  const checkOutBtns = document.querySelectorAll('.check-out-btn');
  const checkInBtns = document.querySelectorAll('.check-in-btn');
  checkOutBtns.forEach(btn => {
    btn.onclick = function() {
      const row = btn.closest('tr');
      openCheckModal('check-out', row);
    };
  });
  checkInBtns.forEach(btn => {
    btn.onclick = function() {
      const row = btn.closest('tr');
      openCheckModal('check-in', row);
    };
  });
}

if (cancelCheckBtn) {
  cancelCheckBtn.addEventListener('click', function() {
    closeCheckModal();
  });
}

if (checkModal) {
  checkModal.addEventListener('click', function(e) {
    if (e.target === checkModal) closeCheckModal();
  });
}

if (checkForm) {
  checkForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!currentCheckResource) return;
    const cells = currentCheckResource.querySelectorAll('td');
    const resourceName = cells[0].textContent;
    const resourceType = cells[1].textContent;
    let resourceQty = parseInt(cells[2].textContent, 10) || 0;
    const user = checkForm.querySelector('#checkUser').value;
    const location = checkForm.querySelector('#checkLocation').value;
    const qtyToCheck = parseInt(checkForm.querySelector('#checkQty').value, 10) || 1;
    const action = currentCheckAction;

    if (action === 'check-out') {
      const purpose = checkForm.querySelector('#checkPurpose').value;
      if (qtyToCheck > resourceQty) {
        alert('Not enough quantity in stock to check out!');
        return;
      }
      resourceQty -= qtyToCheck;
      cells[2].textContent = resourceQty;
      activityLogger.logActivity(
        'Check Out',
        resourceName,
        user,
        `Checked out ${qtyToCheck} units for: ${purpose}${location ? ` (Location: ${location})` : ''}`,
        qtyToCheck
      );
    } else if (action === 'check-in') {
      const condition = checkForm.querySelector('#checkCondition').value;
      resourceQty += qtyToCheck;
      cells[2].textContent = resourceQty;
      activityLogger.logActivity(
        'Check In',
        resourceName,
        user,
        `Checked in ${qtyToCheck} units${location ? ` from location: ${location}` : ''} (Condition: ${condition})`,
        qtyToCheck
      );
    }

    closeCheckModal();
    alert('Action logged successfully!');
    saveResourceDataToLocalStorage();
    updateAllReports();
  });
}

if (resourceTable) {
  resourceTable.addEventListener('click', function(event) {
    const btn = event.target;
    if (btn.tagName === 'BUTTON' && btn.textContent === 'Edit') {
      console.log('Edit button clicked'); // Debug log
      const row = btn.closest('tr');
      if (!row) return;
      // Get cell values using row.children
      form.querySelector('#name').value = row.children[0].textContent;
      form.querySelector('#type').value = row.children[1].textContent;
      form.querySelector('#quantity').value = row.children[2].textContent;
      // Store the row being edited
      form.dataset.editing = 'true';
      form.dataset.editRowIndex = Array.from(row.parentNode.children).indexOf(row);
      // Open modal
      modalOverlay.classList.add('active');
    }
    if (btn.tagName === 'BUTTON' && btn.textContent === 'Delete') {
      const row = btn.closest('tr');
      if (!row) return;
      const resourceName = row.children[0].textContent;
      const resourceType = row.children[1].textContent;
      const quantity = row.children[2].textContent;
      const user = getCurrentUser();
      activityLogger.logActivity(
        'Delete Resource',
        resourceName,
        user,
        `Deleted ${resourceType} resource with quantity ${quantity}`,
        parseInt(quantity, 10)
      );
      row.remove();
      saveResourceDataToLocalStorage();
      updateAllReports();
    }
    if (btn.classList.contains('check-out-btn')) {
      const row = btn.closest('tr');
      if (!row) return;
      openCheckModal('check-out', row);
    }
    if (btn.classList.contains('check-in-btn')) {
      const row = btn.closest('tr');
      if (!row) return;
      openCheckModal('check-in', row);
    }
  });
}

function getResourceData() {
  const data = [];
  const rows = document.querySelectorAll('#resourcesTable tbody tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 3) {
      data.push({
        name: cells[0].textContent,
        type: cells[1].textContent,
        quantity: parseInt(cells[2].textContent, 10) || 0
      });
    }
  });
  return data;
}

// Hide Edit/Delete buttons for non-admins after DOM is loaded
const hideAdminControls = () => {
  if (!isAdmin) {
    document.querySelectorAll('.action-btn.small').forEach(btn => {
      btn.style.display = 'none';
    });
  }
};

hideAdminControls();
});