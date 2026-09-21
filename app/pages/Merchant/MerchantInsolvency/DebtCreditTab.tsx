'use client';

import { FC, useMemo, useState } from 'react';
import { Star, ShieldAlert, Award, Clock } from 'lucide-react';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import creditRatings from '@/app/data/tarc_rerun_peer_comparison/credit_ratings.json';
import ChargesTab from './ChargesTab';
import DebtProfileTab from './DebtProfileTab';

interface DebtCreditTabProps {
  merchantId: string;
}

type RatingsFilter = 'Accepted' | 'Unaccepted';

// Recent ratings leave OUTLOOK as "-" and put the watch in REMARKS, e.g.
// "Under Rating Watch with Negative Implications" -> "Negative Watch".
const outlookOrWatch = (outlook?: string | null, remarks?: string | null) => {
  const o = (outlook || '').trim();
  if (o && o !== '-') return o;
  const r = (remarks || '').toLowerCase();
  if (r.includes('watch')) {
    if (r.includes('negative')) return 'Negative Watch';
    if (r.includes('positive')) return 'Positive Watch';
    return 'Rating Watch';
  }
  return '—';
};

const StatCard: FC<{ icon: React.ReactNode; label: string; value: string; sub?: string }> = ({ icon, label, value, sub }) => (
  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
    <div className="w-10 h-10 rounded-full bg-blue-50/70 border border-blue-100/50 flex items-center justify-center text-blue-600 shadow-inner flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-gray-500 tracking-wide">{label}</p>
      <div className="flex items-baseline gap-2 mt-0.5">
        <span className="text-xl font-bold text-gray-900 leading-none">{value}</span>
        {sub && <span className="text-[11px] text-gray-400 font-normal truncate">{sub}</span>}
      </div>
    </div>
  </div>
);

const DebtCreditTab: FC<DebtCreditTabProps> = () => {
  const [ratingsFilter, setRatingsFilter] = useState<RatingsFilter>('Accepted');

  const latestRating = useMemo(() => {
    const sorted = [...creditRatings.ratings].sort(
      (a, b) => new Date(b.DATE || '').getTime() - new Date(a.DATE || '').getTime()
    );
    return sorted[0];
  }, []);

  return (
    <div className="mt-4 min-w-0">
      <div className="min-w-0">
        <SectionHeaderWithFlags
          title="Credit Bureau Summary"
          icon={ShieldAlert}
          iconColorClass="text-blue-700"
          titleColorClass="text-blue-700"
          positiveFlags={[]}
          negativeFlags={[]}
          allowCollapse={false}
        />

        <div className="mt-2 border border-dashed border-gray-200 rounded-xl bg-white py-14 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-blue-600" />
          </div>
          <p className="mt-4 text-base font-semibold text-gray-900">
            Commercial credit bureau data is currently unavailable for this company.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Data required:</span> Commercial bureau
            report from CIBIL, CRIF High Mark, Experian or Equifax
          </p>
        </div>
      </div>

      <DebtProfileTab />

      <div className="flex items-center justify-between mt-16">
        <div className="flex flex-row items-center">
          <Star className="h-6 w-6 text-blue-600 inline-block mr-2" />
          <p className="text-lg font-semibold text-blue-700">
            External Credit Ratings
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['Accepted', 'Unaccepted'] as RatingsFilter[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setRatingsFilter(opt)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                ratingsFilter === opt ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {opt} Ratings
            </button>
          ))}
        </div>
      </div>
      <div className="w-full border-b border-gray-200 mt-2 mb-4" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <StatCard
          icon={<Award className="h-5 w-5" />}
          label="Latest Rating"
          value={latestRating?.RATING || '—'}
          sub={latestRating?.AGENCY?.trim()}
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Rated Amount"
          value={
            typeof latestRating?.AMOUNT === 'number'
              ? `₹${latestRating.AMOUNT.toLocaleString('en-IN')} Cr`
              : '—'
          }
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Rating Status"
          value={outlookOrWatch(latestRating?.OUTLOOK, latestRating?.REMARKS)}
        />
      </div>

      {ratingsFilter === 'Accepted' ? (
        <CustomTableView
          columns={[
            { key: 'date', header: 'Rating Date', width: '14%' },
            { key: 'agency', header: 'Agency', width: '14%' },
            { key: 'instrument', header: 'Instrument', width: '18%' },
            { key: 'amount', header: 'Amount (₹ Cr)', align: 'right', width: '13%' },
            { key: 'rating', header: 'Rating', width: '11%' },
            { key: 'action', header: 'Action', width: '14%' },
            { key: 'outlook', header: 'Outlook / Watch', width: '16%' },
          ]}
          data={creditRatings.ratings.map((r) => ({
            date: r.DATE || '',
            agency: r.AGENCY?.trim() || '',
            instrument: r.INSTRUMENT || '',
            amount: typeof r.AMOUNT === 'number' ? r.AMOUNT.toLocaleString('en-IN') : '',
            rating: r.RATING || '-',
            action: r.ACTION || '-',
            outlook: outlookOrWatch(r.OUTLOOK, r.REMARKS),
          }))}
          className="w-full"
          initialRowLimit={5}
        />
      ) : (
        <CustomTableView
          columns={[
            { key: 'sno', header: 'S.No' },
            { key: 'agency', header: 'Rating Agency' },
            { key: 'instrument', header: 'Instrument' },
            { key: 'amount', header: 'Amount (INR Cr)', align: 'right' },
            { key: 'rating', header: 'Rating' },
            { key: 'dateOfNonAcceptance', header: 'Date of Non-Acceptance' },
            { key: 'remarks', header: 'Remarks' },
          ]}
          data={creditRatings.unacceptedRatings.map((r, index) => ({
            sno: index + 1,
            agency: r.AGENCY?.trim() || '',
            instrument: r.INSTRUMENT || '',
            amount: typeof r.AMOUNT === 'number' ? r.AMOUNT.toLocaleString('en-IN') : '',
            rating: r.RATING || '-',
            dateOfNonAcceptance: r['DATE OF NON-ACCEPTANCE'] || '',
            remarks: r.REMARKS || '-',
          }))}
          className="w-full"
          initialRowLimit={5}
        />
      )}

      <ChargesTab />
    </div>
  );
};

export default DebtCreditTab;
