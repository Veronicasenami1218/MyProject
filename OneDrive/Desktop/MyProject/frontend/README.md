# Resource Inventory Management System - Frontend

This is the React frontend for the Resource Inventory Management System.

## Features

- **React 18** with modern hooks and functional components
- **React Router** for client-side routing
- **Protected Routes** for authentication
- **Comprehensive API Service** for backend communication
- **Responsive Design** with modern CSS
- **Component-based Architecture** for maintainability

## Project Structure

```
frontend/
├── public/
│   └── index.html          # React entry point
├── src/
│   ├── components/         # React components
│   │   ├── Dashboard.js    # Main dashboard
│   │   ├── ViewLog.js      # Activity log viewer
│   │   ├── Report.js       # Report generator
│   │   ├── Login.js        # Login form
│   │   ├── Register.js     # Registration form
│   │   ├── Logout.js       # Logout confirmation
│   │   ├── Home.js         # Landing page
│   │   ├── Index.js        # Main resource management
│   │   ├── ProtectedRoute.js # Authentication wrapper
│   │   └── [Modal components]
│   ├── services/
│   │   └── api.js          # API service
│   ├── styles/
│   │   └── App.css         # Main styles
│   ├── App.js              # Main app component
│   └── index.js            # React entry point
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will open at `http://localhost:3000`

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## API Configuration

The frontend is configured to communicate with the backend API. The API base URL is set in `src/services/api.js` and defaults to `http://localhost:5000/api`.

You can override this by setting the `REACT_APP_API_URL` environment variable.

## Authentication

The application uses JWT tokens for authentication. Tokens are stored in localStorage (for "remember me") or sessionStorage (for session-only).

### Protected Routes

Routes that require authentication are wrapped with the `ProtectedRoute` component:

```jsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### Role-based Access

Some routes require specific user roles:

```jsx
<Route path="/admin" element={
  <ProtectedRoute requiredRole="admin">
    <AdminPanel />
  </ProtectedRoute>
} />
```

## Components

### Core Components

- **Home** - Landing page with feature overview
- **Index** - Main resource management interface
- **Dashboard** - System overview and statistics
- **ViewLog** - Activity log viewer with filtering
- **Report** - Report generation and export
- **Login/Register** - Authentication forms
- **Logout** - Logout confirmation

### Modal Components

- **AddResourceModal** - Add new resources
- **QuickCheckoutModal** - Check out resources
- **GenerateReportModal** - Generate reports
- **ExportDataModal** - Export data

## Styling

The application uses CSS modules and custom CSS. The main styles are in `src/styles/App.css`.

### CSS Classes

- `.btn` - Button styles with variants (primary, secondary, danger)
- `.form-group` - Form field styling
- `.table` - Table styling
- `.modal` - Modal overlay and content
- `.alert` - Alert/notification styles

## State Management

The application uses React hooks for state management:

- `useState` - Local component state
- `useEffect` - Side effects and data fetching
- `useRef` - DOM references and chart instances

## API Service

The `api.js` service provides a centralized way to communicate with the backend:

```javascript
import apiService from '../services/api';

// Example usage
const resources = await apiService.getResources();
const user = await apiService.getCurrentUser();
```

## Development

### Adding New Components

1. Create a new file in `src/components/`
2. Export the component as default
3. Import and use in `App.js` or other components

### Adding New Routes

1. Import the component in `App.js`
2. Add a new `Route` element
3. Wrap with `ProtectedRoute` if authentication is required

### Styling Guidelines

- Use CSS classes for styling
- Follow BEM methodology for class naming
- Keep styles modular and reusable
- Use CSS variables for consistent theming

## Build and Deployment

### Production Build

```bash
npm run build
```

This creates an optimized build in the `build/` directory.

### Environment Variables

Create a `.env` file in the frontend directory:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check if the backend server is running
   - Verify the API URL in `src/services/api.js`
   - Check CORS configuration on the backend

2. **Authentication Issues**
   - Clear browser storage (localStorage/sessionStorage)
   - Check token expiration
   - Verify backend authentication endpoints

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for syntax errors in components
   - Verify all imports are correct

## Contributing

1. Follow the existing code style
2. Add comments for complex logic
3. Test your changes thoroughly
4. Update documentation as needed

## License

This project is licensed under the MIT License. 