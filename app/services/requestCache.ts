import { API } from './axios';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const pendingPromises = new Map<string, Promise<any>>();

// Default TTL 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

function makeKey(method: Method, url: string, params?: any, data?: any) {
  let key = `${method}:${url}`;
  if (params) {
    try {
      // stable stringify params
      key += `:P:${JSON.stringify(Object.keys(params).sort().reduce((acc: any, k) => {
        acc[k] = params[k];
        return acc;
      }, {}))}`;
    } catch (e) {
      key += `:P:${String(params)}`;
    }
  }
  if (data) {
    try {
      key += `:D:${JSON.stringify(data)}`;
    } catch (e) {
      key += `:D:${String(data)}`;
    }
  }
  return key;
}

export async function cachedRequest(method: Method, url: string, options: { params?: any; data?: any; ttlMs?: number; cacheKey?: string } = {}) {
  const { params, data, ttlMs, cacheKey } = options;
  const key = cacheKey || makeKey(method, url, params, data);

  const entry = cache.get(key);
  const ttl = ttlMs ?? DEFAULT_TTL;
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data;
  }

  // If there's an in-flight request for this key, return it
  if (pendingPromises.has(key)) {
    return pendingPromises.get(key);
  }

  // perform request and track it
  const requestPromise = (async () => {
    try {
      let resp;
      if (method === 'GET') {
        resp = await API.get(url, { params });
      } else if (method === 'POST') {
        resp = await API.post(url, data, { params });
      } else if (method === 'PATCH') {
        resp = await API.patch(url, data, { params });
      } else if (method === 'PUT') {
        resp = await API.put(url, data, { params });
      } else if (method === 'DELETE') {
        resp = await API.delete(url, { params });
      } else {
        throw new Error(`Unsupported method ${method}`);
      }

      const responseData = resp.data;
      // store response.data
      cache.set(key, { data: responseData, timestamp: Date.now() });
      return responseData;
    } finally {
      // Clean up the pending promise
      pendingPromises.delete(key);
    }
  })();

  pendingPromises.set(key, requestPromise);
  return requestPromise;
}

export function invalidateCachedRequest(method: Method, url: string, options: { params?: any; data?: any; cacheKey?: string } = {}) {
  const key = options.cacheKey || makeKey(method, url, options.params, options.data);
  cache.delete(key);
}

export function clearRequestCache() {
  cache.clear();
}

export default {
  cachedRequest,
  invalidateCachedRequest,
  clearRequestCache,
};
