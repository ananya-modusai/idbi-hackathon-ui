'use client';

import React, { useMemo } from 'react';
import { 
  Activity,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  AlertTriangle,
  Minus,
  Shield,
  ChevronRight,
  ShieldAlert,
  Info,
  Check,
  X
} from 'lucide-react';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { extractSocialField } from '../../InvWorkspace/InvWebDataLogic';
import { renderClickableValue, formatDisplayValue } from '../utils/pdfLinkUtils';

interface VPAAnalysisPDFProps {
  merchantName: string;
  runDate: string;
  website: string;
  hasData?: boolean;

  // Social media and Scam Intelligence data relocated to this VPA tab
  socialMediaPlatforms?: any[];
  scamIntelligenceData?: any;
  monitoredDimensions?: any[];
  riskAnalysisData?: any;
  reviewsAnalysisData?: any;
  scamDetectedOverall?: boolean;
  redFlags?: any[] | null;
}

const InvestigationVPAAnalysisPDFTemplate: React.FC<VPAAnalysisPDFProps> = ({
  merchantName,
  runDate,
  website,
  hasData = false,
  socialMediaPlatforms = [],
  scamIntelligenceData,
  monitoredDimensions = [],
  riskAnalysisData,
  reviewsAnalysisData,
  scamDetectedOverall = false,
  redFlags = null
}) => {
  const SectionHeader = ({ title, icon: Icon, colorClass = "text-blue-600" }: { title: string, icon: any, colorClass?: string }) => (
    <div className="flex items-center justify-start gap-3 mb-4 border-b-2 border-blue-600 pb-2 mt-8" style={{ breakInside: 'avoid' }}>
      <div className="flex items-center gap-3">
        <Icon className={`${colorClass} w-6 h-6`} />
        <h2 className="text-xl font-bold text-blue-800 whitespace-nowrap">{title}</h2>
      </div>
    </div>
  );

  // Re-use the memoized social media platform list logic
  const socialPlatforms = useMemo(() => {
    const targets = [
      { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2', fields: ['Employees', 'Connection', 'Link'] },
      { name: 'Instagram', icon: Instagram, color: '#E4405F', fields: ['Followers', 'Posts', 'Link'] },
      { name: 'Facebook', icon: Facebook, color: '#1877F2', fields: ['Followers', 'Posts', 'Link'] },
      { name: 'YouTube', icon: Youtube, color: '#FF0000', fields: ['Subscribers', 'Posts', 'Link'] }
    ];
    
    return targets.map(target => {
      // Find matching platform from passed data (case-insensitive)
      const match = (socialMediaPlatforms || []).find((p: any) => 
        p.name.toLowerCase().includes(target.name.toLowerCase()) || 
        target.name.toLowerCase().includes(p.name.toLowerCase())
      );
      
      // Filter for matched accounts only, matching the UI logic in InvMerchantOverviewTab
      const accounts = Array.isArray(match?.data) ? match.data : (match ? [match] : []);
      const filteredAccounts = accounts.filter((a: any) => {
        const hasWebsiteSource = String(a.source || "").toLowerCase() === "website" || 
                               String(a.site_data?.source || "").toLowerCase() === "website";
        if (hasWebsiteSource) return true;
        return a.matched === true || a.matched === "true";
      });
      
      const item = filteredAccounts[0] || {};
      const isActive = filteredAccounts.length > 0;
      
      return { 
        ...match, 
        name: target.name,
        icon: target.icon, 
        iconColor: target.color,
        displayFields: target.fields,
        status: isActive ? 'Active' : 'Not Found',
        data: {
          'Employees': extractSocialField(item, target.name, ['number_of_employees', 'employeeCount', 'employee_count', 'employeesCount', 'employees']) ?? 'N/A',
          'Connection': extractSocialField(item, target.name, ['connections', 'followers', 'followerCount', 'connectionCount', 'biography', 'about_merchant']) ?? 'N/A',
          'Followers': extractSocialField(item, target.name, ['followers', 'followersCount', 'followerCount']) ?? 'N/A',
          'Posts': extractSocialField(item, target.name, ['number_of_posts', 'postsCount', 'postCount', 'posts', 'total_videos_or_reels', 'videosCount', 'videos']) ?? 'N/A',
          'Subscribers': extractSocialField(item, target.name, ['number_of_subscribers', 'subscribersCount', 'subscribers', 'subscriberCount', 'followers']) ?? 'N/A',
          'Link': item.url || 'N/A'
        }
      };
    });
  }, [socialMediaPlatforms]);

  return (
    <div className="p-10 bg-white font-sans text-gray-900" style={{ width: '1122px', margin: '0 auto' }}>
      
      {/* 1. Social Media Presence Section */}
      <div className="mb-10" style={{ breakInside: 'avoid' }}>
        <div className="flex items-center gap-2 mb-4 border-b-2 border-blue-600 pb-2">
          <Linkedin className="text-blue-600 w-6 h-6" />
          <h2 className="text-xl font-bold text-blue-800">Social Media Presence</h2>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          {socialPlatforms.map((target, idx) => {
            const data = target.data;
            const isActive = target.status === 'Active' || (!!target.data.Link && target.data.Link !== 'N/A');

            return (
              <div key={idx} className="border border-gray-100 rounded-xl p-4 shadow-sm bg-white flex flex-col justify-between h-full" style={{ breakInside: 'avoid' }}>
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                        <target.icon className="w-5 h-5" style={{ color: target.iconColor }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-800">{target.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider inline-block w-fit mt-0.5 ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {isActive ? 'Active' : 'Not Found'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {target.displayFields.map((field: string) => (
                      <div key={field} className="flex justify-between items-center gap-4">
                        <span className="text-[12px] text-gray-400 font-bold tracking-tight whitespace-nowrap">{field}</span>
                        <span className="text-[11px] font-bold text-gray-700 truncate text-right flex-1 min-w-0">
                          {field === 'Link' ? renderClickableValue(data[field]) : formatDisplayValue(data[field])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Scam Intelligence Section */}
      <div className="mb-10" style={{ breakInside: 'avoid' }}>
        <div className="flex items-center gap-2 mb-6 border-b-2 border-blue-600 pb-2">
          <Shield className="text-blue-600 w-6 h-6" />
          <h2 className="text-xl font-bold text-blue-800">Scam Intelligence</h2>
        </div>
        
        {/* Detection Banner (Conditional based on Scam intelligence data) */}
        {scamDetectedOverall && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-600 rounded-full text-white shadow-md">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-red-700">Scam Detected</span>
            </div>
            <ChevronRight className="w-6 h-6 text-red-400" />
          </div>
        )}

        {/* Monitored Dimensions Legend and Chips */}
        <div className="mb-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Monitored Dimensions</h3>
            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-tight">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                  <Minus className="w-3 h-3" />
                </div>
                <span className="text-emerald-700">No Risk Observed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white">
                  <AlertTriangle className="w-3 h-3" />
                </div>
                <span className="text-red-700">Potential Risk Identified</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {(monitoredDimensions || []).map((dim, idx) => (
              <div key={idx} className="flex items-center gap-3 px-3 py-2.5 border border-gray-100 rounded-xl bg-white shadow-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 ${dim.noData ? 'bg-gray-400' : dim.status === 'yes' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                  {dim.noData ? <Info className="w-3 h-3 text-white" /> : dim.status === 'yes' ? <AlertTriangle className="w-3 h-3 text-white" /> : <Minus className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs font-bold text-gray-700 leading-tight">{dim.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* External Insights - Start on new page */}
      <div style={{ pageBreakBefore: 'always' }} className="pt-10">
        <h3 className="text-md font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">External Insights</h3>
      </div>
      
      <div className="flex flex-col gap-6 mb-10">
        {/* Top: Review Insights */}
        <div className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white" style={{ breakInside: 'avoid' }}>
          {(() => {
            const items = reviewsAnalysisData?.individual_reviews || reviewsAnalysisData?.data?.individual_reviews || reviewsAnalysisData?.data?.reviews || reviewsAnalysisData?.reviews || [];
            if (!items || items.length === 0) {
              return (
                <div className="py-10 flex items-center justify-center opacity-50">
                  <span className="text-gray-400 font-bold italic">No Review Insights Available</span>
                </div>
              );
            }
            return (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Customer Reviews</h4>
                {items.map((it: any, idx: number) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50/30" style={{ breakInside: 'avoid' }}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-bold text-blue-600 flex-1 leading-tight">{it.review_title || it.title || 'Untitled Review'}</h4>
                      <BubbleTag text="Review" color="purple" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-lg p-3 text-xs text-gray-600 leading-relaxed italic shadow-sm">
                      {it.review_content || it.content || it.summary || it.review_summary || 'No review content provided.'}
                    </div>
                    {(it.url || it.link) && (
                      <div className="mt-2 text-[10px] text-blue-600 truncate opacity-70">
                        {it.url || it.link}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        
        {/* Bottom: News / Scam Reports Insights */}
        <div className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white" style={{ breakInside: 'avoid' }}>
          {(() => {
            const items = riskAnalysisData?.incidents || riskAnalysisData?.data?.incidents || [];
            if (!items || items.length === 0) {
              return (
                <div className="py-10 flex items-center justify-center opacity-50">
                  <span className="text-gray-400 font-bold italic">No News Insights Available</span>
                </div>
              );
            }
            return (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">News & Risk Reports</h4>
                {items.map((it: any, idx: number) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50/30" style={{ breakInside: 'avoid' }}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-bold text-blue-600 flex-1 leading-tight">{it.incident_title || it.title || 'Reported Scam Information'}</h4>
                      <BubbleTag text="News" color="blue" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-lg p-3 text-xs text-gray-600 leading-relaxed italic shadow-sm">
                      {it.summary || it.content || it.incident_description || 'Detailed scam analysis reports provided for this site.'}
                    </div>
                    {(it.url || it.link) && (
                      <div className="mt-2 text-[10px] text-blue-600 truncate opacity-70">
                        {it.url || it.link}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 3. VPA Analysis Section */}
      <div style={{ pageBreakBefore: 'always', breakInside: 'avoid' }} className="pt-10">
        <SectionHeader title="VPA Analysis" icon={Activity} />
        
        {!hasData ? (
          <div className="p-20 border-2 border-dashed border-gray-100 rounded-[32px] bg-white text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-6">
              <Activity className="w-8 h-8 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-3">No VPA Analysis Available</h3>
            <p className="text-sm text-slate-400 font-medium max-w-md leading-relaxed px-10">
              We couldn't find any VPA analysis data for this merchant case. This might be because the analysis is still in progress or no VPAs were identified.
            </p>
          </div>
        ) : (
          <div className="p-10 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 font-bold italic">
            VPA Analysis content would go here.
          </div>
        )}
      </div>

    </div>
  );
};

export default InvestigationVPAAnalysisPDFTemplate;
