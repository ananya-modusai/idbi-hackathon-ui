'use client';

import { useParams } from 'next/navigation';
import CBWorkspacePage from '@/app/pages/Chargebacks/CBWorkspace/CBWorkspacePage';

export default function ChargebackCasePage() {
  const params = useParams();
  const caseId = params.caseId as string;

  return <CBWorkspacePage caseId={caseId} />;
}
