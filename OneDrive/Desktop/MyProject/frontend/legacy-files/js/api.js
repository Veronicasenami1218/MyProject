// API Service for connecting to backend
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: this.getHeaders(),
        ...options
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  // Resource methods
  async getResources(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/resources${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async getResource(id) {
    return await this.request(`/resources/${id}`);
  }

  async createResource(resourceData) {
    return await this.request('/resources', {
      method: 'POST',
      body: JSON.stringify(resourceData)
    });
  }

  async updateResource(id, resourceData) {
    return await this.request(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resourceData)
    });
  }

  async deleteResource(id) {
    return await this.request(`/resources/${id}`, {
      method: 'DELETE'
    });
  }

  async checkoutResource(id, checkoutData) {
    return await this.request(`/resources/${id}/checkout`, {
      method: 'POST',
      body: JSON.stringify(checkoutData)
    });
  }

  async checkinResource(id, checkinData) {
    return await this.request(`/resources/${id}/checkin`, {
      method: 'POST',
      body: JSON.stringify(checkinData)
    });
  }

  async getResourceStats() {
    return await this.request('/resources/stats/overview');
  }

  // Transaction methods
  async getTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async getTransaction(id) {
    return await this.request(`/transactions/${id}`);
  }

  async getMyCheckouts() {
    return await this.request('/transactions/my-checkouts');
  }

  async getOverdueTransactions() {
    return await this.request('/transactions/overdue');
  }

  async getTransactionStats() {
    return await this.request('/transactions/stats/overview');
  }

  // Report methods
  async getDashboardReport() {
    return await this.request('/reports/dashboard');
  }

  async getResourceReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/reports/resources${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async getTransactionReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/reports/transactions${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async exportReport(type, format = 'json', params = {}) {
    const queryString = new URLSearchParams({ ...params, format }).toString();
    const endpoint = `/reports/export/${type}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('content-disposition')?.split('filename=')[1] || `${type}-report.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Notification methods
  async getAlerts() {
    return await this.request('/notifications/alerts');
  }

  async getDashboardNotifications() {
    return await this.request('/notifications/dashboard');
  }

  // User methods (Admin only)
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async getUser(id) {
    return await this.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return await this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deactivateUser(id) {
    return await this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  async reactivateUser(id) {
    return await this.request(`/users/${id}/reactivate`, {
      method: 'POST'
    });
  }

  // Location methods
  async getLocations() {
    return await this.request('/locations');
  }

  async getLocationResources(location, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/locations/${encodeURIComponent(location)}/resources${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  // Utility methods
  async healthCheck() {
    return await fetch(`${this.baseURL.replace('/api', '')}/health`);
  }

  // Error handler
  handleError(error) {
    console.error('API Error:', error);
    
    if (error.message === 'Invalid token.' || error.message === 'Token expired.') {
      this.clearToken();
      window.location.href = '/login.html';
      return;
    }
    
    // Show user-friendly error message
    this.showNotification(error.message, 'error');
  }

  // Notification helper
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}

// Create global API instance
const api = new ApiService();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
} 