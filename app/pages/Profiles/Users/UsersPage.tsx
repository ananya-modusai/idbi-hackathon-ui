'use client';

import { FC } from 'react';
import { Workspace } from '@/app/layout/Workspace/Workspace';
import UsersListTab from './UsersListTab';
import { Users } from 'lucide-react';
import { RouteGuard } from '@/app/components/RouteGuard';

const UsersPage: FC = () => {
  const tabs = [
    {
      id: 'users',
      label: 'Users',
      icon: <Users className="h-4 w-4" />,
      content: <UsersListTab />
    }
  ];

  return (
    <RouteGuard requiredRole="ADMIN">
      <Workspace tabs={tabs} />
    </RouteGuard>
  );
};

export default UsersPage;

