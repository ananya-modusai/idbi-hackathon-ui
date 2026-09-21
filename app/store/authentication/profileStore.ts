import { create } from 'zustand';
import { profileService } from '@/app/services/profileService';

interface ProfileState {
  organizationId: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  profile: any | null;  // Replace 'any' with your profile type if available
  fetchProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  organizationId: null,
  isAdmin: false,
  isLoading: false,
  error: null,
  profile: null,

  fetchProfile: async () => {
    // Only fetch if we don't already have the profile
    const state = useProfileStore.getState();
    if (state.profile || state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const result = await profileService.getCurrentUserProfile();
      if (result.success && result.data) {
        set({
          organizationId: result.data.organization.id,
          isAdmin: result.data.role === 'ADMIN',
          profile: result.data,
          error: null
        });
      } else {
        set({ error: result.error || 'Failed to fetch profile' });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
    } finally {
      set({ isLoading: false });
    }
  }
}));
