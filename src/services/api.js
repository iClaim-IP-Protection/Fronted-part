const API_BASE_URL = 'http://localhost:8000';

// Helper function to get JWT token from localStorage
const getToken = () => localStorage.getItem('jwt_token');

// Helper function to set JWT token in localStorage
const setToken = (token) => localStorage.setItem('jwt_token', token);

// Helper function to remove JWT token
const removeToken = () => localStorage.removeItem('jwt_token');

// Helper function to get User ID from localStorage
const getUserId = () => localStorage.getItem('user_id');

// Helper function to set User ID in localStorage
const setUserId = (userId) => localStorage.setItem('user_id', userId);

// Helper function to remove User ID from localStorage
const removeUserId = () => localStorage.removeItem('user_id');

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
    if (data.id) {
      setUserId(data.id);
    }
    return data;
  },

  register: async (username, email, contact, password, firstName, lastName) => {
    const data = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        username, 
        email, 
        contact, 
        password, 
        first_name: firstName, 
        last_name: lastName 
      }),
    });
    if (data.access_token) {
      setToken(data.access_token);
    }
    if (data.id) {
      setUserId(data.id);
    }
    return data;
  },

  logout: () => {
    removeToken();
    removeUserId();
  },

  getCurrentUser: async () => {
    return await apiCall('/api/profile/me', { method: 'GET' });
  },

  connectWallet: async (walletAddress) => {
    return await apiCall('/api/profile/connect-wallet', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress }),
    });
  },

  disconnectWallet: async () => {
    return await apiCall('/api/profile/disconnect-wallet', {
      method: 'POST',
    });
  },

  getToken,
  getUserId,
  isAuthenticated: () => !!getToken(),
};

// Assets Endpoints
export const assetsAPI = {
  uploadAsset: async (formData) => {
    // Special handling for FormData - don't set Content-Type header
    const token = getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/ipfs/upload`, {
      method: 'POST',
      headers,
      body: formData,
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
  },

  // getAsset: async (assetId) => {
  //   return await apiCall(`/api/assets/me`, { method: 'GET' });
  // },

  // getUserAssets: async (username) => {
  //   return await apiCall(`/api/assets/${username}`, { method: 'GET' });
  // },

  getAssets: async () => {
    return await apiCall(`/api/ipfs/assets`, { method: 'GET' });
  },

  getAssetInfo: async (assetId) => {
    return await apiCall(`/api/ipfs/${assetId}`, { method: 'GET' });
  },

  getAssetByHash: async (certificateHash) => {
    return await apiCall(`/api/ipfs/hash/${certificateHash}`, { method: 'GET' });
  },

  updateAsset: async (assetId, updateData) => {
    const formData = new FormData();
    if (updateData.title) formData.append('title', updateData.title);
    if (updateData.version !== undefined) formData.append('version', updateData.version);
    if (updateData.previous_asset_id !== undefined) formData.append('previous_asset_id', updateData.previous_asset_id);

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/ipfs/${assetId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update asset');
    }

    return await response.json();
  },

  deleteAsset: async (assetId) => {
    return await apiCall(`/api/ipfs/${assetId}`, { method: 'DELETE' });
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
    return await apiCall(`/api/dashboard/me`, { method: 'GET' });
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
