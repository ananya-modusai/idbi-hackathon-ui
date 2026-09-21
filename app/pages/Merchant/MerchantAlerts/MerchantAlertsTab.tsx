'use client';

import { FC, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Search,
  Eye,
  EyeOff,
  AlertCircle,
  AlertOctagon,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronUp
} from 'lucide-react';
import { CustomCard } from '@/components/custom/CustomCard';
import { ActionButton } from '@/components/custom/ActionButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { notificationsService, NotificationItem } from '@/app/services/notificationsService';
import { useNotificationCount } from '@/app/hooks/useNotificationCount';
import { useMerchantNavigation } from '@/app/hooks/useMerchantNavigation';
import { useMerchantIdStore } from '@/app/store/merchant/merchantIdStore';
import CustomLoader from '@/components/custom/CustomLoader';
import { insolvencySectionConfig } from '@/components/custom/ExternalInsights/configs/insolvencyConfig';

interface ExpandedNotification {
  [key: string]: boolean;
}


interface MerchantAlertsTabProps {
  merchantId?: string;
}

// Local type for external insight items
type InsightItem = {
  severity?: string;
  title?: string;
  summary?: string;
  insight_type?: string;
  external_date?: string;
};

const MerchantAlertsTab: FC<MerchantAlertsTabProps> = ({ merchantId }) => {
  console.log('🚀 MerchantAlertsTab component rendered with merchantId:', merchantId);
  console.log('🔧 Environment check - API URL:', process.env.NEXT_PUBLIC_API_URL);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'data_refresh' | 'external_insights' | 'system'>('all');
  const [showRead, setShowRead] = useState(true);
  const [typesOpen, setTypesOpen] = useState(false);
  const typesRef = useRef<HTMLDivElement | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotifications, setExpandedNotifications] = useState<ExpandedNotification>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(20);
  // totalCount removed: header and UI rely on shared unreadCount
  const { unreadCount, refreshCount } = useNotificationCount();

  // Fetch notifications from API
  useEffect(() => {
    console.log('useEffect triggered, fetching notifications...');
    const fetchNotifications = async () => {
      try {
        console.log('Starting to fetch notifications...');
        setLoading(true);
        const response = await notificationsService.getNotifications({
          page: currentPage,
          limit: limit,
          status: 'active'
        });
        console.log('Notifications response:', response);
        setNotifications(response.notifications);
        setTotalCount(response.total_count);
        // refresh shared unread count hook after fetching the page
        refreshCount();
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        // Set empty state on error
        setNotifications([]);
        setTotalCount(0);
        // ensure shared count resets
        refreshCount();
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentPage, limit, refreshCount]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, showRead]);

  // Close the types dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (typesRef.current && !typesRef.current.contains(e.target as Node)) {
        setTypesOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const getNotificationIcon = (redirectSection: string) => {
    switch (redirectSection) {
      case 'external_insights':
        return Info;
      case 'dashboard':
        return CheckCircle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (redirectSection: string) => {
    switch (redirectSection) {
      case 'external_insights':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'dashboard':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getNotificationType = (redirectSection: string) => {
    switch (redirectSection) {
      case 'external_insights':
        return 'external_insights';
      case 'dashboard':
        return 'data_refresh';
      default:
        return 'system';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'severe':
        return AlertOctagon;
      case 'high':
        return AlertTriangle;
      case 'medium':
        return AlertCircle;
      case 'low':
        return Shield;
      case 'neutral':
        return Info;
      case 'good':
      case 'verygood':
        return CheckCircle;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'severe':
        return 'border-red-600';
      case 'high':
        return 'border-red-500';
      case 'medium':
        return 'border-yellow-500';
      case 'low':
        return 'border-green-500';
      case 'neutral':
        return 'border-gray-400';
      case 'good':
      case 'verygood':
        return 'border-green-400';
      default:
        return 'border-gray-400';
    }
  };

  const getInsightTypeIcon = (insightType?: string) => {
    const normalizedType = insightType?.toLowerCase() || '';
    const config = Object.entries(insolvencySectionConfig).find(
      ([key]) => key.toLowerCase() === normalizedType
    );
    return config ? config[1].icon : Info;
  };

  const getInsightTypeLabel = (insightType?: string) => {
    const normalizedType = insightType?.toLowerCase() || '';
    const config = Object.entries(insolvencySectionConfig).find(
      ([key]) => key.toLowerCase() === normalizedType
    );
    return config ? config[1].title : insightType || 'Unknown';
  };

  const getInsightTypeIconColor = (insightType?: string) => {
    const normalizedType = insightType?.toLowerCase() || '';
    const config = Object.entries(insolvencySectionConfig).find(
      ([key]) => key.toLowerCase() === normalizedType
    );
    return config ? config[1].iconColorClass : 'text-gray-400';
  };

  const formatNotificationTypeLabel = (label?: string) => {
    if (!label) return '';
    return label.replace(/_/g, ' ').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Navigation & merchant resolution
  const { navigateToMerchantInsolvency } = useMerchantNavigation();
  const { merchantIdList, fetchMerchantIdList } = useMerchantIdStore();

  const resolveMerchantIdByTitle = async (title: string): Promise<string | null> => {
    // Try to extract an uppercase token (likely merchant short name) from the title as a fallback
    const uppercaseWords = (title.match(/[A-Z0-9\s]{2,}/g) || [])
      .map(s => s.trim())
      .filter(Boolean);

    if (!merchantIdList.length) {
      try {
        await fetchMerchantIdList();
      } catch (err) {
        console.error('Failed to fetch merchant list while resolving merchant id:', err);
      }
    }

    if (merchantIdList.length) {
      // Try to match by legalName or cin or any other available field
      for (const token of uppercaseWords) {
        const found = merchantIdList.find(m => {
          const nameMatch = m.legalName && m.legalName.toUpperCase().includes(token.toUpperCase());
          const cinMatch = (m.cin || '').toUpperCase().includes(token.toUpperCase());
          const tradeNameMatch = (m.tradeName || '').toUpperCase().includes(token.toUpperCase());
          return nameMatch || cinMatch || tradeNameMatch;
        });

        if (found) return found.id;
      }

      // As a last resort, try direct substring match against legalName
      const titleLower = title.toLowerCase();
      const found = merchantIdList.find(m => (m.legalName || '').toLowerCase().includes(titleLower));
      if (found) return found.id;
    }

    return null;
  };

  const handleTitleClick = async (notification: NotificationItem) => {
    try {
      // Prefer explicit merchant_id from API
      if (notification.merchant_id) {
        navigateToMerchantInsolvency(notification.merchant_id);
        return;
      }

      // Otherwise attempt to resolve from title
      const resolvedId = await resolveMerchantIdByTitle(notification.title || '');
      if (resolvedId) {
        navigateToMerchantInsolvency(resolvedId);
        return;
      }

      console.warn('Could not resolve merchant id for notification:', notification);
    } catch (error) {
      console.error('Error navigating to merchant insolvency from notification title:', error);
    }
  };

  const handleInsightClick = async (notification: NotificationItem, item: { insight_type?: string; [k: string]: unknown }) => {
    try {
      const rawType = item.insight_type ?? item.type ?? item.category ?? item.section ?? null;
      const insightType = typeof rawType === 'string' ? rawType : null;

      // Prefer explicit merchant_id from notification
      let merchantToUse: string | null = notification.merchant_id || null;
      if (!merchantToUse) {
        merchantToUse = await resolveMerchantIdByTitle(notification.title || '');
      }

      if (!merchantToUse) {
        console.warn('Could not resolve merchant id for insight click:', notification, item);
        return;
      }

      // Map incoming insight types to the External Insights section keys used by the insolvency config
      const insightTypeMap: Record<string, string> = {
        'legal_regulatory_compliance': 'legal_regulatory_compliance',
        'executive_workforce_developments': 'executive_workforce_developments',
        'operational_disruptions': 'operational_disruptions',
        'sentiment_brand_reputation': 'sentiment_brand_reputation',
        'financial_warning_signs': 'financial_warning_signs',
        'industry_macroeconomic': 'industry_macroeconomic',
        'financial_disclosures': 'financial_disclosures',
        'audit_report_insights': 'audit_report_insights',
        'annual_report_insights': 'annual_report_insights'
      };

      const normalizedSection = insightType && insightTypeMap[insightType] ? insightTypeMap[insightType] : insightType;

      // Navigate and ask the insolvency external insights tab to open the specific section
      navigateToMerchantInsolvency(merchantToUse as string, { initialSection: normalizedSection, initialTab: 'external-insights' });
    } catch (error) {
      console.error('Failed to navigate to external insights for item:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || getNotificationType(notification.redirect_section) === filterType;
    const matchesRead = showRead || !notification.is_seen;
    
    return matchesSearch && matchesFilter && matchesRead;
  });

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId ? { ...notification, is_seen: true } : notification
      ));
      // refresh the shared unread count (sidebar + header)
      refreshCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Use mark-as-seen endpoint for each unread notification to ensure server-side logic runs
      const unread = notifications.filter(n => !n.is_seen).map(n => n.id);
      await Promise.all(unread.map(id => notificationsService.markAsSeen(id)));
      setNotifications(prev => prev.map(notification => ({ ...notification, is_seen: true })));
      // Also call generic markAllAsRead endpoint to ensure server consistency (optional)
  try { await notificationsService.markAllAsRead(); } catch { /* ignore */ }
      refreshCount();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationsService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      refreshCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const toggleExpanded = (notificationId: string) => {
    setExpandedNotifications(prev => ({
      ...prev,
      [notificationId]: !prev[notificationId]
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    console.log('Component is in loading state');
    return (
      <div className="flex items-center justify-center h-64">
        <CustomLoader 
          loading={true}
          specs={{
            type: 'spinner',
            size: 'lg',
            color: 'blue',
            text: 'Loading notifications...'
          }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4 px-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications read'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <ActionButton
              text="Mark All Read"
              icon={CheckCircle}
              onClick={markAllAsRead}
              size="sm"
              variant="outline"
            />
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="space-y-4">
  <CustomCard className="border-none shadow-none bg-white">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-10 text-lg w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Custom All Types dropdown */}
              <div ref={typesRef} className="relative">
                <button
                  onClick={() => setTypesOpen(!typesOpen)}
                  className="w-40 flex justify-between items-center gap-4 px-3 py-2 rounded-md text-sm border border-blue-400 text-blue-600 bg-white"
                >
                  <span className="text-sm">{filterType === 'all' ? 'All Types' : filterType === 'data_refresh' ? 'Data Refresh' : filterType === 'external_insights' ? 'External Insights' : 'System'}</span>
                  <svg className={`h-3 w-3 transition-transform ${typesOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.12 1.006l-4.25 4.65a.75.75 0 01-1.08 0L5.23 8.28a.75.75 0 01-.02-1.07z"/></svg>
                </button>
                {typesOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <ul className="py-1">
                      <li className="px-4 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => { setFilterType('all'); setTypesOpen(false); }}>All Types</li>
                      <li className="px-4 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => { setFilterType('data_refresh'); setTypesOpen(false); }}>Data Refresh</li>
                      <li className="px-4 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => { setFilterType('external_insights'); setTypesOpen(false); }}>External Insights</li>
                      <li className="px-4 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => { setFilterType('system'); setTypesOpen(false); }}>System</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Hide Read pill */}
              <button
                onClick={() => setShowRead(!showRead)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${showRead ? 'border border-blue-400 text-blue-600 bg-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {showRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{showRead ? 'Hide Read' : 'Show Read'}</span>
              </button>
            </div>
          </div>
        </CustomCard>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <CustomCard className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </CustomCard>
          ) : (
            filteredNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.redirect_section);
              const colorClass = getNotificationColor(notification.redirect_section);
              const notificationType = getNotificationType(notification.redirect_section);
              const isExpanded = expandedNotifications[notification.id];
              const isExpandable = notification.redirect_section === 'external_insights';
              const isDataRefresh = notification.redirect_section === 'dashboard';
              
              // Data Refresh - Simple banner style
              if (isDataRefresh) {
                return (
                  <motion.div
                    key={notification.id}
                    variants={itemVariants}
                    className={`transition-all duration-200 ${notification.is_seen ? 'opacity-60' : ''}`}
                  >
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleTitleClick(notification)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTitleClick(notification); } }}
                        className="relative cursor-pointer transition-colors duration-200 bg-white shadow-md hover:shadow-lg rounded-lg overflow-hidden border border-green-200"
                      >
                        {/* left colored stripe (green) - clipped by parent's rounded corners */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                        <div className="pl-5 pr-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium text-gray-900">{notification.title}</div>
                              {!notification.is_seen && (
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                            </div>
                            <div className="text-xs text-gray-600">{getRelativeTime(notification.created_at)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 text-xs rounded-full font-medium bg-green-100 text-green-700 border border-green-200">
                            {formatNotificationTypeLabel(notificationType)}
                          </span>
                          {!notification.is_seen && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                              className="text-gray-500 hover:text-green-600 hover:bg-green-50 p-1 h-7 w-7"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }
              
              // External Insights - Card with grid layout
              return (
                <motion.div
                  key={notification.id}
                  variants={itemVariants}
                  className={`transition-all duration-200 ${notification.is_seen ? 'opacity-60' : ''}`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTitleClick(notification)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTitleClick(notification); } }}
                    className="relative cursor-pointer transition-colors duration-200 bg-white shadow-md hover:shadow-lg rounded-lg overflow-hidden border border-blue-200"
                  >
                    {/* left colored stripe (blue) - clipped by parent's rounded corners */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                    <div className="pl-5 pr-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Info className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-gray-900">{notification.title}</div>
                            {!notification.is_seen && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">{getRelativeTime(notification.created_at)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-xs rounded-full font-medium bg-blue-100 text-blue-700 border border-blue-200">
                          {formatNotificationTypeLabel(notificationType)}
                        </span>
                        {isExpandable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); toggleExpanded(notification.id); }}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50 text-xs px-2 py-1 h-7 flex items-center gap-1"
                          >
                            {isExpanded ? 'Show Less' : 'Show Details'}
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          </Button>
                        )}
                        {!notification.is_seen && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                            className="text-gray-500 hover:text-green-600 hover:bg-green-50 p-1 h-7 w-7"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Expandable insights in 2x2 grid */}
                    {isExpandable && isExpanded && (((notification.data as Record<string, unknown>)['items']) as InsightItem[] | undefined)?.length && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {
                          ((((notification.data as Record<string, unknown>)['items']) as InsightItem[]) || [])
                          .sort((a: InsightItem, b: InsightItem) => {
                            const severityOrder = {
                              'severe': 0,
                              'Severe': 0,
                              'high': 1,
                              'High': 1,
                              'medium': 2,
                              'Medium': 2,
                              'low': 3,
                              'Low': 3,
                              'neutral': 4,
                              'Neutral': 4,
                              'good': 5,
                              'Good': 5,
                              'veryGood': 6,
                              'VeryGood': 6
                            } as Record<string, number>;
                            return (severityOrder[a.severity as string] || 7) - (severityOrder[b.severity as string] || 7);
                          })
                          .map((item: InsightItem, index: number) => {
                            const InsightTypeIcon = getInsightTypeIcon(item.insight_type);
                            return (
                              <div
                                key={index}
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); handleInsightClick(notification, item); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleInsightClick(notification, item); } }}
                                className="bg-white rounded-lg p-3 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium text-sm text-gray-900 mb-0 flex-1 line-clamp-2">{item.title}</h5>
                                  <div className="flex items-center gap-2 ml-3">
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                      item.severity?.toLowerCase() === 'severe' ? 'bg-red-100 text-red-700' :
                                      item.severity?.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' :
                                      item.severity?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      item.severity?.toLowerCase() === 'low' ? 'bg-green-100 text-green-700' :
                                      item.severity?.toLowerCase() === 'neutral' ? 'bg-gray-100 text-gray-700' :
                                      item.severity?.toLowerCase() === 'good' || item.severity?.toLowerCase() === 'verygood' ? 'bg-green-100 text-green-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {item.severity}
                                    </span>
                                    <InsightTypeIcon className="h-4 w-4 flex-shrink-0" />
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 mb-3 line-clamp-3 leading-relaxed">{item.summary}</p>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium text-xs">
                                    {getInsightTypeLabel(item.insight_type)}
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    {item.external_date ? new Date(item.external_date).toLocaleDateString('en-GB') : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <motion.div 
            variants={itemVariants} 
            className="flex items-center justify-between px-2 py-4 border-t border-gray-200"
          >
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} notifications
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1 px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {Math.ceil(totalCount / limit)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / limit), prev + 1))}
                disabled={currentPage >= Math.ceil(totalCount / limit) || loading}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MerchantAlertsTab;
