"use client"

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TooltipProvider } from '@/components/ui/tooltip'
// import { WorkspaceProvider } from "@/app/layout/Workspace/WorkspaceContext"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // <WorkspaceProvider>
    <TooltipProvider>
      <DndProvider backend={HTML5Backend}>
        {children}
      </DndProvider>
    </TooltipProvider>
    // </WorkspaceProvider>
  )
} 