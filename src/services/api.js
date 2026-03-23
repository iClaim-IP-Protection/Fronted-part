const API_BASE_URL = 'http://localhost:8000';

// Helper function to get JWT token from localStorage
const getToken = () => localStorage.getItem('jwt_token');

// Helper function to set JWT token in localStorage
const setToken = (token) => localStorage.setItem('jwt_token', token);

// Helper function to remove JWT token
const removeToken = () => localStorage.removeItem('jwt_token');

// Helper function for API calls with error handling
const apiCall = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // Ignore JSON parsing errors
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    // Ensure we always throw an Error object with a message
    const message = error instanceof Error ? error.message : String(error);
    const finalError = new Error(message);
    console.error('API Error:', finalError);
    throw finalError;
  }
};

// Auth Endpoints
export const authAPI = {
  login: async (email, password) => {
    const data = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) {
      setToken(data.access_token);
    }
    return data;
  },

  register: async (username, email, contact, wallet, password, firstName, lastName) => {
    const data = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        username, 
        email, 
        contact, 
        wallet_address: wallet, 
        password, 
        first_name: firstName, 
        last_name: lastName 
      }),
    });
    if (data.access_token) {
      setToken(data.access_token);
    }
    return data;
  },

  logout: () => {
    removeToken();
  },

  getToken,
  isAuthenticated: () => !!getToken(),
};

// Assets Endpoints
export const assetsAPI = {
  getAsset: async (assetId) => {
    return await apiCall(`/api/assets/${assetId}`, { method: 'GET' });
  },

  getUserAssets: async (username) => {
    return await apiCall(`/api/assets/${username}`, { method: 'GET' });
  },
};

// Profile Endpoints
export const profileAPI = {
  getProfile: async (username) => {
    return await apiCall(`/api/profile/${username}`, { method: 'GET' });
  },

  updateProfile: async (username, profileData) => {
    return await apiCall(`/api/profile/${username}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// Dashboard Endpoints
export const dashboardAPI = {
  getDashboard: async (username) => {
    return await apiCall(`/api/dashboard/${username}`, { method: 'GET' });
  },
};

// Health Check
export const healthAPI = {
  check: async () => {
    return await apiCall('/', { method: 'GET' });
  },
};

export default {
  authAPI,
  assetsAPI,
  profileAPI,
  dashboardAPI,
  healthAPI,
};
