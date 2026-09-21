'use client';

import React, { FC, useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Search, X, RotateCcw, Download, ArrowUpDown, Check, ExternalLink, Play } from 'lucide-react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { useInvestigationCaseStore } from '@/app/store/investigation/investigationCaseStore';
import { getFlagInfo } from '../Sample Data/InvDecisioningSampleData';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select2';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SortActionButton, SortDirection } from '@/components/custom/CustomList/SortActionButton';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import { InvReasoningArtifact } from '../Components/InvReasoningArtifact';
import { formatTitleCase } from "@/lib/utils";
import { ExecuteRulesModal } from '../Components/ExecuteRulesModal';
import { useProfileStore } from '@/app/store/authentication/profileStore';

interface InvDashboardProps {
  merchantId?: string;
}

const gfCodes = ['GF001', 'GF002', 'GF003'];
const rfCodes = [
  'RF001',
  'RF002',
  'RF003',
  'RF004',
  'RF005',
  'RF006',
  'RF009',
  'RF010',
  'RF011',
  'RF012',
  'RF013',
  'RF014',
  'RF015',
  'RF016',
  'RF017',
];
const mrCodes = ['MR001'];

const ruleOptions = [...gfCodes, ...rfCodes, ...mrCodes].map((code) => ({
  value: code,
  label: code,
}));

const parseDateTimeParts = (dateStr: string) => {
  if (!dateStr) return { dateStr: '—', timeStr: '' };
  const date = new Date(dateStr);

  // Apply same Indian Standard Time offset (+5h 30m) as in Portfolio page!
  date.setHours(date.getHours() + 5);
  date.setMinutes(date.getMinutes() + 30);

  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');

  return {
    dateStr: `${day} ${monthName} ${year}`,
    timeStr: `${strHours}:${minutes} ${ampm}`
  };
};

const InvDashboard: FC<InvDashboardProps> = ({ merchantId }) => {
  const { rulesSummaryCases, rulesSummaryLoading: loading, fetchRulesSummaryCases } =
    useInvestigationCaseStore();
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isAdmin = profile?.role === 'ADMIN';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuleCodes, setSelectedRuleCodes] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const exportRef = useRef<(() => void) | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [selectedRowForRules, setSelectedRowForRules] = useState<{ id: string; merchantName: string } | null>(null);

  const sortFields = useMemo(() => [
    { key: "date", label: "Date" },
    { key: "merchantName", label: "Merchant Name" },
    { key: "riskScore", label: "Risk Score" },
    { key: "aiDecision", label: "AI Decision" },
  ], []);

  const handleSortChange = (fieldKey: string, dir: SortDirection) => {
    setSortField(fieldKey);
    setSortDirection(dir);
  };

  useEffect(() => {
    if (rulesSummaryCases.length === 0) {
      fetchRulesSummaryCases(1000);
    }
  }, [fetchRulesSummaryCases, rulesSummaryCases.length]);

  const visibleColumns = useMemo(() => {
    const staticCols = [
      {
        key: 'date',
        header: 'Date',
        sortable: true,
        minWidth: '130px',
        verticalAlign: 'middle' as const,
        render: (val: any) => {
          if (!val) return <span className="text-gray-400">—</span>;
          const { dateStr, timeStr } = parseDateTimeParts(val);
          return (
            <div className="py-0.5 flex flex-col items-start leading-tight">
              <span className="text-gray-800 font-bold text-[13px] whitespace-nowrap">
                {dateStr}
              </span>
              <span className="text-gray-400 font-medium text-[11px] whitespace-nowrap mt-0.5">
                {timeStr}
              </span>
            </div>
          );
        },
      },
      {
        key: 'merchantName',
        header: 'Merchant Name',
        sortable: true,
        minWidth: '260px',
        width: '240px',
        verticalAlign: 'middle' as const,
        render: (val: any) => (
          <span className="font-semibold text-blue-700" title={val || 'N/A'}>
            {formatTitleCase(val || 'N/A')}
          </span>
        ),
      },
      {
        key: 'riskScore',
        header: 'Risk Score',
        sortable: true,
        minWidth: '100px',
        align: 'center' as const,
        verticalAlign: 'middle' as const,
        render: (val: any, row: any) => {
          const getScoreColorClass = (decision?: string): string => {
            const t = String(decision || "").toLowerCase();
            if (t.includes("critical")) return "text-red-700 font-bold";
            if (t.includes("high")) return "text-orange-700 font-bold";
            if (t.includes("medium")) return "text-yellow-700 font-bold";
            if (t.includes("low")) return "text-green-700 font-bold";
            if (t.includes("manual review")) return "text-purple-700 font-bold";
            return "text-gray-500 font-medium";
          };
          return (
            <span className={`text-[14px] ${getScoreColorClass(row?.aiDecision)}`}>
              {val}
            </span>
          );
        },
      },
      {
        key: 'aiDecision',
        header: 'AI Decision',
        sortable: true,
        minWidth: '160px',
        align: 'center' as const,
        verticalAlign: 'middle' as const,
        render: (val: any) => {
          const getRiskColor = (tier?: string): any => {
            const t = String(tier || "").toLowerCase();
            if (t.includes("critical")) return "red";
            if (t.includes("high")) return "orange";
            if (t.includes("medium")) return "yellow";
            if (t.includes("low")) return "green";
            if (t.includes("manual review")) return "purple";
            return "gray";
          };
          return (
            <div className="flex justify-center">
              <BubbleTag
                text={val}
                color={getRiskColor(val)}
                withBorder={true}
                fixedWidth={130}
              />
            </div>
          );
        },
      },
      {
        key: 'aiReasoning',
        header: 'AI Reasoning',
        minWidth: '130px',
        align: 'center' as const,
        verticalAlign: 'middle' as const,
        render: (val: any, row: any) => {
          const handleReasoningClick = () => {
            if (!row.id) return;
            const artifactId = `ai-reasoning-${row.id}`;
            
            const artifactStore = useArtifactStore.getState();
            
            artifactStore.addTab({
              id: artifactId,
              title: "AI Reasoning",
              renderArtifact: () => (
                <InvReasoningArtifact
                  runId={row.id}
                  aiDecision={row.aiDecision}
                  riskScore={row.riskScore}
                  reasoning={row.aiReasoning}
                />
              ),
            });
            
            setTimeout(() => {
              artifactStore.setCollapsed(false);
              artifactStore.forceActivateTab(artifactId);
            }, 50);
          };

          if (!val) {
            return <span className="text-gray-300 font-medium whitespace-nowrap">—</span>;
          }

          return (
            <div className="flex justify-center">
              <BubbleTag
                text="Reasoning"
                color="blueTextWhiteBg"
                hasInsideIcon={true}
                icon={<ExternalLink className="w-3 h-3 text-blue-700" />}
                clickable={true}
                onClick={handleReasoningClick}
                withBorder={true}
                fixedWidth={110}
              />
            </div>
          );
        },
      },
    ];

    if (isAdmin) {
      staticCols.push({
        key: 'executeRules',
        header: 'Execute Rules',
        minWidth: '130px',
        align: 'center' as const,
        verticalAlign: 'middle' as const,
        render: (val: any, row: any) => {
          const handleExecuteClick = () => {
            if (!row.id) return;
            setSelectedRowForRules({
              id: row.id,
              merchantName: row.merchantName,
            });
            setIsRulesModalOpen(true);
          };

          return (
            <div className="flex justify-center">
              <BubbleTag
                text="Execute"
                color="blueTextWhiteBg"
                hasInsideIcon={true}
                icon={<Play className="w-3 h-3 text-blue-700 fill-blue-700/10" />}
                clickable={true}
                onClick={handleExecuteClick}
                withBorder={true}
                fixedWidth={110}
              />
            </div>
          );
        },
      });
    }

    const filteredGf = gfCodes
      .filter((code) => selectedRuleCodes.length === 0 || selectedRuleCodes.includes(code))
      .map((code) => {
        const ruleInfo = getFlagInfo(code);
        return {
          key: code,
          header: (
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center justify-center cursor-pointer py-1 text-center max-w-[120px]">
                    <span className="font-mono text-[11px] font-bold text-gray-700">
                      {code}
                    </span>
                    {ruleInfo && (
                      <span
                        className="text-[9px] text-gray-400 font-medium normal-case leading-normal mt-0.5 break-words whitespace-normal text-center"
                        title={ruleInfo.name}
                      >
                        {ruleInfo.name}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="p-3 bg-white border border-gray-200 shadow-xl rounded-xl max-w-xs z-50">
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-semibold text-gray-800 leading-normal mt-1">
                      {ruleInfo?.name || 'Rules assessment'}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ),
          minWidth: '180px',
          width: '180px',
          align: 'center' as const,
          verticalAlign: 'middle' as const,
          render: (val: any) => {
            const valStr = String(val).toLowerCase();
            const isTriggered = val === 'Yes' || val === true || valStr === 'yes' || valStr === 'triggered' || valStr === 'true';
            const isNotTriggered = val === 'No' || val === false || valStr === 'no' || valStr === 'not_triggered' || valStr === 'false';
            if (isTriggered) {
              return (
                <span className="font-semibold text-red-700 text-[13px] whitespace-nowrap">
                  Yes
                </span>
              );
            }
            if (isNotTriggered) {
              return (
                <span className="font-semibold text-emerald-700 text-[13px] whitespace-nowrap">
                  No
                </span>
              );
            }
            return <span className="text-gray-300 font-medium whitespace-nowrap">—</span>;
          },
        };
      });

    const filteredRf = rfCodes
      .filter((code) => selectedRuleCodes.length === 0 || selectedRuleCodes.includes(code))
      .map((code) => {
        const ruleInfo = getFlagInfo(code);
        return {
          key: code,
          header: (
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center justify-center cursor-pointer py-1 text-center max-w-[120px]">
                    <span className="font-mono text-[11px] font-bold text-gray-700">
                      {code}
                    </span>
                    {ruleInfo && (
                      <span
                        className="text-[9px] text-gray-400 font-medium normal-case leading-normal mt-0.5 break-words whitespace-normal text-center"
                        title={ruleInfo.name}
                      >
                        {ruleInfo.name}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="p-3 bg-white border border-gray-200 shadow-xl rounded-xl max-w-xs z-50">
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-semibold text-gray-800 leading-normal mt-1">
                      {ruleInfo?.name || 'Rules assessment'}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ),
          minWidth: '180px',
          width: '180px',
          align: 'center' as const,
          verticalAlign: 'middle' as const,
          render: (val: any) => {
            const valStr = String(val).toLowerCase();
            const isTriggered = val === 'Yes' || val === true || valStr === 'yes' || valStr === 'triggered' || valStr === 'true';
            const isNotTriggered = val === 'No' || val === false || valStr === 'no' || valStr === 'not_triggered' || valStr === 'false';
            if (isTriggered) {
              return (
                <span className="font-semibold text-red-700 text-[13px] whitespace-nowrap">
                  Yes
                </span>
              );
            }
            if (isNotTriggered) {
              return (
                <span className="font-semibold text-emerald-700 text-[13px] whitespace-nowrap">
                  No
                </span>
              );
            }
            return <span className="text-gray-300 font-medium whitespace-nowrap">—</span>;
          },
        };
      });

    const filteredMr = mrCodes
      .filter((code) => selectedRuleCodes.length === 0 || selectedRuleCodes.includes(code))
      .map((code) => {
        const ruleInfo = getFlagInfo(code);
        return {
          key: code,
          header: (
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center justify-center cursor-pointer py-1 text-center max-w-[120px]">
                    <span className="font-mono text-[11px] font-bold text-gray-700">
                      {code}
                    </span>
                    {ruleInfo && (
                      <span
                        className="text-[9px] text-gray-400 font-medium normal-case leading-normal mt-0.5 break-words whitespace-normal text-center"
                        title={ruleInfo.name}
                      >
                        {ruleInfo.name}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="p-3 bg-white border border-gray-200 shadow-xl rounded-xl max-w-xs z-50">
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-semibold text-gray-800 leading-normal mt-1">
                      {ruleInfo?.name || 'Rules assessment'}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ),
          minWidth: '180px',
          width: '180px',
          align: 'center' as const,
          verticalAlign: 'middle' as const,
          render: (val: any) => {
            const valStr = String(val).toLowerCase();
            const isTriggered = val === 'Yes' || val === true || valStr === 'yes' || valStr === 'triggered' || valStr === 'true';
            const isNotTriggered = val === 'No' || val === false || valStr === 'no' || valStr === 'not_triggered' || valStr === 'false';
            if (isTriggered) {
              return (
                <span className="font-semibold text-red-700 text-[13px] whitespace-nowrap">
                  Yes
                </span>
              );
            }
            if (isNotTriggered) {
              return (
                <span className="font-semibold text-emerald-700 text-[13px] whitespace-nowrap">
                  No
                </span>
              );
            }
            return <span className="text-gray-300 font-medium whitespace-nowrap">—</span>;
          },
        };
      });

    return [...staticCols, ...filteredMr, ...filteredGf, ...filteredRf];
  }, [selectedRuleCodes, isAdmin]);

  const tableData = useMemo(() => {
    const filteredCases = rulesSummaryCases.filter((c) => {
      if (isAdmin) return true;
      const isActive = (c as any).run?.is_active ?? (c as any).is_active;
      return isActive === true;
    });
    return filteredCases.map((c) => {
      const rowData: Record<string, any> = {
        id: c.caseId || (c as any).id || Math.random().toString(),
        date: c.createdDateTime || (c as any).run?.created_at || '',
        merchantName: formatTitleCase(c.registeredName || (c as any).merchant?.name || 'N/A'),
        websiteUrl: (c as any).websiteUrl || (c as any).merchant?.website || 'N/A',
      };

      // Extract risk score
      let finalRiskScore: any = null;
      const priority_flag = (c as any).priority_flag;
      const risk_report = (c as any).risk_report;
      const risk_score = (c as any).risk_score;
      if (priority_flag?.points !== undefined && priority_flag?.points !== null) {
        finalRiskScore = priority_flag.points;
      } else if (risk_report && typeof risk_report === "object" && risk_report.risk_score !== undefined) {
        finalRiskScore = risk_report.risk_score;
      } else if (risk_score && typeof risk_score === "object" && (risk_score as any).risk_score !== undefined) {
        finalRiskScore = (risk_score as any).risk_score;
      } else if (typeof risk_score === "number") {
        finalRiskScore = risk_score;
      } else if (typeof (c as any).riskScore === "number") {
        finalRiskScore = (c as any).riskScore;
      }

      // Extract AI decision / risk tier
      const rawTier = priority_flag?.category || risk_report?.risk_tier || (risk_score as any)?.risk_tier || "N/A";
      let riskTier = "Evaluating...";
      const lowRaw = String(rawTier).toLowerCase();
      if (lowRaw.includes("critical")) riskTier = "Critical Risk";
      else if (lowRaw.includes("high")) riskTier = "High Risk";
      else if (lowRaw.includes("medium")) riskTier = "Medium Risk";
      else if (lowRaw.includes("low")) riskTier = "Low Risk";
      else if (lowRaw.includes("manual review")) riskTier = "Manual Review";
      else if (lowRaw === "recommended") riskTier = "Low Risk";
      else if (lowRaw === "not recommended") riskTier = "Critical Risk";
      else if (lowRaw !== "n/a") riskTier = rawTier;

      rowData.riskScore = finalRiskScore !== null ? finalRiskScore : '—';
      rowData.aiDecision = riskTier;

      // Extract AI Reasoning / Fraud Commentary
      const getReasoning = (d: any) => {
        if (!d) return "";
        const findCommentary = (obj: any) => {
          if (!obj || typeof obj !== "object") return null;
          return obj.fraud_commentary || obj.fraud_commentry || obj.fraudCommentary || obj.fraudCommentry || obj.risk_explanation || obj.explanation || obj.reasoning || obj.reason;
        };
        return (
          findCommentary(d) ||
          findCommentary(d.priority_flag) ||
          findCommentary(d.risk_report) ||
          findCommentary(d.risk_score) ||
          findCommentary(d.run) ||
          findCommentary(d.merchant) ||
          ""
        );
      };
      rowData.aiReasoning = getReasoning(c) || '';

      // Set empty string for GF, RF and MR columns, or query existing values dynamically
      [...gfCodes, ...rfCodes, ...mrCodes].forEach((code) => {
        let val = (c as any)[code] ?? (c as any).flags?.[code];
        
        if (val === undefined && (c as any).rules?.[code]) {
          const ruleObj = (c as any).rules[code];
          if (ruleObj && typeof ruleObj === 'object') {
            val = ruleObj.overall_triggered ?? ruleObj.overallTriggered;
          } else {
            val = ruleObj;
          }
        }

        if (val === undefined && Array.isArray((c as any).flags)) {
          const foundFlag = (c as any).flags.find((f: any) => f.code === code || f.step === code);
          if (foundFlag) {
            val = foundFlag.overallTriggered ?? foundFlag.overall_triggered;
          }
        }

        let normalizedVal = '';
        if (val !== undefined && val !== null && val !== '') {
          const valStr = String(val).toLowerCase();
          const isTriggered = val === 'Yes' || val === true || valStr === 'yes' || valStr === 'triggered' || valStr === 'true';
          const isNotTriggered = val === 'No' || val === false || valStr === 'no' || valStr === 'not_triggered' || valStr === 'false';
          if (isTriggered) {
            normalizedVal = 'Yes';
          } else if (isNotTriggered) {
            normalizedVal = 'No';
          }
        }
        
        rowData[code] = normalizedVal;
      });

      return rowData;
    });
  }, [rulesSummaryCases, isAdmin]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return tableData;
    return tableData.filter((row) =>
      row.merchantName.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [tableData, searchQuery]);

  const sortedAndFilteredData = useMemo(() => {
    const result = [...filteredData];
    result.sort((a, b) => {
      if (sortField === 'date') {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
      } else if (sortField === 'merchantName') {
        const nameA = String(a.merchantName || '').toLowerCase();
        const nameB = String(b.merchantName || '').toLowerCase();
        return sortDirection === 'desc' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
      } else if (sortField === 'riskScore') {
        const scoreA = a.riskScore !== '—' && a.riskScore !== null ? Number(a.riskScore) : -1;
        const scoreB = b.riskScore !== '—' && b.riskScore !== null ? Number(b.riskScore) : -1;
        return sortDirection === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      } else if (sortField === 'aiDecision') {
        const decA = String(a.aiDecision || '').toLowerCase();
        const decB = String(b.aiDecision || '').toLowerCase();
        return sortDirection === 'desc' ? decB.localeCompare(decA) : decA.localeCompare(decB);
      }
      return 0;
    });
    return result;
  }, [filteredData, sortField, sortDirection]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedRuleCodes([]);
    setSortField('date');
    setSortDirection('desc');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="space-y-6 px-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-4">
        <SectionHeaderWithFlags
          title="Dashboard"
          icon={LayoutDashboard}
          positiveFlags={[]}
          negativeFlags={[]}
          allowCollapse={false}
        />
      </motion.div>

      {/* Filters and Search Row */}
      <motion.div variants={itemVariants} className="flex gap-3 w-full mt-2 items-center">
        {/* Multi-select dropdown for Rule Codes */}
        <div className="w-[240px] shrink-0">
          <MultiSelect
            options={ruleOptions}
            value={selectedRuleCodes}
            onValueChange={setSelectedRuleCodes}
            placeholder="Filter Rules"
            compactSummary={true}
            className="w-full bg-white border border-gray-200 shadow-sm rounded-lg"
          />
        </div>

        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by Merchant Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 w-full bg-white border border-gray-200 focus-visible:ring-blue-500 rounded-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 hover:border-red-300 rounded-lg hover:bg-red-50 transition-colors text-red-500 font-medium text-sm shadow-sm whitespace-nowrap active:scale-[0.98]"
          title="Reset All Filters"
        >
          <RotateCcw className="h-4 w-4 text-red-500" />
          <span>Reset</span>
        </button>

        {/* Sort By Button */}
        <SortActionButton
          sortFields={sortFields}
          currentSortField={sortField}
          currentSortDirection={sortDirection}
          onSortChange={handleSortChange}
          color="blueTextWhiteBg"
          border={true}
        />

        <button
          onClick={() => exportRef.current?.()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 font-medium text-sm shadow-sm whitespace-nowrap active:scale-[0.98]"
          title="Export CSV"
        >
          <Download className="h-4 w-4 text-blue-600" />
          <span>Export CSV</span>
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="w-[92.5vw] mt-4 space-y-4">
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex justify-end items-center gap-2.5 text-[11px] font-bold text-gray-500 mr-1 select-none leading-none">
            <span>
              <span className="text-red-700">Yes</span>
              <span className="text-gray-400 mx-1">→</span>
              <span className="text-red-700">Triggered</span>
            </span>
            <span className="text-gray-300">|</span>
            <span>
              <span className="text-emerald-700">No</span>
              <span className="text-gray-400 mx-1">→</span>
              <span className="text-emerald-700">Not Triggered</span>
            </span>
          </div>
          <CustomTableView
            columns={visibleColumns}
            data={sortedAndFilteredData}
            isLoading={loading}
            showCSVExport={false}
            exportRef={exportRef}
            initialRowLimit={50}
            isExpanded={true}
            fixedFirstColumn={true}
            fixedColumnsCount={2}
            headerBgColor="bg-blue-50"
            alternateRowBgColor="bg-gray-50"
            hoverBgColor="hover:bg-gray-100"
          />
        </div>
      </motion.div>
      {selectedRowForRules && (
        <ExecuteRulesModal
          open={isRulesModalOpen}
          onOpenChange={setIsRulesModalOpen}
          pipelineId={selectedRowForRules.id}
          merchantName={selectedRowForRules.merchantName}
          onSuccess={() => fetchRulesSummaryCases(1000, true)}
        />
      )}
    </motion.div>
  );
};

export default InvDashboard;
