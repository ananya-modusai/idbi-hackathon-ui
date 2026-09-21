'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, RefreshCw, Building, CreditCard, Banknote, FileText, ExternalLink } from 'lucide-react';
import { CustomCard } from '@/components/custom/CustomCard';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { ColorScheme, getColorClasses } from '@/components/custom/CustomColorScheme';
import { useChargebackCaseStore } from '@/app/store/chargeback/chargebackCaseStore';
import CBPageHeader from '../Components/CBPageHeader';
import { 
  ReconStatus, 
  MerchantReconData, 
  TransactionReconData, 
  PAAccountReconData, 
  MerchantLedgerReconData 
} from '@/app/pages/Chargebacks/SampleData/CBCasesSampleData';

interface CBReconciliationTabProps {
  merchantId?: string;
  caseId?: string;
}

interface ReconFlowCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  status: 'Reconciled' | 'Not Reconciled';
  input: { [key: string]: any };
  intermediate: { matchPercentage: number };
  output: { [key: string]: any };
  onAction: () => void;
}

const ReconFlowCard: FC<ReconFlowCardProps> = ({
  title,
  description,
  icon,
  iconColor,
  status,
  input,
  intermediate,
  output,
  onAction
}) => {
  const formatIndianCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatDateTime = (dateTimeString: string): string => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatValue = (key: string, value: any): string => {
    // Check if the key suggests it's an amount/currency field
    const amountKeys = ['amount', 'debit', 'transaction'];
    const isAmountField = amountKeys.some(keyword => 
      key.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Check if the key suggests it's a datetime field
    const dateTimeKeys = ['datetime', 'date', 'time'];
    const isDateTimeField = dateTimeKeys.some(keyword => 
      key.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (isAmountField && typeof value === 'number') {
      return formatIndianCurrency(value);
    }
    
    if (isDateTimeField && typeof value === 'string' && value.includes('T')) {
      return formatDateTime(value);
    }
    
    return String(value);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Reconciled':
        return 'border-green-200';
      case 'Not Reconciled':
        return 'border-red-200';
      default:
        return 'border-yellow-200';
    }
  };

  const getHeaderColor = () => {
    switch (status) {
      case 'Reconciled':
        return 'text-green-600';
      case 'Not Reconciled':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getMatchColor = (percentage: number): ColorScheme => {
    if (percentage >= 95) return 'green';
    if (percentage >= 80) return 'yellow';
    return 'red';
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={itemVariants}
    >
      <CustomCard className={`p-5 border-l-4 ${getStatusColor()}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-gray-100 rounded-lg ${iconColor}`}>
                {icon}
              </div>
              <div>
                <h3 className={`font-semibold ${getHeaderColor()}`}>{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Manual Reconciliation Button for Non-Reconciled */}
              {status === 'Not Reconciled' && (
                <button
                  onClick={onAction}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 ${getColorClasses('blueTextWhiteBg')}`}
                  style={{ 
                    borderColor: 'currentColor',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Manual Reconciliation
                </button>
              )}
              
              {status === 'Reconciled' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-sm font-medium ${status === 'Reconciled' ? 'text-green-600' : 'text-red-600'}`}>
                {status}
              </span>
            </div>
          </div>

          {/* Horizontal Separator */}
          <div className="w-full h-px bg-gray-200"></div>

          {/* Reconciliation Flow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Input</h4>
                <div className="space-y-2">
                  {Object.entries(input).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-medium text-gray-900">{formatValue(key, value)}</span>
                    </div>
                  ))}
                </div>
            </div>

            {/* Vertical Separator */}
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 md:block hidden"></div>
              <div className="md:pl-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">Match</h4>
                  <BubbleTag
                    text={`${intermediate.matchPercentage}%`}
                    color={getMatchColor(intermediate.matchPercentage)}
                  />
                </div>
                <div className="space-y-2">
                  {Object.entries(output).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-medium text-gray-900">{formatValue(key, value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>


        </div>
      </CustomCard>
    </motion.div>
  );
};

const CBReconciliationTab: FC<CBReconciliationTabProps> = ({ 
  merchantId, 
  caseId 
}) => {
  const { selectedCase } = useChargebackCaseStore();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const handleMerchantRecon = () => {
    console.log('Re-running merchant reconciliation...');
  };

  const handleTransactionRecon = () => {
    console.log('Re-running transaction reconciliation...');
  };

  const handlePAAccountRecon = () => {
    console.log('Re-running PA account reconciliation...');
  };

  const handleMerchantLedgerRecon = () => {
    console.log('Re-running merchant ledger reconciliation...');
  };

  if (!selectedCase) {
    return (
      <motion.div 
        className="text-center py-12"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-400">No Case Selected</h2>
        <p className="text-gray-500">Please select a chargeback case from the Active Context to view reconciliation details.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6 px-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <CBPageHeader activeCase={selectedCase} />
      </motion.div>

      {/* Reconciliation Cards - Single Column */}
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
      >
        {/* Merchant Reconciliation */}
        <ReconFlowCard
          title="Merchant Recon"
          description="Merchant Name → Merchant ID"
          icon={<Building className="h-5 w-5" />}
          iconColor="text-purple-600"
          status={selectedCase.reconStatus.merchantRecon.status}
          input={selectedCase.reconStatus.merchantRecon.input}
          intermediate={selectedCase.reconStatus.merchantRecon.intermediate}
          output={selectedCase.reconStatus.merchantRecon.output}
          onAction={handleMerchantRecon}
        />

        {/* Transaction Reconciliation */}
        <ReconFlowCard
          title="Transaction Recon"
          description="Bank Reference → Internal Transaction ID"
          icon={<CreditCard className="h-5 w-5" />}
          iconColor="text-blue-600"
          status={selectedCase.reconStatus.transactionRecon.status}
          input={selectedCase.reconStatus.transactionRecon.input}
          intermediate={selectedCase.reconStatus.transactionRecon.intermediate}
          output={selectedCase.reconStatus.transactionRecon.output}
          onAction={handleTransactionRecon}
        />

        {/* PA Account Reconciliation */}
        <ReconFlowCard
          title="PA Account Recon"
          description="Chargeback Notification → PA Account Debit"
          icon={<Banknote className="h-5 w-5" />}
          iconColor="text-green-600"
          status={selectedCase.reconStatus.paAccountRecon.status}
          input={selectedCase.reconStatus.paAccountRecon.input}
          intermediate={selectedCase.reconStatus.paAccountRecon.intermediate}
          output={selectedCase.reconStatus.paAccountRecon.output}
          onAction={handlePAAccountRecon}
        />

        {/* Merchant Ledger Reconciliation */}
        <ReconFlowCard
          title="Merchant Ledger Recon"
          description="Chargeback Notification → Merchant Ledger Debit"
          icon={<FileText className="h-5 w-5" />}
          iconColor="text-orange-600"
          status={selectedCase.reconStatus.merchantLedgerRecon.status}
          input={selectedCase.reconStatus.merchantLedgerRecon.input}
          intermediate={selectedCase.reconStatus.merchantLedgerRecon.intermediate}
          output={selectedCase.reconStatus.merchantLedgerRecon.output}
          onAction={handleMerchantLedgerRecon}
        />
      </motion.div>
    </motion.div>
  );
};

export default CBReconciliationTab;
