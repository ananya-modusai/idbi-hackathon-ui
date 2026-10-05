/**
 * IndexedDB Utility for caching graph API responses.
 * Provides persistent storage to speed up initial loads and reduce network requests.
 */

const DB_NAME = 'ModusGraphDB';
const STORE_NAME = 'api_cache';
const VERSION = 1;

interface CacheEntry {
  data: any[];
  error: string | null;
  timestamp: number;
}

/**
 * Open the IndexedDB database.
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      console.error('[EntityGraphDB] Error opening database:', event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Get cached data from IndexedDB.
 * @param key The cache key (e.g., "customerId::degree=all")
 */
export const getGraphCache = async (key: string): Promise<CacheEntry | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = (event: any) => {
        const result = event.target.result;
        if (result) {
          resolve(result as CacheEntry);
        } else {
          resolve(null);
        }
      };

      request.onerror = (event: any) => {
        console.error(`[EntityGraphDB] Error getting cache for ${key}:`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('[EntityGraphDB] getGraphCache failed:', error);
    return null;
  }
};

/**
 * Set cached data in IndexedDB.
 * @param key The cache key
 * @param data The graph data array
 * @param error Optional error message
 */
export const setGraphCache = async (key: string, data: any[], error: string | null = null): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const entry: CacheEntry = {
        data,
        error,
        timestamp: Date.now()
      };

      const request = store.put(entry, key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event: any) => {
        console.error(`[EntityGraphDB] Error setting cache for ${key}:`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('[EntityGraphDB] setGraphCache failed:', error);
  }
};

/**
 * Clear cache for a specific key or all keys if no key provided.
 */
export const clearGraphCache = async (key?: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = key ? store.delete(key) : store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event: any) => {
        console.error(`[EntityGraphDB] Error clearing cache${key ? ` for ${key}` : ''}:`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('[EntityGraphDB] clearGraphCache failed:', error);
  }
};
