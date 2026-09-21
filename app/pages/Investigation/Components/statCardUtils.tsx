import { TrendingUp, Store, ShieldAlert, Calendar, ArrowLeftRight, Wallet, CircleCheck, FileCheck, Puzzle, Building2, Users } from 'lucide-react';
import { KeyMetric } from '@/app/types';

export const getStatCards = (keyMetrics: KeyMetric) => [
  {
    title: 'Total GMV',
    value: `₹${(keyMetrics.total_amount).toFixed(2)}L`,
    icon: <TrendingUp className="h-5 w-5 text-green-500" />
  },
  {
    title: 'Business Category / Industry',
    value: keyMetrics.business_category.toString(),
    icon: <Store className="h-5 w-5 text-blue-500" />
  },
  {
    title: 'Total life time investigations',
    value: keyMetrics.total_num_investigations.toString(),
    icon: <ShieldAlert className="h-5 w-5 text-orange-500" />
  },
  {
    title: 'Date of onboarding',
    value: keyMetrics.date_of_onboarding.toString(),
    icon: <Calendar className="h-5 w-5 text-purple-500" />
  },
  {
    title: 'Chargeback Percentage',
    value: keyMetrics.chargeback_percentage.toString(),
    icon: <ArrowLeftRight className="h-5 w-5 text-red-500" />
  },
  {
    title: 'Current Balance in Ledger',
    value: keyMetrics.current_balance_in_ledger.toString(),
    icon: <Wallet className="h-5 w-5 text-emerald-500" />
  },
  {
    title: 'Account status',
    value: keyMetrics.account_status.toString(),
    icon: <CircleCheck className="h-5 w-5 text-blue-500" />
  },
  {
    title: 'KYC status',
    value: keyMetrics.date_of_onboarding.toString(),
    icon: <FileCheck className="h-5 w-5 text-teal-500" />
  },
  {
    title: 'Integration types',
    value: keyMetrics.integration_types.toString(),
    icon: <Puzzle className="h-5 w-5 text-indigo-500" />
  },
  {
    title: 'Business Type',
    value: keyMetrics.business_type.toString(),
    icon: <Building2 className="h-5 w-5 text-slate-500" />
  },
  {
    title: 'Count to total unique customers',
    value: keyMetrics.no_of_unique_customers.toString(),
    icon: <Users className="h-5 w-5 text-violet-500" />
  },
];