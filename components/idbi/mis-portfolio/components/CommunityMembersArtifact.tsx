import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

import { ArtifactHeader } from '@/components/custom/ArtifactHeader';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { misService as customerService } from '../misData';
import { CommunityArtifactItem } from '@/app/types/customerTypes';
import CustomLoader from '@/components/custom/CustomLoader';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { ColorScheme } from '@/components/custom/CustomColorScheme';
import { formatIndianNumber } from '@/utils/utils';

interface CommunityMembersArtifactProps {
  communityId: string;
}

// ---------------------------------------------------------------------------
// Repayment timeline color helper — mirrors LinkedIndividualsArtifact logic
// ---------------------------------------------------------------------------
const determineInstallmentColor = (
  delayRaw: any,
  isPaid: boolean,
  repaymentDateRaw?: any,
  dueDateRaw?: any
): string => {
  const RED    = 'bg-red-400';
  const YELLOW = 'bg-yellow-300';
  const GREEN  = 'bg-green-300';
  const GRAY   = 'bg-gray-300';
  const ORANGE = 'bg-orange-300';
  const BLUE   = 'bg-blue-400';

  const delay = Number(String(delayRaw || '0').replace(/[^0-9-]/g, '')) || 0;

  const parseMaybe = (d: any) => {
    if (!d && d !== 0) return null;
    try {
      const s = String(d).trim();
      const t = s.replace(/^([0-9]{4}-[0-9]{2}-[0-9]{2})\s+/, '$1T');
      const dt = new Date(t);
      return isNaN(+dt) ? null : dt;
    } catch { return null; }
  };

  const repaymentDate = parseMaybe(repaymentDateRaw);
  const dueDate       = parseMaybe(dueDateRaw);

  if (isPaid) {
    if (repaymentDate && dueDate && +repaymentDate < +dueDate) return BLUE;
    if (delay <= 0)  return GREEN;
    if (delay <= 5)  return YELLOW;
    if (delay <= 15) return ORANGE;
    return RED;
  }

  if (delay === 0) return GRAY;
  if (delay > 0)   return RED;
  return GRAY;
};

// ---------------------------------------------------------------------------
// Repayment Timeline box renderer
// ---------------------------------------------------------------------------
const RepaymentTimelineCell: React.FC<{ row: any }> = ({ row }) => {
  const [tooltipInfo, setTooltipInfo] = useState<{
    content: string;
    x: number;
    y: number;
  } | null>(null);

  const timeline =
    Array.isArray(row.repayment_timeline)
      ? row.repayment_timeline
      : Array.isArray(row.repaymentTimeline)
      ? row.repaymentTimeline
      : Array.isArray(row.loans?.[0]?.repayment_timeline)
      ? row.loans[0].repayment_timeline
      : null;

  if (!timeline || timeline.length === 0) {
    return <span className="text-gray-400 text-xs">—</span>;
  }

  const sorted = timeline.slice().sort((a: any, b: any) => {
    const ai = Number(a.installment_no ?? a.installmentNo ?? 0);
    const bi = Number(b.installment_no ?? b.installmentNo ?? 0);
    return ai - bi;
  });

  return (
    <>
      <div
        className="flex items-center overflow-x-auto overflow-y-visible py-1"
        style={{ maxWidth: '200px' }}
      >
        {sorted.map((inst: any, idx: number) => {
          const isPaid =
            (inst.is_emi_paid ?? inst.isEmiPaid ?? false) === true ||
            Boolean(inst.repayment_date ?? inst.repaymentDate);
          const delayRaw =
            inst.delay_in_payment_days ??
            inst.delay ??
            inst.delayInPaymentDays ??
            inst.delayDays ??
            '0';
          const delay =
            Number(String(delayRaw || '0').replace(/[^0-9-]/g, '')) || 0;
          const color = determineInstallmentColor(
            delay,
            Boolean(isPaid),
            inst.repayment_date ?? inst.repaymentDate ?? null,
            inst.due_date ?? inst.dueDate ?? null
          );
          const dueDateStr =
            inst.due_date ?? inst.dueDate ?? row.emi_start_date ?? null;
          const installmentDate = dueDateStr
            ? new Date(dueDateStr)
            : new Date();

          return (
            <div
              key={idx}
              className="relative inline-block mr-0.5 align-middle"
            >
              <button
                type="button"
                onMouseEnter={(e) => {
                  const rect = (
                    e.currentTarget as HTMLElement
                  ).getBoundingClientRect();
                  setTooltipInfo({
                    content: `Inst: ${inst.installment_no ?? idx + 1}\nDue: ${installmentDate.toLocaleDateString()}\nPaid: ${isPaid ? 'Yes' : 'No'}\nDelay: ${delay}d`,
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  });
                }}
                onMouseLeave={() => setTooltipInfo(null)}
                className={`${color} w-3 h-3 flex-shrink-0 rounded-none focus:outline-none`}
              />
            </div>
          );
        })}
      </div>

      {tooltipInfo &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: tooltipInfo.x,
              top: tooltipInfo.y - 8,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-pre shadow-lg">
              {tooltipInfo.content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};


export const CommunityMembersArtifact: React.FC<CommunityMembersArtifactProps> = ({ communityId }) => {
  const [data, setData] = useState<CommunityArtifactItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tableRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // request first page with a sensible default limit; the service will also normalise
        // a few common response shapes into an array.
        const result = await customerService.getCommunityArtifacts(communityId, 1, 100);
        // defensive coercion in case the service returns unexpected shape
        if (Array.isArray(result)) setData(result);
        else if (result && Array.isArray((result as any).data)) setData((result as any).data);
        else if (result && Array.isArray((result as any).items)) setData((result as any).items);
        else setData([]);
      } catch (error) {
        console.error('Error fetching community members:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [communityId]);

  const columns = [
    { key: 'sno', header: 'Sno.', sortable: false, width: '60px' },
    { 
      key: 'customer_id', 
      header: "CID's", 
      sortable: true,
      isClickable: true,
      render: (val: string) => (
        <button 
          onClick={() => window.open(`/Customer/Investigation/${val}`, '_blank')}
          className="text-blue-600 hover:underline font-medium"
        >
          {val}
        </button>
      )
    },
    { key: 'name', header: 'Customer', sortable: true },
    {
      key: 'risk_indicator',
      header: 'Risk',
      sortable: true,
      render: (val: string) => {
        const risk = val?.toLowerCase() || '';
        let color: ColorScheme = 'slate';
        if (risk.includes('high'))   color = 'red';
        else if (risk.includes('medium')) color = 'yellow';
        else if (risk.includes('low'))    color = 'green';
        if (!val) return '-';
        return <BubbleTag text={val} color={color} withBorder={true} />;
      },
    },
    {
      key: 'loan_id',
      header: 'Loan ID',
      sortable: true,
      render: (val: any) =>
        val ? <span className="font-mono text-xs text-gray-700">{val}</span> : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key: 'disbursal_date',
      header: 'Disbursal Date',
      sortable: true,
      render: (val: any) => {
        if (!val) return <span className="text-gray-400 text-xs">—</span>;
        try {
          const dt = new Date(String(val).replace(/^([0-9]{4}-[0-9]{2}-[0-9]{2})\s+/, '$1T'));
          return isNaN(+dt) ? String(val) : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return String(val); }
      },
    },
    {
      key: 'loan_amount',
      header: 'Loan Amount (IN INR)',
      sortable: true,
      render: (val: any) => {
        if (!val && val !== 0) return <span className="text-gray-400 text-xs">—</span>;
        const num = Number(String(val).replace(/[^\d.]/g, ''));
        return isNaN(num) ? String(val) : `₹${num.toLocaleString('en-IN')}`;
      },
    },
    {
      key: 'total_installments',
      header: 'Total Installments',
      sortable: true,
      render: (val: any) =>
        (val !== undefined && val !== null && val !== '')
          ? val
          : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key: 'repayment_timeline',
      header: 'Repayment Timeline',
      sortable: false,
      render: (_val: any, row: any) => (
        <RepaymentTimelineCell row={row} />
      ),
    },
    // {
    //   key: 'loan_status',
    //   header: 'Loan Status',
    //   sortable: true,
    //   render: (val: string) => {
    //     if (!val) return <span className="text-gray-400 text-xs">—</span>;
    //     const s = String(val).toLowerCase();
    //     const isActive = s.includes('active') && !s.includes('inactive');
    //     return (
    //       <span
    //         className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
    //           isActive
    //             ? 'bg-green-100 text-green-800'
    //             : 'bg-gray-100 text-gray-600'
    //         }`}
    //       >
    //         {val}
    //       </span>
    //     );
    //   },
    // },
    { key: 'cibil_score', header: 'CIBIL', sortable: true },
  ];

  const tableData = (() => {
    const flattened: any[] = [];
    data.forEach((item) => {
      if (item.loans && item.loans.length > 0) {
        item.loans.forEach((loan) => {
          flattened.push({
            ...item,
            loan_id: loan.loan_id,
            disbursal_date: loan.disbursal_date,
            loan_amount: loan.loan_amount,
            total_installments: loan.total_installments,
            loan_status: loan.loan_status,
            repayment_timeline: loan.repayment_timeline
          });
        });
      } else {
        flattened.push({
          ...item,
          loan_id: item.loan_id,
          disbursal_date: item.disbursal_date,
          loan_amount: item.loan_amount,
          total_installments: item.total_installments,
          loan_status: item.loan_status,
          repayment_timeline: item.repayment_timeline
        });
      }
    });
    return flattened.map((row, index) => ({
      ...row,
      sno: index + 1
    }));
  })();


  const totalCustomers = data.length;
  const totalLoans = data.reduce((acc: number, curr: CommunityArtifactItem) => acc + (curr.loans?.length || 0), 0);

  return (
    <div className="bg-white min-h-full flex flex-col p-4">
      <ArtifactHeader
        title={
          <div className="flex items-center gap-2">
            <span>Community Members</span>
            <BubbleTag text={`${formatIndianNumber(totalCustomers)} Customers`} color="blue" />
            <BubbleTag text={`${formatIndianNumber(totalLoans)} Loans`} color="blue" />
          </div>
        }
        contentIDText="Community ID"
        contentID={communityId}
        lastUpdatedAt={new Date()}
        onDownloadCSV={tableData.length > 0 ? () => tableRef.current?.() : undefined}
      />

      <div className="mt-6 flex-1 overflow-auto">
        <CustomLoader loading={isLoading} specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading members...' }}>
          <CustomTableView
            exportRef={tableRef}
            columns={columns}
            data={tableData}
            isExpanded={true}
            initialRowLimit={100}
          />
        </CustomLoader>
      </div>
    </div>
  );
};

export default CommunityMembersArtifact;
