"use client"

import * as React from "react"
import { useWorkspace } from "@/app/layout/Workspace/WorkspaceContext"
import { Artifact } from "./Artifact/Artifact"
import { AppBottom } from "./AppBottom"

export function AppContent({ children }: { children: React.ReactNode }) {
  const { activeComponent: Component } = useWorkspace()

  const content = React.useMemo(() => {
    if (!Component) {
      return children
    }

    // Check if Component is already a JSX element
    if (React.isValidElement(Component)) {
      return Component
    }

    // Check if Component is a function
    if (typeof Component === 'function') {
      try {
        return React.createElement(Component)
      } catch (error) {
        console.error('Error creating element:', error)
        return children
      }
    }

    return children
  }, [Component, children])

  return (
    <div className="flex flex-col flex-1 min-h-0 p-3 bg-gray-100">
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col gap-4">
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex flex-col min-h-0 flex-1 min-w-0 max-w-[calc(100%-var(--artifact-width))]">
            <div className="flex flex-col min-h-0 flex-1">
              {content}
            </div>
          </div>
          <Artifact/>
        </div>
        {/* <AppBottom /> */}
      </main>
    </div>
  )
}