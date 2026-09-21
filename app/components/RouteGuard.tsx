'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/app/store/authentication/profileStore';
import { useAuthStore } from '@/app/store/authentication/authStore';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { profile, fetchProfile, isLoading } = useProfileStore();

  useEffect(() => {
    // Only perform role check if authenticated
    // Unauthenticated redirection is handled globally in ClientRootLayout
    if (!isAuthenticated) return;

    const checkAccess = async () => {
      try {
        await fetchProfile();
        const currentProfile = useProfileStore.getState().profile;
        
        if (currentProfile && requiredRole && currentProfile.role !== requiredRole) {
          router.push('/portfolio');
        }
      } catch (error) {
        console.error('Error checking user access:', error);
      }
    };

    checkAccess();
  }, [isAuthenticated, requiredRole, fetchProfile, router]);

  // If a specific role is required and we don't have a profile yet or the role doesn't match,
  // return null to prevent rendering the protected content.
  // The useEffect will handle the redirection to /portfolio if the role is definitely wrong.
  if (requiredRole && (!profile || (profile && profile.role !== requiredRole))) {
    return null;
  }

  return <>{children}</>;
}
