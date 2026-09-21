import { API } from './axios';

export interface NotificationItem {
  id: string;
  title: string;
  data: unknown;
  status: string;
  merchant_id: string;
  redirect_section: string;
  redirect_subsection: string | null;
  is_seen: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  total_count: number;
  unread_count: number;
  page: number;
  limit: number;
}

export interface NotificationsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const notificationsService = {
  // Simple cache and in-flight promise deduplication for list requests
  _cache: new Map<string, NotificationsResponse>(),
  _promises: new Map<string, Promise<NotificationsResponse>>(),

  async getNotifications(params: NotificationsParams = {}): Promise<NotificationsResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);

    const key = queryParams.toString();

    // Return cached response if present
    if (notificationsService._cache.has(key)) {
      return notificationsService._cache.get(key) as NotificationsResponse;
    }

    // If an in-flight request exists, return it
    if (notificationsService._promises.has(key)) {
      return notificationsService._promises.get(key) as Promise<NotificationsResponse>;
    }

    const url = `/api/v1/notifications?${key}`;
    console.log('Making API request to:', url);

    const promise = (async () => {
      try {
        const response = await API.get(url);
        const data = response.data as NotificationsResponse;
        notificationsService._cache.set(key, data);
        return data;
      } finally {
        notificationsService._promises.delete(key);
      }
    })();

    notificationsService._promises.set(key, promise);
    return promise;
  },

  /**
   * Fetch only the unread notifications count from dedicated endpoint
   * Returns a number (unread count). The server may return a JSON number or a string.
   */
  async getUnreadCount(): Promise<number> {
    const response = await API.get('/api/v1/notifications/unread-count');
    const data = response.data;
    if (typeof data === 'number') return data;
    if (typeof data === 'string') {
      const parsed = parseInt(data, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    // If server returns an object like { unread_count: n }
    if (data && typeof data === 'object' && 'unread_count' in (data as Record<string, unknown>)) {
      const val = (data as Record<string, unknown>)['unread_count'];
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    }
    return 0;
  },

  /**
   * Mark a specific notification as seen using the provided endpoint
   * POST /api/v1/notifications/mark-as-seen with body { notification_id }
   */
  async markAsSeen(notificationId: string): Promise<void> {
    await API.post('/api/v1/notifications/mark-as-seen', { notification_id: notificationId });
    // Invalidate list cache so callers refetch fresh data
    notificationsService._cache.clear();
  },

  async markAsRead(notificationId: string): Promise<void> {
    await API.patch(`/api/v1/notifications/${notificationId}/read`);
    notificationsService._cache.clear();
  },

  async markAllAsRead(): Promise<void> {
    await API.patch('/api/v1/notifications/read-all');
    notificationsService._cache.clear();
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await API.delete(`/api/v1/notifications/${notificationId}`);
    notificationsService._cache.clear();
  }
};
