'use client';

import { FC, useMemo } from 'react';
import { BookOpen, Table, Users, ExternalLink, Download } from 'lucide-react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { Building2 } from 'lucide-react';
import { SafeMarkdown } from '@/app/components/SafeMarkdown';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { ColorScheme } from '@/components/custom/CustomColorScheme';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import { PeerIdentificationArtifact } from './PeerIdentificationArtifact';
import industryIdentification from '@/app/data/tarc_rerun_peer_comparison/industry_identification.json';
import industryMappingNse from '@/app/data/tarc_rerun_peer_comparison/industry_mapping_nse.json';
import peerIdentification from '@/app/data/tarc_rerun_peer_comparison/peer_identification.json';

// Ported from ipo-compliance-nse/listing-compliance-ui's
// PeerIdentification/PeerIdentificationTab.tsx (Industry Identification, Industry
// Mapping and Peer Identification blocks). Per company policy, Industry Code /
// Macro Economic Sector / Sector are dropped everywhere — only Industry is
// shown — and the source is never labeled "NSE" in the UI.

const PALETTE: ColorScheme[] = ['blue', 'orange', 'green', 'indigo', 'purple', 'teal'];

// MCA XLS reports (public/files/peer-comparison/), matched by normalized company name.
const normalizeName = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '');

const MCA_XLS_FILES: Record<string, string> = {
  [normalizeName('TARC LIMITED')]: '/files/peer-comparison/L70100DL2016PLC390526_TARC_LIMITED.xls',
  [normalizeName("MODI'S NAVNIRMAN LIMITED")]: '/files/peer-comparison/U45203MH2022PLC377939_MODIS_NAVNIRMAN_LIMITED.xls',
  [normalizeName('SURATWWALA BUSINESS GROUP LIMITED')]: '/files/peer-comparison/L45200PN2008PLC131361_SURATWWALA_BUSINESS_GROUP_LIMITED.xls',
};

const PeerSelectionTab: FC = () => {
  const artifactStore = useArtifactStore();

  const industryText = industryIdentification.data.industry_identification || 'No industry identification data available.';

  const mappingData = useMemo(
    () => industryMappingNse.data.mappings.map((m) => ({ name: industryMappingNse.data.company_name, industry: m.industry })),
    []
  );

  const valueColorMap = useMemo(() => {
    const values = Array.from(new Set(peerIdentification.data.map((p) => p.type).filter(Boolean))).sort();
    const map: Record<string, ColorScheme> = {};
    values.forEach((val, index) => {
      map[val] = PALETTE[index % PALETTE.length];
    });
    return map;
  }, []);

  const getValueColor = (value: string): ColorScheme => valueColorMap[value] || 'gray';

  const peerIdentificationData = useMemo(
    () => peerIdentification.data.map((item, index) => ({
      ...item,
      sno: index + 1,
      mca_xls_url: MCA_XLS_FILES[normalizeName(item.name)] || null,
    })),
    []
  );

  const peerIdentificationColumns = [
    { key: 'sno', header: 'S.No', width: '6%', render: (_: any, row: any) => row.sno },
    { key: 'name', header: 'Company', width: '18%', render: (v: string) => <span className="text-blue-600 font-medium">{v}</span> },
    {
      key: 'industry',
      width: '11%',
      header: 'Industry',
      render: (v: string) => <BubbleTag text={v || '-'} color={getValueColor(v)} fixedWidth="160px" />,
    },
    {
      key: 'type',
      width: '14%',
      header: 'Type',
      render: (v: string) => {
        if (!v) return '-';
        const formattedText = v.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return <BubbleTag text={formattedText} color={getValueColor(v)} fixedWidth="120px" />;
      },
    },
    {
      key: 'revenue',
      width: '12%',
      header: 'Revenue (Rs. Crore)',
      render: (v: number) => (typeof v === 'number' ? v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'),
    },
    {
      key: 'assets',
      width: '12%',
      header: 'Total Assets',
      render: (v: number) => (typeof v === 'number' ? v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'),
    },
    {
      key: 'mca_xls_url',
      width: '15%',
      header: 'Download MCA Data',
      render: (v: string | null) => {
        if (!v) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <a href={v} download target="_blank" rel="noopener noreferrer">
            <BubbleTag text="Download" hasInsideIcon icon={<Download className="h-3 w-3" />} color="green" clickable />
          </a>
        );
      },
    },
    {
      key: 'details',
      width: '12%',
      header: 'Details',
      render: (_: any, row: any) => (
        <BubbleTag
          text="Open"
          hasInsideIcon
          icon={<ExternalLink className="h-3 w-3" />}
          color="blue"
          clickable
          onClick={() => {
            const artifactId = `peer-reasoning-${row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            artifactStore.addTab({
              id: artifactId,
              title: `Reasoning - ${row.name}`,
              renderArtifact: () => <PeerIdentificationArtifact item={row} getValueColor={getValueColor} />,
            });
            setTimeout(() => {
              artifactStore.forceActivateTab(artifactId);
              artifactStore.setCollapsed(false);
            }, 0);
          }}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Industry Overview */}
      <div>
        <SectionHeaderWithFlags title="Industry Overview" icon={BookOpen} iconColorClass="text-blue-600" positiveFlags={[]} negativeFlags={[]} allowCollapse={false} />

        <div className="mt-3 flex flex-col gap-4">
          <div className="border border-blue-100 rounded-lg bg-blue-50/40 p-4">
            <p className="text-[12.6px] font-semibold text-blue-700 mb-2">Industry Summary</p>
            <SafeMarkdown className="prose prose-sm max-w-none text-gray-600 text-[12.6px]">{industryText}</SafeMarkdown>
          </div>

          <div>
            <SectionHeaderWithFlags
              title="Industry Mapping"
              icon={Building2}
              iconColorClass="text-blue-700"
              titleColorClass="text-blue-700"
              positiveFlags={[]}
              negativeFlags={[]}
              allowCollapse={false}
            />
            <div className="mt-2">
            <CustomTableView
              columns={[
                { key: 'name', header: 'Name', width: '50%', render: (v: string) => <span className="text-blue-600 font-medium">{v}</span> },
                { key: 'industry', header: 'Industry', width: '50%', render: (v: string) => <BubbleTag text={v} color="indigo" /> },
              ]}
              data={mappingData}
              initialRowLimit={5}
              showCSVExport={false}
            />
            </div>
          </div>
        </div>
      </div>

      {/* Peer Identification */}
      <div>
        <SectionHeaderWithFlags title="Peer Identification" icon={Users} iconColorClass="text-blue-600" positiveFlags={[]} negativeFlags={[]} allowCollapse={false} />

        <div className="mt-3">
          <CustomTableView
            columns={peerIdentificationColumns}
            data={peerIdentificationData}
            initialRowLimit={3}
            showCSVExport={false}
          />
        </div>
      </div>
    </div>
  );
};

export default PeerSelectionTab;
