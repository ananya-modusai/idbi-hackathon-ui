'use client';

import { useParams } from 'next/navigation';
import MerchantInsolvency from '../../pages/Merchant/MerchantInsolvency/MerchantInsolvency';
import React, { useEffect, useState } from 'react';

export default function MerchantInsolvencyPage() {
  const params = useParams();
  // route is [cin] so use params.cin; fall back to merchant_id if present for compatibility
  const displayed = (params?.cin || params?.merchant_id) as string;
  const [resolvedMerchantId, setResolvedMerchantId] = useState<string | null>(null);
  const [resolutionAttempted, setResolutionAttempted] = useState(false);

  useEffect(() => {
    if (!displayed) return;

    (async () => {
      const { merchantIdList, fetchMerchantIdList } = (await import('@/app/store/merchant/merchantIdStore')).useMerchantIdStore.getState();
      let resolved = merchantIdList.find(m => m.id === displayed)?.id;
      if (!resolved) {
        try {
          // Try a larger fetch to increase chance of finding the merchant by CIN
          await fetchMerchantIdList(0, 500);
          const updated = (await import('@/app/store/merchant/merchantIdStore')).useMerchantIdStore.getState().merchantIdList;
          resolved = updated.find(m => m.id === displayed)?.id || updated.find(m => m.cin === displayed)?.id;
        } catch {
          // ignore - we'll handle unresolved case explicitly
        }
      }
      setResolvedMerchantId(resolved || null);
      setResolutionAttempted(true);
    })();
  }, [displayed]);

  return (
    <main className="flex flex-col flex-1 min-h-0">
      {!resolutionAttempted ? (
        <div className="p-8 text-center">Loading merchant...</div>
      ) : resolvedMerchantId ? (
        <MerchantInsolvency merchantId={resolvedMerchantId} />
      ) : (
        <div className="p-8 text-center text-red-600">Merchant not found — cannot load insolvency data.</div>
      )}
    </main>
  );
}
