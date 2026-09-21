'use client';

import { FC } from 'react';
import { Share2 } from 'lucide-react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { ArtifactHeader } from '@/components/custom/ArtifactHeader';
import { ArtifactSectionCollapsible } from '@/components/custom/ArtifactSectionCollapsible';
import { CustomTableView } from '@/components/custom/CustomTableView';
import SocialMediaCard from '@/components/custom/SocialMediaCard';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import WebsiteSnapshotsSection from './WebsiteSnapshotsSection';
// import MccClassificationSection from './MccClassificationSection';
import socialMediaAccounts from '@/app/data/staticSnapshots/tarc/social-media.json';

const PLATFORM_ICON_NAMES: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'Linkedin',
  youtube: 'Youtube',
};

const BusinessDigitalPresenceTab: FC = () => {
  const artifactStore = useArtifactStore();

  const openSocialMediaArtifact = (account: (typeof socialMediaAccounts)[number]) => {
    const artifactId = `social-media-${account.platform}-${Date.now()}`;
    artifactStore.addTab({
      id: artifactId,
      title: `${account.name} (Social)`,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader title={`${account.name} - Social Media Details`} />
          <ArtifactSectionCollapsible title="Details" defaultOpen>
            <CustomTableView
              columns={[
                { key: 'field', header: 'Field' },
                {
                  key: 'value',
                  header: 'Value',
                  align: 'right',
                  render: (v: string) =>
                    v.startsWith('http') ? (
                      <a href={v} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{v}</a>
                    ) : v,
                },
              ]}
              data={[
                { field: 'Status', value: account.status },
                ...('followers' in account && account.followers != null ? [{ field: 'Followers', value: account.followers.toLocaleString('en-IN') }] : []),
                ...('posts' in account && account.posts != null ? [{ field: 'Posts', value: String(account.posts) }] : []),
                ...('following' in account && account.following != null ? [{ field: 'Following', value: String(account.following) }] : []),
                ...('verified' in account ? [{ field: 'Verified', value: account.verified ? 'Yes' : 'No' }] : []),
                ...('category' in account && account.category ? [{ field: 'Category', value: account.category }] : []),
                ...(account.url ? [{ field: 'Link', value: account.url }] : []),
              ]}
              className="w-full"
            />
          </ArtifactSectionCollapsible>
          {'bio' in account && account.bio && (
            <ArtifactSectionCollapsible title="Bio" defaultOpen>
              <div className="text-sm text-gray-700 whitespace-pre-line">{account.bio}</div>
            </ArtifactSectionCollapsible>
          )}
        </div>
      ),
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Website Snapshots — same component as the underwriting product */}
      <WebsiteSnapshotsSection />

      {/* MCC Classification — same component as the underwriting product */}
      {/* <MccClassificationSection /> */}

      {/* Social Media Presence */}
      <div>
        <SectionHeaderWithFlags
          title="Social Media Presence"
          icon={Share2}
          iconColorClass="text-purple-600"
          positiveFlags={[]}
          negativeFlags={[]}
          allowCollapse={false}
        />
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {socialMediaAccounts.map((account) => (
            <div key={account.platform} onClick={() => openSocialMediaArtifact(account)} role="button" tabIndex={0}>
              <SocialMediaCard
                iconName={PLATFORM_ICON_NAMES[account.platform]}
                name={account.name}
                status={account.status}
                accountCount={account.status === 'Active' ? 1 : 0}
                accounts={[{
                  url: account.url,
                  followers: 'followers' in account ? account.followers : undefined,
                  posts: 'posts' in account ? account.posts : undefined,
                  following: 'following' in account ? account.following : undefined,
                  details: 'bio' in account ? account.bio : undefined,
                }]}
                onMoreDetails={() => openSocialMediaArtifact(account)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessDigitalPresenceTab;
