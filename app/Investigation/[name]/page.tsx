'use client';

import { useParams } from 'next/navigation';
import InvCaseWorkspacePage from '@/app/pages/Investigation/InvWorkspace/InvCaseWorkspacePage';

export default function InvestigationCasePage() {
  const params = useParams();
  const name = params.name as string;

  return <InvCaseWorkspacePage name={name} />;
}
