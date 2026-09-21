'use client';

import { FC, useRef, useState, useEffect } from 'react';
import { useActiveContext } from '@/app/layout/ActiveContext/useActiveContext';
import { useMerchantIdStore } from '@/app/store/merchant/merchantIdStore';
import InsolvencyPageHeader from './Components/InsolvencyPageHeader';
import { ExternalInsightsComponent, insolvencyExternalInsightsConfig } from '@/components/custom/ExternalInsights';
import CustomLoader from '@/components/custom/CustomLoader';
import ExternalInsightsPDFTemplate from './Report/ExternalInsights/ExternalInsightsPDFTemplate';
import { generateExternalInsightsPDF, preparePDFElement } from './Report/utils/pdfUtils';
import { industryService } from '@/app/services/industryServices';
import { merchantService } from '@/app/services/merchantServices';
import type { ApiResponse } from '@/components/custom/ExternalInsights/ExternalInsightsComponent';

interface InsolvencyExternalInsightsTabProps {
  merchantId: string;
  initialSection?: string | null;
}

const InsolvencyExternalInsightsTab: FC<InsolvencyExternalInsightsTabProps> = ({ merchantId, initialSection = undefined }) => {
  const { activeContexts } = useActiveContext();
  const { merchantIdList, selectedMerchantId } = useMerchantIdStore();
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  // State for PDF data
  const [insightsData, setInsightsData] = useState<Record<string, any[]>>({});
  const [redFlagsData, setRedFlagsData] = useState<Record<string, any[]>>({});
  // Start with an empty object so the child component skips its own fetch (which would omit the date)
  const [externalApiResponses, setExternalApiResponses] = useState<ApiResponse>({});
  const [merchantIndustry, setMerchantIndustry] = useState<{ industry: string; risk_segment: string } | null>(null);
  const [loading, setLoading] = useState(false);
  // Selected date/version from page header (used as runDate for PDFs)
  const [selectedDate, setSelectedDate] = useState<string>('');

  const merchantIdToUse = merchantId || activeContexts?.merchant || selectedMerchantId;
  const activeMerchant = merchantIdList.find(m => m.id === merchantIdToUse);

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

  // Fetch external insights data for PDF
  useEffect(() => {
    const fetchExternalInsightsData = async () => {
      // Ensure we always pass a version date on first load
      if (!merchantIdToUse || !selectedDate) return;

      try {
        setLoading(true);
        // format selectedDate to YYYY-MM-DD if provided
        const formatToYYYYMMDD = (d?: string) => {
          if (!d) return undefined;
          // If already in YYYY-MM-DD, return as-is
          if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
          const parsed = new Date(d);
          if (isNaN(parsed.getTime())) return d;
          return parsed.toISOString().slice(0, 10);
        };

        const formattedDate = formatToYYYYMMDD(selectedDate || undefined);

        // Fetch main external data, including monthly_range when selected
        const rawData = await merchantService.getMerchantExternalData(merchantIdToUse, formattedDate);

        // Fetch audit and annual reports
        let auditData = null;
        let annualData = null;

        try {
          auditData = await merchantService.getMerchantAuditReportInsights(merchantIdToUse);
        } catch (err) {
          console.warn('Failed to fetch audit reports:', err);
        }

        try {
          annualData = await merchantService.getMerchantAnnualReportInsights(merchantIdToUse);
        } catch (err) {
          console.warn('Failed to fetch annual reports:', err);
        }

        // Normalize API responses: transformer expects objects with a `data` array
        const normalizeResponse = (resp: any) => {
          if (!resp) return undefined;
          if (Array.isArray(resp)) return { data: resp };
          // If it's an object and has a data property that's an array, return as-is
          if (resp && typeof resp === 'object' && Array.isArray(resp.data)) return resp;
          // Otherwise, attempt to wrap single items
          return { data: Array.isArray(resp) ? resp : (resp ? [resp] : []) };
        };

        const mainResp = normalizeResponse(rawData);
        const auditResp = normalizeResponse(auditData);
        const annualResp = normalizeResponse(annualData);

        // Store raw API responses so the UI component can transform them
        setExternalApiResponses({ main: mainResp, audit: auditResp, annual: annualResp });

        // Transform data locally (used for PDF template and red flags generation)
        const transformedData = insolvencyExternalInsightsConfig.dataTransformer({
          main: mainResp,
          audit: auditResp || undefined,
          annual: annualResp || undefined
        });

        setInsightsData(transformedData);

        // Generate red flags for each section
        const redFlags: Record<string, any[]> = {};
        Object.keys(transformedData).forEach(sectionKey => {
          const items = transformedData[sectionKey] || [];
          if (items.length > 0) {
            redFlags[sectionKey] = insolvencyExternalInsightsConfig.redFlagMapper(sectionKey, items, merchantIdToUse);
          }
        });

        setRedFlagsData(redFlags);
      } catch (err) {
        console.error('Failed to fetch external insights data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExternalInsightsData();
  }, [merchantIdToUse, selectedDate]);

  // Handle PDF generation
  const handleGenerateReport = async () => {
    if (!activeMerchant || !pdfTemplateRef.current) {
      console.error('Missing required data for PDF generation');
      return;
    }

    try {
        await generateExternalInsightsPDF(
        pdfTemplateRef.current,
        activeMerchant.legalName,
        merchantIndustry, // Pass the industry object
        activeMerchant.cin || activeMerchant.id, // Pass the CIN
        {
          filename: `${activeMerchant.legalName.replace(/[^a-z0-9]/gi, ' ')} External Insights Report.pdf`
          , runDate: selectedDate || null
        }
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="space-y-6 px-2 min-w-0">
      {activeMerchant ? (
        <InsolvencyPageHeader
          activeMerchant={activeMerchant}
          sections={[
            { id: 'external-insights', title: 'External Insights' }
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
      
      <ExternalInsightsComponent 
        config={insolvencyExternalInsightsConfig}
        contextId={merchantIdToUse || undefined}
        initialSection={initialSection}
        externalApiResponses={externalApiResponses}
        externalLoading={loading}
      />

      {/* Hidden PDF Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={pdfTemplateRef}>
          {/* Only mount the PDF template when we have transformed insights data to avoid showing the no-data message */}
          {activeMerchant && Object.keys(insightsData).some(k => Array.isArray(insightsData[k]) && insightsData[k].length > 0) && (
            <>
              {console.log('Rendering PDF template with insights counts:', Object.keys(insightsData).reduce((acc, key) => (acc + (insightsData[key]?.length || 0)), 0))}
              <ExternalInsightsPDFTemplate
                activeMerchant={activeMerchant}
                insightsData={insightsData}
                redFlagsData={redFlagsData}
                merchantIndustry={merchantIndustry}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsolvencyExternalInsightsTab;