import { CustomCard } from "./CustomCard";
import { LucideIcon } from "lucide-react";

interface TransactionsStatsCardProps {
  title: string;
  icon: LucideIcon;
  amount: number;
  count: number;
}

export const TransactionsStatsCard = ({ title, icon: Icon, amount, count }: TransactionsStatsCardProps) => {
  const formatAmount = (amount: number) => 
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);

  const formatCount = (count: number) =>
    new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2
    }).format(count);

  return (
    <CustomCard className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-blue-500" />
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-gray-900">
            {formatAmount(amount)}
          </p>
          <p className="text-sm text-gray-500">Amount</p>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-gray-900">
            {formatCount(count)}
          </p>
          <p className="text-sm text-gray-500">Count</p>
        </div>
      </div>
    </CustomCard>
  );
};