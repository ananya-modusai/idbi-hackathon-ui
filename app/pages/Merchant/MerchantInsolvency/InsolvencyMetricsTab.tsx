import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useActiveContext } from '@/app/layout/ActiveContext/useActiveContext';
import { useMerchantIdStore } from '@/app/store/merchant/merchantIdStore';
import InsolvencyPageHeader from './Components/InsolvencyPageHeader';
import MetricStatement from './Components/MetricStatement';
import { useWorkspace } from '@/app/layout/Workspace/WorkspaceContext';
import SectionHeaderWithFlags from '@/components/custom/SectionHeaderWithFlags';
import { BarChart3 } from 'lucide-react';
import CustomLoader from '@/components/custom/CustomLoader';
import MetricsPDFTemplate from './Report/Metrics/MetricsPDFTemplate';
import { generateMetricsPDF } from './Report/utils/pdfUtils';
import { industryService } from '@/app/services/industryServices';
import { metricsService } from '@/app/services/metricsService';

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

interface InsolvencyMetricsTabProps {
	merchantId: string;
}



const InsolvencyMetricsTab: React.FC<InsolvencyMetricsTabProps> = ({ merchantId: propMerchantId }) => {
	const { activeContexts } = useActiveContext();
	const { merchantIdList, selectedMerchantId } = useMerchantIdStore();
	const { setActiveNavigation } = useWorkspace();
	const pdfTemplateRef = useRef<HTMLDivElement>(null);
	
	// State for PDF data
	// Selected date/version from page header (used as runDate for PDFs)
	const [selectedDate, setSelectedDate] = useState<string>('');
	
	const [processedMetrics, setProcessedMetrics] = useState<ProcessedMetric[]>([]);
    const [startYear, setStartYear] = useState<number>(2020);
    const [availableYears, setAvailableYears] = useState<number[]>([2020, 2021, 2022, 2023, 2024]);
	const [numberFormat, setNumberFormat] = useState<string>('₹');
	const [merchantIndustry, setMerchantIndustry] = useState<{ industry: string; risk_segment: string } | null>(null);
	const [loading, setLoading] = useState(true);
	
	React.useEffect(() => {
		// Set active navigation to Merchant/Insolvency when component mounts
		setActiveNavigation({ group: "Merchant", item: "Insolvency" });
	}, [setActiveNavigation]);
	
	const merchantId = propMerchantId || activeContexts?.merchant || selectedMerchantId;
	const activeMerchant = merchantIdList.find(m => m.id === merchantId);

	// Fetch merchant industry data
	useEffect(() => {
		const fetchMerchantIndustry = async () => {
			if (activeMerchant?.id) {
				const industryData = await industryService.getMerchantIndustry(activeMerchant.id);
				setMerchantIndustry(industryData);
			}
		};

		fetchMerchantIndustry();
	}, [activeMerchant?.id]);

	// Fetch metrics data for PDF
	useEffect(() => {
		const fetchMetrics = async () => {
			if (!merchantId) {
				setLoading(false);
				return;
			}
			
			try {
				setLoading(true);
				const response = await metricsService.getMetricsByYear(merchantId);
				const apiMetrics = response.metrics || [];
				
				// Determine available years from API data
				const yearSet = new Set<number>();
				apiMetrics.forEach(metric => {
					Object.keys(metric).forEach(key => {
						if (/^\d{4}$/.test(key)) {
							yearSet.add(parseInt(key));
						}
					});
				});
				const dynamicYears = yearSet.size > 0 ? Array.from(yearSet).sort((a, b) => a - b) : [2020, 2021, 2022, 2023, 2024];
				setAvailableYears(dynamicYears);
				
				// Set start year to the first available year if not already set or invalid
				if (dynamicYears.length > 0) {
					setStartYear(dynamicYears[0]);
				}

				// Convert API metrics to ProcessedMetric format
				const processed: ProcessedMetric[] = apiMetrics.map((apiMetric) => {
					const historicalValues: (number | null)[] = [];
					
					// Extract year values
					dynamicYears.forEach(year => {
						const yearValue = apiMetric[year.toString()];
						if (yearValue !== '-' && yearValue !== undefined && yearValue !== null) {
							historicalValues.push(Number(yearValue));
						} else {
							historicalValues.push(null);
						}
					});

					// Parse normal range
					let normalRange;
					if (apiMetric.threshold_1 !== null && apiMetric.threshold_1 !== undefined && 
						apiMetric.threshold_2 !== null && apiMetric.threshold_2 !== undefined) {
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
						normalRange = null;
					}

					// Calculate relative values
					const calculateRelativeToNormalRange = (value: number | null): number | null => {
						if (value === null || value === undefined || isNaN(value)) return null;
						
						const sign = apiMetric.threshold_redflag_sign;
						
						if (sign === '-' || 
							apiMetric.threshold_1 === null || apiMetric.threshold_1 === undefined ||
							apiMetric.threshold_2 === null || apiMetric.threshold_2 === undefined) {
							return null;
						}
						
						const threshold = sign === '>' ? (normalRange?.max ?? 0) : (normalRange?.min ?? 0);
						
						if (sign === '>') {
							return value > threshold ? ((value - threshold) / threshold) * 100 : 0;
						} else {
							return value < threshold ? ((threshold - value) / threshold) * 100 : 0;
						}
					};

					const relativeValues = historicalValues.map(calculateRelativeToNormalRange);

					return {
						id: apiMetric.metric_code,
						name: apiMetric.metric,
						type: 'Financial',
						icon: 'BarChart3',
						normalRange,
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
				const BUCKET_ORDER = ["Leverage Risk", "Growth Risk", "Liquidity Risk", "Others"];
				const sortedProcessed = [...processed].sort((a, b) => {
					const indexA = BUCKET_ORDER.indexOf(a.bucket || "Others");
					const indexB = BUCKET_ORDER.indexOf(b.bucket || "Others");
					
					const finalIndexA = indexA === -1 ? 99 : indexA;
					const finalIndexB = indexB === -1 ? 99 : indexB;

					if (finalIndexA !== finalIndexB) {
						return finalIndexA - finalIndexB;
					}
					return a.name.localeCompare(b.name);
				});

				setProcessedMetrics(sortedProcessed);
			} catch (err) {
				console.error('Failed to fetch metrics:', err);
				setProcessedMetrics([]);
			} finally {
				setLoading(false);
			}
		};

		fetchMetrics();
	}, [merchantId]);

	// Handle PDF generation
	const handleGenerateReport = async () => {
		if (!activeMerchant || !pdfTemplateRef.current) {
			console.error('Missing required data for PDF generation');
			return;
		}

		try {
			await generateMetricsPDF(
				pdfTemplateRef.current,
				activeMerchant.legalName,
				merchantIndustry || activeMerchant.industry || null,
				activeMerchant.cin || activeMerchant.id,
				{
					filename: `${activeMerchant.legalName.replace(/[^a-z0-9]/gi, ' ')} Metrics Report.pdf`
					, runDate: selectedDate || null
				}
			);
		} catch (error) {
			console.error('Error generating PDF:', error);
		}
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

	return (
		<motion.div
			className="space-y-6 px-2 min-w-0"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			{activeMerchant ? (
				<InsolvencyPageHeader
					activeMerchant={activeMerchant}
					sections={[
						{ id: 'metrics-overview', title: 'Metrics Overview' },
						{ id: 'metric-statement', title: 'Metric Statement' }
					]}
					onGenerateReport={handleGenerateReport}
					onDateChange={(date) => setSelectedDate(date)}
				/>
			) : (
				<CustomLoader 
					loading={true}
					specs={{
						type: 'spinner',
						size: 'lg',
						color: 'blue',
						text: 'Loading merchant information...'
					}}
				/>
			)}

			<motion.div variants={itemVariants}>
				<SectionHeaderWithFlags
					title="Ratio Analysis"
					icon={BarChart3}
					iconColorClass="text-blue-700"
					positiveFlags={[]}
					negativeFlags={[]}
					neutralFlags={[]}
					mildPositiveFlags={[]}
					mildNegativeFlags={[]}

					allowCollapse={true}
				/>
			</motion.div>

			<motion.div variants={itemVariants}>
				<MetricStatement 
					merchantId={merchantId || undefined} 
					filterBarAlignment="left"
					showSearchBar={true}
				/>
			</motion.div>

			{/* Hidden PDF Template */}
			<div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
				<div ref={pdfTemplateRef}>
					{activeMerchant && (
						<MetricsPDFTemplate
							activeMerchant={activeMerchant}
							processedMetrics={processedMetrics}
							startYear={startYear}
							availableYears={availableYears}
							numberFormat={numberFormat}
							merchantIndustry={merchantIndustry}
						/>
					)}
				</div>
			</div>
		</motion.div>
	);
};

export default InsolvencyMetricsTab;
