import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { createPortal } from 'react-dom';
import { ArtifactHeader } from '@/components/custom/ArtifactHeader';
import { ArtifactSectionCollapsible } from '@/components/custom/ArtifactSectionCollapsible';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { misService as customerService } from '../misData';
import { LinkageArtifactItem } from '@/app/types/customerTypes';
import CustomLoader from '@/components/custom/CustomLoader';
import { LinkedIndividualsArtifactProps } from '@/app/types/customerTypes';
import { formatIndianNumber } from '@/utils/utils';
import { ColorScheme } from '@/components/custom/CustomColorScheme';

// ---------------------------------------------------------------------------
// Repayment timeline color helper — mirrors CustomerOverviewTab logic exactly
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
// Repayment Timeline box renderer (inline, no portal needed for artifact panel)
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
        style={{ maxWidth: '260px' }}
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
                className={`${color} w-5 h-5 flex-shrink-0 rounded-none focus:outline-none`}
              />
            </div>
          );
        })}
      </div>

      {/* Portal tooltip — renders above all overflow:hidden ancestors */}
      {tooltipInfo &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: tooltipInfo.x,
              top: tooltipInfo.y - 8,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-gray-900 text-white text-[11px] rounded px-2 py-1.5 whitespace-pre shadow-lg max-w-[200px]">
              {tooltipInfo.content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const LinkedIndividualsArtifact: React.FC<LinkedIndividualsArtifactProps> = ({
  customerName,
  customerId,
  connectorType = 'all',
}) => {
  const [data2, setData2] = useState<LinkageArtifactItem[] | null>(null);
  const [data4, setData4] = useState<LinkageArtifactItem[] | null>(null);
  const [data6, setData6] = useState<LinkageArtifactItem[] | null>(null);
  const [countFromApi2, setCountFromApi2] = useState<number>(0);
  const [countFromApi4, setCountFromApi4] = useState<number>(0);
  const [countFromApi6, setCountFromApi6] = useState<number>(0);
  const [loading2, setLoading2] = useState(false);
  const [loading4, setLoading4] = useState(false);
  const [loading6, setLoading6] = useState(false);
  const [loanCount2, setLoanCount2] = useState<number>(0);
  const [loanCount4, setLoanCount4] = useState<number>(0);
  const [loanCount6, setLoanCount6] = useState<number>(0);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading2(true);
      setLoading4(true);
      setLoading6(true);

      const [res2, res4, res6] = await Promise.all([
        customerService.getLinkageArtifacts(customerId, connectorType, '2'),
        customerService.getLinkageArtifacts(customerId, connectorType, '4'),
        customerService.getLinkageArtifacts(customerId, connectorType, '6'),
      ]);

      setData2(res2?.data || []);
      setCountFromApi2(res2?.total_count || 0);
      setLoanCount2((res2?.data || []).reduce((acc: number, curr: LinkageArtifactItem) => acc + (curr.loans?.length || 0), 0));
      
      setData4(res4?.data || []);
      setCountFromApi4(res4?.total_count || 0);
      setLoanCount4((res4?.data || []).reduce((acc: number, curr: LinkageArtifactItem) => acc + (curr.loans?.length || 0), 0));
      
      setData6(res6?.data || []);
      setCountFromApi6(res6?.total_count || 0);
      setLoanCount6((res6?.data || []).reduce((acc: number, curr: LinkageArtifactItem) => acc + (curr.loans?.length || 0), 0));

      setLoading2(false);
      setLoading4(false);
      setLoading6(false);
    };

    if (customerId) {
      fetchAllData();
    }
  }, [customerId, connectorType]);

  const handleOpenInvestigation = (userId: string) => {
    window.open(`/Customer/Investigation/${userId}`, '_blank');
  };

  const handleDownloadCSV = (specificDegree?: string) => {
    const allItems: any[] = [];
    
    const sections = [
      { degree: '2nd', items: data2 },
      { degree: '4th', items: data4 },
      { degree: '6th', items: data6 }
    ];

    const filteredSections = specificDegree 
      ? sections.filter(s => s.degree === specificDegree)
      : sections;

    filteredSections.forEach(({ degree, items }) => {
      (items || []).forEach((item) => {
        if (item.loans && item.loans.length > 0) {
          item.loans.forEach((loan) => {
            allItems.push({
              Degree: degree,
              "CID's": item.customer_id,
              Customer: item.name,
              Risk: item.risk_indicator,
              "Loan ID": loan.loan_id,
              "Disbursal Date": loan.disbursal_date,
              "Loan Amount": loan.loan_amount,
              "Total Installments": loan.total_installments,
              "Loan Status": loan.loan_status,
              CIBIL: item.cibil_score
            });
          });
        } else {
          allItems.push({
            Degree: degree,
            "CID's": item.customer_id,
            Customer: item.name,
            Risk: item.risk_indicator,
            "Loan ID": '—',
            "Disbursal Date": '—',
            "Loan Amount": '—',
            "Total Installments": '—',
            "Loan Status": '—',
            CIBIL: item.cibil_score
          });
        }
      });
    });

    if (allItems.length === 0) return;

    const csv = Papa.unparse(allItems);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = specificDegree 
      ? `Linked_Individuals_${specificDegree}_${customerId}.csv`
      : `Linked_Individuals_All_${customerId}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDownloadButton = (degree: string) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleDownloadCSV(degree);
      }}
      className="flex items-center px-2 py-1 text-[10px] font-medium bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-gray-600 shadow-sm mr-2"
      title={`Download ${degree} CSV`}
    >
      <svg 
        className="w-3 h-3 mr-1" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
        />
      </svg>
      Download
    </button>
  );

  const renderDegreeTable = (
    data: LinkageArtifactItem[] | null,
    loading: boolean
  ) => {
    const flattenedData: any[] = [];
    (data || []).forEach((item) => {
      if (item.loans && item.loans.length > 0) {
        item.loans.forEach((loan) => {
          flattenedData.push({
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
        // Fallback for cases with no loans array
        flattenedData.push({
          ...item,
          // Root fields are already used by columns if loans are missing
        });
      }
    });

    const tableData = flattenedData.map((row, index) => ({
      ...row,
      sno: index + 1,
    }));

    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[100px]">
        <CustomLoader
          loading={loading}
          specs={{ type: 'spinner', size: 'sm', color: 'blue' }}
        >
          <CustomTableView
            columns={[
              { key: 'sno', header: 'Sno.', sortable: false, width: '60px' },
              {
                key: 'customer_id',
                header: "CID's",
                sortable: true,
                isClickable: true,
                render: (val: string) => (
                  <button
                    onClick={() => handleOpenInvestigation(val)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {val}
                  </button>
                ),
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
              // ── Loan ID ──────────────────────────────────────────────────
              {
                key: 'loan_id',
                header: 'Loan ID',
                sortable: true,
                render: (val: any) =>
                  val ? <span className="font-mono text-xs text-gray-700">{val}</span> : <span className="text-gray-400 text-xs">—</span>,
              },
              // ── Disbursal Date ────────────────────────────────────────────
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
              // ── Loan Amount ───────────────────────────────────────────────
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
              // ── Total Installments ────────────────────────────────────────
              {
                key: 'total_installments',
                header: 'Total Installments',
                sortable: true,
                render: (val: any) =>
                  (val !== undefined && val !== null && val !== '')
                    ? val
                    : <span className="text-gray-400 text-xs">—</span>,
              },
              // ── Repayment Timeline ────────────────────────────────────────
              {
                key: 'repayment_timeline',
                header: 'Repayment Timeline',
                sortable: false,
                render: (_val: any, row: any) => (
                  <RepaymentTimelineCell row={row} />
                ),
              },
              // ── Loan Status ───────────────────────────────────────────────
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
              // ── existing columns ─────────────────────────────────────────
              { key: 'cibil_score', header: 'CIBIL', sortable: true },
            ]}
            data={tableData}
            initialRowLimit={100}
            showCSVExport={false}
            isExpanded={true}
          />
        </CustomLoader>
      </div>
    );
  };

  const count2 = countFromApi2;
  const count4 = countFromApi4;
  const count6 = countFromApi6;
  const totalCount = count2 + count4 + count6;

  return (
    <div className="bg-white min-h-full flex flex-col">
      <ArtifactHeader
        title={
          <div className="flex items-center gap-2">
            <span>Linked Individuals</span>
            <BubbleTag text={`${formatIndianNumber(totalCount)} Customers`} color="blue" />
            <BubbleTag text={`${formatIndianNumber(loanCount2 + loanCount4 + loanCount6)} Loans`} color="blue" />
          </div>
        }
        contentIDText="Customer"
        contentID={customerName}
        lastUpdatedAt={new Date()}
        onDownloadCSV={handleDownloadCSV}
      />

      <div className="overflow-y-auto flex-1 space-y-4 pb-6">
        <ArtifactSectionCollapsible
          title={
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">
                2nd-Degree linkages
              </span>
              <BubbleTag text={`${formatIndianNumber(count2)} Customers`} color="blue" />
              <BubbleTag text={`${formatIndianNumber(loanCount2)} Loans`} color="blue" />
            </div>
          }
          defaultOpen={true}
          rightElement={renderDownloadButton('2nd')}
        >
          {renderDegreeTable(data2, loading2)}
        </ArtifactSectionCollapsible>

        <ArtifactSectionCollapsible
          title={
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">
                4th-degree linkages
              </span>
              <BubbleTag text={`${formatIndianNumber(count4)} Customers`} color="blue" />
              <BubbleTag text={`${formatIndianNumber(loanCount4)} Loans`} color="blue" />
            </div>
          }
          defaultOpen={false}
          rightElement={renderDownloadButton('4th')}
        >
          {renderDegreeTable(data4, loading4)}
        </ArtifactSectionCollapsible>

        <ArtifactSectionCollapsible
          title={
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">
                6th-degree linkages
              </span>
              <BubbleTag text={`${formatIndianNumber(count6)} Customers`} color="blue" />
              <BubbleTag text={`${formatIndianNumber(loanCount6)} Loans`} color="blue" />
            </div>
          }
          defaultOpen={false}
          rightElement={renderDownloadButton('6th')}
        >
          {renderDegreeTable(data6, loading6)}
        </ArtifactSectionCollapsible>
      </div>
    </div>
  );
};

export default LinkedIndividualsArtifact;
