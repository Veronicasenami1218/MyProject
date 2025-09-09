# Login/Logout Frontend Setup

## Overview
The Resource Inventory System features a modern dropdown-based authentication system for seamless login and logout functionality.

## Features (Frontend)

### 🔐 Authentication Dropdown
- Smart state detection (logged in/out)
- User information display (name and role)
- Quick actions: login, register, profile, logout
- Responsive design for all screen sizes

### 🎨 Visual Design
- Modern UI with clean dropdown
- Smooth animations and hover effects
- Consistent styling with the system
- Accessibility: keyboard navigation (Escape to close)

## How It Works (Frontend)

### For Logged Out Users
- Dropdown shows Login and Register options

### For Logged In Users
- Dropdown shows user info, profile, and logout

## Usage (Frontend)

### Registration
1. Click the "Login" dropdown button
2. Select "Register"
3. Fill in your details (email, password, role)
4. Click "Register"

### Login
1. Click the "Login" dropdown button
2. Select "Login"
3. Enter your credentials
4. Click "Log in"

### Logout
1. Click your name in the dropdown
2. Select "Logout"
3. You will be redirected to the home page

## Technical Details (Frontend)

### Files Modified/Created
- `AuthDropdown.js` - Main dropdown functionality (React)
- `Login.js` - Login form (React)
- `Register.js` - Registration form (React)
- `api.js` - API service for backend communication (React)
- All main pages/components - Integrated dropdown navigation

### Authentication Flow (Frontend)
1. Registration: Sends data to backend `/api/auth/register`
2. Login: Sends credentials to backend `/api/auth/login`
3. Token Storage: JWT token stored in localStorage/sessionStorage
4. Logout: Token cleared and backend notified

## Troubleshooting (Frontend)

1. **Dropdown not showing**
   - Ensure `AuthDropdown.js` is imported and used
   - Check browser console for JavaScript errors
   - Verify all required components are included

2. **Login not working**
   - Check if backend server is running
   - Verify API base URL in `api.js`
   - Check browser console for CORS errors

3. **Registration issues**
   - Ensure all required fields are filled
   - Check for error messages from backend

## Development Tips (Frontend)

- Test the dropdown on different screen sizes
- Use browser dev tools to debug UI issues
- Customize dropdown styles in CSS as needed

## Future Enhancements (Frontend)
- User profile management UI
- Password reset UI
- Remember me functionality
- Improved session management
- Enhanced accessibility 