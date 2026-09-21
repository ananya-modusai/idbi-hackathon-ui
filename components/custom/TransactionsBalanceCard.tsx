import { CustomCard } from "@/components/custom/CustomCard";
import { LucideIcon } from "lucide-react";

export const TransactionsBalanceCard = ({
    title,
    icon: Icon,
    totalTransactionsAmount,
    totalPayoutAmount
  }: {
    title: string,
    icon: LucideIcon,
    totalTransactionsAmount: number,
    totalPayoutAmount: number
  }) => {
    const balanceAmount = totalTransactionsAmount - totalPayoutAmount;
    const formatAmount = (amount: number) => 
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
  
    return (
      <CustomCard className="col-span-2 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-gray-900">
              {formatAmount(totalTransactionsAmount)}
            </p>
            <p className="text-sm text-gray-500">Total Transactions</p>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-gray-900">
              {formatAmount(totalPayoutAmount)}
            </p>
            <p className="text-sm text-gray-500">Total Payouts</p>
          </div>
          <div className="space-y-2">
            <p className={`text-2xl font-semibold ${balanceAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatAmount(balanceAmount)}
            </p>
            <p className="text-sm text-gray-500">Balance Amount</p>
          </div>
        </div>
      </CustomCard>
    );
  };