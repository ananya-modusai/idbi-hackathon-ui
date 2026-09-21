'use client';

import { FC } from 'react';
import { TrendingUp, AlertTriangle, ExternalLink, ArrowRight } from 'lucide-react';
import { useMerchantNavigation } from '@/app/hooks/useMerchantNavigation';
import SectionHeaderWithRedFlags from '@/components/custom/SectionHeaderWithRedFlags';

interface KeyCreditInsightsSectionProps {
  merchantId: string;
}

type CardColor = 'orange' | 'red' | 'blue';

const BORDER_CLASSES: Record<CardColor, string> = {
  orange: 'border-l-orange-400',
  red: 'border-l-red-400',
  blue: 'border-l-blue-400',
};

const BADGE_CLASSES: Record<CardColor, string> = {
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
};

interface Insight {
  color: CardColor;
  category: string;
  headline: string;
  description: string;
  source: string;
  linkLabel: string;
  // External links open the source PDF in a new tab. Internal links navigate
  // within this app (Debt & Credit tab) instead of pointing at a third party.
  link: { type: 'external'; url: string } | { type: 'internal'; tab: string };
}

const INSIGHTS: Insight[] = [
  {
    color: 'orange',
    category: 'Debt Structure',
    headline: '~40% of FY25 borrowings sit outside the standalone parent',
    description:
      'Consolidated borrowings were ₹1,949.65 Cr versus ₹1,175.54 Cr standalone—a ₹774.11 Cr difference. Credit assessment therefore needs the project-SPV and subsidiary view, not only TARC Limited.',
    source: 'FY25 AOC-4 · computed',
    linkLabel: 'TARC FY25 Annual Report',
    link: { type: 'external', url: 'https://www.tarc.in/tarc_pdf/dis-46/2024-25.pdf' },
  },
  {
    color: 'red',
    category: 'Security Control',
    headline: 'Key project cash flows and subsidiary shares support the ₹1,250 Cr charge',
    description:
      'The security package includes pledged shares in TARC Projects and Echo Buildtech plus escrow accounts linked to Kailasa and Tripundra. This improves lender control but reduces unrestricted cash-flow flexibility.',
    source: 'MCA charge filing · 23 Oct 2024',
    linkLabel: 'Verify Credit Exposure',
    link: { type: 'internal', tab: 'debt-credit' },
  },
  {
    color: 'blue',
    category: 'Timing Mismatch',
    headline: 'Debt reduction precedes most accounting revenue from the flagship projects',
    description:
      'Management guides to debt reduction in FY27, while ~₹8,000 Cr of Kailasa and Ishva revenue recognition is expected only in FY29–30. Near-term repayment capacity therefore depends more on collections and escrow releases than reported revenue.',
    source: 'Q1 FY27 investor presentation',
    linkLabel: 'View presentation',
    link: { type: 'external', url: 'https://www.tarc.in/tarc_pdf/investor_presentation_11_08_2026.pdf' },
  },
  {
    color: 'orange',
    category: 'External Rating',
    headline: 'Operating momentum has improved, but the NCD remains on negative watch',
    description:
      'Q1 FY27 delivered ₹602 Cr pre-sales, ₹305 Cr collections and ₹22.65 Cr PAT. However, the ₹409 Cr NCD was reaffirmed at BBB− with Rating Watch with Negative Implications in May 2026.',
    source: 'TARC presentation · Infomerics',
    linkLabel: 'View Rating History',
    link: { type: 'internal', tab: 'debt-credit' },
  },
  {
    color: 'red',
    category: 'Needs Clarification',
    headline: 'ED search disclosure contains a material date inconsistency',
    description:
      'The 30 Apr 2026 filing states that an ED search occurred on 21 Apr 2025 and related to a pre-2020 transaction of the pre-demerged entity. TARC reported no allegation, order or operating impact; the one-year date gap should be clarified.',
    source: 'Exchange disclosure · 30 Apr 2026',
    linkLabel: 'View exchange disclosure',
    link: { type: 'external', url: 'https://www.tarc.in/tarc_pdf/disclosure_under_regulation_30_30_04_2026.pdf' },
  },
];

const InsightCard: FC<{ insight: Insight; index: number; merchantId: string }> = ({ insight, index, merchantId }) => {
  const { navigateToMerchantInsolvency } = useMerchantNavigation();

  return (
    <div className={`border border-l-4 ${BORDER_CLASSES[insight.color]} rounded-lg bg-white p-5 flex flex-col`}>
      <div className="flex items-start gap-3 mb-2">
        <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold shrink-0 ${BADGE_CLASSES[insight.color]}`}>
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 tracking-wide uppercase mb-1">
            <AlertTriangle className="h-3 w-3" />
            {insight.category}
          </div>
          <p className="text-base font-semibold text-gray-900">{insight.headline}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">{insight.description}</p>

      <div className="mt-auto flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs text-gray-400">{insight.source}</span>
        {insight.link.type === 'external' ? (
          <a
            href={insight.link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {insight.linkLabel} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <button
            onClick={() => navigateToMerchantInsolvency(merchantId, { initialTab: insight.link.type === 'internal' ? insight.link.tab : 'debt-credit' })}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {insight.linkLabel} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

const KeyCreditInsightsSection: FC<KeyCreditInsightsSectionProps> = ({ merchantId }) => {
  return (
    <div className="mt-10 min-w-0">
      <SectionHeaderWithRedFlags
        redFlags={[]}
        title="Key Credit Insights"
        icon={TrendingUp}
        iconColorClass="text-blue-600"
        showRedFlagsInHeader={false}
      />

      <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {INSIGHTS.map((insight, index) => (
          <InsightCard key={insight.category} insight={insight} index={index} merchantId={merchantId} />
        ))}
      </div>
    </div>
  );
};

export default KeyCreditInsightsSection;
