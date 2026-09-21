'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { MerchantItemType } from '@/app/types';
import './MetricsPDFTemplate.css';
import SectionHeader from '../components/SectionHeader';

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

interface MetricsPDFTemplateProps {
    activeMerchant: MerchantItemType;
    processedMetrics: ProcessedMetric[];
    startYear: number;
    availableYears: number[];
    numberFormat: string;
    merchantIndustry?: {
        industry: string;
        risk_segment: string;
    } | null;
}



const MetricsPDFTemplate: React.FC<MetricsPDFTemplateProps> = ({
    activeMerchant,
    processedMetrics,
    startYear,
    availableYears,
    numberFormat
}) => {
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

    // ...existing code (background coloring logic removed because not used by current template)

    const filteredYears = availableYears.filter(year => year >= startYear);

    // Debug logging
    console.log('MetricsPDFTemplate rendering with:', {
        merchantName: activeMerchant.legalName,
        metricsCount: processedMetrics.length,
        startYear,
        filteredYears,
        firstMetric: processedMetrics[0]
    });

    return (
        <div className="pdf-metrics-template">
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
                        <h2 className="pdf-report-title">Metrics Report</h2>
                        <p className="pdf-report-date">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div> */}

            {/* Metrics Analysis Section */}
            <div className="pdf-section pdf-metrics-section">
                <SectionHeader title="Ratio Analysis" Icon={BarChart3} />
                <div className="pdf-section-content">
                    {processedMetrics.length > 0 ? (
                        <div className={`pdf-metrics-page`}>
                            <div className="pdf-metrics-table-container">
                                <table className="pdf-metrics-table">
                                    <thead>
                                        <tr>
                                            <th className="pdf-metric-name-header">Metric</th>
                                            <th className="pdf-metric-type-header">Type</th>
                                            <th className="pdf-normal-range-header">Normal Range</th>
                                            {filteredYears.map(year => (
                                                <th key={year} className="pdf-year-header">{year}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processedMetrics.map(metric => (
                                            <tr key={metric.id} className={`pdf-metric-row`}>
                                                <td className="pdf-metric-name">
                                                    <div className="pdf-metric-name-content"><span>{metric.name}</span></div>
                                                </td>
                                                <td className="pdf-metric-type">
                                                    <div className="pdf-bucket-badge-container">
                                                        <span className={`pdf-bucket-badge ${metric.bucket?.toLowerCase().includes('profit') ? 'profit' : metric.bucket?.toLowerCase().includes('liquid') ? 'liquid' : metric.bucket?.toLowerCase().includes('efficiency') ? 'efficiency' : metric.bucket?.toLowerCase().includes('leverage') ? 'leverage' : metric.bucket?.toLowerCase().includes('valuation') ? 'valuation' : metric.bucket?.toLowerCase().includes('growth') ? 'growth' : 'other'}`}>
                                                            {metric.bucket || '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="pdf-normal-range">
                                                    {metric.thresholdSign !== '-' && metric.threshold1 !== null ? `X ${metric.thresholdSign === '>' ? '<' : '>'} ${metric.threshold1}` : '-'}
                                                </td>
                                                {metric.historicalValues.map((value: number | null, idx: number) => {
                                                    const year = availableYears[idx]; if (year < startYear) return null;
                                                    return <td key={year} className={`pdf-metric-values`}>{formatNumberWithUnit(value, typeof metric.category === 'string' ? metric.category : undefined)}</td>;
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <p className="pdf-no-data">No financial metrics data available for this merchant.</p>
                    )}
                </div>
            </div>

            {/* Summary Section */}
            {/* <div className="pdf-section">
                <div className="pdf-section-header">
                    <Building2 className="pdf-section-icon" />
                    <h2 className="pdf-section-title">Metrics Summary</h2>
                </div>
                <div className="pdf-section-content">
                    <div className="pdf-summary-grid">
                        <div className="pdf-summary-item">
                            <div className="pdf-summary-label">Total Metrics</div>
                            <div className="pdf-summary-value">{processedMetrics.length}</div>
                        </div>
                        <div className="pdf-summary-item">
                            <div className="pdf-summary-label">Analysis Period</div>
                            <div className="pdf-summary-value">{startYear} - {Math.max(...filteredYears)}</div>
                        </div>
                        <div className="pdf-summary-item">
                            <div className="pdf-summary-label">Years Covered</div>
                            <div className="pdf-summary-value">{filteredYears.length} years</div>
                        </div>
                        <div className="pdf-summary-item">
                            <div className="pdf-summary-label">Number Format</div>
                            <div className="pdf-summary-value">{numberFormat}</div>
                        </div>
                    </div>
                </div>
            </div> */}

            {/* Legend Section */}
            {/* <div className="pdf-section">
                <div className="pdf-section-header">
                    <h3 className="pdf-section-title">Color Legend</h3>
                </div>
                <div className="pdf-section-content">
                    <div className="pdf-legend">
                        <div className="pdf-legend-item">
                            <div className="pdf-legend-color pdf-cell-green"></div>
                            <span>Within Normal Range</span>
                        </div>
                        <div className="pdf-legend-item">
                            <div className="pdf-legend-color pdf-cell-red"></div>
                            <span>Outside Normal Range (Risk Indicator)</span>
                        </div>
                        <div className="pdf-legend-item">
                            <div className="pdf-legend-color pdf-cell-neutral"></div>
                            <span>No Data / Not Applicable</span>
                        </div>
                    </div>
                </div>
            </div> */}

            {/* Footer */}
            {/* <div className="pdf-footer">
                <p>This report contains confidential financial metrics and analysis.</p>
                <p>© {new Date().getFullYear()} Insolvency Analysis Platform</p>
            </div> */}
        </div>
    );
};

export default MetricsPDFTemplate;