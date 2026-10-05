import axios, { AxiosInstance } from 'axios';

/**
 * Client for the customer-underwriting backend.
 *
 * The app's primary `API` (./axios) targets NEXT_PUBLIC_API_URL, which is a
 * different service. The ported Linkages and Portfolio-MIS tabs talk to the
 * underwriting API instead, so they get their own instance rather than having
 * the shared client re-pointed.
 */

const normalizeBaseURL = (value?: string): string | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().replace(/^['"]|['"]$/g, '');
  return normalized || undefined;
};

const resolveCustomerApiBaseURL = (): string | undefined =>
  normalizeBaseURL(process.env.NEXT_PUBLIC_CUSTOMER_UNDERWRITING_API_URL) ||
  normalizeBaseURL(process.env.CUSTOMER_UNDERWRITING_API_URL) ||
  normalizeBaseURL(process.env.NEXT_PUBLIC_API_URL);

const createAPI = (baseURL?: string): AxiosInstance => {
  const instance = axios.create({
    baseURL: normalizeBaseURL(baseURL),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    // A dev restart can briefly leave baseURL empty; without this the customer
    // calls would fall back to same-origin routes like /customers.
    if (!config.baseURL) {
      const runtimeBaseURL = resolveCustomerApiBaseURL();
      if (runtimeBaseURL) config.baseURL = runtimeBaseURL;
    }

    try {
      const auth = localStorage.getItem('auth');
      if (auth) {
        const { accessToken } = JSON.parse(auth);
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
    } catch {
      // no stored auth; the request goes out unauthenticated
    }
    return config;
  });

  return instance;
};

export const API = createAPI(resolveCustomerApiBaseURL());
