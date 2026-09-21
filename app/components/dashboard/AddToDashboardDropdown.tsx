import React from 'react';
import { ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useDashboardStore } from '@/app/store/dashboard/dashboardStore';

interface AddToDashboardDropdownProps {
  visualizationId: string;
  onAddToDashboard?: () => void;
}

export const AddToDashboardDropdown: React.FC<AddToDashboardDropdownProps> = ({
  visualizationId,
  onAddToDashboard
}) => {
  const { dashboards, addVisualizationToDashboard } = useDashboardStore();

  const handleAddToDashboard = (dashboardId: string) => {
    addVisualizationToDashboard(dashboardId, visualizationId);
    
    // Call the callback if provided
    if (onAddToDashboard) {
      onAddToDashboard();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center gap-1 px-3 py-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full border border-gray-200 transition-colors"
          title="Add to dashboard"
        >
          <ExternalLink size={14} />
          <span className="text-xs font-medium">Dashboard</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.values(dashboards).map(dashboard => (
          <DropdownMenuItem 
            key={dashboard.dashboard_id} 
            onClick={() => handleAddToDashboard(dashboard.dashboard_id)}
          >
            {dashboard.title}
          </DropdownMenuItem>
        ))}
        {Object.keys(dashboards).length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem 
          className="text-gray-400 cursor-not-allowed"
          disabled 
        >
          Create New Dashboard... (Coming soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 