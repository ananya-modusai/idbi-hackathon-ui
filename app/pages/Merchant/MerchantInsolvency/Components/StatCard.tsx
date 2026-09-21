import { FC } from 'react';
import { CustomCard } from '@/components/custom/CustomCard';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | React.ReactNode;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard: FC<StatCardProps> = ({ title, value, icon, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <CustomCard className="p-3">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-gray-50 rounded-lg">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-gray-500 truncate">{title}</div>
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold truncate">{value}</div>
            {trend && (
              <div className="flex items-center gap-1">
                <ArrowUpRight 
                  className={`h-3 w-3 ${
                    trend.isPositive ? 'text-green-500' : 'text-red-500'
                  } ${!trend.isPositive && 'rotate-90'}`} 
                />
                <span className={`text-xs ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.value}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomCard>
  </motion.div>
);