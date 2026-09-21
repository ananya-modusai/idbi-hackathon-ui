import { API } from '@/app/services/axios';

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  is_active: boolean;
  is_superuser: boolean;
  first_login: boolean;
  organization: {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
  };
}

export const profileService = {
  getCurrentUserProfile: async () => {
    try {
      const response = await API.get('/api/v1/users/me/profile');
      return {
        success: true,
        data: response.data as UserProfile
      };
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      const errorResponse = error.response?.data;
      const errorMessage = errorResponse?.message || error.message || 'Failed to fetch user profile';
      const errorCode = error.response?.status;
      
      return {
        success: false,
        error: errorMessage,
        errorDetails: errorResponse,
        statusCode: errorCode
      };
    }
  }
};
