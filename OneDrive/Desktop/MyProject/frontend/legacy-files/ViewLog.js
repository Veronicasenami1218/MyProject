document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const searchInput = document.querySelector('input[placeholder="Search logs..."]');
    const filterSelect = document.querySelector('select');
    const logTableBody = document.getElementById('logTableBody');
    
    // Store original log data
    let originalLogData = [];
    let filteredLogData = [];
    
    // Initialize log data from ActivityLogger
    function initializeLogData() {
        // Get logs from localStorage (ActivityLogger saves them there)
        const savedLogs = localStorage.getItem('activityLogs');
        const logs = savedLogs ? JSON.parse(savedLogs) : [];
        
        // Clear existing table rows
        logTableBody.innerHTML = '';
        
        if (logs.length === 0) {
            // Show message if no logs exist
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="5" style="text-align: center; padding: 20px; color: #666;">No activity logs found. Start using the system to see logs here.</td>';
            logTableBody.appendChild(tr);
            originalLogData = [];
            filteredLogData = [];
            return;
        }
        
        // Convert logs to table rows
        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${log.dateTime}</td>
                <td>${log.resourceName}</td>
                <td>${log.activity}</td>
                <td>${log.user}</td>
                <td>${log.details}</td>
            `;
            logTableBody.appendChild(tr);
        });
        
        // Store log data for filtering
        originalLogData = Array.from(logTableBody.querySelectorAll('tr')).map(row => {
            const cells = row.querySelectorAll('td');
            return {
                element: row,
                dateTime: cells[0].textContent,
                resourceName: cells[1].textContent,
                activity: cells[2].textContent,
                user: cells[3].textContent,
                details: cells[4].textContent,
                display: true
            };
        });
        filteredLogData = [...originalLogData];
        console.log('Initialized log data:', originalLogData.length, 'rows');
    }
    
    // Search functionality
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedFilter = filterSelect.value;
        
        console.log('Searching for:', searchTerm, 'Filter:', selectedFilter);
        
        filteredLogData = originalLogData.filter(log => {
            // Check if log matches search term
            const matchesSearch = searchTerm === '' || 
                log.resourceName.toLowerCase().includes(searchTerm) ||
                log.activity.toLowerCase().includes(searchTerm) ||
                log.user.toLowerCase().includes(searchTerm) ||
                log.details.toLowerCase().includes(searchTerm) ||
                log.dateTime.toLowerCase().includes(searchTerm);
            
            // Check if log matches filter
            const matchesFilter = selectedFilter === 'All Activities' || 
                log.activity === selectedFilter;
            
            return matchesSearch && matchesFilter;
        });
        
        console.log('Filtered results:', filteredLogData.length, 'rows');
        updateTableDisplay();
    }
    
    // Update table display based on filtered data
    function updateTableDisplay() {
        // Hide all rows first
        originalLogData.forEach(log => {
            log.element.style.display = 'none';
        });
        
        // Show only filtered rows
        filteredLogData.forEach(log => {
            log.element.style.display = '';
        });
        
        // Show "no results" message if no matches
        const noResultsRow = document.getElementById('noResultsRow');
        if (filteredLogData.length === 0) {
            if (!noResultsRow) {
                const tr = document.createElement('tr');
                tr.id = 'noResultsRow';
                tr.innerHTML = '<td colspan="5" style="text-align: center; padding: 20px; color: #666;">No logs found matching your search criteria.</td>';
                logTableBody.appendChild(tr);
            }
        } else {
            if (noResultsRow) {
                noResultsRow.remove();
            }
        }
    }
    
    // Add event listeners
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            console.log('Search input changed:', this.value);
            performSearch();
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            console.log('Filter changed:', this.value);
            performSearch();
        });
    }
    
    // Initialize the log data when page loads
    initializeLogData();
    
    // Add refresh functionality
    function addRefreshButton() {
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = 'Refresh Logs';
        refreshBtn.style.marginLeft = '10px';
        refreshBtn.addEventListener('click', function() {
            initializeLogData();
            performSearch();
        });
        
        const filterContainer = document.querySelector('#logSection div');
        if (filterContainer) {
            filterContainer.appendChild(refreshBtn);
        }
    }
    
    // Add export functionality
    function addExportButton() {
        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export Logs';
        exportBtn.style.marginLeft = '10px';
        exportBtn.addEventListener('click', exportLogs);
        
        const filterContainer = document.querySelector('#logSection div');
        if (filterContainer) {
            filterContainer.appendChild(exportBtn);
        }
    }
    
    function exportLogs() {
        const savedLogs = localStorage.getItem('activityLogs');
        const logs = savedLogs ? JSON.parse(savedLogs) : [];
        
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
    }
    
    // Add clear logs functionality
    function addClearButton() {
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear All Logs';
        clearBtn.style.marginLeft = '10px';
        clearBtn.style.backgroundColor = '#dc3545';
        clearBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all activity logs? This action cannot be undone.')) {
                localStorage.removeItem('activityLogs');
                initializeLogData();
                performSearch();
                alert('All logs have been cleared.');
            }
        });
        
        const filterContainer = document.querySelector('#logSection div');
        if (filterContainer) {
            filterContainer.appendChild(clearBtn);
        }
    }
    
    // Add buttons
    addRefreshButton();
    addExportButton();
    addClearButton();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
        
        // Escape to clear search
        if (e.key === 'Escape') {
            if (searchInput) searchInput.value = '';
            if (filterSelect) filterSelect.value = 'All Activities';
            performSearch();
        }
        
        // F5 to refresh logs
        if (e.key === 'F5') {
            e.preventDefault();
            initializeLogData();
            performSearch();
        }
    });
    
    // Debug: Log that script is loaded
    console.log('ViewLog.js loaded successfully');
    console.log('Search input found:', !!searchInput);
    console.log('Filter select found:', !!filterSelect);
    console.log('Log table body found:', !!logTableBody);
}); 