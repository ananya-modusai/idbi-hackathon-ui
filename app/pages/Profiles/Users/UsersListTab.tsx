'use client';

import { FC, useState, useEffect } from 'react';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Plus, Users, ChevronRight, PenLine, Trash2, User as UserIcon } from 'lucide-react';
import { userService, User } from '@/app/services/userServices';
import CreateDeleteForm from '../components/CreateDeleteForm';
import CustomList from '@/components/custom/CustomList/customList';
import { CustomListItemProps } from '@/components/custom/CustomList/customListItem';
import { getColorClasses } from '@/components/custom/CustomColorScheme';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { profileService, UserProfile } from '@/app/services/profileService';
import { useProfileStore } from '@/app/store/authentication/profileStore';
import CustomLoader from '@/components/custom/CustomLoader';

interface UserListItem extends CustomListItemProps {
  originalData: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
    status?: string;
  };
}

// Convert API user data to CustomListItem format
const createUserListItem = (user: User, handlers: {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}): UserListItem => ({
  itemID: user.id,
  title: (
    <div className="flex items-center gap-2">
      <span className="text-base font-semibold text-blue-700">
        {user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)}
      </span>
      <BubbleTag
        text={user.role || 'User'}
        color="blue"
      />
      <BubbleTag
        text={user.is_active ? 'Active' : 'Inactive'}
        color={user.is_active ? 'green' : 'red'}
      />
    </div>
  ),
  subtitle: undefined,
  mainContent: undefined,
  bottomLeftContent: (
    <span className="text-xs text-gray-400">[{user.id}]</span>
  ),
  topRightContent: (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlers.onEdit(user);
        }}
        className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-blue-300 hover:bg-blue-50"
      >
        <PenLine className="h-3.5 w-3.5" />
        Edit
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlers.onDelete(user);
        }}
        className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  ),
  // rightMainIcon: ChevronRight,
  originalData: {
    id: user.id,
    email: user.email,
    role: user.role || 'User',
    createdAt: user.created_at,
    status: user.is_active ? 'Active' : 'Inactive'
  },
  themeColor: getColorClasses('blue')
});

const UsersListTab: FC = () => {
  const [usersList, setUsersList] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'create' | 'delete' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [pagination] = useState({ skip: 0, limit: 500 });

  // Fetch users data and convert to CustomList format
  const handleEditUser = (user: User) => {
    setSelectedUser({
      ...user,
      role: user.role || 'USER',
      is_active: user.is_active ?? true
    });
    setDialogAction('edit');
    setIsDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDialogAction('delete');
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Ensure profile is loaded (store will avoid duplicate fetches)
        await useProfileStore.getState().fetchProfile();
        const profile = useProfileStore.getState().profile;
        if (!profile || profile.role?.toLowerCase() !== 'admin') {
          console.warn('User does not have admin access');
          setIsLoading(false);
          return;
        }

        // Only fetch users if user is admin
        const result = await userService.getUsers(pagination.skip, pagination.limit);
        if (result.success && result.data) {
          const userItems = Array.isArray(result.data) 
            ? result.data.map((user: User) => createUserListItem(user, { onEdit: handleEditUser, onDelete: handleDeleteUser }))
            : [];
          setUsersList(userItems);
        } else {
          console.error("Failed to fetch users:", result.error);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pagination.skip, pagination.limit]);

  // Filter function for CustomList
  const searchFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    const query = selectedValues[0] || '';
    if (!query.trim()) return true;
    
    const userItem = item as UserListItem;
    const searchQuery = query.toLowerCase();
    return (
      userItem.originalData.email.toLowerCase().includes(searchQuery) ||
      userItem.originalData.role.toLowerCase().includes(searchQuery)
    );
  };

  return (
    <motion.div 
      className="w-full px-2 pb-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Section Header */}
      <motion.div className="mb-4">
        <SectionHeaderWithFlags
          title="User Management"
          icon={Users}
          positiveFlags={[]}
          negativeFlags={[]}
          mildPositiveFlags={[]}
          titleColorClass="text-blue-700"
          iconColorClass="text-blue-700"

          allowCollapse={false}
          initialRowLimit={5}
        />
      </motion.div>

      <CustomLoader 
        loading={isLoading}
        specs={{
          size: 'lg',
          color: 'blue',
          type: 'spinner',
          text: 'Loading users...',
          textColor: 'blue'
        }}
      >
        <CustomList
          items={usersList}
          searchFields={['title', 'subtitle']}
          showTimeline={false}
          disableInternalSorting={true}
          primaryFilterGroup={[
          {
            id: 'role',
            label: 'Role',
            type: 'togglebuttons',
            options: [
              { value: 'ADMIN', label: 'Admin' },
              { value: 'MEMBER', label: 'Member' }
            ],
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: (item: CustomListItemProps, selectedValues: string[]) => {
              if (selectedValues.length === 0) return true;
              const userItem = item as UserListItem;
              return selectedValues.includes(userItem.originalData.role);
            },
            showLabel: true
          },
          {
            id: 'status',
            label: 'Status',
            type: 'togglebuttons',
            options: [
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ],
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: (item: CustomListItemProps, selectedValues: string[]) => {
              if (selectedValues.length === 0) return true;
              const userItem = item as UserListItem;
              return selectedValues.includes(userItem.originalData.status || 'Active');
            },
            showLabel: true
          },
          {
            id: 'search',
            label: 'Search',
            type: 'searchbar',
            options: [],
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: searchFilterFunction,
            showLabel: false,
            searchPlaceholder: 'Search by name, role...',
            actionButtons: [
              {
                id: 'add-user',
                text: 'Create User',
                icon: Plus,
                color: 'blueTextWhiteBg' as const,
                onClick: () => {
                  setSelectedUser(null);
                  setDialogAction('create');
                  setIsDialogOpen(true);
                },
                alignment: 'right' as const,
                filterRow: 'primary' as const,
                border: true
              }
            ]
          }
        ]}
        emptyState={{
          icon: UserIcon,
          title: 'No Users Found',
          description: 'Get started by creating a new user.'
        }}
        />
      </CustomLoader>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            // Clear message when dialog is closed
            setSubmitMessage(null);
          }
          setIsDialogOpen(open);
        }}>
        <DialogContent className="p-0 border-0 bg-transparent shadow-none sm:rounded-none max-w-[460px]">
          <DialogTitle className="sr-only">{dialogAction} User</DialogTitle>
          {submitMessage && (
            <div className={`w-full p-4 text-sm rounded-md relative mb-2 ${
              submitMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className="flex items-center">
                {submitMessage.type === 'success' ? (
                  <div className="rounded-full bg-green-400 p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : null}
                {submitMessage.text}
              </div>
            </div>
          )}
          <CreateDeleteForm
            action={dialogAction}
            entity="user"
            defaultEmail={selectedUser?.email || ""}
            defaultRole={selectedUser?.role || "MEMBER"}
            defaultIsActive={selectedUser?.is_active ?? true}
            userId={selectedUser?.id}
            isSubmitting={isSubmitting}
            onSubmit={async (email, userId, role, isActive) => {
  setIsSubmitting(true);
  setSubmitMessage(null);

  // Get current user's profile for organization_id (needed for both create and edit)
  let organizationId: string;
  try {
    const profileResult = await profileService.getCurrentUserProfile();
    if (!profileResult.success || !profileResult.data) {
      throw new Error('Failed to get current user profile');
    }
    organizationId = profileResult.data.organization_id;
  } catch (error) {
    console.error('Error getting organization ID:', error);
    setSubmitMessage({
      type: 'error',
      text: 'Failed to get organization information'
    });
    setIsSubmitting(false);
    return;
  }

  if (dialogAction === "edit" && userId) {
    try {
      // For edit operation, we only need role, organization_id, and is_active
      const result = await userService.editUser(
        userId,
        role || 'USER',
        organizationId,
        isActive ?? true
      );
      
      if (result.success) {
        // Refresh the users list first
        const usersResult = await userService.getUsers(pagination.skip, pagination.limit);
        if (usersResult.success && usersResult.data) {
          const userItems = Array.isArray(usersResult.data) 
            ? usersResult.data.map((user: User) => createUserListItem(user, { onEdit: handleEditUser, onDelete: handleDeleteUser }))
            : [];
          setUsersList(userItems);
        }
        
        // Set success message and close dialog after a short delay
        setSubmitMessage({
          type: 'success',
          text: 'User updated successfully.'
        });
        
        setTimeout(() => {
          setIsDialogOpen(false);
          setSubmitMessage(null);
        }, 1500);
      } else {
        setSubmitMessage({
          type: 'error',
          text: result.error || 'Failed to update user'
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setSubmitMessage({
        type: 'error',
        text: 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  } else if (dialogAction === "delete" && userId) {
    try {
      const result = await userService.deleteUser(userId);
      
      if (result.success) {
        // Refresh the users list first
        const usersResult = await userService.getUsers(pagination.skip, pagination.limit);
        if (usersResult.success && usersResult.data) {
          const userItems = Array.isArray(usersResult.data) 
            ? usersResult.data.map((user: User) => createUserListItem(user, { onEdit: handleEditUser, onDelete: handleDeleteUser }))
            : [];
          setUsersList(userItems);
        }
        
        // Set success message and close dialog after a short delay
        setSubmitMessage({
          type: 'success',
          text: 'User deleted successfully.'
        });
        
        setTimeout(() => {
          setIsDialogOpen(false);
          setSubmitMessage(null);
        }, 1500);
      } else {
        setSubmitMessage({
          type: 'error',
          text: result.error || 'Failed to delete user'
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setSubmitMessage({
        type: 'error',
        text: 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  } else if (dialogAction === "create") {
    try {
      // Get current user's profile for organization_id only
      const profileResult = await profileService.getCurrentUserProfile();
      if (!profileResult.success || !profileResult.data) {
        throw new Error('Failed to get current user profile');
      }
      
      const { organization_id } = profileResult.data;
      
      const result = await userService.createUser(
        email,
        role || 'USER', // default to USER if not provided
        organization_id,
        isActive ?? true // default to true if not provided
      );
      
      if (result.success) {
        // Refresh the users list first
        const usersResult = await userService.getUsers(pagination.skip, pagination.limit);
        if (usersResult.success && usersResult.data) {
          const userItems = Array.isArray(usersResult.data) 
            ? usersResult.data.map((user: User) => createUserListItem(user, { onEdit: handleEditUser, onDelete: handleDeleteUser }))
            : [];
          setUsersList(userItems);
        }
        
        // Set success message and close dialog after a short delay
        setSubmitMessage({
          type: 'success',
          text: 'User created successfully.'
        });
        
        setTimeout(() => {
          setIsDialogOpen(false);
          setSubmitMessage(null);
        }, 1500);
      } else {
        setSubmitMessage({
          type: 'error',
          text: result.error || 'Failed to create user'
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setSubmitMessage({
        type: 'error',
        text: 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

            }}
            onClose={() => {
              setIsDialogOpen(false);
              setSelectedUser(null);
              setSubmitMessage(null);
            }}
            showClose
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default UsersListTab;
