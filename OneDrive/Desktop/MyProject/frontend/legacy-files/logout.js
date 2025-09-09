// logout.js

// Call this function to protect a page (redirects to Login.html if not logged in)
function protectPage() {
    if (!localStorage.getItem('username') || !localStorage.getItem('role')) {
        window.location.href = 'Login.html';
    }
}

// Call this function to set up a logout button by its ID
function setupLogoutButton(buttonId = 'logoutBtn') {
    const btn = document.getElementById(buttonId);
    if (btn) {
        btn.addEventListener('click', function() {
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            window.location.href = 'Login.html';
        });
    }
}

// Example usage (uncomment as needed):
// protectPage();
// setupLogoutButton();

// Logout.js - Handles logout confirmation page functionality

const api = new ApiService();

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isAuthenticated = checkAuthStatus();
    
    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        window.location.href = 'Login.html';
        return;
    }
    
    // Load user information
    loadUserInfo();
    
    // Setup event listeners
    setupEventListeners();
});

function checkAuthStatus() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    return !!(token && currentUser);
}

function loadUserInfo() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const loginTime = localStorage.getItem('loginTime') || new Date().toISOString();
        
        // Display user information
        document.getElementById('userName').textContent = currentUser.firstName || currentUser.email || 'User';
        document.getElementById('userRole').textContent = currentUser.role || 'User';
        
        // Display session information
        const loginDate = new Date(loginTime);
        const now = new Date();
        const sessionDuration = Math.floor((now - loginDate) / 1000 / 60); // minutes
        
        document.getElementById('loginTime').textContent = loginDate.toLocaleString();
        document.getElementById('sessionDuration').textContent = formatDuration(sessionDuration);
        
    } catch (error) {
        console.error('Error loading user info:', error);
        document.getElementById('userName').textContent = 'Unknown User';
        document.getElementById('userRole').textContent = 'Unknown Role';
    }
}

function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(minutes / 1440);
        const remainingHours = Math.floor((minutes % 1440) / 60);
        return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
    }
}

function setupEventListeners() {
    // Cancel button - go back to previous page
    document.getElementById('cancelBtn').addEventListener('click', function() {
        if (document.referrer && document.referrer.includes(window.location.origin)) {
            window.history.back();
        } else {
            window.location.href = 'Index.html';
        }
    });
    
    // Logout button - perform logout
    document.getElementById('logoutBtn').addEventListener('click', async function() {
        await performLogout();
    });
    
    // Return to Home button
    document.querySelector('a[href="Index.html"]').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'Index.html';
    });
}

async function performLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const originalText = logoutBtn.textContent;
    
    try {
        // Show loading state
        logoutBtn.textContent = 'Logging out...';
        logoutBtn.disabled = true;
        
        // Call backend logout
        await api.logout();
        
        // Clear local storage
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('loginTime');
        
        // Show success message
        showNotification('Logged out successfully!', 'success');
        
        // Redirect to home page after a short delay
        setTimeout(() => {
            window.location.href = 'Index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed. Please try again.', 'error');
        
        // Reset button state
        logoutBtn.textContent = originalText;
        logoutBtn.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4caf50';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            break;
        case 'info':
            notification.style.backgroundColor = '#2196f3';
            break;
        default:
            notification.style.backgroundColor = '#2196f3';
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style); 