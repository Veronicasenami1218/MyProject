// Register.js
const registerApi = new ApiService();

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    // Validation
    if (!username || !password || !confirmPassword) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long.', 'error');
        return;
    }
    
    if (!isValidEmail(username)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }

    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Registering...';
    submitBtn.disabled = true;
    
    try {
        const response = await registerApi.register({
            username: username,
            email: username, // Using email as username
            password: password,
            firstName: username.split('@')[0], // Extract name from email
            lastName: '',
            department: 'General'
        });
        
        console.log('Registration response:', response);
        
        if (response.success) {
            showNotification('Registration successful! Logging you in...', 'success');
            this.reset();
            // Automatically log the user in
            try {
                const loginResponse = await registerApi.login({
                    email: username,
                    password: password
                });
                console.log('Login response after registration:', loginResponse);
                if (loginResponse.success) {
                    // Store user info
                    localStorage.setItem('currentUser', JSON.stringify(loginResponse.data.user));
                    localStorage.setItem('isAuthenticated', 'true');
                    localStorage.setItem('loginTime', new Date().toISOString());
                    // Store token in localStorage by default
                    localStorage.setItem('authToken', loginResponse.data.token);
                    // Redirect based on role
                    setTimeout(() => {
                        if (loginResponse.data.user.role === 'admin') {
                            window.location.href = 'Dashboard.html';
                        } else {
                            window.location.href = 'Index.html';
                        }
                    }, 1000);
                } else {
                    showNotification('Registration succeeded but login failed: ' + (loginResponse.message || 'Unknown error') + '. Please try logging in manually.', 'error');
                    setTimeout(() => {
                        window.location.href = 'Login.html';
                    }, 2000);
                }
            } catch (loginError) {
                console.error('Login error after registration:', loginError);
                showNotification('Registration succeeded but login failed: ' + (loginError.message || loginError) + '. Please try logging in manually.', 'error');
                setTimeout(() => {
                    window.location.href = 'Login.html';
                }, 2000);
            }
        } else {
            showNotification('Registration failed: ' + (response.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed: ' + (error.message || error), 'error');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Simple notification function
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