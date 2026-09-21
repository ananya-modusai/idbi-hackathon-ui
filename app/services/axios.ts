import axios from 'axios';
import { matchStaticData } from './staticDataOverride';

export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Sentinel used to short-circuit a request that has a static override, without
// hitting the network at all. Thrown from the request interceptor and caught
// in the response interceptor's rejection handler below.
class StaticDataHit {
  constructor(public data: unknown, public config: any) {}
}

// Add a request interceptor
API.interceptors.request.use((config) => {
  // Get token from localStorage
  const auth = localStorage.getItem('auth');
  if (auth) {
    const { accessToken } = JSON.parse(auth);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  // Serve a frozen snapshot for known data endpoints instead of calling the
  // live API (auth endpoints like /token, /login-otp never match here).
  const staticData = matchStaticData(config.method || 'get', config.url, config.method?.toLowerCase() === 'post' ? config.data : config.params);
  if (staticData !== undefined) {
    return Promise.reject(new StaticDataHit(staticData, config));
  }

  return config;
});

// Add a response interceptor with better error handling
API.interceptors.response.use(
  (response) => {
    // Validate response structure for financial data endpoints
    if (response.config.url?.includes('/credit-insolvency/') &&
        response.config.url?.includes('/financialsTable')) {
      // Allow valid error responses (success: false) to pass through
      if (response.data && response.data.success === false) {
        return response;
      }
      // Only validate data structure for successful responses
      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        return Promise.reject(new Error('Invalid financial data response format'));
      }
    }
    return response;
  },
  (error) => {
    if (error instanceof StaticDataHit) {
      return Promise.resolve({
        data: error.data,
        status: 200,
        statusText: 'OK (static snapshot)',
        headers: {},
        config: error.config,
      });
    }
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('auth');
      window.location.href = '/auth';
    } else if (error.response?.status === 404) {
      console.error('Resource not found:', error.config.url);
    } else if (!error.response) {
      console.error('Network error:', error.message);
    } else {
      console.error('API error:', error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);