import { create } from 'zustand';
import { notificationsService } from '@/app/services/notificationsService';

interface NotificationState {
  unreadCount: number | null;
  loading: boolean;
  error: string | null;
  fetchUnreadCount: (force?: boolean) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => {
  // in-flight promise shared so concurrent callers reuse the same request
  let inFlight: Promise<void> | null = null;

  return {
    unreadCount: null,
    loading: false,
    error: null,

    fetchUnreadCount: async (force: boolean = false) => {
      const state = get();
      // If we already have a value and not forcing, skip fetching
      if (!force && state.unreadCount !== null) return;

      // If a request is already in flight, return it
      if (inFlight) return inFlight;

      inFlight = (async () => {
        try {
          set({ loading: true, error: null });
          const count = await notificationsService.getUnreadCount();
          set({ unreadCount: typeof count === 'number' ? count : 0 });
        } catch (err) {
          console.error('Failed to fetch unread count in store:', err);
          set({ error: err instanceof Error ? err.message : String(err), unreadCount: 0 });
        } finally {
          set({ loading: false });
          inFlight = null;
        }
      })();

      return inFlight;
    }
  };
});

export default useNotificationStore;
