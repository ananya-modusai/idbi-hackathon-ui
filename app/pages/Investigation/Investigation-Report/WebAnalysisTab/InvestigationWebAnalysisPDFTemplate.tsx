'use client';

import React from 'react';
import { 
  Globe, 
  Shield, 
  Lock, 
  Server, 
  Link as LinkIcon, 
  ShieldAlert, 
  User, 
  Activity, 
  ShoppingCart,
  Check,
  X,
  Minus,
  AlertTriangle,
  Info,
  MapPin,
  Clock,
  Calendar,
  Building,
  EyeOff,
  Layers,
  CircleDot,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  CreditCard,
  TrendingUp,
  Smartphone,
  Monitor,
  ArrowUp
} from 'lucide-react';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { renderClickableValue, formatDisplayValue } from '../utils/pdfLinkUtils';

interface WebAnalysisPDFProps {
  merchantName: string;
  runDate: string;
  website: string;
  websiteMccData?: any;
  
  // 1. Website Analysis
  websiteAnalysis: {
    summary: string;
    frequentWords: string[];
  };
  
  // 2. Website Integrity
  websiteIntegrity: {
    isWorking: boolean | null;
    checklist: Array<{ name: string; status: string; noData?: boolean }>;
    metrics: Array<{ label: string; value: any; icon?: string }>;
    isSubdomain: string;
    copyrightLine: string;
    fatfStatus: string;
  };
  
  // 3. SSL
  sslDetails: {
    enabled: boolean;
    valid: boolean;
    metrics: Array<{ label: string; value: any; icon?: string }>;
  };
  
  // 4. DNS
  dnsInfrastructure: {
    dnssecEnabled: boolean;
    metrics: Array<{ label: string; value: any; icon?: string }>;
  };
  
  // 5. URL & Page Behavior
  urlPageBehavior: {
    metrics: Array<{ label: string; value: any; icon?: string }>;
    consistencyTable: Array<{ field: string; value: string; matches?: boolean }>;
    behaviorFlags: Array<{ field: string; value: string }>;
  };
  
  // 6. Malware
  malwareDetection: {
    isBlacklisted: boolean;
    tableData: Array<{ field: string; value: string; engines?: string[] }>;
  };
  
  // 7. Contact
  contactData: Array<{ field: string; value: string }>;
  
  // 8. Navigation
  navigationFlow: Array<{ field: string; value: string }>;
  
  // 9. Product
  productAnalysis: {
    products: Array<any>;
  };

  // 10. Website Snapshots
  websiteSnapshots: any[];

  // 11. Reverse Product Image Search
  reverseImageSearchData?: any;
  scamDetectedOverall?: boolean;

  // 12. Traffic & Engagement
  trafficData?: any;
}

const InvestigationWebAnalysisPDFTemplate: React.FC<WebAnalysisPDFProps> = ({
  merchantName,
  runDate,
  website,
  websiteMccData = null,
  websiteAnalysis,
  websiteIntegrity,
  sslDetails,
  dnsInfrastructure,
  urlPageBehavior,
  malwareDetection,
  contactData,
  navigationFlow,
  productAnalysis,
  websiteSnapshots,
  reverseImageSearchData = null,
  scamDetectedOverall = false,
  trafficData = null
}) => {
  const SectionHeader = ({ title, icon: Icon, colorClass = "text-blue-600", tags, isFirst = false }: { title: string, icon: any, colorClass?: string, tags?: React.ReactNode, isFirst?: boolean }) => (
    <div className={`flex items-center justify-start gap-3 mb-2 border-b-2 border-blue-600 pb-1.5 ${isFirst ? 'mt-0' : 'mt-5'}`} style={{ breakInside: 'avoid' }}>
      <div className="flex items-center gap-3">
        <Icon className={`${colorClass} w-6 h-6`} />
        <h2 className="text-xl font-bold text-blue-800 whitespace-nowrap">{title}</h2>
      </div>
      {tags && <div className="flex gap-2 ml-4 mb-0.5">{tags}</div>}
    </div>
  );

  const HeaderTag = ({ text, isValid, icon: TagIcon }: { text: string, isValid: boolean, icon: any }) => (
    <div className={`px-4 py-1 rounded-lg text-sm font-black flex items-center gap-2 ${isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
      <TagIcon className="w-4 h-4" />
      {text}
    </div>
  );

  const KeyMetricsGrid = ({ metrics }: { metrics: Array<{ label: string; value: any; icon?: string }> }) => (
    <div className="grid grid-cols-4 gap-4 mb-6" style={{ breakInside: 'avoid' }}>
      {metrics.map((m, i) => {
        const mLabel = m.label.toLowerCase();
        let IconComp = Activity;
        let iconColor = "text-gray-400";
        
        if (mLabel.includes("language")) { IconComp = Globe; iconColor = "text-teal-500"; }
        else if (mLabel.includes("response") || mLabel.includes("age")) { IconComp = Clock; iconColor = "text-orange-500"; }
        else if (mLabel.includes("ip address") || mLabel.includes("a records")) { IconComp = Server; iconColor = "text-blue-500"; }
        else if (mLabel.includes("country")) { IconComp = MapPin; iconColor = "text-emerald-500"; }
        else if (mLabel.includes("created") || mLabel.includes("date") || mLabel.includes("valid")) { IconComp = Calendar; iconColor = "text-blue-400"; }
        else if (mLabel.includes("registrar") || mLabel.includes("issuer")) { IconComp = Building; iconColor = "text-red-500"; }
        else if (mLabel.includes("privacy")) { IconComp = EyeOff; iconColor = "text-slate-400"; }
        else if (mLabel.includes("certificates") || mLabel.includes("ssl") || mLabel.includes("tls")) { IconComp = Shield; iconColor = "text-indigo-500"; }
        else if (mLabel.includes("dns") || mLabel.includes("nameserver") || mLabel.includes("ns records")) { IconComp = Server; iconColor = "text-blue-400"; }
        else if (mLabel.includes("mx records")) { IconComp = Shield; iconColor = "text-orange-400"; }
        else if (mLabel.includes("txt") || mLabel.includes("spf") || mLabel.includes("dmarc")) { IconComp = ShieldAlert; iconColor = "text-amber-500"; }
        else if (mLabel.includes("url") || mLabel.includes("redirect destination")) { IconComp = LinkIcon; iconColor = "text-blue-600"; }
        else if (mLabel.includes("redirects")) { IconComp = Activity; iconColor = "text-purple-500"; }

        return (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 overflow-hidden min-h-[72px]">
            <div className={`p-2 rounded-lg bg-gray-50 border border-gray-100 ${iconColor} shrink-0`}>
              <IconComp className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 truncate">{m.label}</span>
              <span className="text-sm font-bold text-gray-800 block truncate">
                {formatDisplayValue(m.value)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const DataTable = ({ columns, data }: { columns: string[], data: any[] }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-6" style={{ breakInside: 'avoid' }}>
      <table className="w-full text-xs">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="px-4 py-2 text-left font-bold text-gray-600 border-b">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {Object.values(row).map((val: any, j) => (
                <td key={j} className="px-4 py-2 border-b text-gray-700">
                  {formatDisplayValue(val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="pt-0 px-10 pb-8 bg-white font-sans text-gray-900" style={{ width: '1122px', margin: '0 auto' }}>
      
      {/* 1. Website Analysis */}
      <div style={{ breakInside: 'avoid' }} className="mb-2">
        <SectionHeader title="Website Analysis" icon={Globe} isFirst={true} />
        
        {/* Checklist section */}
        <div className="mb-2.5 bg-gray-50/50 p-3 pb-3 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Website Quality Checklist</h3>
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
          
          <div className="grid grid-cols-4 gap-2">
            {websiteIntegrity.checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-3 py-1 border border-gray-100 rounded-lg bg-white shadow-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 ${item.noData ? 'bg-gray-400' : item.status === 'yes' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                  {item.noData ? <Info className="w-3 h-3 text-white" /> : item.status === 'yes' ? <AlertTriangle className="w-3 h-3 text-white" /> : <Minus className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs font-bold text-gray-700 leading-tight">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {websiteAnalysis.frequentWords.length > 0 && (
          <div className="bg-white p-3 rounded-xl border border-gray-200 mb-2.5">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Frequent Words</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {websiteAnalysis.frequentWords.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* MCC Classification */}
      {websiteMccData && (
        <div style={{ breakInside: 'avoid' }} className="mb-4">
          <div className="flex items-center justify-between mb-2.5 border-b-2 border-blue-600 pb-1.5 mt-2.5">
            <div className="flex items-center gap-3">
              <CreditCard className="text-blue-600 w-6 h-6" />
              <h2 className="text-xl font-bold text-blue-800 whitespace-nowrap">MCC Classification</h2>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-200 bg-purple-50 text-[10px] font-bold text-purple-600 tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              AI LABELLED
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 pb-4 shadow-sm flex flex-col gap-3.5">
            {/* Top Split Portion (First 2 Rows) */}
            <div className="flex flex-row items-stretch gap-4">
              {/* Left Column */}
              <div className="w-1/4 flex flex-col justify-between shrink-0">
                <div>
                  <div className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    {websiteMccData.mcc_code || "-"}
                  </div>
                  <div className="text-sm font-semibold text-gray-500 mt-1">
                    {websiteMccData.mcc_description || "N/A"}
                  </div>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="w-px bg-gray-100 self-stretch my-1" />

              {/* Right Column (Top 2 Rows) */}
              <div className="flex-1 flex flex-col justify-between gap-3">
                {/* Top Row: LOB, Business Category, and Sub Category */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                      LOB
                    </div>
                    <div className="text-sm font-semibold text-gray-800 mt-0.5">
                      {websiteMccData.lob || websiteMccData.industry_group || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                      Business Category
                    </div>
                    <div className="text-sm font-semibold text-gray-800 mt-0.5">
                      {websiteMccData.business_category || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                      Sub Category
                    </div>
                    <div className="text-sm font-semibold text-gray-800 mt-0.5">
                      {websiteMccData.sub_category || "-"}
                    </div>
                  </div>
                </div>

                {/* Middle Row: Confidence Score */}
                {websiteMccData.confidence_score !== undefined && (() => {
                  const isHighConfidence = (websiteMccData.confidence_score || 0) >= 0.75;
                  return (
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                        Confidence Score
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="relative flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isHighConfidence ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full`} 
                            style={{ width: `${Math.min(Math.max((websiteMccData.confidence_score || 0) * 100, 0), 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${isHighConfidence ? 'text-emerald-600' : 'text-amber-600'} shrink-0`}>
                          {websiteMccData.confidence_score?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Bottom Full-Width Portion (Reasoning) */}
            {websiteMccData.reasoning && (
              <div className="border-t border-gray-100 pt-3">
                {/* Reasoning starts from first */}
                <div>
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                    Reasoning
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">
                    {websiteMccData.reasoning}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Traffic & Engagement Section */}
      {(() => {
        const data = trafficData || {
          metrics: {
            totalVisits: { label: "Total Visits", value: "635.76M", trend: { value: "8.6% vs last month", isPositive: true } },
            uniqueVisits: { label: "Unique Visits", value: "333.79M", trend: { value: "5.1% vs last month", isPositive: true } },
            pagesPerVisit: { label: "Pages / Visit", value: "3.23" },
            avgVisitDuration: { label: "Avg Visit Duration", value: "07:49" },
            bounceRate: { label: "Bounce Rate", value: "58.92%" }
          },
          monthlyVisits: [
            { month: "Nov 25", visits: 450000 },
            { month: "Dec 25", visits: 580000 },
            { month: "Jan 26", visits: 300000 },
            { month: "Feb 26", visits: 500000 },
            { month: "Mar 26", visits: 680000 },
            { month: "Apr 26", visits: 550000 }
          ],
          deviceDistribution: {
            mobileWeb: { label: "Mobile Web", percentage: "73.47%" },
            desktop: { label: "Desktop", percentage: "26.53%" }
          },
          countryTraffic: [
            { country: "United States", flag: "🇺🇸", share: "32.9%" },
            { country: "United Kingdom", flag: "🇬🇧", share: "6.9%" },
            { country: "India", flag: "🇮🇳", share: "5.9%" },
            { country: "Japan", flag: "🇯🇵", share: "4.9%" },
            { country: "Germany", flag: "🇩🇪", share: "3.5%" }
          ],
          referringSources: [
            { url: "google.com", visits: 245680 },
            { url: "facebook.com", visits: 128540 },
            { url: "instagram.com", visits: 95320 },
            { url: "twitter.com", visits: 72145 },
            { url: "linkedin.com", visits: 38920 },
            { url: "reddit.com", visits: 28450 }
          ],
          outgoingLinks: [
            { url: "shop.thebarelab.com", clicks: 189450 },
            { url: "blog.thebarelab.com", clicks: 134280 },
            { url: "support.thebarelab.com", clicks: 98760 },
            { url: "contact.thebarelab.com", clicks: 76540 },
            { url: "pricing.thebarelab.com", clicks: 52300 },
            { url: "newsletter.thebarelab.com", clicks: 31850 }
          ]
        };

        return (
          <div style={{ breakInside: 'avoid' }} className="mb-10">
            <SectionHeader title="Traffic & Engagement" icon={TrendingUp} />
            
            <div className="flex flex-col gap-6 mt-6">
              {/* Row 1: Volume & Engagement Quality Metrics (5 cols grid) */}
              <div className="grid grid-cols-5 gap-4" style={{ breakInside: 'avoid' }}>
                {/* Total Visits */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 overflow-hidden min-h-[72px]">
                  <div className="p-2 rounded-lg bg-purple-50 border border-purple-100 text-purple-500 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 truncate">{data.metrics.totalVisits.label}</span>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-gray-800 truncate">{data.metrics.totalVisits.value}</span>
                      {data.metrics.totalVisits.trend && (
                        <span className="text-[10px] font-bold text-emerald-600 whitespace-nowrap">
                          ↑ {data.metrics.totalVisits.trend.value.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unique Visits */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 overflow-hidden min-h-[72px]">
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-500 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 truncate">{data.metrics.uniqueVisits.label}</span>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-gray-800 truncate">{data.metrics.uniqueVisits.value}</span>
                      {data.metrics.uniqueVisits.trend && (
                        <span className="text-[10px] font-bold text-emerald-600 whitespace-nowrap">
                          ↑ {data.metrics.uniqueVisits.trend.value.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pages Per Visit */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 overflow-hidden min-h-[72px]">
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-500 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 truncate">{data.metrics.pagesPerVisit.label}</span>
                    <span className="text-sm font-bold text-gray-800 block truncate">{data.metrics.pagesPerVisit.value}</span>
                  </div>
                </div>

                {/* Avg Visit Duration */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 overflow-hidden min-h-[72px]">
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-500 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 truncate">{data.metrics.avgVisitDuration.label}</span>
                    <span className="text-sm font-bold text-gray-800 block truncate">{data.metrics.avgVisitDuration.value}</span>
                  </div>
                </div>

                {/* Bounce Rate */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 overflow-hidden min-h-[72px]">
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 truncate">{data.metrics.bounceRate.label}</span>
                    <span className="text-sm font-bold text-gray-800 block truncate">{data.metrics.bounceRate.value}</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Device Distribution Metrics (occupying second row with aligned card widths) */}
              <div className="grid grid-cols-5 gap-4" style={{ breakInside: 'avoid' }}>
                {/* Mobile Web */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 overflow-hidden min-h-[72px]">
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-500 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 truncate">{data.deviceDistribution.mobileWeb.label}</span>
                    <span className="text-sm font-bold text-gray-800 block truncate">{data.deviceDistribution.mobileWeb.percentage}</span>
                  </div>
                </div>

                {/* Desktop */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 overflow-hidden min-h-[72px]">
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-500 shrink-0">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 truncate">{data.deviceDistribution.desktop.label}</span>
                    <span className="text-sm font-bold text-gray-800 block truncate">{data.deviceDistribution.desktop.percentage}</span>
                  </div>
                </div>

                {/* Empty columns to align Mobile & Desktop cards exactly with Row 1 sizing */}
                <div className="col-span-3" />
              </div>

              {/* Row 2: Graph & Country Traffic Row */}
              <div className="grid grid-cols-2 gap-6">
                {/* Monthly Visits Chart Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4" style={{ minHeight: '260px' }}>
                  <h3 className="text-xs font-bold text-gray-900 mb-0">Monthly Visits</h3>
                  <div className="w-full flex-1 flex items-center justify-center">
                    <svg viewBox="0 0 500 200" className="w-full h-[190px]">
                      <defs>
                        <linearGradient id="visitsGradientPDF" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="50" y1="10" x2="450" y2="10" stroke="#f3f4f6" strokeDasharray="3,3" />
                      <line x1="50" y1="50" x2="450" y2="50" stroke="#f3f4f6" strokeDasharray="3,3" />
                      <line x1="50" y1="90" x2="450" y2="90" stroke="#f3f4f6" strokeDasharray="3,3" />
                      <line x1="50" y1="130" x2="450" y2="130" stroke="#f3f4f6" strokeDasharray="3,3" />
                      <line x1="50" y1="170" x2="450" y2="170" stroke="#f3f4f6" strokeDasharray="3,3" />
                      
                      {/* Y Axis Labels */}
                      <text x="10" y="14" fill="#9ca3af" fontSize="9" fontFamily="sans-serif">1M</text>
                      <text x="10" y="54" fill="#9ca3af" fontSize="9" fontFamily="sans-serif">750K</text>
                      <text x="10" y="94" fill="#9ca3af" fontSize="9" fontFamily="sans-serif">500K</text>
                      <text x="10" y="134" fill="#9ca3af" fontSize="9" fontFamily="sans-serif">250K</text>
                      <text x="10" y="174" fill="#9ca3af" fontSize="9" fontFamily="sans-serif">0</text>
                      
                      {/* X Axis Labels */}
                      <text x="50" y="192" fill="#9ca3af" fontSize="9" fontFamily="sans-serif" textAnchor="middle">Nov 25</text>
                      <text x="130" y="192" fill="#9ca3af" fontSize="9" fontFamily="sans-serif" textAnchor="middle">Dec 25</text>
                      <text x="210" y="192" fill="#9ca3af" fontSize="9" fontFamily="sans-serif" textAnchor="middle">Jan 26</text>
                      <text x="290" y="192" fill="#9ca3af" fontSize="9" fontFamily="sans-serif" textAnchor="middle">Feb 26</text>
                      <text x="370" y="192" fill="#9ca3af" fontSize="9" fontFamily="sans-serif" textAnchor="middle">Mar 26</text>
                      <text x="450" y="192" fill="#9ca3af" fontSize="9" fontFamily="sans-serif" textAnchor="middle">Apr 26</text>
                      
                      {/* Filled Area */}
                      <path d="M 50 98 L 130 77.2 L 210 122 L 290 90 L 370 61.2 L 450 82 L 450 170 L 50 170 Z" fill="url(#visitsGradientPDF)" />
                      
                      {/* Stroke Path */}
                      <path d="M 50 98 L 130 77.2 L 210 122 L 290 90 L 370 61.2 L 450 82" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      
                      {/* Markers */}
                      <circle cx="50" cy="98" r="3.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx="130" cy="77.2" r="3.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx="210" cy="122" r="3.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx="290" cy="90" r="3.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx="370" cy="61.2" r="3.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx="450" cy="82" r="3.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>

                {/* Country Traffic Share Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between" style={{ minHeight: '260px' }}>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 mb-4">Traffic by Country</h3>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-[9px] font-bold text-gray-400 tracking-wider uppercase pb-2">COUNTRY</th>
                          <th className="text-[9px] font-bold text-gray-400 tracking-wider uppercase pb-2 text-right">SHARE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.countryTraffic.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-2.5 flex items-center gap-2.5">
                              <span className="text-xl leading-none select-none">{item.flag}</span>
                              <span className="text-xs font-semibold text-gray-700">{item.country}</span>
                            </td>
                            <td className="py-2.5 text-xs font-bold text-gray-900 text-right pr-1">
                              {item.share}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Row 3: Referral Sources & Outgoing Links */}
              <div className="grid grid-cols-2 gap-6" style={{ pageBreakBefore: 'always' }}>
                {/* Top Referring Sources */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between" style={{ minHeight: '260px' }}>
                  <div>
                    <div className="flex items-center gap-1.5 mb-4">
                      <LinkIcon className="h-3.5 w-3.5 text-gray-600 shrink-0" strokeWidth={2.5} />
                      <h3 className="text-xs font-bold text-gray-900">
                        Top Referring Sources <span className="text-[10px] font-normal text-slate-400 ml-1">(Incoming)</span>
                      </h3>
                    </div>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-[9px] font-bold text-gray-400 tracking-wider uppercase pb-2">SOURCE URL</th>
                          <th className="text-[9px] font-bold text-gray-400 tracking-wider uppercase pb-2 text-right">VISITS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.referringSources.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-2.5 flex items-center gap-2">
                              <LinkIcon className="h-3 w-3 text-gray-300 shrink-0" />
                              <span className="text-xs font-semibold text-gray-600 truncate max-w-[300px]">
                                {item.url}
                              </span>
                            </td>
                            <td className="py-2.5 text-xs font-bold text-indigo-600 text-right pr-1">
                              {item.visits.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Outgoing Links */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between" style={{ minHeight: '260px' }}>
                  <div>
                    <div className="flex items-center gap-1.5 mb-4">
                      <LinkIcon className="h-3.5 w-3.5 text-gray-600 shrink-0" strokeWidth={2.5} />
                      <h3 className="text-xs font-bold text-gray-900">
                        Top Outgoing Links <span className="text-[10px] font-normal text-slate-400 ml-1">(Destinations)</span>
                      </h3>
                    </div>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-[9px] font-bold text-gray-400 tracking-wider uppercase pb-2">DESTINATION URL</th>
                          <th className="text-[9px] font-bold text-gray-400 tracking-wider uppercase pb-2 text-right">CLICKS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.outgoingLinks.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-2.5 flex items-center gap-2">
                              <LinkIcon className="h-3 w-3 text-gray-300 shrink-0" />
                              <span className="text-xs font-semibold text-gray-600 truncate max-w-[300px]">
                                {item.url}
                              </span>
                            </td>
                            <td className="py-2.5 text-xs font-bold text-indigo-600 text-right pr-1">
                              {item.clicks.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. Website Snapshots */}
      {websiteSnapshots && websiteSnapshots.length > 0 && (
        <div style={{ breakInside: 'avoid' }} className="mb-10">
          <SectionHeader title="Website Snapshot" icon={Globe} />
          <div className="grid grid-cols-4 gap-4 mt-6">
            {websiteSnapshots.slice(0, 4).map((result: any, idx: number) => {
              const imageBase64 = result.bs4 || result.screenshot_b64;
              return (
                <div 
                  key={idx} 
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col"
                >
                  <div className="aspect-[4/3] w-full relative overflow-hidden bg-gray-50 shrink-0">
                    {imageBase64 ? (
                      <img 
                        src={imageBase64.startsWith("data:image") 
                          ? imageBase64 
                          : `data:image/png;base64,${imageBase64}`} 
                        alt={result.screenshot_name || `Snapshot ${idx + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                        <span className="text-[10px]">No screenshot available</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Product Analysis */}
      <div style={{ breakInside: 'avoid' }} className="mb-10">
        <SectionHeader title="Product Analysis" icon={ShoppingCart} />
        {productAnalysis.products.length > 0 ? (
          <DataTable 
            columns={['Field', 'Price', 'Customization Options', 'Availability', 'URL']} 
            data={productAnalysis.products.map(p => ({
              field: p.field,
              price: p.price,
              customization: p.customizationOptions,
              availability: p.availability,
              url: p.productUrl || "-"
            }))} 
          />
        ) : (
          <div className="p-10 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 font-bold italic">
            No product analysis data available.
          </div>
        )}
      </div>

      {/* 4. Reverse Product Image Search Section */}
      {reverseImageSearchData && (
        <div className="mb-10" style={{ breakInside: 'avoid' }}>
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="text-blue-600 w-5 h-5" />
              <h2 className="text-lg font-bold text-gray-800 tracking-tight">Reverse Product Image Search</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-[#ECFDF5] text-[#059669] rounded-md text-[10px] font-bold flex items-center gap-1.5 border border-[#A7F3D0]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#059669]"></div>
                Website Working
              </div>
              
              {reverseImageSearchData?.data?.reverse_image && (
                <div className="px-2 py-1 bg-[#FEFCE8] text-[#854D0E] rounded-md text-[10px] font-bold border border-[#FEF08A]">
                  Total Scanned Products: {reverseImageSearchData.data.reverse_image.sources_processed || reverseImageSearchData.data.reverse_image.total_scanned || 0}
                </div>
              )}

              {scamDetectedOverall && (
                <div className="px-2 py-1 bg-[#FEF2F2] text-[#DC2626] rounded-md text-[10px] font-bold flex items-center gap-1.5 border border-[#FECACA]">
                  <AlertTriangle size={12} />
                  Potential Risk Identified
                </div>
              )}
            </div>
          </div>
          
          {(() => {
            const rawResults = reverseImageSearchData?.data?.reverse_image?.results || [];
            
            const results = rawResults
              .filter((scan: any) => !scan.error)
              .map((scan: any) => {
                const processedMatches = (scan.matches || []).map((m: any) => {
                  const scoreRaw = m.similarity_score !== undefined 
                    ? m.similarity_score 
                    : (m.similarity_pct !== undefined ? m.similarity_pct / 100 : 0);
                  const isCopyRisk = scoreRaw > 0.85;
                  return {
                    ...m,
                    status: isCopyRisk ? "Product Copy Risk" : "No Risk Observed",
                    computed_score: scoreRaw
                  };
                }).filter((m: any) => {
                  const isSimilarityOk = m.computed_score >= 0.07;
                  const pType = (m.product_type || "").toLowerCase();
                  const excludedKeywords = ["icon", "illustration", "logo"];
                  const isTypeExcluded = excludedKeywords.some((keyword: string) => pType.includes(keyword));
                  return isSimilarityOk && !isTypeExcluded;
                });

                return {
                  ...scan,
                  matches: processedMatches,
                  riskCount: processedMatches.filter((m: any) => m.status === "Product Copy Risk").length
                };
              })
              .sort((a: any, b: any) => {
                const matchesA = (a.matches || []).length;
                const matchesB = (b.matches || []).length;
                if (matchesB !== matchesA) return matchesB - matchesA;
                return b.riskCount - a.riskCount;
              });
            
            if (results.length === 0) {
              return (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
                  <ImageIcon size={28} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-medium">No reverse image results to show.</p>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {results.map((scan: any, sIdx: number) => {
                  const matches = scan.matches || [];

                  return (
                    <div key={sIdx} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm" style={{ breakInside: 'avoid' }}>
                      <div className="p-3 px-4 flex gap-5 bg-white">
                        <div className="w-20 h-20 flex-shrink-0 border border-gray-100 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-1.5 shadow-inner">
                          <img 
                            src={scan.source_url || scan.source_image} 
                            className="max-w-full max-h-full object-contain mix-blend-multiply" 
                            alt="Source"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1.5 min-w-0 flex-1">
                              {renderClickableValue(scan.source_url || scan.source_image)}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <BubbleTag text={scan.source_type ? (scan.source_type.charAt(0).toUpperCase() + scan.source_type.slice(1)) : "Product"} color="indigo" />
                            <BubbleTag text={`Matches: ${matches.length}`} color="purple" />
                          </div>
                        </div>
                        <div className="flex items-center justify-center px-1">
                          <ChevronRight size={18} className="text-gray-300" />
                        </div>
                      </div>

                      {matches.length > 0 && (
                        <div className="px-4 pb-4 border-t border-gray-50 bg-gray-50/10">
                          <div className="pt-4 space-y-3">
                            {matches.map((match: any, mIdx: number) => {
                              let domainUrl = "unknown";
                              try {
                                const urlObj = new URL(match.url);
                                domainUrl = urlObj.hostname;
                                if (domainUrl.startsWith('www.')) domainUrl = domainUrl.substring(4);
                              } catch (e) {}

                              return (
                                <div key={mIdx} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden" style={{ breakInside: 'avoid' }}>
                                  <div className="p-3 flex gap-4 items-stretch">
                                    <div className="w-20 h-20 flex-shrink-0 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center p-1.5">
                                      <img 
                                        src={`https://www.google.com/s2/favicons?domain=${domainUrl}&sz=64`}
                                        className="w-12 h-12 object-contain grayscale opacity-60"
                                        alt={match.source || domainUrl}
                                      />
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                                      <div className="flex items-center justify-between w-full gap-4 min-w-0">
                                        <h3 className="text-[14px] font-bold text-blue-800 leading-tight truncate flex-1">
                                          {match.title || match.product_title || "Untitled Product"}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <BubbleTag text={domainUrl} color="purple" fixedWidth="w-fit" />
                                          {match.status === "Product Copy Risk" && (
                                            <BubbleTag text={match.status} color="red" fixedWidth="w-fit" />
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[11px] text-gray-400 font-semibold uppercase flex-shrink-0 tracking-tighter">URL:</span>
                                        <a 
                                          href={match.url} 
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[11px] text-blue-500 hover:underline flex items-center gap-1.5 min-w-0 flex-1"
                                        >
                                          <span className="truncate">{match.url}</span>
                                          <ExternalLink size={11} className="shrink-0" />
                                        </a>
                                      </div>

                                      {(match.reason || match.analysis) && (
                                        <div className="text-[12px] text-gray-600 italic bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                                          {match.reason || match.analysis}
                                        </div>
                                      )}

                                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                        {(match.brand_found || match.entity_name) && (
                                          <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                                            Brand: {match.brand_found || match.entity_name}
                                          </span>
                                        )}
                                        {match.product_type && (
                                          <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                                            Type: {match.product_type}
                                          </span>
                                        )}
                                        {match.price && (
                                          <span className="text-[11px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                                            Price: {match.price}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 5. Website Integrity */}
      <div style={{ breakInside: 'avoid' }} className="mb-10">
        <SectionHeader 
          title="Website Integrity" 
          icon={Shield} 
          tags={websiteIntegrity.isWorking !== null && (
            <HeaderTag 
              text={websiteIntegrity.isWorking ? 'Website Working' : 'Website Not Working'} 
              isValid={websiteIntegrity.isWorking} 
              icon={websiteIntegrity.isWorking ? Check : X} 
            />
          )}
        />

        <KeyMetricsGrid metrics={websiteIntegrity.metrics} />

        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-40 flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px]">
                <Layers className="w-4 h-4" /> Is Subdomain
              </div>
              <div className="text-sm font-bold text-gray-700">{websiteIntegrity.isSubdomain}</div>
            </div>
            <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
              <div className="w-40 flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px]">
                <CircleDot className="w-4 h-4" /> Copyright Line
              </div>
              <div className="text-sm font-bold text-gray-700">{websiteIntegrity.copyrightLine}</div>
            </div>
            <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
              <div className="w-40 flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px]">
                <Shield className="w-4 h-4" /> FATF Status
              </div>
              <div className="text-sm font-bold text-gray-700">{websiteIntegrity.fatfStatus}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. SSL Certificate Details */}
      <div style={{ breakInside: 'avoid' }} className="mb-10">
        <SectionHeader 
          title="SSL Certificate Details" 
          icon={Lock} 
          tags={(
            <>
              <HeaderTag text={sslDetails.enabled ? 'SSL Secure' : 'SSL Not Secure'} isValid={sslDetails.enabled} icon={sslDetails.enabled ? Check : X} />
              <HeaderTag text={sslDetails.valid ? 'Verified Certificate' : 'Unverified Certificate'} isValid={sslDetails.valid} icon={sslDetails.valid ? Check : X} />
            </>
          )}
        />
        <KeyMetricsGrid metrics={sslDetails.metrics} />
      </div>

      {/* 7. DNS Infrastructure */}
      <div style={{ breakInside: 'avoid' }} className="mb-10">
        <SectionHeader 
          title="DNS Infrastructure" 
          icon={Server} 
          tags={(
            <HeaderTag 
              text={dnsInfrastructure.dnssecEnabled ? 'DNSSEC Enabled' : 'DNSSEC Disabled'} 
              isValid={dnsInfrastructure.dnssecEnabled} 
              icon={dnsInfrastructure.dnssecEnabled ? Check : X} 
            />
          )}
        />
        <KeyMetricsGrid metrics={dnsInfrastructure.metrics} />
      </div>

      {/* 8. URL & Page Behavior */}
      <div style={{ breakInside: 'avoid' }} className="mb-10">
        <SectionHeader title="URL & Page Behavior" icon={LinkIcon} />
        <KeyMetricsGrid metrics={urlPageBehavior.metrics} />
        
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 mt-6">Page Behavior Flags</h3>
          <div className="grid grid-cols-2 gap-4">
            {urlPageBehavior.behaviorFlags.map((flag, i) => (
              <div key={i} className="bg-white p-3 border border-gray-200 rounded-lg flex justify-between items-center shadow-sm">
                <span className="text-sm text-gray-600 font-medium">{flag.field}</span>
                <span className={`text-sm font-black ${flag.value === 'Yes' ? 'text-red-600' : 'text-emerald-600'}`}>{flag.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 9. Malware & Threat Detection */}
      <div style={{ breakInside: 'avoid' }} className="mb-10">
        <SectionHeader 
          title="Malware & Threat Detection" 
          icon={ShieldAlert} 
          tags={(
            <HeaderTag 
              text={malwareDetection.isBlacklisted ? 'Malicious / Blacklisted Site' : 'Safe / Clean Site'} 
              isValid={!malwareDetection.isBlacklisted} 
              icon={malwareDetection.isBlacklisted ? X : Check} 
            />
          )}
        />

        <DataTable 
          columns={['Engine/Check', 'Result']} 
          data={malwareDetection.tableData.map(row => ({
            field: row.field,
            value: row.engines && row.engines.length > 0 ? `${row.value} (${row.engines.join(', ')})` : row.value
          }))} 
        />
      </div>

      {/* 10. Contact Data */}
      <div style={{ breakInside: 'avoid' }} className="mb-10">
        <SectionHeader title="Contact Data" icon={User} />
        <DataTable columns={['Field', 'Value']} data={contactData} />
      </div>

      {/* 11. Navigation Flow */}
      <div style={{ breakInside: 'avoid' }}>
        <SectionHeader title="Navigation Flow" icon={Activity} />
        <DataTable columns={['Navigation Link', 'Destination URL']} data={navigationFlow} />
      </div>

    </div>
  );
};

export default InvestigationWebAnalysisPDFTemplate;
