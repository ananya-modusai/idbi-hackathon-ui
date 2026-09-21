'use client';

import { FC, useState } from 'react';
import { CreditCard, ChevronDown, ChevronRight } from 'lucide-react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import mccClassification from '@/app/data/staticSnapshots/tarc/mcc-classification.json';

// Ported from the underwriting product's MCC Classification section
// (InvWebAnalysisTab.tsx) — same big-code layout, confidence bar and
// collapsible AI Reasoning panel, fed from the same static snapshot.

const MccClassificationSection: FC = () => {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const data = mccClassification;

  const code = String(data.mcc_code || '').trim().toUpperCase();
  const hasCode = code !== '' && code !== 'UNKNOWN' && code !== 'N/A' && code !== '-';
  const lob = String(data.lob || data.industry_group || '').trim();
  const hasLob = lob !== '' && lob !== '-';
  const bc = String(data.business_category || '').trim();
  const hasBc = bc !== '' && bc !== '-';
  const sc = String(data.sub_category || '').trim();
  const hasSc = sc !== '' && sc !== '-';
  const hasData = hasCode || hasLob || hasBc || hasSc;

  const isHighConfidence = (data.confidence_score || 0) >= 0.75;

  return (
    <div>
      <SectionHeaderWithFlags
        positiveFlags={[]}
        negativeFlags={[]}
        neutralFlags={[]}
        title="MCC Classification"
        icon={CreditCard}
        allowCollapse={false}
        titleRightElement={
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-[10px] font-bold text-purple-600 tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            AI LABELLED
          </div>
        }
      />

      {hasData ? (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-8">
            <div className="w-full md:w-1/4 flex flex-col justify-start shrink-0">
              <div>
                <div className="text-5xl font-extrabold text-gray-900 tracking-tight">{data.mcc_code || '-'}</div>
                <div className="text-sm font-semibold text-gray-500 mt-2">{data.mcc_description || 'N/A'}</div>
              </div>
            </div>

            <div className="hidden md:block w-px bg-gray-100 self-stretch my-1" />

            <div className="flex-1 flex flex-col justify-start gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">LOB</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{data.lob || data.industry_group || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Business Category</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{data.business_category || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Sub Category</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{data.sub_category || '-'}</div>
                </div>
              </div>

              {data.confidence_score !== undefined && (
                <div>
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Confidence Score</div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="relative flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isHighConfidence ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(Math.max((data.confidence_score || 0) * 100, 0), 100)}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${isHighConfidence ? 'text-emerald-600' : 'text-amber-600'} shrink-0`}>
                      {data.confidence_score?.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {data.reasoning && (
            <div className="border-t border-gray-100 -mx-6 -mb-6 px-6 bg-gray-50/50 rounded-b-xl">
              <div
                className="flex items-center justify-between py-3.5 cursor-pointer select-none"
                onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
              >
                <div className="flex items-center gap-2">
                  {isReasoningExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="text-xs font-bold text-gray-600 tracking-wider uppercase">AI Reasoning</span>
                </div>
              </div>

              {isReasoningExpanded && (
                <div className="pb-4 pl-6 pr-6">
                  <p className="text-xs text-gray-600 leading-relaxed">{data.reasoning}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center text-gray-500 text-sm">
          No MCC Classification data available for this case.
        </div>
      )}
    </div>
  );
};

export default MccClassificationSection;
