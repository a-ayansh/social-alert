
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const API_URL = import.meta.env.VITE_API_URL 

class ApiService {
  constructor() {
    this.baseURL = API_URL;
    this.timeout = 10000;
      }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
          }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const data = await response.json();
            return data;

    } catch (error) {
      console.error('💥 API Error:', {
        endpoint,
        error: error.message,
        url,
        timestamp: '2025-07-14 17:18:17'
      });

      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check if backend is running');
      }
    }
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async getCases(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/cases${queryString ? `?${queryString}` : ''}`);
  }

  async createCase(caseData) {
    return this.request('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  }

  async getCaseById(id) {
    return this.request(`/cases/${id}`);
  }

  async updateCaseStatus(id, status, notes) {
    return this.request(`/cases/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  async getCaseStats() {
    return this.request('/cases/stats/summary');
  }

  async healthCheck() {
    return this.request('/health');
  }
}

const apiService = new ApiService();
export default apiService;