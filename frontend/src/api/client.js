import axios from 'axios';

// During development, we use relative paths so Vite's proxy routes requests
// to the backend to avoid CORS errors. In production, we use VITE_API_URL.
const baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000');

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('resq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Check if unauthorized (401)
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect if not already on the login page
      localStorage.removeItem('resq_token');
      localStorage.removeItem('resq_user');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    
    // Format error message to return to components
    let message = 'An unexpected error occurred';
    let validationErrors = null;
    
    if (error.response) {
      const data = error.response.data;
      
      if (data) {
        if (typeof data.detail === 'string') {
          message = data.detail;
        } else if (Array.isArray(data.detail)) {
          // FastAPI validation errors
          validationErrors = data.detail;
          message = data.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        } else if (data.message) {
          message = data.message;
        }
      }
    } else if (error.request) {
      message = 'Cannot connect to the server. Please check your network connection.';
    } else {
      message = error.message;
    }
    
    const formattedError = new Error(message);
    formattedError.status = error.response ? error.response.status : null;
    formattedError.validationErrors = validationErrors;
    formattedError.originalError = error;
    
    return Promise.reject(formattedError);
  }
);

export default client;
