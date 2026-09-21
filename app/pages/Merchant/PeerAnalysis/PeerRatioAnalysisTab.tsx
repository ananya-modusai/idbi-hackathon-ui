'use client';

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { Info, Search, X, Download } from 'lucide-react';
import PeerMetricInfo from './PeerMetricInfo';
import metricsJson from '@/app/data/tarc_rerun_peer_comparison/metrics.json';

// Ported from ipo-compliance-nse/listing-compliance-ui's PeerComparison/MetricStatement.tsx,
// with the live usePeerMetricsStore/useCompanyStore/useActiveContext data sources replaced
// by the static metrics.json snapshot for TARC.

const metricsData: any = metricsJson.data;

function coerceMetricNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function isSubjectCompanyKind(kind: string | undefined): boolean {
  if (!kind || typeof kind !== 'string') return false;
  const k = kind.toLowerCase();
  return k === 'current_company' || k.endsWith('current_company');
}

type FinancialOperationalTab = 'Financial' | 'Operational';

function matchesFinancialOperationalTab(fo: string | undefined, tab: FinancialOperationalTab): boolean {
  const s = (fo ?? 'Financial').trim().toLowerCase();
  if (tab === 'Financial') {
    if (s.includes('financial')) return true;
    if (s.includes('operational')) return false;
    return true;
  }
  return s.includes('operational');
}

type PercentageDisplayMode = 'none' | 'prevYear';
type NumberFormatMode = '₹L' | '₹Cr' | '₹M' | '₹';

interface CompanyValue {
  ourCompany: (number | null)[];
  company2: (number | null)[];
  company3: (number | null)[];
}

interface ProcessedMetric {
  id: string;
  name: string;
  type: string;
  financialOperational: string;
  icon: string;
  normalRange: {
    min?: number;
    max?: number;
    description?: string;
  } | null;
  companyValues: CompanyValue;
  formula: string;
  description: string;
  category?: string;
  normalRangeValue: string;
  thresholdSign: string;
  threshold1: number | null;
  threshold2: number | null;
}

const PeerRatioAnalysisTab: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [percentageMode, setPercentageMode] = useState<PercentageDisplayMode>('prevYear');
  const [selectedMetric, setSelectedMetric] = useState<ProcessedMetric | null>(null);
  const [numberFormat, setNumberFormat] = useState<NumberFormatMode>('₹');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [financialOperationalTab, setFinancialOperationalTab] = useState<FinancialOperationalTab>('Financial');

  const years = useMemo(() => {
    if (metricsData?.years && metricsData.years.length > 0) {
      return metricsData.years.map((y: string) => parseInt(y)).sort((a: number, b: number) => a - b);
    }
    return [2021, 2022, 2023, 2024, 2025];
  }, []);

  React.useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[years.length - 1]);
    }
  }, [years, selectedYear]);

  const formatMetricName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        const lower = word.toLowerCase();
        if (lower === 'mom') return 'MoM';
        if (lower === 'yoy') return 'YoY';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const peerMapping = useMemo(() => {
    const mapping = {
      our: { name: 'Our Company', cin: '' },
      p1: { name: 'Peer 1', cin: '' },
      p2: { name: 'Peer 2', cin: '' },
    };

    if (metricsData?.by_year && metricsData.by_year.length > 0) {
      const latestYearBlock = [...metricsData.by_year].sort((a: any, b: any) => parseInt(b.year, 10) - parseInt(a.year, 10))[0];
      const currentCompany = latestYearBlock.companies.find((c: any) => isSubjectCompanyKind(c.kind));
      const peers = latestYearBlock.companies.filter((c: any) => !isSubjectCompanyKind(c.kind));

      if (currentCompany) {
        mapping.our.cin = currentCompany.cin;
        if (currentCompany.display_name) {
          mapping.our.name = currentCompany.display_name;
        }
      }

      if (peers[0]) {
        mapping.p1.name = peers[0].display_name || 'Peer 1';
        mapping.p1.cin = peers[0].cin;
      }
      if (peers[1]) {
        mapping.p2.name = peers[1].display_name || 'Peer 2';
        mapping.p2.cin = peers[1].cin;
      }
    }
    return mapping;
  }, []);

  const companyNames = useMemo(() => ({
    our: peerMapping.our.name,
    p1: peerMapping.p1.name,
    p2: peerMapping.p2.name,
  }), [peerMapping]);

  const processedMetrics: ProcessedMetric[] = useMemo(() => {
    if (!metricsData || !metricsData.by_year) return [];

    const iconList = ['BarChart3', 'TrendingUp', 'PieChart', 'Activity', 'DollarSign', 'Percent', 'Briefcase', 'LineChart', 'Target', 'Zap', 'Layers', 'Globe', 'Cpu', 'Shield', 'HardDrive'];
    let metricCount = 0;

    const metricMap: Record<string, ProcessedMetric> = {};

    metricsData.by_year.forEach((yearData: any) => {
      const year = parseInt(yearData.year);
      const yearIdx = years.indexOf(year);
      if (yearIdx === -1) return;
      yearData.companies.forEach((company: any) => {
        company.metrics.forEach((metric: any) => {
          const id = metric.metric_type.toLowerCase().replace(/\s+/g, '_');

          const excludedMetrics = [
            'altman_z_score',
            'altman_z_score_emerging',
            'altman_z_score_private',
            'dividend_proposed',
            'zmijewski_score',
          ];

          if (excludedMetrics.includes(id)) return;

          if (!metricMap[id]) {
            let parsedRange: ProcessedMetric['normalRange'] = null;
            const rangeStr = metric.normal_range || '';
            const numericMatch = rangeStr.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);

            if (numericMatch) {
              parsedRange = {
                min: parseFloat(numericMatch[1]),
                max: parseFloat(numericMatch[2]),
              };
            } else if (rangeStr) {
              parsedRange = {
                description: rangeStr,
              };
            }

            const displayLabel = metric.name?.trim() || formatMetricName(metric.metric_type);
            const foRaw = metric.financial_operational?.trim() || 'Financial';

            metricMap[id] = {
              id,
              name: displayLabel,
              type: foRaw,
              financialOperational: foRaw,
              icon: (() => {
                const lowerId = id.toLowerCase();
                const lowerName = displayLabel.toLowerCase();

                if (lowerId.includes('working_capital') || lowerName.includes('working capital')) return 'Wallet';
                if (lowerId.includes('revenue') || lowerName.includes('revenue')) return 'DollarSign';
                if (lowerId.includes('debt') || lowerName.includes('debt')) return 'Scale';
                if (lowerId.includes('employee') || lowerName.includes('employee')) return 'Users';
                if (lowerId.includes('ratio') || lowerName.includes('ratio') || lowerId.includes('margin') || lowerName.includes('margin')) return 'Percent';

                return iconList[metricCount % iconList.length];
              })(),
              normalRange: parsedRange,
              companyValues: {
                ourCompany: new Array(years.length).fill(null),
                company2: new Array(years.length).fill(null),
                company3: new Array(years.length).fill(null),
              },
              formula: metric.formula ?? '',
              description: metric.description ?? '',
              category: (() => {
                const type = (metric.metric_value_type ?? '').toLowerCase();
                const rawType = (metric.metric_type || '').toLowerCase();
                const formattedName = displayLabel.toLowerCase();

                if (type.includes('percentage') || type.includes('%')) return 'percentage';

                if (formattedName === 'revenue per employee growth prior') {
                  return 'decimal';
                }

                if (rawType.endsWith('_abs')) return 'rupees';

                if (
                  type.includes('rupee') || type.includes('rs') || type.includes('₹') ||
                  rawType.includes('net_worth') || rawType.includes('working_capital') ||
                  rawType.includes('msme_outstanding') || rawType.includes('value_of_charges') ||
                  formattedName.includes('net worth') || formattedName.includes('working capital')
                ) {
                  return 'rupees';
                }

                if (formattedName.includes('revenue per employee') && !formattedName.includes('growth')) {
                  return 'rupees';
                }

                if (
                  rawType.includes('regulatory_cases') ||
                  rawType.includes('legal_cases') ||
                  (rawType.includes('charges_outstanding') && !rawType.includes('value')) ||
                  rawType.includes('employee_count') ||
                  rawType.includes('audit_qualifications') ||
                  (rawType.includes('auditor_change') && rawType.includes('frequency')) ||
                  rawType.endsWith('_flag') ||
                  formattedName.includes('employee count') ||
                  formattedName.includes('audit qualifications')
                ) {
                  return 'integer';
                }

                return 'decimal';
              })(),
              normalRangeValue: metric.normal_range ?? '',
              thresholdSign: metric.threshold_redflag_sign ?? '-',
              threshold1: metric.threshold_1 !== undefined && metric.threshold_1 !== null ? Number(metric.threshold_1) : null,
              threshold2: metric.threshold_2 !== undefined && metric.threshold_2 !== null ? Number(metric.threshold_2) : null,
            };
            metricCount++;
          }

          let companyKey = '';
          if (isSubjectCompanyKind(company.kind) || (peerMapping.our.cin && company.cin === peerMapping.our.cin)) {
            companyKey = 'ourCompany';
          } else if (peerMapping.p1.cin && company.cin === peerMapping.p1.cin) {
            companyKey = 'company2';
          } else if (peerMapping.p2.cin && company.cin === peerMapping.p2.cin) {
            companyKey = 'company3';
          }

          if (companyKey) {
            const val = coerceMetricNumber(metric.metric_value);
            (metricMap[id].companyValues as any)[companyKey][yearIdx] = val;
          }

          const fo = metric.financial_operational?.trim();
          if (fo) {
            metricMap[id].financialOperational = fo;
            metricMap[id].type = fo;
          }
        });
      });
    });

    Object.values(metricMap).forEach((m) => {
      const vals = m.companyValues.ourCompany;
      for (let i = 0; i < vals.length; i++) {
        if (vals[i] !== null && vals[i] !== undefined) continue;
        for (let j = i - 1; j >= 0; j--) {
          if (vals[j] !== null && vals[j] !== undefined) {
            vals[i] = vals[j];
            break;
          }
        }
      }
    });

    const metrics = Object.values(metricMap);

    const debtIdx = metrics.findIndex((m) => m.id === 'debt_to_equity_ratio');
    const deprIdx = metrics.findIndex((m) => m.id === 'depreciation_index');

    if (debtIdx !== -1 && deprIdx !== -1) {
      const [deprMetric] = metrics.splice(deprIdx, 1);
      const newDebtIdx = metrics.findIndex((m) => m.id === 'debt_to_equity_ratio');
      metrics.splice(newDebtIdx + 1, 0, deprMetric);
    }

    return metrics;
  }, [years, peerMapping]);

  const filteredMetrics = useMemo(() => {
    let list = processedMetrics.filter((metric) => matchesFinancialOperationalTab(metric.financialOperational, financialOperationalTab));
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((metric) => metric.name.toLowerCase().includes(q));
    }
    return list;
  }, [processedMetrics, searchTerm, financialOperationalTab]);

  const displayedMetrics = useMemo(() => {
    return isExpanded ? filteredMetrics : filteredMetrics.slice(0, 20);
  }, [filteredMetrics, isExpanded]);

  const handleExportCSV = () => {
    const yearIdx = years.indexOf(selectedYear);
    const header = ['Metric', 'Normal Range', companyNames.our, companyNames.p1, companyNames.p2];
    const csvRows = [header];

    filteredMetrics.forEach((metric) => {
      const normalRange =
        metric.thresholdSign !== '-' && metric.threshold1 !== null
          ? `X ${metric.thresholdSign === '>' ? '<' : '>'} ${metric.threshold1}`
          : metric.normalRangeValue || metric.normalRange?.description?.trim() || '-';
      const row = [
        metric.name,
        normalRange,
        metric.companyValues.ourCompany[yearIdx] !== null ? String(metric.companyValues.ourCompany[yearIdx]) : '',
        metric.companyValues.company2[yearIdx] !== null ? String(metric.companyValues.company2[yearIdx]) : '',
        metric.companyValues.company3[yearIdx] !== null ? String(metric.companyValues.company3[yearIdx]) : '',
      ];
      csvRows.push(row);
    });

    const csvContent = csvRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = companyNames.our.replace(/[^a-z0-9\-_]/gi, '_');
    a.href = url;
    a.download = `${safeName}_metrics_${selectedYear}_${financialOperationalTab}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const formatNumberWithUnit = (num: number | null, category?: string): string => {
    if (num === null || num === undefined || typeof num !== 'number' || isNaN(num)) return '-';

    switch (category) {
      case 'percentage':
        return `${num.toFixed(2)}%`;
      case 'percentage-100':
        return `${(num * 100).toFixed(2)}%`;
      case 'rupees': {
        const formatVal = (val: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
        switch (numberFormat) {
          case '₹L':
            return `₹${formatVal(num / 100000)}L`;
          case '₹Cr':
            return `₹${formatVal(num / 10000000)}Cr`;
          case '₹M':
            return `₹${formatVal(num / 1000000)}M`;
          case '₹':
          default:
            return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
        }
      }
      case 'decimal':
      default:
        return num.toFixed(2);
      case 'integer':
        return Math.round(num).toLocaleString('en-IN');
    }
  };

  const getNormalRangeBackgroundColor = (value: number, thresholdSign: string, threshold1: number | null, threshold2: number | null): string => {
    if (thresholdSign === '-' || value === null || value === undefined || isNaN(value) || threshold1 === null) return '';

    if (thresholdSign === '>') {
      if (threshold2 !== null && value >= threshold2) {
        return 'bg-red-200';
      } else if (value >= threshold1) {
        return 'bg-red-200';
      } else {
        return 'bg-green-50';
      }
    } else {
      if (threshold2 !== null && value <= threshold2) {
        return 'bg-red-200';
      } else if (value <= threshold1) {
        return 'bg-red-200';
      } else {
        return 'bg-green-50';
      }
    }
  };

  const getPercentageBackgroundColor = (percentText: string): string => {
    if (!percentText || percentText === '-') return '';
    const value = parseFloat(percentText.replace('+', '').replace('%', ''));
    if (value === 0) return '';
    if (value > 0) {
      if (value < 5) return 'bg-green-50';
      if (value < 10) return 'bg-green-100';
      if (value < 20) return 'bg-green-200';
      if (value < 30) return 'bg-green-300';
      return 'bg-green-400';
    } else {
      const absValue = Math.abs(value);
      if (absValue < 5) return 'bg-red-50';
      if (absValue < 10) return 'bg-red-100';
      if (absValue < 20) return 'bg-red-200';
      if (absValue < 30) return 'bg-red-300';
      return 'bg-red-400';
    }
  };

  const calculatePercentChange = (current: number, previous: number): string => {
    if (previous === 0 || current === null || previous === null) return '-';
    const percentChange = ((current - previous) / Math.abs(previous)) * 100;
    return `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) {
      return <LucideIcons.BarChart3 size={16} className="text-blue-700" />;
    }
    return <IconComponent size={16} className="text-blue-700" />;
  };

  const renderMetricRow = (metric: ProcessedMetric) => {
    const yearIdx = years.indexOf(selectedYear);
    const prevYearIdx = yearIdx > 0 ? yearIdx - 1 : -1;

    const companies = [
      { key: 'ourCompany', label: 'Our Company' },
      { key: 'company2', label: '2nd Company' },
      { key: 'company3', label: '3rd Company' },
    ];

    return (
      <TableRow key={metric.id}>
        <TableCell className="sticky left-0 bg-white py-2 flex-1">
          <div className="flex items-center gap-2">
            {renderIcon(metric.icon)}
            <span className="font-medium text-gray-700">{metric.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMetric(metric);
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Info size={16} className="text-gray-400 hover:text-blue-600" />
            </button>
          </div>
        </TableCell>
        <TableCell className="bg-gray-100 py-2 w-48">
          <div className="text-sm text-gray-600 text-center italic break-words px-1">
            {metric.thresholdSign !== '-' && metric.threshold1 !== null
              ? `X ${metric.thresholdSign === '>' ? '<' : '>'} ${metric.threshold1}`
              : metric.normalRangeValue?.trim() || metric.normalRange?.description?.trim() || '-'}
          </div>
        </TableCell>
        {companies.map((company) => {
          const values = (metric.companyValues as any)[company.key];
          const value = values[yearIdx];
          const prevValue = prevYearIdx >= 0 ? values[prevYearIdx] : null;

          let percentChange: string | null = null;
          if (percentageMode === 'prevYear' && value !== null && prevValue !== null) {
            percentChange = calculatePercentChange(value, prevValue);
          }

          let bgColorClass = '';
          if (percentageMode === 'none') {
            bgColorClass = value !== null ? getNormalRangeBackgroundColor(value, metric.thresholdSign, metric.threshold1, metric.threshold2) : '';
          } else if (metric.thresholdSign !== '-') {
            bgColorClass = percentChange ? getPercentageBackgroundColor(percentChange) : '';
          }

          return (
            <TableCell key={company.key} className={cn('text-right py-2', bgColorClass)}>
              <div className="flex flex-col items-end justify-center h-full">
                <div>{formatNumberWithUnit(value, metric.category)}</div>
                {percentageMode !== 'none' ? (
                  percentChange ? (
                    <span className={cn('text-xs italic font-medium', percentChange.startsWith('+') ? 'text-green-700' : percentChange.startsWith('-') ? 'text-red-700' : 'text-gray-500')}>
                      {percentChange}
                    </span>
                  ) : (
                    <div className="text-xs invisible">&nbsp;</div>
                  )
                ) : (
                  <div className="text-xs invisible">&nbsp;</div>
                )}
              </div>
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  const renderFilterControls = () => (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Metrics</span>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['Financial', 'Operational'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFinancialOperationalTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                financialOperationalTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      {filteredMetrics.some((metric) => metric.category === 'rupees') && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Format</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { value: '₹', label: 'Raw' },
              { value: '₹L', label: '₹ L' },
              { value: '₹M', label: '₹ M' },
              { value: '₹Cr', label: '₹ Cr' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setNumberFormat(option.value as NumberFormatMode)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  numberFormat === option.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Select Year</span>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {years.map((year: number) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedYear === year ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Comparison</span>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { value: 'none', label: 'Relative to Normal Range' },
            { value: 'prevYear', label: 'Relative to Prev Year' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPercentageMode(option.value as PercentageDisplayMode)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                percentageMode === option.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {renderSearchBar()}
    </div>
  );

  const renderSearchBar = () => (
    <div className="flex gap-2 flex-1 min-w-[260px]">
      <div className="flex items-center gap-3 flex-1 min-w-[260px]">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search metrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-8 w-full h-10 border-gray-300 bg-inherit shadow-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative min-w-0">
        <div className="pb-2">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-row items-start gap-4 w-full">
              {/* filters wrap onto several lines; the button stays pinned to the
                  top row rather than floating to the vertical centre */}
              <div className="flex flex-wrap items-center gap-4 flex-1 min-w-0">
                {renderFilterControls()}
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 font-medium text-sm shadow-sm whitespace-nowrap self-start flex-shrink-0"
                title="Export CSV"
              >
                <Download className="h-4 w-4 text-blue-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-2">
          <div className="overflow-x-auto">
            <Table className="w-full border-b">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10 py-2 flex-1">Metric</TableHead>
                  <TableHead className="bg-white py-2 w-48 text-center">Normal Range</TableHead>
                  <TableHead className="text-right py-2">{companyNames.our}</TableHead>
                  <TableHead className="text-right py-2">{companyNames.p1}</TableHead>
                  <TableHead className="text-right py-2">{companyNames.p2}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMetrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-gray-500">
                      No metrics found.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedMetrics.map((metric) => renderMetricRow(metric))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredMetrics.length > 20 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
              >
                {isExpanded ? (
                  <>
                    <span>Show Less</span>
                    <LucideIcons.ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>Show More ({filteredMetrics.length - 20} remaining)</span>
                    <LucideIcons.ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      {selectedMetric && (
        <PeerMetricInfo
          isOpen={!!selectedMetric}
          onClose={() => setSelectedMetric(null)}
          name={selectedMetric.name}
          formula={selectedMetric.formula?.trim() ? selectedMetric.formula : ''}
          description={[selectedMetric.description, selectedMetric.normalRangeValue].filter(Boolean).join('\n\n').trim()}
        />
      )}
    </>
  );
};

export default PeerRatioAnalysisTab;
