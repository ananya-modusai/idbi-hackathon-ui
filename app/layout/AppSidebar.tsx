

"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from 'next/navigation'
import {
  Sidebar,
  SidebarContent as SidebarContentRoot,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  LineChart,
  Sparkles,
  Footprints,
  Microscope,
  ChevronsLeft,
  ChevronsRight,
  Store,
  BookOpen,
  Brain,
  Bell,
  ListTodo,
  Folder,
  UserCheck,
  MessageCircle,
  Clock,
  FileText,
  AlertTriangle,
  Users,
  Building2,
  Briefcase,
  PieChart,
  Flag,
  Files,
  Star,
  Scale,
} from "lucide-react"
import dynamic from 'next/dynamic'
import { cn, toPascalCase } from "@/lib/utils"
////import MerchantProfile from "../pages/Merchant/MerchantProfile/MerchantProfile"
//import MerchantActivity from "../pages/Merchant/MerchantActivity/MerchantActivity"
const MerchantInsolvency = dynamic(() => import("../pages/Merchant/MerchantInsolvency/MerchantInsolvency"), {
  ssr: false
})
//import RulesPage from "../pages/Strategy/Red Flags/RedFlagsPage"
//import SandboxPage from "../pages/Strategy/Sandbox/SandboxPage"
import { Montserrat } from 'next/font/google'
import { UserProfileFooter } from "@/components/custom/UserProfileFooter"
import { useWorkspaceStore } from '@/app/store/workspace/workspaceStore';
import { useState, useEffect } from 'react';
import { profileService } from '@/app/services/profileService';
//import InvestigationInsights from "../pages/Merchant/MerchantInvestigation/InvestigationInsights"
//import InvestigationHub from "../pages/CaseManagement/InvestigationHub/InvestigationHub"
//import QueueManager from "@/app/pages/CaseManagement/QueueManager/QueueManager"
//import ChatHistory from "@/app/pages/Modus Agent/ChatHistory/ChatHistory"
//import Dashboards from "@/app/pages/Modus Agent/Dashboards/Dashboards"
import { useActiveContextStore } from '@/app/store/activeContextStore';
const UsersPage = dynamic(() => import("../pages/Profiles/Users/UsersPage"), { ssr: false });
import ChangePassword from "../auth/components/ChangePassword"
const MerchantPortfolioPage = dynamic(() => import("../pages/Merchant/MerchantPortfolio/MerchantPortfolioPage"), { ssr: false });
const MerchantWatchlistPage = dynamic(() => import("../pages/Merchant/MerchantPortfolio/MerchantWatchlistPage"), { ssr: false });
const MerchantAlertsPage = dynamic(() => import("../pages/Merchant/MerchantAlerts/MerchantAlertsPage"), { ssr: false });
import { BlankMerchantState } from "../pages/Merchant/MerchantInsolvency/BlankMerchantState"
import { useMerchantIdStore } from "../store/merchant/merchantIdStore"
import { useNotificationCount } from "../hooks/useNotificationCount"
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore"
import ProcessingPage from "../pages/Investigation/Processing/ProcessingPage"
import BannedCategoryPage from "../pages/Investigation/InvAllCases/InvBannedCategoryPage"
import InvRestrictedCategoryPage from "../pages/Investigation/InvAllCases/InvRestrictedCategoryPage"
const InvCaseWorkspacePage = dynamic(() => import("../pages/Investigation/InvWorkspace/InvCaseWorkspacePage"), { ssr: false });
const InvAllCasesPage = dynamic(() => import("../pages/Investigation/InvAllCases/InvAllCasesPage"), { ssr: false });
const HHIPage = dynamic(() => import("../pages/Merchant/HHI/HHIPage"), { ssr: false });
const FlaggedMerchantsPage = dynamic(() => import("../pages/Investigation/FlaggedMerchants/FlaggedMerchantsPage"), { ssr: false });
// Dynamic import for Context page
const InvContextPage = dynamic(() => import("@/app/pages/Investigation/InvAllCases/InvContextPage"), { ssr: false });
//import { BlankCaseState } from "../pages/CaseManagement/BlankCaseState"
//import CustomerInvestigation from "../pages/Customer/Investigation/CustomerInvestigation"
//import SMSIntelligence from "../pages/Customer/SMS/SMSIntelligence"
//import ListingCompliance from "../pages/IPO/ListingCompliance/ListingCompliancePage"
//import EntitiesPage from "../pages/IPO/Entities/EntitiesPage"
//import InsertsPage from "../pages/Consortium/Inserts/InsertsPage"
//mport QueriesPage from "../pages/Consortium/Queries/QueriesPage"
//import ConsortiumAnalyticsPage from "../pages/Consortium/Analytics/ConsortiumAnalyticsPage";

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['800'], // 800 is ExtraBold
})



export interface SidebarItem {
  label: string;
  component?: React.ComponentType<any>;
  icon: React.ComponentType;
  href?: string;
}

interface SidebarGroup {
  label: string;
  items: (SidebarItem & { requiredRole?: string })[];
  requiredRole?: string;  // Added to allow marking entire groups as requiring a role
}

export const sidebarGroups: SidebarGroup[] = [
  {
    label: "Underwriting",
    items: [
      {
        label: "All Cases",
        component: MerchantWatchlistPage,
        icon: Microscope,
      },
    ],
  },
  {
    label: "Merchant Report",
    items: [
      {
        label: "Merchant Report",
        component: MerchantInsolvency,
        icon: LineChart,
      },
    ],
  },
  // {
  //   label: "Underwriting",
  //   items: [
  //     {
  //       label: "Case Workspace",
  //       component: InvCaseWorkspacePage,
  //       icon: Briefcase,
  //     },
  //     {
  //       label: "All Cases",
  //       component: InvAllCasesPage,
  //       icon: Microscope,
  //     },
      // {
      //   label: "Banned Categories",
      //   component: BannedCategoryPage,
      //   icon: ListTodo,
      // },
      // {
      //   label: "Restricted Categories",
      //   component: InvRestrictedCategoryPage,
      //   icon: Files,
      // },
      // {
      //   label: "Flagged Merchants",
      //   component: FlaggedMerchantsPage,
      //   icon: Flag,
      // },
      // {
      //   label: "Context",
      //   component: InvContextPage,
      //   icon: BookOpen,
      //   requiredRole: 'ADMIN',
      // }
      // {
      //   label: "Processing",
      //   component: ProcessingPage,
      //   icon: Microscope,
      // },
  //   ],
  // },
  // {
  //   label: "Manage Profiles",
  //   items: [
  //     {
  //       label: "Users",
  //       component: UsersPage,
  //       icon: Users,
  //       requiredRole: 'ADMIN'  // The entire section will be hidden for non-admin users since this is the only item
  //     },
  //   ],
  //   requiredRole: 'ADMIN'  // Added this to explicitly mark that the whole section requires admin role
  // },

]

const SidebarContents = () => {
  const setActiveComponent = useWorkspaceStore(state => state.setActiveComponent);
  const setActiveNavigation = useWorkspaceStore(state => state.setActiveNavigation);
  const activeNavigation = useWorkspaceStore(state => state.activeNavigation);
  const { state } = useSidebar()
  const activeContexts = useActiveContextStore(state => state.activeContexts);
  const setContext = useActiveContextStore(state => state.setContext);

  // Single-merchant demo build: auto-select TARC (the only merchant available)
  // so users never hit the "No Merchant Selected" blank state.
  useEffect(() => {
    if (!activeContexts.merchant) {
      setContext('merchant', 'd4efc32f-9fcc-4cfc-8e60-eff421acf83d');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { unreadCount } = useNotificationCount();

  const router = useRouter();

  // NOTE: the sidebar used to auto-collapse on the All Cases watchlist. That was a
  // workaround for content overflowing its container - the fix belongs in the page,
  // not in the chrome - so the sidebar is now under user control only.

  useEffect(() => {
    const fetchUserRole = async () => {
      const result = await profileService.getCurrentUserProfile();
      if (result.success && result.data) {
        setUserRole(result.data.role);
      }
    };
    fetchUserRole();
  }, []);

  // Context-sync logic has been moved to individual pages (e.g. InvCaseWorkspacePage, MerchantInsolvency)
  // to avoid infinite re-render loops in the global sidebar component.
  React.useEffect(() => {
    // We only keep the customer logic here if it's not handled elsewhere
    if (activeContexts.customer) {
      if (activeNavigation?.group === "Customer") {
        if (activeNavigation.item === "Investigation" || activeNavigation.item === "SMS Intelligence") {
          return;
        }
        setActiveNavigation({ group: "Customer", item: "SMS Intelligence" });
      }
    }
  }, [activeContexts.customer, activeNavigation, setActiveNavigation]);

  const handleItemClick = React.useCallback((group: string, item: SidebarItem) => {
    const Component = item.component;
    if (Component) {
      // Only update if the component or navigation actually changed
      const store = useWorkspaceStore.getState();
      const currentNav = store.activeNavigation;

      if (
        currentNav?.group !== group ||
        currentNav?.item !== item.label
      ) {
        // Handle state updates before navigation
        store.setActiveTab(null, null);

        // Determine which component to render based on group and context
        let ComponentToRender: any = null;
        let targetPath = '';

        if (group === "Underwriting" && item.label === "All Cases") {
          ComponentToRender = Component;
          targetPath = `/all-cases`;
        } else if (group === "Merchant Report") {
          // Single sidebar entry now — Peer Analysis, External Insights and
          // Compliance Summary all live as tabs inside this one page (see
          // MerchantInsolvency.tsx). Single-merchant demo build: TARC is the
          // only merchant, so we don't need an activeContexts.merchant check.
          const TARC_CIN = 'L70100DL2016PLC390526';
          const TARC_MERCHANT_ID = 'd4efc32f-9fcc-4cfc-8e60-eff421acf83d';
          ComponentToRender = () => React.createElement(Component, {
            merchantId: activeContexts.merchant || TARC_MERCHANT_ID,
            initialTab: 'overview',
          });
          targetPath = `/insolvency/${TARC_CIN}`;
        } else if (group === "Insolvency" && item.label === "Notifications") {
          ComponentToRender = Component;
          targetPath = '/notifications';
        } else if (group === "Insolvency" && item.label === "Merchant Portfolio") {
          ComponentToRender = Component;
          targetPath = `/portfolio`;
        } else if (group === "Insolvency" && item.label === "Herfindahl-Hirschman Index") {
          ComponentToRender = Component;
          targetPath = `/hhi`;
        } else {
          ComponentToRender = Component;
          targetPath = `/${item.label.toLowerCase()}`;
        }

        setActiveComponent(ComponentToRender);
        setActiveNavigation({ group, item: item.label });

        // Navigate last to avoid double compilation
        router.push(targetPath);
      }
    } else if (item.href) {
      setActiveComponent(null);
      router.push(item.href);
    }
  }, [activeContexts, setActiveComponent, setActiveNavigation, router]);

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="h-14 relative">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className={cn(
            "transition-all duration-200",
            "group-data-[collapsible=icon]:opacity-0"
          )}>
            <div
              onClick={() => {
                const store = useWorkspaceStore.getState();
                const { clearContexts } = useActiveContextStore.getState();

                // Clear contexts and reset tab
                clearContexts();
                store.setActiveTab(null, null);

                // Make sure workspace shows the Portfolio navigation and select the Watchlist tab
                // (helps when user is already on /portfolio and router.push won't trigger a route change)
                store.setActiveComponentAndNavigation(MerchantPortfolioPage, { group: 'Merchant', item: 'Portfolio' });
                store.setActiveTab('watchlist', 'Watchlist');

                // Navigate to Portfolio page (app home)
                router.push('/portfolio');
              }}
              className="cursor-pointer"
            >
              <span className={cn("text-lg text-[#00285B]", montserrat.className)}>modus ai</span>
            </div>
          </div>
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <SidebarTrigger>
            {state === "collapsed" ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContentRoot>
        {sidebarGroups.map((group, groupIdx) => {
          // Check if user has access to the group itself
          if (group.requiredRole && group.requiredRole !== userRole) return null;

          // Filter items based on user role
          const visibleItems = group.items.filter(item => !item.requiredRole || item.requiredRole === userRole);

          // Skip rendering the entire group if there are no visible items
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={`${group.label}-${groupIdx}`}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              {visibleItems.map((item) => {
                const isActive = activeNavigation?.group === group.label && activeNavigation?.item === item.label
                const showNotificationCount = item.label === "Notifications" && unreadCount > 0
                return (
                  <SidebarMenuButton
                    key={item.label}
                    icon={item.icon}
                    tooltip={item.label}
                    onClick={() => handleItemClick(group.label, item)}
                    className={cn(
                      isActive && "bg-blue-100/80 text-blue-600 font-medium hover:bg-blue-200/80",
                      "transition-colors"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{item.label}</span>
                      {showNotificationCount && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </SidebarMenuButton>
                )
              })}
            </SidebarGroup>
          );
        })}
      </SidebarContentRoot>
      <UserProfileFooter
        user={{
          name: "John Doe",
          email: "john.doe@example.com",
          // avatarUrl: "/path/to/avatar.jpg" // Optional
        }}
      />
    </Sidebar>
  )
}

export function AppSidebar() {
  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarContents />
    </SidebarProvider>
  )
}