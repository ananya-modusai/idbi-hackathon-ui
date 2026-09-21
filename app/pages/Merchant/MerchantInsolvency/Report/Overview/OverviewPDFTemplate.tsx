'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Building2, Activity, AlertTriangle, Factory, ExternalLink } from 'lucide-react';
import { MerchantItemType } from '@/app/types';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { KeyMetrics } from '@/components/custom/KeyMetrics';
import Metrics from '../components/Metrics';
// import ProbabilityOfDefault from '../Components/ProbabilityOfDefault';
import { RiskAssessmentSection } from '../../Components/RiskAssessmentSection';
import { useRiskMetricsStore } from '@/app/store/merchant/riskMetricsStore';
import { industryService, MerchantIndustry } from '@/app/services/industryServices';
import { API } from '@/app/services/axios';
import { getTagCategory } from '@/app/pages/Merchant/MerchantInsolvency/SampleData/syntheticTagsMapping';
import { watchlistService, WatchlistItem } from '@/app/services/watchlistServices';
import { useProfileStore } from '@/app/store/authentication/profileStore';
import { merchantService } from '@/app/services/merchantServices';
import './OverviewPDFTemplate.css';
import SectionHeader from '../components/SectionHeader';
import { SegmentedBar } from '@/app/pages/Merchant/MerchantInsolvency/Components/SegmentedBarComponent';
import { RiskBar } from '@/app/pages/Merchant/MerchantInsolvency/Components/RiskBarComponent';

interface CompanyMetric {
  label: string;
  value: string | number;
  icon: string;
}

interface CompanyData {
  company_name: string;
  about_the_company: string;
  source_urls: string[];
}

interface IndustryData {
  about_the_industry: string;
  is_industry_risky: string;
  justification: string;
}

interface OverviewPDFTemplateProps {
  activeMerchant: MerchantItemType;
  companyData: CompanyData | null;
  industryData: IndustryData | null;
  companyMetrics: CompanyMetric[];
  merchantId: string;
  merchantIndustry?: {
    industry: string;
    risk_segment: string;
  } | null;
  flagsList: any[];
  watchlistItem?: WatchlistItem | null;
  runDate?: string | null;
  versionNo?: number | null;
  date?: string | null;
  showIndustrialMaterials?: boolean;
}

const OverviewPDFTemplate: React.FC<OverviewPDFTemplateProps> = ({
  activeMerchant,
  companyData,
  industryData,
  companyMetrics,
  merchantId,
  merchantIndustry,
  flagsList,
  watchlistItem: watchlistItemProp,
  runDate,
  versionNo,
  date,
  showIndustrialMaterials: showIndustrialMaterialsProp = true
}) => {
  // Risk metrics store
  const { metrics, loading, error, fetchRiskMetrics } = useRiskMetricsStore();
  const { organizationId, fetchProfile } = useProfileStore();
  
  // State for industry data
  const [industryRisk, setIndustryRisk] = useState<MerchantIndustry | null>(null);
  const [industryRiskLoading, setIndustryRiskLoading] = useState(false);
  const [industryAdd, setIndustryAdd] = useState<number | null>(null);
  const [industryAddLoading, setIndustryAddLoading] = useState(false);
  const showIndustrialMaterials = showIndustrialMaterialsProp;
  const [watchlistItem, setWatchlistItem] = useState<WatchlistItem | null>(watchlistItemProp || null);
  // If watchlistItem is provided as prop, never show loading state
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  // Only fetch risk metrics when version or date parameters are provided
  // Never call API without parameters
  useEffect(() => {
    if (merchantId && ((versionNo !== null && versionNo !== undefined) || date)) {
      fetchRiskMetrics(merchantId, versionNo, date);
    }
  }, [merchantId, versionNo, date, fetchRiskMetrics]);

  // Fetch industry risk data
  const fetchIndustryRisk = useCallback(async () => {
    if (!merchantId) return;
    try {
      setIndustryRiskLoading(true);
      const result = await industryService.getMerchantIndustry(merchantId);
      setIndustryRisk(result);
    } catch (error) {
      console.error('Failed to fetch industry risk:', error);
      setIndustryRisk(null);
    } finally {
      setIndustryRiskLoading(false);
    }
  }, [merchantId]);

  // Fetch industry-specific ADD
  const fetchIndustryAdd = useCallback(async () => {
    if (!merchantId) return;
    try {
      setIndustryAddLoading(true);
      const addValue = await industryService.getIndustryAdd(merchantId);
      setIndustryAdd(addValue);
    } catch (error) {
      console.error('Failed to fetch industry ADD:', error);
      setIndustryAdd(null);
    } finally {
      setIndustryAddLoading(false);
    }
  }, [merchantId]);

  // Fetch watchlist data to get PD breakdown values (only if not provided as prop)
  const fetchWatchlistData = useCallback(async () => {
    // Never fetch if watchlistItem is provided as prop
    if (watchlistItemProp) {
      return;
    }
    if (!organizationId || !merchantId) return;
      try {
      setWatchlistLoading(true);
      const result = await watchlistService.getOrganizationWatchlist(organizationId);
      if (result.success && result.data) {
        const matchingItem = result.data.find(
          (item: WatchlistItem) => item.merchant_id === merchantId
        );
        setWatchlistItem(matchingItem || null);
      }
    } catch (error) {
      console.error('Failed to fetch watchlist data:', error);
      setWatchlistItem(null);
    } finally {
      setWatchlistLoading(false);
    }
  }, [organizationId, merchantId, watchlistItemProp]);

  // Fetch industry data when merchant changes
  useEffect(() => {
    if (merchantId) {
      fetchIndustryRisk();
      if (showIndustrialMaterials) {
        fetchIndustryAdd();
      }
    }
  }, [merchantId, showIndustrialMaterials, fetchIndustryRisk, fetchIndustryAdd]);

  // Update watchlistItem when prop changes - if prop is provided, use it and never fetch
  useEffect(() => {
    if (watchlistItemProp) {
      setWatchlistItem(watchlistItemProp);
      setWatchlistLoading(false);
    } else {
      // Only fetch if prop is not provided
      setWatchlistItem(null);
      // Fetch profile if not available
      if (!organizationId) {
        fetchProfile();
      }
      // Fetch watchlist data when organizationId or merchantId changes
      if (organizationId && merchantId) {
        fetchWatchlistData();
      }
    }
  }, [watchlistItemProp, organizationId, merchantId, fetchProfile, fetchWatchlistData]);

  // Helper function to extract domain from URL
  const extractDomain = (url: string) => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };

  // Helper function to get risk segment
  const getRiskSegment = (pdScore: number | null | undefined) => {
    if (pdScore === null || pdScore === undefined) return { label: 'Medium', colorClass: 'text-yellow-700', colorScheme: 'yellow' };
    
    if (pdScore < 2) return { label: 'Very Low', colorClass: 'text-green-700', colorScheme: 'green' };
    if (pdScore < 5) return { label: 'Low', colorClass: 'text-green-700', colorScheme: 'green' };
    if (pdScore < 10) return { label: 'Medium', colorClass: 'text-yellow-700', colorScheme: 'yellow' };
    if (pdScore < 15) return { label: 'High', colorClass: 'text-orange-700', colorScheme: 'orange' };
    return { label: 'Very High', colorClass: 'text-red-700', colorScheme: 'red' };
  };

  // Light background helper for PD block (use lighter versions of the color)
  const getPdBackgroundClass = (scheme: string) => {
    switch (scheme) {
      case 'green': return 'bg-green-50';
      case 'blue': return 'bg-blue-50';
      case 'yellow': return 'bg-yellow-50';
      case 'orange': return 'bg-orange-50';
      case 'red': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  // Helper function to get industry risk color
  const getIndustryRiskColorClass = (riskSegment: string | null | undefined): string => {
    if (!riskSegment) return 'text-gray-700';
    switch (riskSegment.toLowerCase()) {
      case 'very low': return 'text-risk-very-low';
      case 'low': return 'text-risk-low';
      case 'medium': return 'text-risk-medium';
      case 'high': return 'text-risk-high';
      case 'very high': return 'text-risk-very-high';
      default: return 'text-gray-700';
    }
  };

  // Helper function to get conglomerate risk color (same as industry risk)
  const getConglomerateRiskColorClass = (riskSegment: string | null | undefined): string => {
    return getIndustryRiskColorClass(riskSegment);
  };

  const hasParams = (versionNo !== undefined && versionNo !== null) || Boolean(date);

  // Calculate derived values
  const calculateDerivedValues = () => {
    if (!metrics || metrics.merchant_id !== merchantId) return null;

  // Always use values from the standard metrics fields (cpv_daily, tpv_daily, collateral)
  // Do not use mrm_ prefixed overrides for CPV/TPV/Collateral in the PDF template
  const metricsAny = metrics as any;
  const cpvDaily = (metricsAny.cpv_daily || 0);
  const tpvDaily = (metricsAny.tpv_daily || 0);
  const collateral = (metricsAny.collateral || 0);
    const lgdRate = metrics.lgd_rate || 0;
    const addDays = (showIndustrialMaterials && industryAdd !== null) ? industryAdd : (metrics.add_days || 0);
    
    // Resolve pdScore matching the UI logic
    const pdScore = ((): number => {
      const m = metrics as any;
      if (typeof m.final_pd === 'number') return m.final_pd;
      if (typeof m.pd_score === 'number') return m.pd_score;
      if (typeof m.pd === 'number') return m.pd;
      return 0;
    })();

    // Calculate derived metrics
    const grossNDX = cpvDaily * addDays;
    const netNDX = Math.max(0, grossNDX - collateral);
    const expectedLoss = (netNDX * lgdRate);
    const valueAtRisk = (netNDX * pdScore) / 100;
    const settlementDays = tpvDaily > 0 ? (valueAtRisk / tpvDaily) : 0;

    return {
      cpvDaily,
      tpvDaily,
      collateral,
      lgdRate,
      addDays,
      pdScore,
      grossNDX,
      netNDX,
      expectedLoss,
      valueAtRisk,
      settlementDays
    };
  };

  const derivedValues = calculateDerivedValues();

  // Logic for resolved PD value and display (matches the UI logic)
  const rawFinalPd = hasParams 
    ? (metrics as any)?.final_pd
    : ((metrics as any)?.final_pd ?? (metrics as any)?.pd_score);
  
  const finalPdIsNA = typeof rawFinalPd === 'string' && /^(NA|N\/A)$/i.test(rawFinalPd);
  const finalPdNumber = typeof rawFinalPd === 'number' ? rawFinalPd : undefined;

  const displayPD = (() => {
    if (rawFinalPd !== undefined && rawFinalPd !== null) {
      if (typeof rawFinalPd === 'string') {
        return finalPdIsNA ? "N/A" : rawFinalPd;
      }
      if (typeof rawFinalPd === 'number') {
        return `${rawFinalPd.toFixed(2)}%`;
      }
      return "N/A";
    }

    if (!hasParams && derivedValues?.pdScore !== undefined && typeof derivedValues.pdScore === 'number') {
      return `${derivedValues.pdScore.toFixed(2)}%`;
    }

    return "N/A";
  })();

  const effectivePdForSegment = hasParams ? finalPdNumber : derivedValues?.pdScore;
  const riskSegment = hasParams && finalPdIsNA
    ? { label: 'N/A', colorClass: 'text-gray-700', colorScheme: 'gray' }
    : getRiskSegment(effectivePdForSegment);

  // Use metrics from API with parameters only
  // Do NOT fallback to watchlist or derived values for these grid cells. If
  // value missing or API failed -> show "..." in the template.
  const fbFromMetrics = (metrics as any)?.financial_breakdown;
  const financialBasePd = typeof (metrics as any)?.financial_pd_score === 'number'
    ? (metrics as any).financial_pd_score
    : null;

  const normalizePct = (v: any): number | null => {
    if (v === undefined || v === null) return null;
    if (typeof v !== 'number') return null;
    return v <= 1 ? v * 100 : v;
  };

  const fb = fbFromMetrics || null;
  const liquidityPct = fb ? normalizePct(fb.liquidity) : null;
  const leveragePct = fb ? normalizePct(fb.leverage) : null;
  const growthPct = fb ? normalizePct(fb.growth) : null;
  const otherPct = fb ? normalizePct(fb.other) : null;

  const liquidityComp = liquidityPct === null ? null : (liquidityPct / 100) * financialBasePd;
  const leverageComp = leveragePct === null ? null : (leveragePct / 100) * financialBasePd;
  const growthComp = growthPct === null ? null : (growthPct / 100) * financialBasePd;
  const otherComp = otherPct === null ? null : (otherPct / 100) * financialBasePd;

  // Generate histogram data for 0-100% in 5% increments with a declining trend (same as UI)
  const histogramData = Array.from({ length: 7 }, (_, i) => {
    const start = i * 5;
    const end = start + 5;
    const count = Math.round(450 * Math.exp(-0.5 * i));
    return {
      bucket: i === 6 ? '30%+' : `${start}%`, // Show lower bound for all bars, last bucket shows 30%+
      count,
      pdRange: [start, end],
    };
  });

  // Determine if we need to split pages based on number of red flags under Company Overview
  const companyOverviewFlags = getRedFlagsForSection('insolvency_overview_company');
  const splitPages = companyOverviewFlags.length > 2;

  // Helper functions for red flags
  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return {
          color: 'red' as const,
          text: 'Severe'
        };
      case 'high':
        return {
          color: 'orange' as const,
          text: 'High'
        };
      case 'medium':
        return {
          color: 'yellow' as const,
          text: 'Medium'
        };
      default:
        return {
          color: 'gray' as const,
          text: 'Low'
        };
    }
  };

  const mapSeverity = (severity: string): 'severe' | 'high' | 'medium' | 'low' => {
    switch (severity?.toLowerCase()) {
      case 'severe':
        return 'severe';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  };

  // Filter red flags by section
  function getRedFlagsForSection(sectionType: string) {
    return flagsList.filter(flag => flag.rule_type === sectionType);
  }

  // Render red flags for a section
  const renderRedFlags = (sectionFlags: any[]) => {
    if (!sectionFlags || sectionFlags.length === 0) return null;

    return (
      <div className="pdf-red-flags-section">
        <div className="pdf-red-flags-content">
          <table className="pdf-red-flags-table">
            <tbody>
              {sectionFlags.map((flag) => {
                const mappedSeverity = mapSeverity(flag.severity);
                const config = getSeverityConfig(mappedSeverity);
                const categoryText = getTagCategory(flag.rule_type);
                
                return (
                  <tr key={flag.id} className="pdf-red-flag-row">
                    <td className="pdf-red-flag-severity">
                      <span className={`pdf-severity-text ${config.color}`}>
                        {config.text}
                      </span>
                    </td>
                    <td className="pdf-red-flag-description">
                      {flag.description}
                    </td>
                    <td className="pdf-red-flag-category">
                      <span className="pdf-category-text">
                        {categoryText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="pdf-template">
      {/* Header */}
      {/* <div className="pdf-header">
        <div className="pdf-header-content">
          <div className="pdf-title-section">
            <h1 className="pdf-main-title">{activeMerchant.legalName}</h1>
            <div className="pdf-subtitle-section">
              {merchantIndustry && (
                <span className={`pdf-industry-tag ${
                  merchantIndustry.risk_segment === 'Medium' ? 'medium-risk' : 
                  merchantIndustry.risk_segment === 'High' ? 'high-risk' : 
                  merchantIndustry.risk_segment === 'Low' ? 'low-risk' : 
                  'default-risk'
                }`}>
                  {merchantIndustry.industry}
                </span>
              )}
              <span className="pdf-cin">CIN {activeMerchant.cin || activeMerchant.id}</span>
            </div>
          </div>
          <div className="pdf-report-info">
            <h2 className="pdf-report-title">Insolvency Overview Report</h2>
            <p className="pdf-report-date">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div> */}

      {/* Company Overview and Company Metrics - try to keep together on one page */}
      <div
        className="pdf-watermarked-group"
        style={{
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
          WebkitColumnBreakInside: 'avoid',
          WebkitPageBreakInside: 'avoid'
        } as any}
      >
      {/* Company Overview Section */}
  <div className="pdf-section">
        <SectionHeader title="Company Overview" Icon={Building2} />
        {/* {renderRedFlags(companyOverviewFlags)} */}
        <div className="pdf-section-content">
          {companyData ? (
            <>
              <p className="pdf-text">{companyData.about_the_company}</p>
              {companyData.source_urls && companyData.source_urls.length > 0 && (
                <div className="pdf-sources">
                  <div className="pdf-sources-header">
                    {/* <ExternalLink className="pdf-sources-icon" /> */}
                    <span>Sources:</span>
                  </div>
                  <div className="pdf-sources-list">
                    {companyData.source_urls.map((url, index) => (
                      <span key={index} className="pdf-source-item">
                        <a href={url} className="pdf-source-link" target="_blank" rel="noopener noreferrer">
                          {extractDomain(url)}
                        </a>
                        {index < companyData.source_urls.length - 1 && (
                          <span className="pdf-source-separator"> • </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="pdf-loading">Loading company information...</p>
          )}

          {/* Company Metrics Subsection moved below to allow page break */}
        </div>
      </div>

  {/* Company Metrics Section (moved out to allow page break) */}
   <div className={`pdf-section`}>  {/*  ${splitPages ? 'pdf-page-break' : ''} */}
     <SectionHeader title="Company Metrics" />
        {/* {renderRedFlags(getRedFlagsForSection('insolvency_overview_transactionMetrics'))} */}
        <div className="pdf-section-content">
          {companyMetrics.length > 0 ? (
            <Metrics metrics={companyMetrics} layout="table" columns={4} truncateLength={20} />
          ) : (
            <p className="pdf-loading">Loading company metrics...</p>
          )}
        </div>
  </div>
  {/* close shared watermark wrapper */}
  </div>

  {/* Probability of Default and Stats Section - Complete section on single page */}
  <div 
    className="pdf-section pdf-watermarked pdf-page-break"
    style={{
      pageBreakInside: 'avoid',
      breakInside: 'avoid',
      WebkitColumnBreakInside: 'avoid',
      WebkitPageBreakInside: 'avoid'
    } as any}
  >
        <SectionHeader title="Probability of Default Analysis" Icon={AlertTriangle} />
        <div className="pdf-section-content" style={{ marginTop: '0', paddingTop: '0' }}>
          <div className="pdf-pod-wrapper">
            {loading ? (
              <div className="p-4 text-center">Loading risk metrics...</div>
            ) : error || !derivedValues ? (
              <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle size={18} />
                  <p>Error loading risk metrics data. Risk assessment may not be available for this merchant.</p>
                </div>
              </div>
            ) : (
              /* Probability of Default Analysis - Matching UI exactly */
              <div className="space-y-1" style={{ paddingTop: '0rem', paddingBottom: '0rem' }}>
                <div className={`space-y-1 ${getPdBackgroundClass(riskSegment.colorScheme)} rounded-lg p-2 shadow-sm border border-gray-100`} style={{ marginTop: '0', marginBottom: '0.1rem' }}>
                  {/* Main Content Grid - Two Column Layout */}
                  <div className="grid gap-6 items-stretch" style={{ display: 'grid', gridTemplateColumns: '60% 40%', paddingTop: '0.1rem', paddingBottom: '0.1rem' }}>
                    {/* Column 1: Probability of Default, Company Risk, PD Score Breakdown, Financial Score Breakdown */}
                    <div className="flex flex-col h-full space-y-1" style={{ paddingTop: '0.1rem', paddingBottom: '0.1rem' }}>
                      {/* Probability of Default and Company Risk Row */}
                      <div className="flex gap-8 pb-2" style={{ marginBottom: '0.25rem' }}>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-gray-600">Probability of Default (PD)</p>
                          <div className="flex items-end gap-2">
                            <span className={`text-3xl font-bold ${riskSegment.colorClass}`}>
                              {displayPD}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-gray-600">Company Risk</p>
                          <div className="flex items-end gap-2">
                          <span className={`text-3xl font-bold ${riskSegment.colorClass}`}>
                            {riskSegment.label} Risk
                          </span>
                          </div>
                        </div>
                      </div>

                      {/* PD Score Breakdown Box */}
                      <div className="pdf-pd-breakdown-container">
                        <div className="pdf-pd-breakdown-label">PD Score Breakdown</div>
                        <div className="pdf-pd-breakdown-box">
                          <div className="pdf-pd-breakdown-grid">
                            <div className="pdf-pd-breakdown-col">
                              <div className="pdf-pd-breakdown-metric-val">
                                {financialBasePd !== null ? `${financialBasePd.toFixed(2)}%` : 'N/A'}
                              </div>
                              <div className="pdf-pd-breakdown-metric-label">Financial PD</div>
                            </div>
                            <div className="pdf-pd-breakdown-col">
                              <div className="pdf-pd-breakdown-metric-val">
                                {(() => {
                                  const sentimentPD = typeof (metrics as any)?.sentiment_score === 'number'
                                    ? (metrics as any).sentiment_score
                                    : (watchlistItem?.sentiment_score !== undefined ? Number(watchlistItem.sentiment_score) : null);
                                  return sentimentPD !== null ? `${sentimentPD.toFixed(2)}%` : 'N/A';
                                })()}
                              </div>
                              <div className="pdf-pd-breakdown-metric-label">Sentiment PD</div>
                            </div>
                            <div className="pdf-pd-breakdown-col">
                              <div className={`pdf-pd-breakdown-metric-val ${getIndustryRiskColorClass(industryRisk?.risk_segment)}`}>
                                {industryRisk?.risk_segment ? `${industryRisk.risk_segment} Risk` : 'N/A'}
                              </div>
                              <div className="pdf-pd-breakdown-metric-label">Industry Risk</div>
                            </div>
                            <div className="pdf-pd-breakdown-col">
                              <div className={`pdf-pd-breakdown-metric-val ${getConglomerateRiskColorClass((metrics as any)?.conglomerate_risk)}`}>
                                {(metrics as any)?.conglomerate_risk && (metrics as any).conglomerate_risk !== "NA"
                                  ? `${(metrics as any).conglomerate_risk} Risk`
                                  : "N/A"}
                              </div>
                              <div className="pdf-pd-breakdown-metric-label">Conglomerate Risk</div>
                            </div>
                            <div className="pdf-pd-breakdown-col">
                              <div 
                                className="pdf-pd-breakdown-metric-val"
                                style={(metrics as any)?.moat_market_leadership === "Yes" ? { color: '#2563eb' } : undefined}
                              >
                                {(metrics as any)?.moat_market_leadership === "Yes" ? "Yes" : "N/A"}
                              </div>
                              <div className="pdf-pd-breakdown-metric-label">Moat/Market Leader</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial PD Breakdown - Segmented Bar */}
                      <div className="mt-2">
                        {(() => {
                          const fb = (metrics as any)?.financial_breakdown || watchlistItem?.financial_breakdown || null;
                          const financialPdNumeric = typeof (metrics as any)?.financial_pd_score === 'number'
                            ? (metrics as any).financial_pd_score
                            : (watchlistItem?.financial_pd_score !== undefined ? Number(watchlistItem.financial_pd_score) : (derivedValues?.pdScore || 0));

                          const leveragePct = fb?.leverage ?? 0;
                          const liquidityPct = fb?.liquidity ?? 0;
                          const growthPct = fb?.growth ?? 0;

                          const leverageVal = (leveragePct * financialPdNumeric) / 100;
                          const liquidityVal = (liquidityPct * financialPdNumeric) / 100;
                          const growthVal = (growthPct * financialPdNumeric) / 100;

                          const total = leverageVal + liquidityVal + growthVal || 100;

                          const segments = [
                            { value: leverageVal, label: "Leverage Risk", color: "#1e4d7b" },
                            { value: liquidityVal, label: "Liquidity Risk", color: "#4a90d9" },
                            { value: growthVal, label: "Growth Risk", color: "#a2c5ed" },
                          ];

                          return (
                            <SegmentedBar min={0} max={total} segments={segments} height={20} />
                          );
                        })()}
                      </div>

                      {/* Sentiment PD Reference - Risk Bar */}
                      <div className="mt-1">
                        {(() => {
                          const sentimentPDNumeric = typeof (metrics as any)?.sentiment_score === 'number'
                            ? (metrics as any).sentiment_score
                            : (watchlistItem?.sentiment_score !== undefined ? Number(watchlistItem.sentiment_score) : null);

                          return (
                            <RiskBar risk={sentimentPDNumeric} height={20} />
                          );
                        })()}
                      </div>
                    </div>

                    {/* Column 2: Legend and Histogram */}
                    <div className="flex flex-col h-full space-y-2" style={{ paddingTop: '0.25rem', paddingBottom: '0.25rem' }}>
                      {/* Risk Segmentation Section */}
                      <div style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-gray-600">Risk Segmentation</p>
                        </div>
                        {/* Company Risk Segmentation Guide */}
                        <div className="flex gap-1 flex-wrap">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-600" />
                            <span className="text-[10px] text-black">Very Low (PD 0-2%)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-600" />
                            <span className="text-[10px] text-black">Low (PD 2-5%)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-600" />
                            <span className="text-[10px] text-black">Medium (PD 5-10%)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-orange-600" />
                            <span className="text-[10px] text-black">High (PD 10-15%)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-600" />
                            <span className="text-[10px] text-black">Very High (PD 15%+)</span>
                          </div>
                        </div>
                          </div>

                      {/* PD Score Threshold Section */}
                      <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-gray-600">PD Score Threshold</p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            <span className="text-[10px] text-black">0.75% (Overall PD Floor (0.75%), Sentiment PD Ceiling (5%))</span>
                        </div>
                      </div>
                    </div>

                      {/* PD Score Distribution Section */}
                      <div className="flex flex-col flex-grow" style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                      <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-gray-600">PD Score Distribution</p>
                        </div>
                          <div className="flex-1 flex items-end gap-1 w-full min-h-[50px]" style={{ paddingTop: '0.1rem' }}>
                          {histogramData.map((item, index) => {
                            const pdForHistogram = hasParams ? finalPdNumber : derivedValues?.pdScore;
                            const isCurrentBucket = pdForHistogram !== undefined && 
                              pdForHistogram >= item.pdRange[0] && pdForHistogram < item.pdRange[1];
                            const getBucketRiskSegment = (pdRange: number[]) => {
                              // classify bucket by midpoint so a 5% bucket maps sensibly to risk segments
                              const mid = (pdRange[0] + pdRange[1]) / 2;
                              if (mid < 2) return 'green';
                              if (mid < 5) return 'green';
                              if (mid < 10) return 'yellow';
                              if (mid < 15) return 'orange';
                              return 'red';
                            };

                            const bucketColorScheme = getBucketRiskSegment(item.pdRange);
                          const getBarColor = () => {
                              // Only the current bucket receives the color for the merchant's PD segment; others are neutral gray
                            if (!isCurrentBucket) return 'bg-gray-200';
                              // Use the actual merchant PD to decide the color for the highlighted bar
                              const currentPd = pdForHistogram ?? 0;
                              const pdSegment = (v: number) => {
                                if (v < 2) return 'green';
                                if (v < 5) return 'green';
                                if (v < 10) return 'yellow';
                                if (v < 15) return 'orange';
                                return 'red';
                              };
                              switch (pdSegment(currentPd)) {
                                case 'green':
                                  return 'bg-green-600';
                                case 'yellow':
                                  return 'bg-yellow-600';
                                case 'orange':
                                  return 'bg-orange-600';
                                case 'red':
                            return 'bg-red-600';
                                default:
                                  return 'bg-gray-600';
                              }
                          };
                          return (
                              <div key={index} className="flex-1 flex flex-col-reverse items-center h-full">
                                <span className="text-xs text-gray-500 mt-1">{item.bucket}</span>
                              <div
                                className={`w-full ${getBarColor()}`}
                                  style={{ height: `${(item.count / 450) * 100}%`, minHeight: '8px' }}
                              />
                            </div>
                          );
                        })}
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Stats Layout - Included in same div to prevent page break */}
      {!loading && !error && derivedValues && (
        <div 
          style={{
            marginTop: '0.1rem'
          } as any}
        >
          <div className={`${getPdBackgroundClass(riskSegment.colorScheme)} rounded-lg p-2 shadow-sm border border-gray-100`} style={{ marginTop: '0', marginBottom: '0' }}>
                  {/* Row 1: CPV, TPV, Collateral */}
                  <div className="grid grid-cols-4 gap-3" style={{ paddingTop: '0.1rem', paddingBottom: '0.1rem' }}>
                    <div className="space-y-1" style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                      <p className="text-[10px] text-gray-600">Chargebackable Payment Volume (CPV)</p>
                      <div className="text-sm font-semibold text-blue-700">
                        ₹{derivedValues.cpvDaily.toLocaleString('en-IN')}
                      </div>
                      <p className="text-[9px] text-gray-500 italic pt-0.5">Chargebackable Payment Volume processed in a day</p>
                    </div>
                    <div className="space-y-1" style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                      <p className="text-[10px] text-gray-600">Total Payment Volume (TPV) [Daily]</p>
                      <div className="text-sm font-semibold text-blue-700">
                        ₹{derivedValues.tpvDaily.toLocaleString('en-IN')}
                      </div>
                      <p className="text-[9px] text-gray-500 italic pt-0.5">Total Payment Volume processed in a day</p>
                    </div>
                    <div className="space-y-1" style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                      <p className="text-[10px] text-gray-600">Collateral</p>
                      <div className="text-sm font-semibold text-blue-700">
                        ₹{derivedValues.collateral.toLocaleString('en-IN')}
                      </div>
                      <p className="text-[9px] text-gray-500 italic pt-0.5">Collateral value available</p>
                    </div>
                  </div>

                  {/* Row 2: LGD, ADD, Gross NDX, Net NDX */}
                  <div className="grid grid-cols-4 gap-3" style={{ paddingTop: '0.25rem', paddingBottom: '0.1rem' }}>
                    <div className="space-y-1" style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                      <p className="text-[10px] text-gray-600">Loss Given Default (LGD)</p>
                      <div className="text-sm font-semibold text-orange-700">
                        {(derivedValues.lgdRate * 100).toFixed(2)}%
                      </div>
                      <p className="text-[9px] text-gray-500 italic pt-0.5">Loss to operational creditors if company defaults (%)</p>
                    </div>
                    <div className="space-y-1" style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                      <p className="text-[10px] text-gray-600">Average Delivery Days (ADD)</p>
                      <div className="text-sm font-semibold text-orange-700">
                        {industryAddLoading ? '...' : (derivedValues.addDays > 0 ? Number(derivedValues.addDays).toFixed(1) : '-')}
                      </div>
                      <p className="text-[9px] text-gray-500 italic pt-0.5">(Unearned Revenue/ Total Revenue) * 365</p>
                    </div>
                    <div className="space-y-1" style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                      <p className="text-[10px] text-gray-600">Gross Non-Delivery Exposure (G-NDX)</p>
                      <div className="text-sm font-semibold text-orange-700">
                        ₹{Math.round(derivedValues.grossNDX).toLocaleString('en-IN')}
                      </div>
                      <p className="text-[9px] text-gray-500 italic pt-0.5">CPV * ADD</p>
                    </div>
                    <div className="space-y-1" style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                      <p className="text-[10px] text-gray-600">Net Non-Delivery Exposure (N-NDX)</p>
                      <div className="text-sm font-semibold text-orange-700">
                        ₹{Math.round(derivedValues.netNDX).toLocaleString('en-IN')}
                      </div>
                      <p className="text-[9px] text-gray-500 italic pt-0.5">G-NDX - Collateral</p>
                    </div>
                  </div>

                  {/* Row 3: ELD, VaR, and Settlement Days */}
                  <div className="grid grid-cols-4 gap-3" style={{ paddingTop: '0.25rem', paddingBottom: '0.1rem' }}>
                    <div className="space-y-1" style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                      <p className="text-[10px] text-gray-600">Value at Risk (VaR)</p>
                      <div className="text-sm font-semibold text-red-700">
                        ₹{Math.round(derivedValues.valueAtRisk).toLocaleString('en-IN')}
                      </div>
                      <p className="text-[9px] text-gray-500 italic pt-0.5">N-NDX * PD %</p>
                    </div>
                    <div className="space-y-1" style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                      <p className="text-[10px] text-gray-600">Settlement Days [Recommended]</p>
                      <div className="text-sm font-semibold text-green-700">
                        T+{derivedValues.settlementDays.toFixed(1)}
                      </div>
                      <p className="text-[9px] text-gray-500 italic pt-0.5">VaR / TPV</p>
                    </div>
                    <div className="space-y-1" style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                      <p className="text-[10px] text-gray-600">Expected Loss at Default (ELD)</p>
                      <div className="text-sm font-semibold text-red-700">
                        ₹{Math.round(derivedValues.expectedLoss).toLocaleString('en-IN')}
                      </div>
                      <p className="text-[9px] text-gray-500 italic pt-0.5">N-NDX * LGD %</p>
                    </div>
                  </div>
                </div>
          </div>
      )}
      </div>

      {/* Industry Overview Section */}
      {/* {industryData && (
        <div className="pdf-section">
          <div className="pdf-section-header">
            <Factory className="pdf-section-icon" />
            <h2 className="pdf-section-title">Industry Overview</h2>
          </div>
          <div className="pdf-section-content">
            <p className="pdf-text">{industryData.about_the_industry}</p>
            {industryData.is_industry_risky === 'yes' && (
              <div className="pdf-risk-assessment">
                <h3 className="pdf-risk-title">Industry Risk Assessment</h3>
                <p className="pdf-risk-text">{industryData.justification}</p>
              </div>
            )}
          </div>
        </div>
      )} */}

      {/* Risk Assessment Section */}
      {/* <div className="pdf-section">
        <div className="pdf-section-header">
          <AlertTriangle className="pdf-section-icon" />
          <h2 className="pdf-section-title">Risk Assessment</h2>
        </div>
        <div className="pdf-section-content">
          <div className="pdf-risk-wrapper">
            <RiskAssessmentSection
              riskAssessment={null}
              keyMetricList={{ key_metrics: [] }}
            />
          </div>
        </div>
      </div> */}

      {/* Footer */}
      {/* <div className="pdf-footer">
        <p>This report was generated automatically and contains confidential information.</p>
        <p>© {new Date().getFullYear()} Insolvency Analysis Platform</p>
      </div> */}
    </div>
  );
};

export default OverviewPDFTemplate;