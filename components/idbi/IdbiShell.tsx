"use client";

import * as React from "react";
import { FC, ReactNode } from "react";
import { LayoutGrid, Users, UserRound, Activity, Bell, BellRing, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent as SidebarContentRoot,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserProfileFooter } from "@/components/custom/UserProfileFooter";
import { ActiveContext } from "./ActiveContext/ActiveContext";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["800"] });

interface SidebarItem {
  label: string;
  icon: React.ComponentType<any>;
}

interface SidebarGroupDef {
  label: string;
  items: SidebarItem[];
}

const SIDEBAR_GROUPS: SidebarGroupDef[] = [
  {
    label: "Relationship Management",
    items: [
      // The customer book. Carries the My Workspace icon now that the separate
      // My Workspace section is gone.
      { label: "Workspace", icon: LayoutGrid },
      // The Customer space — one customer's workspace, opened from the list.
      { label: "Customer", icon: UserRound },
      // Book-level view of the opportunity probes that the Customer space shows per customer.
      { label: "Sales & Alerts", icon: BellRing },
      { label: "Team & Performance", icon: Activity },
    ],
  },
];

/**
 * Left sidebar — same structure and behaviour as the cam-ui AppSidebar: the shadcn
 * Sidebar system (SidebarProvider/Sidebar/SidebarHeader/SidebarContent), the wordmark
 * in the header with the trigger pinned to its right, groups with labels, icon menu
 * buttons that collapse to an icon rail with tooltips, and the user profile footer.
 */
const IdbiSidebar: FC<{ active: string; onNavigate?: (label: string) => void }> = ({ active, onNavigate }) => {
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="relative h-14 justify-center">
        {/* Collapsed, the rail is too narrow for the wordmark — it wraps to "m / ai" — so
            the header carries only the trigger, as cam's rail does. */}
        {state !== "collapsed" && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="cursor-pointer">
                <span className={cn("whitespace-nowrap text-lg text-[#00285B]", montserrat.className)}>modus ai</span>
              </div>
            </div>
          </div>
        )}
        <div className={cn(state === "collapsed" ? "flex justify-center" : "absolute right-2 top-1/2 -translate-y-1/2")}>
          <SidebarTrigger>
            {state === "collapsed" ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContentRoot>
        {SIDEBAR_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            {group.items.map((item) => {
              const isActive = item.label === active;
              return (
                <SidebarMenuButton
                  key={item.label}
                  icon={item.icon}
                  tooltip={item.label}
                  onClick={() => onNavigate?.(item.label)}
                  className={cn(
                    isActive && "bg-blue-100/80 font-medium text-blue-600 hover:bg-blue-200/80",
                    "transition-colors"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span>{item.label}</span>
                  </div>
                </SidebarMenuButton>
              );
            })}
          </SidebarGroup>
        ))}
      </SidebarContentRoot>
      <UserProfileFooter user={{ name: "Ananya Rao", email: "Relationship Manager" }} />
    </Sidebar>
  );
};

interface IdbiShellProps {
  active?: string;
  breadcrumb?: string[];
  onNavigate?: (label: string) => void;
  /** Picking a customer from the topbar active-context palette opens their workspace. */
  onSelectCustomer?: (customer: any) => void;
  children: ReactNode;
}

/**
 * IDBI RM Workspace shell. The content card does NOT scroll — each screen owns its own
 * scroll region, so side panels (Modus Agent) stay fixed while the main column scrolls.
 */
export const IdbiShell: FC<IdbiShellProps> = ({
  active = "Workspace",
  breadcrumb = ["Relationship Management", "Workspace"],
  onNavigate,
  onSelectCustomer,
  children,
}) => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-gray-100 text-gray-900">
        <IdbiSidebar active={active} onNavigate={onNavigate} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
            <nav className="flex min-w-0 items-center gap-1 text-sm">
              {breadcrumb.map((crumb, i) => (
                <span key={crumb} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
                  <span className={cn("truncate", i === breadcrumb.length - 1 ? "text-blue-600" : "text-gray-500")}>{crumb}</span>
                </span>
              ))}
            </nav>
            <div className="flex shrink-0 items-center gap-4">
              {/* Active context — cam's topbar widget: what the workspace is pointed at
                  right now, and a palette to point it somewhere else. */}
              <ActiveContext
                activeGroup={SIDEBAR_GROUPS[0].label}
                activeItem={active}
                onSelectCustomer={onSelectCustomer}
              />
              <Bell className="h-5 w-5 text-gray-400" />
            </div>
          </header>

          <main className="flex min-h-0 flex-1 p-3">
            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg bg-white shadow-sm">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default IdbiShell;
