import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '@/app/store/notifications/notificationStore';

export const useNotificationCount = () => {
  const unreadCount = useNotificationStore(state => state.unreadCount ?? 0);
  const loading = useNotificationStore(state => state.loading);
  const fetchUnreadCount = useNotificationStore(state => state.fetchUnreadCount);

  useEffect(() => {
    // Ensure store fetch is initiated; store prevents duplicate concurrent requests
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const refreshCount = useCallback((force: boolean = false) => {
    return fetchUnreadCount(force);
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refreshCount
  };
};
