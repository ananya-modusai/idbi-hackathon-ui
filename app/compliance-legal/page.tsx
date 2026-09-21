'use client';

import { useEffect, useState } from 'react';
import ComplianceLegal from '@/app/pages/Merchant/ComplianceLegal/ComplianceLegal';

// Single-merchant demo build: TARC is the only merchant available.
const TARC_MERCHANT_ID = 'd4efc32f-9fcc-4cfc-8e60-eff421acf83d';

export default function ComplianceLegalPage() {
  const [merchantId, setMerchantId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { useActiveContextStore } = await import('@/app/store/activeContextStore');
      const active = useActiveContextStore.getState().activeContexts?.merchant;
      setMerchantId(active || TARC_MERCHANT_ID);
    })();
  }, []);

  return (
    <main className="flex flex-col flex-1 min-h-0">
      {merchantId ? (
        <ComplianceLegal merchantId={merchantId} />
      ) : (
        <div className="p-8 text-center">Loading merchant...</div>
      )}
    </main>
  );
}
