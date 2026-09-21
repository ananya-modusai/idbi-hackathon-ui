"use client";
import React, { FC, useState } from "react";
import { Image as ImageIcon, ChevronDown, ChevronUp, ExternalLink, Globe, ScanSearch, AlertTriangle, Minus } from "lucide-react";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import { getIconByName } from "@/components/custom/CustomIconScheme";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { cn } from "@/lib/utils";

interface Match {
  url: string;
  source: string;
  title: string;
  brand_found: string;
  similarity_pct: number;
  status: string;
  reason: string;
  color?: string;
  price?: string | null;
  brand_visible?: boolean | string | null;
  product_type?: string;
  similarity_score?: number;
}

interface ScanResult {
  total_scanned: number;
  source_url?: string;
  source_name?: string;
  source_image?: string;
  source_type?: string;
  width: number;
  height: number;
  matches: Match[];
}

interface ReverseImageSearchSectionProps {
  data: ScanResult[];
  totalScanned?: number;
  redFlags: any[] | null;
}

const MatchCard: FC<{ match: Match; scan: ScanResult }> = ({ match, scan }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const [showIframe, setShowIframe] = useState(() => {
    const urlStr = match.url || "";
    let domain = "";
    try {
      domain = new URL(urlStr).hostname;
    } catch {}
    domain = domain.toLowerCase();
    const url = urlStr.toLowerCase();
    const blockerKeywords = [
      "amazon", "flipkart", "meesho", "jiomart", "pinekart", 
      "myntra", "snapdeal", "nykaa", "ebay", "walmart", 
      "target", "alibaba", "aliexpress", "indiamart",
      "google", "facebook", "instagram", "twitter", "linkedin"
    ];
    
    const isBlocked = 
      blockerKeywords.some(key => domain.includes(key) || url.includes(key)) ||
      url.includes("onlineshop") ||
      url.includes("marketplace") ||
      url.includes("/p/") || 
      url.includes("/product/") ||
      domain.endsWith("kart") ||
      domain.endsWith("mart") ||
      domain.endsWith("shop") ||
      domain.endsWith("store");
      
    return !isBlocked;
  });

  const matchStatus = match.status;
  const statusColor = matchStatus === "Product Copy Risk" ? "red" : "green";

  let domainUrl = "unknown";
  try {
    const urlObj = new URL(match.url);
    domainUrl = urlObj.hostname;
    if (domainUrl.startsWith('www.')) domainUrl = domainUrl.substring(4);
  } catch (e) {}

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-3 flex flex-col md:flex-row gap-4 min-w-0 overflow-hidden items-stretch">
        <div className="w-20 h-20 flex-shrink-0 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center relative">
          {!showIframe ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50/50 p-1.5">
              {!logoFailed ? (
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${domainUrl}&sz=64`}
                  alt={match.source}
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src.includes('google.com')) {
                      img.src = `https://logo.clearbit.com/${domainUrl}`;
                    } else {
                      setLogoFailed(true);
                    }
                  }}
                />
              ) : (
                <Globe className="w-10 h-10 text-blue-400 opacity-60" />
              )}
            </div>
          ) : (
            <div className="w-full h-full relative">
              <iframe 
                src={match.url} 
                className="w-full h-full border-none pointer-events-none scale-[0.4] origin-top-left w-[250%] h-[250%]"
                title={`Preview: ${match.title}`}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden justify-center gap-1.5">
          <div className="flex items-center justify-between w-full gap-4 min-w-0">
            <h3 className="text-[14px] font-bold text-blue-800 leading-tight truncate flex-1" title={match.title}>
              {match.title || "-"}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <BubbleTag text={domainUrl} color="purple" fixedWidth="w-fit" />

            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-gray-400 font-semibold uppercase flex-shrink-0">URL:</span>
            <a 
              href={match.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[11px] text-blue-500 hover:underline flex items-center gap-1.5 min-w-0 flex-1"
              title={match.url}
            >
              <span className="truncate">{match.url || "-"}</span>
              <ExternalLink size={11} className="shrink-0" />
            </a>
          </div>

          {(match.reason || (match as any).match_reason) && (
            <div className="text-[12px]">
              {match.reason || (match as any).match_reason}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-1 hidden-scrollbar">
            {match.product_type && (
              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                Type: {match.product_type}
              </span>
            )}
            {match.color && (
              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                Colors: {match.color}
              </span>
            )}
            {match.price !== undefined && match.price !== null && (
              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                Price: {String(match.price)}
              </span>
            )}
            {match.brand_visible !== undefined && match.brand_visible !== null && (
              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                Brand: {String(match.brand_visible)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReverseImageSearchSection: FC<ReverseImageSearchSectionProps> = ({
  data,
  totalScanned = 0,
  redFlags,
}) => {
  const Icon = ScanSearch;
  
  const reverseImageDataArr = (Array.isArray(data) ? [...data] : []) 
    .filter((scan: any) => !scan.error)
    .map(scan => {
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
      const isTypeExcluded = excludedKeywords.some(keyword => pType.includes(keyword));
      return isSimilarityOk && !isTypeExcluded;
    });

    return {
      ...scan,
      matches: processedMatches
    };
  });
  const [showAll, setShowAll] = useState(false);
  
  reverseImageDataArr.sort((a, b) => {
    const matchesA = (a.matches || []).length;
    const matchesB = (b.matches || []).length;
    
    if (matchesB !== matchesA) {
      return matchesB - matchesA;
    }
    
    const riskA = (a.matches || []).filter(m => m.status === "Product Copy Risk").length;
    const riskB = (b.matches || []).filter(m => m.status === "Product Copy Risk").length;
    return riskB - riskA;
  });

  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  const toggleExpand = (idx: number) => {
    const next = new Set(expandedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setExpandedIndices(next);
  };



  const renderScanCard = (scan: ScanResult, sIdx: number) => {
    const isExpanded = expandedIndices.has(sIdx);
    const riskCount = (scan.matches || []).filter(m => m.status === "Product Copy Risk").length;
    


    return (
      <div key={sIdx} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-300">
        <div 
          className="p-2.5 px-4 flex flex-col md:flex-row gap-5 cursor-pointer hover:bg-gray-50/50 transition-colors duration-300" 
          onClick={() => toggleExpand(sIdx)}
        >
          <div className="w-full md:w-20 md:h-20 flex-shrink-0 border border-gray-100 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-1.5 shadow-inner self-center">
            <img 
              src={scan.source_url || scan.source_image} 
              alt="Source" 
              className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-500 hover:scale-105" 
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image'; }} 
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <a 
                href={scan.source_url || scan.source_image} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1.5 min-w-0 flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="truncate" title={scan.source_url || scan.source_image}>{scan.source_url || scan.source_image}</span>
                <ExternalLink size={12} className="shrink-0" />
              </a>
            </div>
            <div className="flex flex-wrap gap-2">

              {scan.source_type && (
                <BubbleTag 
                  text={scan.source_type.charAt(0).toUpperCase() + scan.source_type.slice(1)} 
                  color="indigo" 
                />
              )}
              <BubbleTag text={`Matches: ${(scan.matches || []).length}`} color="purple" />
            </div>
          </div>
          <div className="flex items-center justify-center px-1">
            {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/30">
            <div className="pt-4 space-y-4 max-h-[450px] overflow-y-auto pr-2">
              {(scan.matches || []).length > 0 ? (
                scan.matches.map((match: Match, mIdx: number) => (
                  <MatchCard key={mIdx} match={match} scan={scan} />
                ))
              ) : (
                <div className="text-center py-6 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                  No matches found for this image
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const websiteWorking = (() => {
    if (!redFlags || !Array.isArray(redFlags)) return null;
    const rf006 = redFlags.find(f => String(f?.code || "").toUpperCase() === "RF006");
    if (!rf006) return null;
    
    const statusVal = rf006.overallTriggered ?? rf006.overall_triggered;
    const isTriggered = statusVal === true || 
                        String(statusVal).toLowerCase() === "true" || 
                        statusVal === 1 ||
                        String(statusVal).toLowerCase() === "yes";
    return !isTriggered;
  })();

  const productRiskDetected = (() => {
    if (!redFlags || !Array.isArray(redFlags)) return null;
    const rf009 = redFlags.find(f => String(f?.code || "").toUpperCase() === "RF009");
    if (!rf009) return null;
    
    // Check both camelCase and snake_case field names
    const status = rf009.overallTriggered ?? rf009.overall_triggered;
    
    if (status === true || String(status).toLowerCase() === "true" || status === 1 || String(status).toLowerCase() === "yes") {
      return true;
    }
    if (status === false || String(status).toLowerCase() === "false" || status === 0 || String(status).toLowerCase() === "no") {
      return false;
    }
    
    return null;
  })();

  const RightElements = (
    <div className="flex items-center gap-3">
      
      {websiteWorking === null ? (
        <BubbleTag text="N/A" color="gray" size="md" />
      ) : (() => {
        const Icon = getIconByName(websiteWorking ? "Check" : "X");
        return (
          <BubbleTag
            text={websiteWorking ? "Website Working" : "Website Not Working"}
            color={websiteWorking ? "emerald" : "red"}
            hasInsideIcon={true}
            size="md"
            icon={Icon ? <Icon className="h-3.5 w-3.5" /> : undefined}
          />
        );
      })()}
      {totalScanned > 0 && <BubbleTag text={`Total Scanned Products: ${totalScanned}`} color="yellow" size="md"/>}
      {productRiskDetected && (
        <BubbleTag
          text="Potential Risk Identified"
          color="red"
          hasInsideIcon={true}
          icon={(
            <div className={cn(
              "flex items-center justify-center h-4 w-4 rounded-full text-white shadow-sm bg-red-600"
            )}>
              <AlertTriangle className="h-3 w-3" />
            </div>
          )}
          noBackground={true}
        />
      )}
    </div>
  );

  const displayedData = showAll ? reverseImageDataArr : reverseImageDataArr.slice(0, 10);
  const hasMore = reverseImageDataArr.length > 10;

  return (
    <div className="mt-6">
      <SectionHeaderWithFlags
        positiveFlags={[]}
        negativeFlags={[]}
        neutralFlags={[]}
        title="Reverse Product Image Search"
        icon={Icon || undefined}
        iconColorClass="text-blue-600"
        titleRightElement={RightElements}
        allowCollapse={false}
      />
      {/* Mobile Layout: Simple vertical list to preserve order 1, 2, 3, 4 */}
      <div className="mt-4 flex flex-col gap-4 lg:hidden">
        {displayedData.map((scan: ScanResult, sIdx: number) => renderScanCard(scan, sIdx))}
      </div>

      {/* Desktop Layout: Split into two columns (Even = Left, Odd = Right) to maintain independent flow and 1st-2nd, 3rd-4th order */}
      <div className="mt-4 hidden lg:grid lg:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-4">
          {displayedData.map((scan: ScanResult, sIdx: number) => sIdx % 2 === 0 ? renderScanCard(scan, sIdx) : null)}
        </div>
        <div className="flex flex-col gap-4">
          {displayedData.map((scan: ScanResult, sIdx: number) => sIdx % 2 !== 0 ? renderScanCard(scan, sIdx) : null)}
        </div>
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
          >
            {showAll ? (
              <>
                <ChevronUp size={16} />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Show More ({reverseImageDataArr.length - 10} more)
              </>
            )}
          </button>
        </div>
      )}
      
      
      {reverseImageDataArr.length === 0 && (
        <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-gray-50/20">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <ImageIcon size={32} className="text-blue-500" />
          </div>
          <p className="text-sm text-gray-400 mt-1">No image results to show. Service-based industries are excluded from reverse image search</p>
        </div>
      )}
    </div>
  );
};

export default ReverseImageSearchSection;
