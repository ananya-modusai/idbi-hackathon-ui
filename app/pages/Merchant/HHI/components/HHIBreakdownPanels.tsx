'use client';

import { useState, FC } from 'react';
import {
  ArrowRight,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
  ShoppingBag,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import type { HHIIndustryMerchantBreakdownData } from '../hhiData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HHIBreakdownPanelsProps {
  data: HHIIndustryMerchantBreakdownData;
}

function contributionTextClass(contribution: number): string {
  if (contribution >= 0.02) return 'text-red-600 font-semibold';
  if (contribution >= 0.005) return 'text-amber-600 font-semibold';
  if (contribution >= 0.002) return 'text-green-600 font-semibold';
  return 'text-blue-600 font-semibold';
}

/** Keeps industry vs merchant table row heights aligned */
const tableBodyCell = 'py-2 align-middle leading-snug';

/** White % labels centered in donut segments (Recharts Pie label renderer). */
function industryPiePercentLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius: ir = 0,
    outerRadius: or = 0,
    percent = 0,
  } = props;
  if (percent < 0.011) return null;
  const RADIAN = Math.PI / 180;
  const r = ir + (or - ir) * 0.52;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  const pct = Math.round(percent * 100);
  const fs = percent < 0.035 ? 10 : 12;
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        fontSize: fs,
        fontWeight: 700,
        paintOrder: 'stroke',
        stroke: 'rgba(0,0,0,0.25)',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    >
      {`${pct}%`}
    </text>
  );
}

const IndustryFooterIcon: FC<{ kind: 'pie' | 'bar' | 'shield' }> = ({ kind }) => {
  const cls = 'h-5 w-5';
  if (kind === 'pie') return <PieChartIcon className={cn(cls, 'text-blue-600')} />;
  if (kind === 'bar') return <BarChart3 className={cn(cls, 'text-emerald-600')} />;
  return <ShieldCheck className={cn(cls, 'text-indigo-600')} />;
};

const MerchantFooterIcon: FC<{ kind: 'users' | 'shopping' | 'users-wide' }> = ({ kind }) => {
  const cls = 'h-5 w-5';
  if (kind === 'users') return <Users className={cn(cls, 'text-blue-600')} />;
  if (kind === 'shopping') return <ShoppingBag className={cn(cls, 'text-emerald-600')} />;
  return <UsersRound className={cn(cls, 'text-violet-600')} />;
};

export const HHIBreakdownPanels: FC<HHIBreakdownPanelsProps> = ({ data }) => {
  const [isIndustryDialogOpen, setIsIndustryDialogOpen] = useState(false);
  const [isMerchantDialogOpen, setIsMerchantDialogOpen] = useState(false);
  const { industryBreakdown: ib, topMerchantContributors: mc } = data;

  const pieData = ib.industries.map((row) => ({
    name: row.industry,
    value: row.exposurePct,
    ndxCr: row.ndxCr,
    fill: row.chartColor,
  }));

  const formatNdx = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
      {/* Industry Breakdown */}
      <div className="flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="shrink-0 border-b border-gray-100 px-5 pt-5 pb-4">
          <h3 className="text-lg font-bold text-gray-900">{ib.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{ib.subtitle}</p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 p-5 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-4">
          <div className="flex min-h-[288px] shrink-0 items-center justify-center xl:min-h-0 xl:h-full">
            <div className="relative h-[288px] w-[288px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={132}
                    paddingAngle={0.8}
                    dataKey="value"
                    strokeWidth={0}
                    labelLine={false}
                    label={industryPiePercentLabel}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name + i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-xl">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{d.name}</p>
                            <p className="text-sm font-bold text-gray-900">
                              NDX(₹ CR): <span className="text-blue-600">{d.ndxCr.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                    wrapperStyle={{ zIndex: 100 }}
                    allowEscapeViewBox={{ x: true, y: true }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{ib.totalNdxLabel}</span>
                <span className="text-xl font-bold tabular-nums text-gray-900">
                  ₹{ib.totalNdxCr.toLocaleString('en-IN')} Cr
                </span>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="min-h-0 flex-1 overflow-visible">
              <table className="w-full table-fixed border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-50/80 border-b border-blue-100 text-left text-xs font-semibold uppercase tracking-wide text-blue-600">
                    <th className="w-[32%] min-w-0 py-3 pr-3 align-bottom pl-4 rounded-tl-lg">
                      Industry
                    </th>
                    <th className="w-[15%] py-3 pr-2 tabular-nums align-bottom">NDX (₹ Cr)</th>
                    <th className="w-[23%] py-3 pr-2 align-bottom">Exposure %</th>
                    <th className="min-w-0 w-[30%] py-3 pl-1 pr-4 align-bottom text-center rounded-tr-lg">
                      <span className="block text-center">
                        Contribution to Index
                        <br />
                        <span className="text-[10px] text-blue-400 font-normal">(Share²)</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ib.industries.map((row) => (
                    <tr key={row.industry} className="border-b border-gray-100 last:border-0">
                      <td className={cn(tableBodyCell, 'pr-3')}>
                        <div className="flex items-start gap-1.5">
                          <span
                            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: row.chartColor }}
                          />
                          <span className="min-w-0 font-medium leading-snug text-gray-900">{row.industry}</span>
                        </div>
                      </td>
                      <td className={cn(tableBodyCell, 'pr-2 tabular-nums text-gray-700')}>{formatNdx(row.ndxCr)}</td>
                      <td className={cn(tableBodyCell, 'pr-2')}>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 min-w-0 flex-1 max-w-[64px] overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(row.exposurePct, 100)}%`,
                                backgroundColor: row.chartColor,
                              }}
                            />
                          </div>
                          <span className="shrink-0 tabular-nums text-gray-700">{row.exposurePct}%</span>
                        </div>
                      </td>
                      <td
                        className={cn(
                          tableBodyCell,
                          'pl-1 text-center tabular-nums text-xs sm:text-sm',
                          contributionTextClass(row.contributionHHI)
                        )}
                      >
                        {row.contributionHHI.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex shrink-0 justify-center pt-3">
              <button
                type="button"
                onClick={() => setIsIndustryDialogOpen(true)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {ib.viewAllIndustriesLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <Dialog open={isIndustryDialogOpen} onOpenChange={setIsIndustryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b border-gray-100">
              <DialogTitle className="text-xl font-bold text-gray-900">
                All Industries Breakdown
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-50/80 border-b border-blue-100 text-left text-xs font-semibold uppercase tracking-wide text-blue-600">
                    <th className="py-3 pr-3 pl-4 rounded-tl-lg">Industry</th>
                    <th className="py-3 pr-3 tabular-nums text-right">NDX (₹ Cr)</th>
                    <th className="py-3 pr-3 text-right">Exposure %</th>
                    <th className="py-3 pr-4 text-center rounded-tr-lg">
                      Contribution to Index
                      <br />
                      <span className="text-[10px] text-blue-400 font-normal lowercase">(Share²)</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ib.industries.map((row) => (
                    <tr key={row.industry} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2.5 w-2.5 rounded-full" 
                            style={{ backgroundColor: row.chartColor }}
                          />
                          <span className="font-medium text-gray-900">{row.industry}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 tabular-nums text-right text-gray-700">
                        {formatNdx(row.ndxCr)}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <span className="tabular-nums font-medium text-gray-900">{row.exposurePct}%</span>
                      </td>
                      <td className={cn(
                        "py-3 tabular-nums text-right",
                        contributionTextClass(row.contributionHHI)
                      )}>
                        {row.contributionHHI.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>

        <div className="shrink-0 grid gap-3 border-t border-gray-100 bg-gray-50/80 p-4 sm:grid-cols-3">
          <div className="rounded-lg bg-sky-50/90 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <IndustryFooterIcon kind={ib.footerCards.topIndustry.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">{ib.footerCards.topIndustry.title}</p>
                <p className="truncate text-base font-bold text-gray-900">{ib.footerCards.topIndustry.industry}</p>
                <p className="text-xs text-gray-500">{ib.footerCards.topIndustry.subtext}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50/90 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <IndustryFooterIcon kind={ib.footerCards.industryContribution.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">{ib.footerCards.industryContribution.title}</p>
                <p className="text-base font-bold text-gray-900">{ib.footerCards.industryContribution.valueLine}</p>
                <p className="text-xs text-gray-500">{ib.footerCards.industryContribution.subtext}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-violet-50/90 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <IndustryFooterIcon kind={ib.footerCards.industryHHI.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">{ib.footerCards.industryHHI.title}</p>
                <p className="text-base font-bold text-gray-900">{ib.footerCards.industryHHI.valueLine}</p>
                <p className="text-xs text-gray-500">{ib.footerCards.industryHHI.subtext}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Merchant Contributors */}
      <div className="flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="shrink-0 border-b border-gray-100 px-5 pt-5 pb-4">
          <h3 className="text-lg font-bold text-gray-900">{mc.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{mc.subtitle}</p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-5">
          <div className="min-h-0 flex-1 overflow-visible">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="bg-blue-50/80 border-b border-blue-100 text-left text-xs font-semibold uppercase tracking-wide text-blue-600">
                  <th className="py-3 pr-2 w-10 align-bottom pl-4 rounded-tl-lg">#</th>
                  <th className="py-3 pr-3 align-bottom">Merchant</th>
                  <th className="py-3 pr-3 align-bottom">Industry</th>
                  <th className="py-3 pr-3 tabular-nums align-bottom">NDX (₹ Cr)</th>
                  <th className="py-3 pr-3 tabular-nums align-bottom">Exposure %</th>
                   <th className="py-3 pr-4 tabular-nums align-bottom text-center rounded-tr-lg">
                     <span className="block text-center">
                       Contribution to Index
                       <br />
                       <span className="text-[10px] text-blue-400 font-normal">(Share²)</span>
                     </span>
                   </th>
                </tr>
              </thead>
              <tbody>
                {mc.merchants.map((row) => (
                  <tr key={row.rank + row.merchantName} className="border-b border-gray-100 last:border-0">
                    <td className={cn(tableBodyCell, 'pr-2 tabular-nums text-gray-500')}>{row.rank}</td>
                    <td className={cn(tableBodyCell, 'pr-3 font-medium text-gray-900')}>{row.merchantName}</td>
                    <td className={cn(tableBodyCell, 'pr-3 text-gray-700')}>{row.industry}</td>
                    <td className={cn(tableBodyCell, 'pr-3 tabular-nums text-gray-700')}>{formatNdx(row.ndxCr)}</td>
                    <td className={cn(tableBodyCell, 'pr-3 tabular-nums text-gray-700')}>{row.exposurePct.toFixed(1)}%</td>
                     <td className={cn(tableBodyCell, 'pr-3 tabular-nums text-center', contributionTextClass(row.contributionHHI))}>
                       {row.contributionHHI.toFixed(3)}
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex shrink-0 justify-center pt-3">
            <button
              type="button"
              onClick={() => setIsMerchantDialogOpen(true)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              {mc.viewAllMerchantsLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Dialog open={isMerchantDialogOpen} onOpenChange={setIsMerchantDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b border-gray-100">
              <DialogTitle className="text-xl font-bold text-gray-900">
                Top Merchant Contributors
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-50/80 border-b border-blue-100 text-left text-xs font-semibold uppercase tracking-wide text-blue-600">
                    <th className="py-3 pr-2 w-10 pl-4 rounded-tl-lg">#</th>
                    <th className="py-3 pr-3">Merchant</th>
                    <th className="py-3 pr-3">Industry</th>
                    <th className="py-3 pr-3 text-right">NDX (₹ Cr)</th>
                    <th className="py-3 pr-3 text-right">Exposure %</th>
                    <th className="py-3 pr-4 text-center rounded-tr-lg">
                      Contribution to Index
                      <br />
                      <span className="text-[10px] text-blue-400 font-normal lowercase">(Share²)</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mc.merchants.map((row) => (
                    <tr key={row.rank + row.merchantName} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-2 tabular-nums text-gray-500">{row.rank}</td>
                      <td className="py-3 pr-3 font-medium text-gray-900">{row.merchantName}</td>
                      <td className="py-3 pr-3 text-gray-700">{row.industry}</td>
                      <td className="py-3 pr-3 tabular-nums text-right text-gray-700">
                        {formatNdx(row.ndxCr)}
                      </td>
                      <td className="py-3 pr-3 tabular-nums text-right text-gray-700">
                        {row.exposurePct.toFixed(1)}%
                      </td>
                      <td className={cn(
                        "py-3 tabular-nums text-center",
                        contributionTextClass(row.contributionHHI)
                      )}>
                        {row.contributionHHI.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>

        <div className="shrink-0 grid gap-3 border-t border-gray-100 bg-gray-50/80 p-4 sm:grid-cols-3">
          <div className="rounded-lg bg-sky-50/90 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <MerchantFooterIcon kind={mc.footerCards.top3.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">{mc.footerCards.top3.title}</p>
                <p className="text-base font-bold text-gray-900">{mc.footerCards.top3.valueLine}</p>
                <p className="text-xs text-gray-500">{mc.footerCards.top3.subtext}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50/90 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <MerchantFooterIcon kind={mc.footerCards.top5.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">{mc.footerCards.top5.title}</p>
                <p className="text-base font-bold text-gray-900">{mc.footerCards.top5.valueLine}</p>
                <p className="text-xs text-gray-500">{mc.footerCards.top5.subtext}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-violet-50/90 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <MerchantFooterIcon kind={mc.footerCards.totalMerchants.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">{mc.footerCards.totalMerchants.title}</p>
                <p className="text-base font-bold text-gray-900">{mc.footerCards.totalMerchants.valueLine}</p>
                {mc.footerCards.totalMerchants.subtext ? (
                  <p className="text-xs text-gray-500">{mc.footerCards.totalMerchants.subtext}</p>
                ) : (
                  <p className="text-xs text-gray-400">&nbsp;</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
