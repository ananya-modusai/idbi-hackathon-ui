import { create } from 'zustand';
import { TransactionsType, PayoutsType } from '@/app/types';
import { merchantService } from '@/app/services/merchantServices';

interface ActivityTransactionsStore {
  transactions: TransactionsType;
  fetchTransactions: (merchantId: string) => Promise<void>;
  payouts: PayoutsType;
  fetchPayouts: (merchantId: string) => Promise<void>;
}

export const useActivityTransactionsStore = create<ActivityTransactionsStore>((set) => ({
  transactions: { transactions: [] },
  fetchTransactions: async (merchantId: string) => {
    const transactions = await merchantService.getMerchantTransactions(merchantId);
    set({ transactions });
  },
  payouts: { payouts: [] },
  fetchPayouts: async (merchantId: string) => {
    const payouts = await merchantService.getMerchantPayouts(merchantId);
    set({ payouts });
  },
}));
