import { create } from 'zustand';
import { ActiveContextType } from '../layout/ActiveContext/types';
import { useMerchantIdStore } from './merchant/merchantIdStore';

interface ActiveContextStore {
  activeContexts: ActiveContextType;
  setContext: (type: keyof ActiveContextType, value: string | null) => void;
  clearContexts: () => void;
  initFromUrl: () => void;
}

export const useActiveContextStore = create<ActiveContextStore>((set) => ({
  activeContexts: {
    merchant: null,
    customer: null,
    rule: null,
    case: null,
    company: null,
    intermediary: null,
    chargeback: null,
    investigation: null
  },
  setContext: (type, value) => {
    // Avoid redundant updates if value is unchanged
    if (useActiveContextStore.getState().activeContexts[type] === value) return;
    
    set(state => {
      const newContexts = { 
        ...state.activeContexts, 
        [type]: value 
      };
      
      // Sync with merchantIdStore
      if (type === 'merchant') {
        useMerchantIdStore.getState().setSelectedMerchantId(value);
      }
      
      // Sync with chargebackCaseStore
      if (type === 'chargeback') {
        const { useChargebackCaseStore } = require('./chargeback/chargebackCaseStore');
        useChargebackCaseStore.getState().setSelectedCaseId(value);
      }

      // Sync with investigationCaseStore
      if (type === 'investigation') {
        const { useInvestigationCaseStore } = require('./investigation/investigationCaseStore');
        useInvestigationCaseStore.getState().setSelectedCaseId(value);
      }
      
      return { activeContexts: newContexts };
    });
  },
  clearContexts: () => set({ 
    activeContexts: {
      merchant: null,
      customer: null,
      rule: null,
      case: null,
      company: null,
      intermediary: null,
      chargeback: null,
      investigation: null
    }
  }),
  initFromUrl: () => {
    // Resolve displayed route segment (which is now CIN when available) back to merchantId
    if (typeof window !== 'undefined') {
      (async () => {
        const pathParts = window.location.pathname.split('/');
        const insolvencyIndex = pathParts.indexOf('insolvency');
        if (insolvencyIndex !== -1 && pathParts[insolvencyIndex + 1]) {
          const displayed = pathParts[insolvencyIndex + 1];

          // Try to resolve from existing merchant list
          const { merchantIdList, fetchMerchantIdList } = useMerchantIdStore.getState();
          let resolvedMerchantId: string | undefined;

          // First check if the displayed value is already an ID
          const byId = merchantIdList.find(m => m.id === displayed);
          if (byId) {
            resolvedMerchantId = byId.id;
          } else {
            // Check if it matches a CIN
            const byCin = merchantIdList.find(m => m.cin === displayed);
            if (byCin) resolvedMerchantId = byCin.id;
          }

          // If not resolved, fetch the merchant list then try again
          if (!resolvedMerchantId) {
            try {
              await fetchMerchantIdList(0, 200);
              const updatedList = useMerchantIdStore.getState().merchantIdList;
              const byId2 = updatedList.find(m => m.id === displayed);
              const byCin2 = updatedList.find(m => m.cin === displayed);
              if (byId2) resolvedMerchantId = byId2.id;
              if (byCin2) resolvedMerchantId = byCin2.id;
            } catch {
              // ignore - we'll fallback to using displayed value as-is
            }
          }

          // Only set merchant context when we could resolve the displayed value to a real merchantId
          // This avoids setting the active merchant to the raw CIN string which causes API calls to use CIN
          // and return 422 errors. If we could not resolve the displayed value, leave merchant null and
          // allow components or the page-level resolver to set it later when merchantId is known.
          if (resolvedMerchantId) {
            // Only set the merchant context from the URL if there is not already an
            // explicitly-selected merchant context. This prevents background URL
            // resolution (which can run after a user-initiated selection) from
            // overwriting a selection made by the user.
            const currentMerchant = useActiveContextStore.getState().activeContexts.merchant;
            if (!currentMerchant) {
              set(state => ({
                activeContexts: {
                  ...state.activeContexts,
                  merchant: resolvedMerchantId
                }
              }));
              useMerchantIdStore.getState().setSelectedMerchantId(resolvedMerchantId);
            }
          } else {
            // Do not set merchant context to the unresolved displayed value (CIN)
            // Keep activeContexts.merchant as null so client-side components don't call APIs with CIN.
            // Optionally we could add a separate UI signal that merchant needs resolution.
          }
        }
      })();
    }
  }
}));

