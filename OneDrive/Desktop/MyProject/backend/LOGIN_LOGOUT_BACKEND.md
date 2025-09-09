# Login/Logout Backend Setup

## Backend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp env.example .env
   ```

3. Configure your `.env` file:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/resource_inventory
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

## Database Setup
The system uses MongoDB. Make sure you have:
- MongoDB installed and running locally, OR
- A MongoDB Atlas connection string

## Authentication Flow (Backend)
1. **Registration**: User data sent to `/api/auth/register`
2. **Login**: Credentials sent to `/api/auth/login`
3. **Token Storage**: JWT token stored in localStorage/sessionStorage (handled by frontend, but backend issues the token)
4. **Logout**: Token cleared and backend notified

## Security Features
- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Input validation and sanitization

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

### Resources
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create new resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

## Troubleshooting (Backend)

1. **"API request failed" error**
   - Check if backend server is running
   - Verify the API base URL in frontend's API service
   - Check backend server logs for errors

2. **"User already exists" error**
   - Try a different email address
   - Check if you're already registered

3. **Login not working**
   - Check if MongoDB is running
   - Verify environment variables are set correctly
   - Check backend server logs for errors

## Development Tips (Backend)

- Test API endpoints with tools like Postman or Insomnia
- Check backend logs for authentication errors
- Ensure MongoDB is properly configured

## Future Enhancements (Backend)
- User profile management
- Password reset functionality
- Multi-factor authentication
- Role-based access control
- Session management
- Activity logging 