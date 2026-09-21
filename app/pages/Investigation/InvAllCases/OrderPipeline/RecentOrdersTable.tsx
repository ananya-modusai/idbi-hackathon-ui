'use client';

import React, { useMemo } from 'react';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { Check, X } from 'lucide-react';
import { useOrderPipelineStore } from '@/app/store/orderPipeline/orderPipelineStore';

const formatDateForDisplay = (val: string | undefined, includeTime = true) => {
  if (!val || val === '—' || val === 'N/A') return { date: val || '—', time: '' };

  try {
    const cleanVal = val.includes(',') ? val.replace(', ', ' ') : val;
    const date = new Date(cleanVal);
    if (isNaN(date.getTime())) return { date: val, time: '' };

    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(val.trim());
    if (!includeTime || isDateOnly) return { date: dateStr, time: '' };

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return { date: dateStr, time: timeStr };
  } catch {
    return { date: val, time: '' };
  }
};

export function RecentOrdersTable() {
  const { historyItems } = useOrderPipelineStore();

  const columns = useMemo(
    () => [
      {
        key: 'orderNo',
        header: 'Order No.',
        width: '220px',
        render: (val: string) => <span className="font-semibold text-blue-600">{val}</span>,
      },
      { key: 'authority', header: 'Authority', width: '100px' },
      { key: 'orderType', header: 'Order Type', width: '180px' },
      {
        key: 'captureMethod',
        header: 'Capture Method',
        width: '160px',
        render: (val: string) => (
          <span className="w-full flex justify-center px-2">
            <BubbleTag
              className="w-full"
              text={val === 'auto' ? 'Detected from Web/Email' : 'Manually Uploaded'}
              color={val === 'auto' ? 'blue' : 'yellow'}
              withBorder={false}
              fixedWidth="w-full"
            />
          </span>
        ),
      },
      {
        key: 'issuedOn',
        header: 'Order Issued On',
        width: '185px',
        sortable: true,
        render: (val: string) => {
          const { date, time } = formatDateForDisplay(val);
          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[13px] text-[#1a1a1a]">{date}</span>
              {time && <span className="text-[11px] text-[#999] font-medium opacity-80">{time}</span>}
            </div>
          );
        },
      },
      {
        key: 'receivedOn',
        header: 'Order Received On',
        width: '185px',
        sortable: true,
        render: (val: string) => {
          const { date, time } = formatDateForDisplay(val);
          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[13px] text-[#1a1a1a]">{date}</span>
              {time && <span className="text-[11px] text-[#999] font-medium opacity-80">{time}</span>}
            </div>
          );
        },
      },
    ],
    []
  );

  const tableData = useMemo(
    () =>
      historyItems.map((item) => ({
        orderNo: item.orderNo,
        authority: item.authority,
        orderType: item.orderType,
        captureMethod: item.captureMethod,
        issuedOn: item.issuedOn,
        receivedOn: item.receivedOn,
      })),
    [historyItems]
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm w-full [&_th]:!text-[11.5px] [&_td]:!text-[12.5px] [&_td_span]:!text-[12.5px]">
      <CustomTableView
        columns={columns}
        data={tableData}
        initialRowLimit={10}
        onRowClick={() => {}}
      />
    </div>
  );
}
