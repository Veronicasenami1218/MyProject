class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Helper method to handle API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(credentials) {
    return await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async logout() {
    return await this.request('/auth/logout', {
      method: 'POST'
    });
  }

  async refreshToken() {
    return await this.request('/auth/refresh', {
      method: 'POST'
    });
  }

  // User management endpoints
  async getCurrentUser() {
    return await this.request('/users/me');
  }

  async updateProfile(userData) {
    return await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async changePassword(passwordData) {
    return await this.request('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  }

  // Resource management endpoints
  async getResources(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(`/resources?${queryParams}`);
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

  // Transaction endpoints
  async checkoutResource(transactionData) {
    return await this.request('/transactions/checkout', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
  }

  async checkinResource(transactionData) {
    return await this.request('/transactions/checkin', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
  }

  async getTransactions(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(`/transactions?${queryParams}`);
  }

  // Activity log endpoints
  async getActivityLogs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(`/activity-logs?${queryParams}`);
  }

  async logActivity(activityData) {
    return await this.request('/activity-logs', {
      method: 'POST',
      body: JSON.stringify(activityData)
    });
  }

  // Report endpoints
  async generateReport(reportData) {
    return await this.request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  async getReports(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(`/reports?${queryParams}`);
  }

  async exportReport(reportId, format = 'csv') {
    return await this.request(`/reports/${reportId}/export?format=${format}`);
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return await this.request('/dashboard/stats');
  }

  async getDashboardCharts() {
    return await this.request('/dashboard/charts');
  }

  // Notification endpoints
  async getNotifications() {
    return await this.request('/notifications');
  }

  async markNotificationAsRead(notificationId) {
    return await this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  // File upload endpoints
  async uploadFile(file, type = 'resource') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return await this.request('/upload', {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeaders().Authorization
      },
      body: formData
    });
  }

  // Export/Import endpoints
  async exportData(exportOptions) {
    return await this.request('/export', {
      method: 'POST',
      body: JSON.stringify(exportOptions)
    });
  }

  async importData(importData) {
    return await this.request('/import', {
      method: 'POST',
      body: JSON.stringify(importData)
    });
  }

  // Utility methods
  isAuthenticated() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return !!token;
  }

  getToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  setToken(token, rememberMe = false) {
    if (rememberMe) {
      localStorage.setItem('authToken', token);
    } else {
      sessionStorage.setItem('authToken', token);
    }
  }

  clearToken() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  }

  getCurrentUserFromStorage() {
    const user = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  setCurrentUser(user, rememberMe = false) {
    const userString = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem('currentUser', userString);
    } else {
      sessionStorage.setItem('currentUser', userString);
    }
  }

  clearCurrentUser() {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService; 