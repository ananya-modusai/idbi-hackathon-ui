'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';
import { Info, BarChart3, PieChart, ShieldCheck } from 'lucide-react';
import { HHIData } from '../hhiData';
import { cn } from '@/lib/utils';

interface HHICardProps {
  data: HHIData;
}

export const HHICard: FC<HHICardProps> = ({ data }) => {
  // Calculate rotation for the needle based on non-linear scale in the image
  // Green: 0-0.10 (45 degrees)
  // Yellow: 0.10-0.20 (90 degrees)
  // Red: 0.20-1.00 (45 degrees)
  let angle;
  if (data.score <= 0.10) {
    angle = (data.score / 0.10) * 45;
  } else if (data.score <= 0.20) {
    angle = 45 + ((data.score - 0.10) / 0.10) * 90;
  } else {
    angle = 135 + (Math.min(data.score, 1.0) - 0.20) / 0.80 * 45;
  }
  
  // Convert 0-180 to -90 to 90 for the rotate transform
  const rotation = angle - 90;

  return (
    <div className="grid w-full grid-cols-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:grid-cols-2">
      {/* Left 50%: score + gauge */}
      <div className="flex min-h-0 min-w-0 flex-col border-b border-gray-200 md:flex-row md:border-b-0 md:border-r md:border-gray-100">
        {/* Score */}
        <div className="flex min-w-0 md:basis-[40%] flex-col gap-4 border-b border-gray-100 p-6 md:border-b-0 md:border-r md:border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            Index Score
          </h3>
          <Info className="h-4 w-4 text-gray-400 cursor-help" />
        </div>
        
        <div className="flex flex-col gap-1 mt-4">
          {/* <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">HHI Score</span> */}
          <div className="text-6xl font-extrabold text-red-600 tabular-nums">
            {data.score.toFixed(3)}
          </div>
        </div>

        <div className="mt-2">
          <span className={cn(
            "px-5 py-2 rounded-2xl text-sm font-bold text-white",
            data.riskLevel === 'High' ? "bg-red-600" : 
            data.riskLevel === 'Moderate' ? "bg-yellow-500" : "bg-green-600"
          )}>
            {data.riskLabel}
          </span>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed mt-4">
          Higher values indicate greater portfolio vulnerability.
        </p>
        </div>

        {/* Gauge — share of left 50% */}
        <div className="flex w-full min-w-0 shrink-0 flex-col items-center justify-center bg-white p-5 md:basis-[60%]">
        <div className="mb-2 flex w-full items-center justify-center">
          <span className="text-sm font-bold text-gray-800">HHI Gauge</span>
        </div>

        <div className="relative mt-2 aspect-[2/1] w-full max-w-[272px]">
          <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
            {/* Background segments - Non-linear as in image */}
            {/* Green segment (45 degrees) */}
            <path 
              d="M 10 50 A 40 40 0 0 1 21.7 21.7" 
              fill="none" 
              stroke="#22c55e" 
              strokeWidth="10"
              strokeLinecap="butt"
            />
            {/* Yellow segment (90 degrees) */}
            <path 
              d="M 21.7 21.7 A 40 40 0 0 1 78.3 21.7" 
              fill="none" 
              stroke="#eab308" 
              strokeWidth="10"
              strokeLinecap="butt"
            />
            {/* Red segment (45 degrees) */}
            <path 
              d="M 78.3 21.7 A 40 40 0 0 1 90 50" 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth="10"
              strokeLinecap="butt"
            />

            {/* Markers */}
            <text x="2" y="52" fontSize="4" className="fill-gray-400 font-bold" textAnchor="end">0</text>
            <text x="12" y="12" fontSize="4" className="fill-gray-400 font-bold" textAnchor="middle">0.10</text>
            <text x="88" y="12" fontSize="4" className="fill-gray-400 font-bold" textAnchor="middle">0.20</text>
            <text x="98" y="52" fontSize="4" className="fill-gray-400 font-bold" textAnchor="start">1.00</text>

            {/* Needle */}
            <motion.g 
              initial={{ rotate: -90 }}
              animate={{ rotate: rotation }}
              transition={{ 
                type: "spring", 
                damping: 20, 
                stiffness: 80, 
                delay: 0.5 
              }}
              style={{ originX: '50px', originY: '50px' }}
            >
              <path 
                d="M 50 50 L 48 50 L 50 12 L 52 50 Z" 
                fill="#374151" 
              />
              <circle cx="50" cy="50" r="4" fill="#374151" />
            </motion.g>
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-8 flex w-full flex-wrap justify-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 shrink-0 rounded-full bg-green-500" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold leading-tight text-gray-700">Well Diversified</span>
              <span className="text-[11px] leading-tight text-gray-500">(HHI &lt; 0.10)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 shrink-0 rounded-full bg-yellow-500" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold leading-tight text-gray-700">Moderate</span>
              <span className="text-[11px] leading-tight text-gray-500">(0.10 - 0.20)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 shrink-0 rounded-full bg-red-500" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold leading-tight text-gray-700">High Concentration</span>
              <span className="text-[11px] leading-tight text-gray-500">(HHI &gt; 0.20)</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Right 50%: Insights */}
      <div className="flex min-h-0 min-w-0 flex-col gap-6 p-6">
        {/* Meaning */}
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-pink-500" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-bold text-gray-900">What does this mean?</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {data.explanation}
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full ml-13" />

        {/* Key Insights */}
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <PieChart className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-bold text-gray-900">Key Insights</h4>
            <ul className="text-sm text-gray-600 space-y-1 mt-1">
              {data.insights.map((insight, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full ml-13" />

        {/* Why it matters */}
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-bold text-gray-900">How is it calculated?</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {data.importance}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
