import { API } from './axios';
import { AxiosError } from 'axios';

interface APIErrorResponse {
  detail?: string;
  message?: string;
  data?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  is_active: boolean;
  is_superuser: boolean;
  first_login: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  organization: {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
  };
}

export const userService = {

  // Simple cache and in-flight promise maps to deduplicate getUsers calls
  _usersCache: new Map<string, any>(),
  _usersPromises: new Map<string, Promise<any>>(),

  clearCache: () => {
    userService._usersCache.clear();
    userService._usersPromises.clear();
  },

  
  // Create a new user
  createUser: async (email: string, role: string, organization_id: string, is_active: boolean) => {
    try {
      // Use the API instance which already has the proper configuration
      const response = await API.post('/api/v1/users/create', {
        email,
        role,
        organization_id,
        is_active  // This will trigger sending welcome email automatically based on the API spec
      });
      
      // Invalidate cache after successful creation
      userService.clearCache();
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating user:', error);
      const axiosError = error as AxiosError<APIErrorResponse>;
      const errorResponse = axiosError.response?.data;
      const errorMessage = errorResponse?.detail || errorResponse?.message || (error as Error).message || 'Failed to create user';
      const errorCode = axiosError.response?.status;
      
      return {
        success: false,
        error: errorMessage,
        errorDetails: errorResponse,
        statusCode: errorCode
      };
    }
  },

  // Delete a user
  deleteUser: async (userId: string) => {
    try {
      const response = await API.delete(`/api/v1/users/${userId}`);
      
      // Invalidate cache after successful deletion
      userService.clearCache();

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      const axiosError = error as AxiosError<APIErrorResponse>;
      const errorResponse = axiosError.response?.data;
      const errorMessage = errorResponse?.detail || errorResponse?.message || (error as Error).message || 'Failed to delete user';
      const errorCode = axiosError.response?.status;
      
      return {
        success: false,
        error: errorMessage,
        errorDetails: errorResponse,
        statusCode: errorCode
      };
    }
  },

  // Edit a user
  editUser: async (userId: string, role: string, organization_id: string, is_active: boolean) => {
    try {
      // Make sure we have all required fields
      if (!userId || !role || !organization_id === undefined || is_active === undefined) {
        throw new Error('Missing required fields for user update');
      }

      // Ensure the URL matches exactly /api/v1/users/{user_id}
      const response = await API.put(`/api/v1/users/${userId}`, {
        role: role,
        organization_id: organization_id,
        is_active: is_active
      });
      
      // Invalidate cache after successful edit
      userService.clearCache();

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error editing user:', error);
      const axiosError = error as AxiosError<APIErrorResponse>;
      const errorResponse = axiosError.response?.data;
      const errorMessage = errorResponse?.detail || errorResponse?.message || (error as Error).message || 'Failed to edit user';
      const errorCode = axiosError.response?.status;
      
      return {
        success: false,
        error: errorMessage,
        errorDetails: errorResponse,
        statusCode: errorCode
      };
    }
  },

  // Get all users with pagination (deduplicated + cached)
  getUsers: async (skip: number = 0, limit: number = 100) => {
    const cacheKey = `users_${skip}_${limit}`;

    // Return cached result if available
    if ((userService as any)._usersCache.has(cacheKey)) {
      return {
        success: true,
        data: (userService as any)._usersCache.get(cacheKey)
      };
    }

    // If an in-flight request exists, return that promise
    if ((userService as any)._usersPromises.has(cacheKey)) {
      return (userService as any)._usersPromises.get(cacheKey);
    }

    const promise = (async () => {
      try {
        const response = await API.get(`/api/v1/users/?skip=${skip}&limit=${limit}`);
        const result = {
          success: true,
          data: response.data
        };
        // Cache the data for subsequent callers
        (userService as any)._usersCache.set(cacheKey, response.data);
        return result;
      } catch (error) {
        console.error('Error fetching users:', error);
        const axiosError = error as AxiosError<APIErrorResponse>;
        const errorResponse = axiosError.response?.data;
        const errorMessage = errorResponse?.message || (error as Error).message || 'Failed to fetch users';
        const errorCode = axiosError.response?.status;

        return {
          success: false,
          error: errorMessage,
          errorDetails: errorResponse,
          statusCode: errorCode
        };
      } finally {
        (userService as any)._usersPromises.delete(cacheKey);
      }
    })();

    (userService as any)._usersPromises.set(cacheKey, promise);
    return promise;
  }
};