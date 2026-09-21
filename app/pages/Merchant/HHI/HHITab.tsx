import { FC, useState } from 'react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { PieChart } from 'lucide-react';
import { HHIBreakdownPanels } from './components/HHIBreakdownPanels';
import { HHICard } from './components/HHICard';
import { sampleHHIData, sampleHHIIndustryMerchantBreakdown } from './hhiData';
import { cn } from '@/lib/utils';

const HHITab: FC = () => {
  const [addType, setAddType] = useState<'Industry' | 'Company'>('Industry');

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* <SectionHeaderWithFlags
        title="Herfindahl-Hirschman Index (HHI)"
        icon={PieChart}
        positiveFlags={[]}
        negativeFlags={[]}
        neutralFlags={[]}
        allowCollapse={false}
      /> */}
      
      <div className="mt-2">
        <div className="mb-4 flex justify-end">
          <div className="flex bg-gray-100 p-1 rounded-lg">
             <button
               onClick={() => setAddType('Industry')}
               className={cn(
                 "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                 addType === 'Industry' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
             >
               Industry ADD
             </button>
             <button
               onClick={() => setAddType('Company')}
               className={cn(
                 "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                 addType === 'Company' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
             >
               Company ADD
             </button>
          </div>
        </div>
        <HHICard data={sampleHHIData} />
      </div>

      <HHIBreakdownPanels data={sampleHHIIndustryMerchantBreakdown} />
    </div>
  );
};

export default HHITab;
