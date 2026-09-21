import { create } from 'zustand';
import { notificationsService } from '@/app/services/notificationsService';

interface NotificationsState {
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchUnreadCount: (force?: boolean) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  loading: false,
  error: null,

  fetchUnreadCount: async (force = false) => {
    const state = get();
    if (!force && (state.unreadCount > 0 || state.loading)) return;

    set({ loading: true, error: null });
    try {
      const count = await notificationsService.getUnreadCount();
      set({ unreadCount: count || 0 });
    } catch (err) {
      console.error('Error fetching unread notifications count:', err);
      set({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      set({ loading: false });
    }
  }
}));

export default useNotificationsStore;
