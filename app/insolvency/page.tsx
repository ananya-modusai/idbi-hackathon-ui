'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/app/components/ui/loading-spinner';
import { useWorkspaceStore } from '@/app/store/workspace/workspaceStore';

// Single-merchant demo build: TARC is the only merchant available, so the bare
// /insolvency route (no CIN) redirects straight to it instead of showing a
// "No Merchant Selected" blank state.
const TARC_CIN = 'L70100DL2016PLC390526';

export default function InsolvencyPage() {
  const { setActiveNavigation } = useWorkspaceStore();
  const router = useRouter();

  useEffect(() => {
    // Set navigation context on page load/refresh
    setActiveNavigation({ group: 'Merchant', item: 'Insolvency' });
    router.replace(`/insolvency/${TARC_CIN}`);
  }, [setActiveNavigation, router]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoadingSpinner />
    </Suspense>
  );
}
