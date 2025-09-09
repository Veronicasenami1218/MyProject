// auth-dropdown.js - Handles authentication dropdown functionality

class AuthDropdown {
    constructor() {
        this.dropdown = document.getElementById('authDropdown');
        this.dropdownBtn = document.getElementById('authDropdownBtn');
        this.dropdownContent = document.getElementById('authDropdownContent');
        this.authBtnText = document.getElementById('authBtnText');
        
        // Check if elements exist
        if (!this.dropdown || !this.dropdownBtn || !this.dropdownContent || !this.authBtnText) {
            console.error('Auth dropdown elements not found:', {
                dropdown: !!this.dropdown,
                dropdownBtn: !!this.dropdownBtn,
                dropdownContent: !!this.dropdownContent,
                authBtnText: !!this.authBtnText
            });
            return;
        }
        
        // Initialize API service
        if (typeof ApiService !== 'undefined') {
            this.api = new ApiService();
        } else {
            console.warn('ApiService not found, some features may not work');
            this.api = null;
        }
        
        console.log('AuthDropdown initialized successfully');
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateAuthState();
        
        // Ensure dropdown state is maintained on page load
        this.restoreDropdownState();
    }
    
    setupEventListeners() {
        // Toggle dropdown on button click
        this.dropdownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Dropdown button clicked');
            this.toggleDropdown();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.dropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });
        
        // Persist dropdown state across page navigation
        window.addEventListener('beforeunload', () => {
            this.saveDropdownState();
        });
        
        // Update auth state when storage changes (for multi-tab support)
        window.addEventListener('storage', (e) => {
            if (e.key === 'authToken' || e.key === 'currentUser') {
                this.updateAuthState();
            }
        });
        
        console.log('Event listeners set up successfully');
    }
    
    saveDropdownState() {
        const isOpen = this.dropdown.classList.contains('show');
        sessionStorage.setItem('authDropdownOpen', isOpen.toString());
    }
    
    restoreDropdownState() {
        const wasOpen = sessionStorage.getItem('authDropdownOpen') === 'true';
        if (wasOpen) {
            // Don't auto-open on page load, but remember the preference
            sessionStorage.removeItem('authDropdownOpen');
        }
    }
    
    toggleDropdown() {
        console.log('Toggling dropdown, current state:', this.dropdown.classList.contains('show'));
        this.dropdown.classList.toggle('show');
        this.saveDropdownState();
        console.log('Dropdown toggled, new state:', this.dropdown.classList.contains('show'));
    }
    
    closeDropdown() {
        this.dropdown.classList.remove('show');
        this.saveDropdownState();
    }
    
    updateAuthState() {
        const isAuthenticated = this.checkAuthStatus();
        console.log('Updating auth state, isAuthenticated:', isAuthenticated);
        
        if (isAuthenticated) {
            this.showLoggedInState();
        } else {
            this.showLoggedOutState();
        }
        
        // Ensure the button styling is consistent with other nav items
        this.updateButtonStyling();
    }
    
    updateButtonStyling() {
        // Remove any active class to match other nav behavior
        this.dropdownBtn.classList.remove('active');
        
        // Add consistent styling with other nav items
        const currentPage = window.location.pathname.split('/').pop() || 'Index.html';
        const isCurrentPage = currentPage === 'Index.html' || 
                             currentPage === 'Dashboard.html' || 
                             currentPage === 'Report.html' || 
                             currentPage === 'ViewLog.html';
        
        // If we're on a main page, ensure the dropdown looks like other nav items
        if (isCurrentPage) {
            this.dropdownBtn.style.border = 'none';
            this.dropdownBtn.style.background = 'transparent';
            this.dropdownBtn.style.margin = '0 1em';
            this.dropdownBtn.style.padding = '0';
        }
    }
    
    checkAuthStatus() {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const currentUser = localStorage.getItem('currentUser');
        const isAuthenticated = !!(token && currentUser);
        console.log('Auth status check:', { token: !!token, currentUser: !!currentUser, isAuthenticated });
        return isAuthenticated;
    }
    
    showLoggedInState() {
        console.log('Showing logged in state');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const userDisplayName = currentUser.firstName || currentUser.email || 'User';
        
        this.authBtnText.textContent = userDisplayName;
        this.dropdownContent.innerHTML = `
            <div class="user-info">
                <div>${userDisplayName}</div>
                <div class="user-role">${currentUser.role || 'User'}</div>
            </div>
            <a href="#" id="profileLink">Profile</a>
            <a href="Logout.html" id="logoutPageLink">Logout Page</a>
            <a href="#" id="logoutLink">Quick Logout</a>
        `;
        
        // Add event listeners for logged-in actions
        const logoutLink = this.dropdownContent.querySelector('#logoutLink');
        const logoutPageLink = this.dropdownContent.querySelector('#logoutPageLink');
        const profileLink = this.dropdownContent.querySelector('#profileLink');
        
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
        
        if (logoutPageLink) {
            logoutPageLink.addEventListener('click', (e) => {
                // Let the link work normally - it will navigate to Logout.html
            });
        }
        
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleProfile();
            });
        }
        
        // Update button appearance for logged-in state
        this.dropdownBtn.classList.add('logged-in');
        this.dropdownBtn.style.background = 'transparent';
        this.dropdownBtn.style.color = '#4caf50';
    }
    
    showLoggedOutState() {
        console.log('Showing logged out state');
        this.authBtnText.textContent = 'Login';
        this.dropdownContent.innerHTML = `
            <a href="Login.html">Login</a>
            <a href="Register.html">Register</a>
        `;
        
        // Update button appearance for logged-out state
        this.dropdownBtn.classList.remove('logged-in');
        this.dropdownBtn.style.background = 'transparent';
        this.dropdownBtn.style.color = '#c9ada7';
    }
    
    async handleLogout() {
        try {
            // Call backend logout if API is available
            if (this.api) {
                await this.api.logout();
            }
            
            // Clear local storage
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('loginTime');
            
            // Show success message
            this.showNotification('Logged out successfully', 'success');
            
            // Update UI
            this.updateAuthState();
            this.closeDropdown();
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'Index.html';
            }, 1000);
            
        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Logout failed. Please try again.', 'error');
        }
    }
    
    handleProfile() {
        // For now, just show a message
        this.showNotification('Profile page coming soon!', 'info');
        this.closeDropdown();
    }
    
    showNotification(message, type = 'info') {
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
}

// Initialize auth dropdown when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AuthDropdown');
    new AuthDropdown();
});

// Add CSS for notification animation if not already present
if (!document.querySelector('#auth-dropdown-styles')) {
    const style = document.createElement('style');
    style.id = 'auth-dropdown-styles';
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
}