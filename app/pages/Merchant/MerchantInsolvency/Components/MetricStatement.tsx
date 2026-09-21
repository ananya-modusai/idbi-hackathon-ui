
import React, { useState, useMemo, useEffect } from 'react';
import MetricInfo from './MetricInfo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { metricsSampleData, MetricSample, industryMedians } from '../SampleData/metricsSampleData';
import * as LucideIcons from 'lucide-react';
import { Info, Search, X } from 'lucide-react';
import { colorSchemes } from '@/components/custom/CustomColorScheme';
import { metricsService, APIMetric } from '@/app/services/metricsService';
import { useMerchantIdStore } from '@/app/store/merchant/merchantIdStore';
import { useActiveContext } from '@/app/layout/ActiveContext/useActiveContext';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { ColorScheme } from '@/components/custom/CustomColorScheme';
import { MultiSelect } from "@/components/ui/multi-select2";

type PercentageDisplayMode = 'none' | 'prevYear' | 'baseYear';
type NumberFormatMode = '₹L' | '₹Cr' | '₹M' | '₹';

// Removed hardcoded years array to use dynamic years from API

interface ProcessedMetric {
    id: string;
    name: string;
    type: string;
    icon: string;
    normalRange: {
        min: number;
        max: number;
    } | null;
    historicalValues: (number | null)[];
    relativeValues: (number | null)[];
    thresholdSign: string;
    threshold1: number | null;
    threshold2: number | null;
    formula: string;
    impactOnCompany: string;
    industryMedian?: number;
    category?: string | number;
    bucket?: string;
}

interface MetricStatementProps {
    merchantId?: string;
    filterBarAlignment?: 'left' | 'right';
    showSearchBar?: boolean;
}

const MetricStatement: React.FC<MetricStatementProps> = ({ 
    merchantId: propMerchantId,
    filterBarAlignment = 'right',
    showSearchBar = false
}) => {
    const [startYear, setStartYear] = useState<number>(2020);
    const [percentageMode, setPercentageMode] = useState<PercentageDisplayMode>('prevYear');
    const [selectedMetric, setSelectedMetric] = useState<ProcessedMetric | null>(null);
    const [numberFormat, setNumberFormat] = useState<NumberFormatMode>('₹Cr');
    const [apiMetrics, setApiMetrics] = useState<APIMetric[]>([]);
    const [selectedBuckets, setSelectedBuckets] = useState<string[]>([]);

    const BUCKET_ORDER = ["Leverage Risk", "Growth Risk", "Liquidity Risk", "Others"];

    // Calculate years dynamically from API data
    const dynamicYears = useMemo(() => {
        if (!apiMetrics.length) return [2020, 2021, 2022, 2023, 2024];
        
        const yearSet = new Set<number>();
        apiMetrics.forEach(metric => {
            Object.keys(metric).forEach(key => {
                // Check if key is a 4-digit year
                if (/^\d{4}$/.test(key)) {
                    yearSet.add(parseInt(key));
                }
            });
        });
        
        return Array.from(yearSet).sort((a, b) => a - b);
    }, [apiMetrics]);

    // Set initial start year when dynamicYears are loaded
    useEffect(() => {
        if (dynamicYears.length > 0 && startYear === 2020 && !dynamicYears.includes(2020)) {
            setStartYear(dynamicYears[0]);
        } else if (dynamicYears.length > 0 && startYear === 2020 && dynamicYears.includes(2020)) {
            // Keep 2020 if it exists
        } else if (dynamicYears.length > 0 && !dynamicYears.includes(startYear)) {
            setStartYear(dynamicYears[0]);
        }
    }, [dynamicYears, startYear]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const { selectedMerchantId } = useMerchantIdStore();
    const { activeContexts } = useActiveContext();
    
    // Get merchant ID from props, context, or store (in order of priority)
    const effectiveMerchantId = propMerchantId || activeContexts?.merchant || selectedMerchantId;
    
    console.log('Merchant ID debugging:');
    console.log('  propMerchantId:', propMerchantId);
    console.log('  activeContexts?.merchant:', activeContexts?.merchant);
    console.log('  selectedMerchantId:', selectedMerchantId);
    console.log('  effectiveMerchantId:', effectiveMerchantId);

    // Fetch metrics data from API
    useEffect(() => {
        console.log('useEffect triggered - effectiveMerchantId:', effectiveMerchantId);
        
        const fetchMetrics = async () => {
            if (!effectiveMerchantId) {
                console.log('No merchant ID, skipping API call');
                setLoading(false);
                return;
            }
            
            try {
                console.log('Fetching metrics for merchant:', effectiveMerchantId);
                setLoading(true);
                const response = await metricsService.getMetricsByYear(effectiveMerchantId);
                console.log('API response received:', response);
                console.log('Response type:', typeof response);
                console.log('Response keys:', Object.keys(response));
                console.log('Metrics array:', response.metrics);
                console.log('Metrics array length:', response.metrics?.length);
                setApiMetrics(response.metrics || []);
            } catch (err) {
                console.error('Failed to fetch metrics:', err);
                // Fallback to sample data silently
                setApiMetrics([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [effectiveMerchantId]);

    // Convert API metrics to the format expected by the component
    const processedMetrics: ProcessedMetric[] = useMemo(() => {
        console.log('Processing metrics - apiMetrics length:', apiMetrics.length);
        console.log('apiMetrics:', apiMetrics);
        
        if (!apiMetrics.length) {
            console.log('No API metrics available');
            return [];
        }
        
        console.log('Processing API metrics');
        return apiMetrics.map((apiMetric) => {
            const historicalValues: (number | null)[] = [];
            const availableYears: number[] = [];
            
            // Extract year values and available years
            dynamicYears.forEach(year => {
                const yearValue = apiMetric[year.toString()];
                if (yearValue !== '-' && yearValue !== undefined && yearValue !== null) {
                    historicalValues.push(Number(yearValue));
                    availableYears.push(year);
                } else {
                    historicalValues.push(null); // Use null for missing/invalid data
                }
            });

            // Use threshold_1 and threshold_2 as range values
            // If thresholds are null, parse the normal_range string
            let normalRange;
            if (apiMetric.threshold_1 !== null && apiMetric.threshold_1 !== undefined && 
                apiMetric.threshold_2 !== null && apiMetric.threshold_2 !== undefined) {
                // For threshold_redflag_sign '>', normal range is '< threshold_1'
                // For threshold_redflag_sign '<', normal range is '> threshold_1'
                if (apiMetric.threshold_redflag_sign === '>') {
                    normalRange = {
                        min: -Infinity,
                        max: Number(apiMetric.threshold_1)
                    };
                } else {
                    normalRange = {
                        min: Number(apiMetric.threshold_1),
                        max: Infinity
                    };
                }
            } else {
                // Fallback to parsing normal_range string
                console.log('Parsing normal_range:', apiMetric.normal_range);
                
                // Handle formats like "< -2.22 (non-manipulator), > -2.22 (likely manipulator)"
                const rangeMatch = apiMetric.normal_range.match(/([<>])\s*([-\d.]+)/);
                if (rangeMatch) {
                    const sign = rangeMatch[1];
                    const value = parseFloat(rangeMatch[2]);
                    if (sign === '>') {
                        normalRange = {
                            min: -Infinity,
                            max: value
                        };
                    } else {
                        normalRange = {
                            min: value,
                            max: Infinity
                        };
                    }
                } else {
                    // Show "-" if no threshold is present
                    normalRange = null;
                    console.log('No threshold present, setting to null');
                }
            }

            // Calculate relative to normal range values based on threshold sign
            const calculateRelativeToNormalRange = (value: number | null): number | null => {
                if (value === null || value === undefined || isNaN(value)) return null;
                
                const sign = apiMetric.threshold_redflag_sign;
                
                // If sign is "-" or thresholds are null, don't do any calculations
                if (sign === '-' || 
                    apiMetric.threshold_1 === null || apiMetric.threshold_1 === undefined ||
                    apiMetric.threshold_2 === null || apiMetric.threshold_2 === undefined) {
                    return null;
                }
                
                const threshold = sign === '>' ? (normalRange?.max ?? 0) : (normalRange?.min ?? 0);
                
                if (sign === '>') {
                    // For ">" sign, calculate how much above the threshold
                    return value > threshold ? ((value - threshold) / threshold) * 100 : 0;
                } else {
                    // For "<" sign, calculate how much below the threshold
                    return value < threshold ? ((threshold - value) / threshold) * 100 : 0;
                }
            };

            // Calculate relative values for each historical value
            const relativeValues = historicalValues.map(calculateRelativeToNormalRange);

            return {
                id: apiMetric.metric_code,
                name: apiMetric.metric,
                type: 'Financial',
                icon: 'BarChart3', // Default icon
                normalRange,
                normalRangeValue: apiMetric.normal_range,
                historicalValues,
                relativeValues,
                thresholdSign: apiMetric.threshold_redflag_sign,
                threshold1: apiMetric.threshold_1 !== null ? Number(apiMetric.threshold_1) : null,
                threshold2: apiMetric.threshold_2 !== null ? Number(apiMetric.threshold_2) : null,
                formula: apiMetric.formula,
                impactOnCompany: apiMetric.description,
                industryMedian: apiMetric.industry_median,
                category: apiMetric.category,
                bucket: (() => {
                    const b = (apiMetric.bucket || apiMetric.Bucket || "").toLowerCase();
                    if (b.includes('leverage') || b.includes('solvency')) return "Leverage Risk";
                    if (b.includes('growth')) return "Growth Risk";
                    if (b.includes('liquid')) return "Liquidity Risk";
                    return "Others";
                })()
            };
        });
    }, [apiMetrics, dynamicYears]);

    // Get all unique buckets for filtering
    const allBuckets = useMemo(() => {
        const bucketSet = new Set<string>();
        processedMetrics.forEach(m => {
            if (m.bucket) bucketSet.add(m.bucket);
        });
        // Sort according to requested BUCKET_ORDER
        return BUCKET_ORDER.filter(b => bucketSet.has(b));
    }, [processedMetrics]);

    // Filter metrics based on search term and selected bucket
    const filteredMetrics = useMemo(() => {
        let result = processedMetrics;
        if (searchTerm.trim()) {
            result = result.filter(metric => 
                metric.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (selectedBuckets.length > 0) {
            result = result.filter(metric => metric.bucket && selectedBuckets.includes(metric.bucket));
        }

        // Apply grouping sort
        return [...result].sort((a, b) => {
            const orderA = BUCKET_ORDER.indexOf(a.bucket || "Others");
            const orderB = BUCKET_ORDER.indexOf(b.bucket || "Others");
            if (orderA !== orderB) return orderA - orderB;
            return a.name.localeCompare(b.name);
        });
    }, [processedMetrics, searchTerm, selectedBuckets]);

    // Helper to group metrics by bucket
    const groupedMetrics = useMemo(() => {
        const groups: Record<string, ProcessedMetric[]> = {};
        filteredMetrics.forEach(metric => {
            const bucket = metric.bucket || "Others";
            if (!groups[bucket]) groups[bucket] = [];
            groups[bucket].push(metric);
        });
        return groups;
    }, [filteredMetrics]);

    // Format numbers based on selected format and category
    const formatNumberWithUnit = (num: number | null, category?: string): string => {
        if (num === null || num === undefined || typeof num !== 'number' || isNaN(num)) return '-';

        // Handle different categories
        switch (category) {
            case 'percentage':
                return `${num.toFixed(2)}%`;
            case 'percentage-100':
                return `${(num * 100).toFixed(2)}%`;
            case 'rupees':
                // Apply number format for rupee values
                switch (numberFormat) {
                    case '₹L':
                        return `₹${(num / 100000).toFixed(2)}L`;
                    case '₹Cr':
                        return `₹${(num / 10000000).toFixed(2)}Cr`;
                    case '₹M':
                        return `₹${(num / 1000000).toFixed(2)}M`;
                    case '₹':
                    default:
                        return `₹${num.toLocaleString('en-IN')}`;
                }
            case 'decimal':
            default:
                // For decimal values, always show 2 decimal points
                return num.toFixed(2);
        }
    };

    // Format numbers for display
    const formatNumber = (num: number): string => {
        if (typeof num === 'number' && Math.abs(num) < 1) {
            return num.toFixed(2);
        }
        if (typeof num === 'number' && Math.abs(num) < 100) {
            return num.toFixed(1);
        }
        return num.toLocaleString('en-IN');
    };

    // Get background color based on value relative to normal range using threshold sign
    const getNormalRangeBackgroundColor = (value: number, normalRange: { min: number, max: number }, thresholdSign: string, threshold1: number | null, threshold2: number | null): string => {
        // If sign is "-" or thresholds are null, or value is null, don't apply any background color
        if (thresholdSign === '-' || value === null || value === undefined || isNaN(value) || threshold1 === null) return "";
        
        if (thresholdSign === '>') {
            // For ">" sign, values above or equal to threshold are concerning
            if (threshold2 !== null && value >= threshold2) {
                return "bg-red-200"; // Light red for values above or equal to threshold_2
            } else if (value >= threshold1) {
                return "bg-red-200"; // Light red for values above or equal to threshold_1
            } else {
                return "bg-green-50"; // Values below threshold_1 are good
            }
        } else {
            // For "<" sign, values below threshold are concerning
            if (threshold2 !== null && value <= threshold2) {
                return "bg-red-200"; // Light red for values below or equal to threshold_2
            } else if (value <= threshold1) {
                return "bg-red-200"; // Light red for values below or equal to threshold_1
            } else {
                return "bg-green-50"; // Values above threshold_1 are good
            }
        }
    };

    // Get percentage background color based on value (for year-over-year comparison)
    const getPercentageBackgroundColor = (percentText: string): string => {
        if (!percentText || percentText === "-") return "";
        const value = parseFloat(percentText.replace('+', '').replace('%', ''));
        if (value === 0) return "";
        if (value > 0) {
            if (value < 5) return "bg-green-50";
            if (value < 10) return "bg-green-100";
            if (value < 20) return "bg-green-200";
            if (value < 30) return "bg-green-300";
            return "bg-green-400";
        } else {
            const absValue = Math.abs(value);
            if (absValue < 5) return "bg-red-50";
            if (absValue < 10) return "bg-red-100";
            if (absValue < 20) return "bg-red-200";
            if (absValue < 30) return "bg-red-300";
            return "bg-red-400";
        }
    };

    // Calculate percent change
    const calculatePercentChange = (current: number, previous: number): string => {
        if (previous === 0 || current === null || previous === null) return '-';
        const percentChange = ((current - previous) / Math.abs(previous)) * 100;
        return `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
    };

    // Render icon component
    const renderIcon = (iconName: string) => {
        const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons];
        if (!IconComponent || typeof IconComponent !== 'function') {
            console.warn(`Icon not found: ${iconName}`);
            return <LucideIcons.BarChart3 size={16} className="text-blue-700" />;
        }
        // Type assertion to ensure IconComponent is a valid React component
        const ValidIconComponent = IconComponent as React.ComponentType<{ size: number; className: string }>;
        return <ValidIconComponent size={16} className="text-blue-700" />;
    };

    const getBucketColorScheme = (bucket?: string): ColorScheme => {
        if (!bucket) return "gray";
        if (bucket === "Leverage Risk") return "purple";
        if (bucket === "Growth Risk") return "cyan";
        if (bucket === "Liquidity Risk") return "blue";
        return "gray";
    };

    // Render a metric row with all years of data
    const renderMetricRow = (metric: ProcessedMetric) => {
        return (
            <TableRow key={metric.id}>
                <TableCell className="sticky left-0 bg-white py-3 flex-1">
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
                <TableCell className="py-3 w-48">
                    <div className="flex justify-center">
                        <BubbleTag 
                            text={metric.bucket || '-'} 
                            color={getBucketColorScheme(metric.bucket)}
                            fixedWidth="w-32"
                        />
                    </div>
                </TableCell>
                <TableCell className="bg-gray-100 py-3 w-48">
                    <div className="text-sm text-gray-600 text-center italic">
                        {metric.thresholdSign !== '-' && metric.threshold1 !== null ? `X ${metric.thresholdSign === '>' ? '<' : '>'} ${metric.threshold1}` : '-'}
                    </div>
                </TableCell>
                {/* <TableCell className="bg-gray-100 py-3 w-48">
                    <div className="text-sm text-gray-600 text-center italic">
                        {metric.industryMedian ? formatNumber(metric.industryMedian) : '-'}
                    </div>
                </TableCell> */}
                {metric.historicalValues.map((value: number | null, idx: number) => {
                    const year = dynamicYears[idx];
                    if (year < startYear) return null;
                    // Percent change logic
                    let percentChange: string | null = null;
                    if (percentageMode !== 'none' && idx > 0 && value !== null) {
                        if (percentageMode === 'prevYear') {
                            const prevValue = metric.historicalValues[idx - 1];
                            if (prevValue !== null) {
                                percentChange = calculatePercentChange(value, prevValue);
                            }
                        } else if (percentageMode === 'baseYear') {
                            const baseIdx = dynamicYears.indexOf(startYear);
                            const baseValue = baseIdx >= 0 ? metric.historicalValues[baseIdx] : null;
                            if (baseValue !== null) {
                                percentChange = calculatePercentChange(value, baseValue);
                            }
                        }
                    }
                    let bgColorClass = "";
                    if (percentageMode === 'none') {
                        // Use normal range background when no percentage comparison is selected
                        bgColorClass = value !== null && metric.normalRange ? getNormalRangeBackgroundColor(value, metric.normalRange, metric.thresholdSign, metric.threshold1, metric.threshold2) : "";
                    } else {
                        // Use percentage background for year-over-year comparisons
                        bgColorClass = percentChange ? getPercentageBackgroundColor(percentChange) : "";
                    }

                    return (
                        <TableCell key={year} className={cn("text-right py-3 min-h-[3.5rem]", bgColorClass)}>
                            <div className="flex flex-col items-end justify-center h-full">
                                <div>{formatNumberWithUnit(value, typeof metric.category === 'string' ? metric.category : undefined)}</div>
                                {percentageMode !== 'none' ? (
                                    percentChange ? (
                                        <span className={cn("text-xs italic font-medium", percentChange.startsWith('+') ? 'text-green-700' : percentChange.startsWith('-') ? 'text-red-700' : 'text-gray-500')}>{percentChange}</span>
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">Loading metrics...</div>
            </div>
        );
    }

    // Show no metrics message if no data is available
    if (!processedMetrics.length) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="text-gray-500 text-center">
                    <div className="text-lg font-medium mb-2">No metrics available</div>
                    <div className="text-sm">No financial metrics data is currently available for this merchant.</div>
                </div>
            </div>
        );
    }

    // Render filter controls
    const renderFilterControls = () => (
        <div className="flex flex-row flex-wrap gap-4 items-center w-full">
            {/* Only show format controls if there are rupee values */}
            {processedMetrics.some(metric => metric.category === 'rupees') && (
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Format</span>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {[
                            { value: '₹', label: 'Raw' },
                            { value: '₹L', label: '₹ L' },
                            { value: '₹Cr', label: '₹ Cr' },
                            { value: '₹M', label: '₹ M' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setNumberFormat(option.value as NumberFormatMode)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                    numberFormat === option.value
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {allBuckets.length > 0 && (
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Type</span>
                    <MultiSelect
                        options={allBuckets.map(bucket => ({
                            label: bucket,
                            value: bucket
                        }))}
                        value={selectedBuckets}
                        onValueChange={setSelectedBuckets}
                        placeholder="Select Types"
                        className="w-full min-w-[150px] border-gray-300 bg-inherit shadow"
                    />
                </div>
            )}
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Base Year</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    {dynamicYears.map(year => (
                        <button
                            key={year}
                            onClick={() => setStartYear(year)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                startYear === year
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
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
                        { value: 'none', label: 'Normal Range' },
                        { value: 'prevYear', label: 'Prev Year' },
                        { value: 'baseYear', label: 'Base Year' }
                    ].map(option => (
                        <button
                            key={option.value}
                            onClick={() => setPercentageMode(option.value as PercentageDisplayMode)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                percentageMode === option.value
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
            {showSearchBar && renderSearchBar()}
        </div>
    );

    // Render search bar
    const renderSearchBar = () => (
        // w-full forces a wrap in the filter row's flex flow, so the search
        // always gets its own line beneath the filters and spans it
        <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Search metrics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-8 w-full h-10 border-gray-300 bg-inherit shadow"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );


	return (
		<>
			<div className="relative">
				<div className="pb-4 pt-0">
					<div className="space-y-4">
						<div className={cn(
							"flex flex-row flex-wrap gap-4 items-center",
							filterBarAlignment === 'left' ? 'justify-start' : 'justify-end'
						)}>
							{filterBarAlignment === 'left' && renderFilterControls()}
							{filterBarAlignment === 'right' && renderFilterControls()}
						</div>
					</div>
				</div>
				<div className="overflow-x-auto min-w-0">
					<Table className="w-full border-0 [&_tr]:border-0 [&_td]:border-0 [&_th]:border-0">
						<TableHeader>
							<TableRow>
								<TableHead className="sticky left-0 bg-white z-10 py-2 flex-1">Metric</TableHead>
								<TableHead className="bg-white py-2 w-48 text-center">Type</TableHead>
								<TableHead className="bg-white py-2 w-48 text-center">Normal Range</TableHead>
								{/* <TableHead className="bg-white py-2 w-48 text-center">Industry Median</TableHead> */}
								{dynamicYears.filter(year => year >= startYear).map(year => (
									<TableHead key={year} className="text-right py-2">{year}</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredMetrics.map(metric => renderMetricRow(metric))}
						</TableBody>
					</Table>
				</div>
			</div>
			{selectedMetric && (
				<MetricInfo
					isOpen={!!selectedMetric}
					onClose={() => setSelectedMetric(null)}
					name={selectedMetric.name}
					formula={selectedMetric.formula}
					impactoncompany={selectedMetric.impactOnCompany}
				/>
			)}
		</>
	);
};

export default MetricStatement;
