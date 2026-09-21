'use client';

import React from 'react';
import {
  Building2
} from 'lucide-react';
import { BC_FIELD_GROUPS, BCData } from '../../InvWorkspace/components/businessClassificationSampleData';
import { linkifyText } from '../utils/pdfLinkUtils';

interface InvMerchantOverviewPDFTemplateProps {
  merchantName: string;
  mid: string;
  website: string;
  initials: string;
  runDate: string;
  riskInfo: { label: string; score: string; color: string };

  // Data for section
  businessIdentity: any;
  transformedBCData: BCData;
  bcAnalysis: any;
  redFlags?: any[] | null;
  gstnDetailsData?: any | null;
}

const InvMerchantOverviewPDFTemplate: React.FC<InvMerchantOverviewPDFTemplateProps> = ({
  merchantName,
  mid,
  website,
  initials,
  runDate,
  riskInfo,
  businessIdentity,
  transformedBCData,
  bcAnalysis,
  redFlags,
  gstnDetailsData
}) => {
  const formatHsnDescription = (desc: string): string => {
    if (!desc) return "";
    const minorWords = new Set([
      "and", "or", "of", "in", "on", "at", "to", "for", "with", "by", 
      "a", "an", "the", "whether", "not", "as", "into", "through", 
      "over", "under", "from", "single", "sheets"
    ]);
    
    return desc
      .toLowerCase()
      .split(/\s+/)
      .map((word, idx) => {
        const cleanWord = word.replace(/[^a-z0-9]/g, "");
        if (idx > 0 && minorWords.has(cleanWord)) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };

  return (
    <div className="p-8 bg-white font-sans text-gray-900 overflow-visible" style={{ width: '1122px', margin: '0 auto' }}>

      {/* 1. Business Identity Overview */}
      <div className="mb-10" style={{ breakInside: 'avoid' }}>
        <div className="flex items-center gap-2 mb-4 border-b-2 border-blue-600 pb-2">
          <Building2 className="text-blue-600 w-6 h-6" strokeWidth={2} />
          <h2 className="text-xl font-bold text-blue-800">Business Identity Overview</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {BC_FIELD_GROUPS.map((group, gIdx) => {
            const conflictCount = group.fields.filter(
              (f) => bcAnalysis[f.key]?.status === "conflict"
            ).length;

            return (
              <div key={gIdx} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm" style={{ breakInside: 'avoid' }}>
                <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-start gap-4 bg-gray-50/50">
                  <span className="font-bold text-gray-700 text-sm">{group.label}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100/50">
                      <th className="px-4 py-2 text-left font-semibold text-gray-600 border-b w-1/4">Field</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600 border-b w-1/4">Onboarding Data</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600 border-b w-1/4">Website Data</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600 border-b w-1/4">External Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.fields.map((field, fIdx) => (
                      <tr key={fIdx} className="hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0">
                        <td className="px-4 py-2 font-medium text-gray-700 border-b">{field.label}</td>
                        <td className="px-4 py-2 border-b text-gray-600" style={{ whiteSpace: 'pre-line' }}>{linkifyText(transformedBCData[field.key]?.onboarding || '-')}</td>
                        <td className="px-4 py-2 border-b text-gray-600" style={{ whiteSpace: 'pre-line' }}>{linkifyText(transformedBCData[field.key]?.website || '-')}</td>
                        <td className="px-4 py-2 border-b text-gray-600" style={{ whiteSpace: 'pre-line' }}>{linkifyText(transformedBCData[field.key]?.probe42 || '-')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. GSTN Details */}
      <div className="mb-10" style={{ breakInside: 'avoid' }}>
        <div className="flex items-center gap-2 mb-4 border-b-2 border-blue-600 pb-2">
          <Building2 className="text-blue-600 w-6 h-6" strokeWidth={2} />
          <h2 className="text-xl font-bold text-blue-800">GSTN Details</h2>
        </div>

        {(() => {
          const innerData = (gstnDetailsData?.data as any)?.data;
          const gstnRecords = Array.isArray(innerData?.gstn_records) ? innerData.gstn_records : [];

          if (gstnRecords.length === 0) {
            return (
              <div className="text-gray-500 text-center py-4 border border-gray-200 rounded-lg text-sm bg-gray-50/30">
                No GSTN Details available
              </div>
            );
          }

          return (
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm" style={{ breakInside: 'avoid' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100/50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-600 w-[14%]">Merchant Name</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-600 w-[12%]">GSTN</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-600 w-[8%]">PAN</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-600 w-[8%]">State</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-600 w-[8%]">Reg. Date</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-600 w-[8%]">Status</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-600 w-[30%]">HSN Codes</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-600 w-[8%]">Sources</th>
                  </tr>
                </thead>
                <tbody>
                  {gstnRecords.map((record: any, idx: number) => {
                    const merchantName = record.details?.legal_name || record.raw?.enrichment_details?.online_provider?.details?.legal_name?.value || "-";
                    const gstin = record.gstin || record.raw?.enrichment_details?.online_provider?.details?.gstin?.value || "-";
                    const pan = record.details?.pan || "-";
                    const state = record.pan_lookup_items?.[0]?.state || record.raw?.enrichment_details?.online_provider?.details?.state_jurisdiction?.value || "-";

                    const rawRegDate = record.details?.registration_date || record.raw?.enrichment_details?.online_provider?.details?.registration_date?.value || "";
                    let formattedDate = "-";
                    if (rawRegDate) {
                      try {
                        const date = new Date(rawRegDate);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        formattedDate = `${day}-${month}-${year}`;
                      } catch (e) {
                        formattedDate = rawRegDate.split("T")[0] || rawRegDate;
                      }
                    }

                    const status = String(record.details?.status || record.raw?.enrichment_details?.online_provider?.details?.status?.value || "").trim();
                    const isStatusActive = status.toLowerCase() === "active";

                    const hsnDetails = record.hsn_details || [];
                    const sources = record.discovery?.paths
                      ? Array.from(new Set(record.discovery.paths.map((p: any) => p.source).filter(Boolean)))
                      : [];

                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0">
                        <td className="px-4 py-2.5 font-semibold text-gray-900">{merchantName}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900">{gstin}</td>
                        <td className="px-4 py-2.5 text-gray-700 font-medium">{pan}</td>
                        <td className="px-4 py-2.5 text-gray-600">{state}</td>
                        <td className="px-4 py-2.5 text-gray-600">{formattedDate}</td>
                        <td className="px-4 py-2.5">
                          {status ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${isStatusActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {status}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700 font-medium text-xs">
                          {hsnDetails.length === 0 ? (
                            "-"
                          ) : (
                            <div className="flex flex-col gap-1 text-[11px] text-gray-700">
                              {hsnDetails.map((hsn: any, hIdx: number) => {
                                const code = hsn.hsncd || hsn.saccd;
                                const description = hsn.gdes || hsn.sdes;
                                if (!code && !description) return null;
                                return (
                                  <div key={hIdx} className="leading-relaxed">
                                    {code && <span className="font-semibold text-gray-900">{code}</span>}
                                    {description && ` - ${formatHsnDescription(description)}`}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {sources.length === 0 ? "-" : (
                            <div className="flex flex-wrap gap-1">
                              {sources.map((src: any) => (
                                <span key={src} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-800 uppercase border border-blue-200">
                                  {src}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default InvMerchantOverviewPDFTemplate;
