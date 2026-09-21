import { FC } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, ExternalLink, Calendar, AlertCircle, DollarSign, BarChart3, LineChart, FileBarChart, Wallet, Shield, Globe, Building2, Users } from 'lucide-react';
import CustomListItem from '@/components/custom/CustomList/customListItem';
import { getTextColorClass } from '@/components/custom/CustomColorScheme';
import { BubbleTag } from '@/components/custom/BubbleTag';
import SectionHeaderWithFlags from '@/components/custom/SectionHeaderWithFlags';


interface RedFlag {
  created_at: string;
  title: string;
  mainValue?: string | null;
  keyInsight: string;
  impactOnCompany: string;
  severity: 'severe' | 'high' | 'medium' | 'low' | 'Severe' | 'High' | 'Medium' | 'Low';
}

interface ExecutiveSummaryFlagsProps {
  financialRedFlags: RedFlag[];
  externalRedFlags: RedFlag[];
}

const RedFlagCard: FC<{ redFlag: RedFlag; type: 'financial' | 'external' }> = ({ redFlag, type }) => {
  // Normalize severity for display
  const getSeverityDisplay = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
  };

  // Get color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      case 'Severe': return 'red';
      case 'High': return 'orange';
      case 'Medium': return 'yellow';
      case 'Low': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
             <CustomListItem
         itemID={`red-flag-${type}-${redFlag.title}`}
         title={
           <div className="space-y-2 w-full">
             <div className="space-y-2">
               <div className="flex justify-between items-start gap-4">
                 <div className="flex items-center gap-4">
                   <span className="font-semibold text-gray-800 text-sm">{redFlag.title}</span>
                   {redFlag.mainValue && (
                     <span className="text-base font-bold text-red-600 whitespace-nowrap">
                       [{redFlag.mainValue}]
                     </span>
                   )}
                 </div>
                 <div className="flex items-center gap-2 shrink-0">
                   <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                     <Calendar className="h-3.5 w-3.5" />
                     {(() => {
                       try {
                         const date = new Date(redFlag.created_at);
                         if (isNaN(date.getTime())) {
                           return 'Invalid date';
                         }
                         return date.toLocaleDateString('en-US', {
                           year: 'numeric',
                           month: 'long',
                           day: 'numeric'
                         });
                       } catch (error) {
                         return 'Invalid date';
                       }
                     })()}
                   </span>
                   <BubbleTag 
                     text={getSeverityDisplay(redFlag.severity)} 
                     color={getSeverityColor(redFlag.severity)}
                     hasOutsideIcon={false}
                   />
                 </div>
               </div>
               <div className="w-full">
                 <span className="text-sm text-gray-600 italic block">
                   {redFlag.keyInsight}
                 </span>
               </div>
             </div>
           </div>
         }
         topRightContent={null}
         className="border border-gray-200 rounded-lg shadow-none hover:bg-gray-50"
         themeColor={getTextColorClass('red')}
       />
    </motion.div>
  );
};

const ExecutiveSummaryFlags: FC<ExecutiveSummaryFlagsProps> = ({ financialRedFlags, externalRedFlags }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Function to get top 3 red flags by severity order
  const getTopRedFlags = (flags: RedFlag[]) => {
    const severityOrder = ['severe', 'high', 'medium'];
    const sortedFlags = flags.sort((a, b) => {
      const aIndex = severityOrder.indexOf(a.severity.toLowerCase());
      const bIndex = severityOrder.indexOf(b.severity.toLowerCase());
      return aIndex - bIndex;
    });
    return sortedFlags.slice(0, 3);
  };

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial Red Flags */}
        <motion.div variants={itemVariants} className="space-y-2">
          <SectionHeaderWithFlags
            title="Key Financial Red Flags"
            icon={DollarSign}
            iconColorClass="text-red-600"
            titleColorClass="text-red-600"
            positiveFlags={[]}
            negativeFlags={[]}
            allowCollapse={false}
          />
          
          <div className="space-y-2">
            {getTopRedFlags(financialRedFlags).map((redFlag, index) => (
              <RedFlagCard
                key={`financial-${index}`}
                redFlag={redFlag}
                type="financial"
              />
            ))}
          </div>
        </motion.div>

        {/* External Red Flags */}
        <motion.div variants={itemVariants} className="space-y-2">
          <SectionHeaderWithFlags
            title="Key External Red Flags"
            icon={Globe}
            iconColorClass="text-red-600"
            titleColorClass="text-red-600"
            positiveFlags={[]}
            negativeFlags={[]}
            allowCollapse={false}
          />
          
          <div className="space-y-2">
            {getTopRedFlags(externalRedFlags).map((redFlag, index) => (
              <RedFlagCard
                key={`external-${index}`}
                redFlag={redFlag}
                type="external"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ExecutiveSummaryFlags;
