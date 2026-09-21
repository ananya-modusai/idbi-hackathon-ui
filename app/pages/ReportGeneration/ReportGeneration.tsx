import { Workspace } from '@/app/layout/Workspace/Workspace';
import { ReportGenerationTab } from './ReportGenerationTab';
import { FC } from 'react';

const ReportGeneration: FC = () => { 
    const tabs = [
      {
        id: "report gen",
        label: "report gen",
        content: <ReportGenerationTab />
      }
    ]
    return <Workspace tabs={tabs} />
  }
  
  export default ReportGeneration;