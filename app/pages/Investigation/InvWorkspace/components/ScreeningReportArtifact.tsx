import React, { FC } from "react";
import { FileText, Globe, MapPin, ExternalLink } from "lucide-react";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { ArtifactHeader } from "@/components/custom/ArtifactHeader";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import { getIconByName } from "@/components/custom/CustomIconScheme";
import SocialMediaCard from "@/components/custom/SocialMediaCard";
import { webSearchSampleData } from "./associatedPeopleSampleData";

interface ScreeningReportArtifactProps {
  row: Record<string, unknown>;
  caseId: string;
  activeCase: any;
  websiteDataJson: any;
  redFlags: any[];
  artifactPanelCollapsed: boolean;
  openScreeningSocialMediaArtifact: (name: string, e: any) => void;
}

const EmptyState: FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
    <div className="text-gray-400 mb-2">
      <Globe className="h-10 w-10 opacity-20" />
    </div>
    <div className="text-sm text-gray-500 font-medium text-center">{message}</div>
  </div>
);

export const ScreeningReportArtifact: FC<ScreeningReportArtifactProps> = ({
  row,
  caseId,
  activeCase,
  websiteDataJson,
  redFlags,
  artifactPanelCollapsed,
  openScreeningSocialMediaArtifact,
}) => {
  const entityName = String(row?.name ?? "Screening Report");
  const theCaseId = activeCase?.caseId || caseId;
  const redFlagsList = redFlags ?? [];

  const flagTriggered = (f: any) => {
    if (!f) return false;
    const v = f.overallTriggered ?? f.overall_triggered;
    if (v === true) return true;
    if (typeof v === "string") {
      const s = v.toLowerCase().trim();
      if (s === "yes" || s === "true") return true;
    }
    if (typeof v === "number") return v === 1;
    return false;
  };

  const rf011Triggered = redFlagsList.some((r) => String(r.code).toUpperCase() === "RF011" && flagTriggered(r));
  const rf005Triggered = redFlagsList.some((r) => String(r.code).toUpperCase() === "RF005" && flagTriggered(r));
  const rf006Triggered = redFlagsList.some((r) => String(r.code).toUpperCase() === "RF006" && flagTriggered(r));

  const titleRight = rf011Triggered || rf005Triggered || rf006Triggered ? (
    <div className="flex items-center gap-2">
      {rf011Triggered && <BubbleTag text="Scam Merchant detected" color={"red" as any} />}
      {rf005Triggered && <BubbleTag text="website merchant mismatch" color={"red" as any} />}
      {rf006Triggered && <BubbleTag text="Impersonation detected" color={"red" as any} />}
    </div>
  ) : undefined;

  const IconGlobe = getIconByName("Globe");
  const IconFileSearch = getIconByName("FileSearch");

  const socialPlatforms = [
    { key: "facebook_social_media_data", name: "Facebook", iconName: "Facebook" },
    { key: "instagram_social_media_data", name: "Instagram", iconName: "Instagram" },
    { key: "linkedin_social_media_data", name: "LinkedIn", iconName: "Linkedin" },
    { key: "youtube_social_media_data", name: "YouTube", iconName: "Youtube" },
  ];

  const smData = websiteDataJson as any;
  const builtSocial: any[] = [];

  const extractField = (raw: any, platform: string, fieldNames: string[]) => {
    if (!raw) return null;
    for (const f of fieldNames) {
      if (raw[f] !== undefined && raw[f] !== null) return raw[f];
      
      const sd = raw.site_data;
      if (sd) {
        if (sd[f] !== undefined && sd[f] !== null) return sd[f];
        const psd = sd[platform];
        if (psd) {
          if (Array.isArray(psd)) {
            if (psd[0] && psd[0][f] !== undefined && psd[0][f] !== null)
              return psd[0][f];
          } else if (psd[f] !== undefined && psd[f] !== null) return psd[f];
        }
        const flatKey = `${platform}_${f}`;
        if (sd[flatKey] !== undefined && sd[flatKey] !== null)
          return sd[flatKey];
      }

      // Check raw_apify and raw_amplify
      if (raw.raw_apify && raw.raw_apify[f] !== undefined && raw.raw_apify[f] !== null) return raw.raw_apify[f];
      if (raw.raw_amplify && raw.raw_amplify[f] !== undefined && raw.raw_amplify[f] !== null) return raw.raw_amplify[f];
    }
    return null;
  };

  socialPlatforms.forEach((s) => {
    const platformKey = s.name.toLowerCase();
    const platformData = smData?.platforms?.[platformKey];
    
    if (platformData && !platformData.not_found) {
      const accountsList = Array.isArray(platformData) ? platformData : [platformData];
      
      const qualifyingAccounts = accountsList.filter((a: any) => {
        const hasWebsiteSource = String(a.source || "").toLowerCase() === "website" || 
                               String(a.site_data?.source || "").toLowerCase() === "website";
        if (hasWebsiteSource) return true;
        return a.matched === true || a.matched === "true";
      });

      if (qualifyingAccounts.length > 0) {
        // Group all qualifying accounts for this platform
        const platformAccounts = qualifyingAccounts.map((raw, idx) => {
          const platform = platformKey;
          return {
            url: (() => {
              let l = extractField(raw, platform, ["url", "link", `${platform}_url`]);
              if (platform.includes("facebook") && l && typeof l === "string" && l.toLowerCase().includes("facebook.com")) {
                if (l.includes("/photos/")) l = l.split("/photos/")[0] + "/";
                else if (l.includes("/posts/")) l = l.split("/posts/")[0] + "/";
              }
              return l;
            })(),
            source: extractField(raw, platform, ["source"]),
            followers: extractField(raw, platform, ["followers", "followerCount", "followersCount"]) ?? 
                       raw.raw_apify?.followersCount ?? raw.raw_apify?.followers ?? 
                       raw.raw_amplify?.followersCount ?? raw.raw_amplify?.followers ??
                       raw.raw_apify?.followerCount ?? raw.raw_amplify?.followerCount,
            employees: extractField(raw, platform, ["number_of_employees", "employeeCount", "employee_count"]) ?? (platform === "linkedin" ? (raw.raw_amplify?.employeeCount ?? raw.raw_apify?.employeeCount) : null),
            connections: extractField(raw, platform, ["followers", "connections", "followerCount", "connectionCount"]),
            subscribers: extractField(raw, platform, ["number_of_subscribers", "followers", "subscriberCount", "subscribersCount"]) ?? raw.raw_apify?.subscriberCount ?? raw.raw_apify?.subscribers ?? raw.raw_amplify?.subscriberCount ?? raw.raw_amplify?.subscribers,
            posts: extractField(raw, platform, ["number_of_posts", "total_videos_or_reels", "postCount", "postsCount"]) ?? 
                   raw.raw_apify?.postsCount ?? raw.raw_amplify?.postsCount ??
                   raw.raw_apify?.postCount ?? raw.raw_amplify?.postCount ??
                   (platform === "youtube" ? (raw.raw_apify?.aboutChannelInfo?.channelTotalVideos ?? raw.raw_amplify?.aboutChannelInfo?.channelTotalVideos) : null),
            details: raw.bio ?? extractField(raw, platform, ["bio", "description", "biography"]) ?? raw.raw_apify?.biography ?? raw.raw_amplify?.biography,
            following: platform === "instagram" ? (raw.raw_amplify?.followsCount ?? raw.raw_apify?.followsCount ?? raw.raw_amplify?.followingCount ?? raw.raw_apify?.followingCount) : undefined,
            status: "Active"
          };
        });

        const firstAcc = platformAccounts[0];
        builtSocial.push({
          name: s.name,
          iconName: s.iconName,
          accounts: platformAccounts,
          accountCount: platformAccounts.length,
          ...firstAcc,
          onMoreDetails: (index: number = 0) => openScreeningSocialMediaArtifact(s.name, index),
        });
      } else {
        builtSocial.push({
          name: s.name,
          iconName: s.iconName,
          status: "Not Found",
          accounts: [],
          accountCount: 0,
          followers: "N/A",
          posts: "N/A",
          url: "N/A",
          employees: "N/A",
          connections: "N/A",
          subscribers: "N/A",
          onMoreDetails: () => {},
        });
      }
    } else {
      builtSocial.push({
        name: s.name,
        iconName: s.iconName,
        status: "Not Found",
        accounts: [],
        accountCount: 0,
        followers: "N/A",
        posts: "N/A",
        url: "N/A",
        employees: "N/A",
        connections: "N/A",
        subscribers: "N/A",
        onMoreDetails: () => {},
      });
    }
  });

  const wanted = ["LinkedIn", "Instagram", "Facebook", "YouTube"];
  const renderList = [];
  const iconMap = { LinkedIn: "Linkedin", Instagram: "Instagram", Facebook: "Facebook", YouTube: "Youtube" };

  for (const name of wanted) {
    const existing = builtSocial.find(s => s.name === name);
    if (existing) {
      renderList.push(existing);
    } else {
      renderList.push({
        name,
        iconName: iconMap[name as keyof typeof iconMap] || name,
        status: "Not Found",
        accounts: [],
        accountCount: 0,
        followers: "N/A",
        posts: "N/A",
        url: "N/A",
        employees: "N/A",
        connections: "N/A",
        subscribers: "N/A",
        onMoreDetails: () => {},
      });
    }
  }

  return (
    <div className="pb-6 px-4">
      <ArtifactHeader title={entityName} contentIDText="Case ID" contentID={theCaseId} />
      
      {/* Screening check results at top */}
      <div className="mt-4">
        <div className="bg-white border border-gray-200 rounded p-3 border-l-4 border-l-blue-500">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4">
              <div className="text-sm font-medium text-gray-700 w-48 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600 shrink-0" aria-hidden />
                <span className="font-bold">PEP Check</span>
              </div>
              <div className="text-sm text-gray-900 flex-1 min-w-0">
                <span className="text-gray-900 font-semibold">{String(row?.pep_check ?? "No Match")}</span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-sm font-medium text-gray-700 w-48 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600 shrink-0" aria-hidden />
                <span className="font-bold">Sanction Check</span>
              </div>
              <div className="text-sm text-gray-900 flex-1 min-w-0">
                <span className="text-gray-900 font-semibold">{String(row?.sanction_check ?? "No Match")}</span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-sm font-medium text-gray-700 w-48 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-500 shrink-0" aria-hidden />
                <span className="font-bold">Sanction Country</span>
              </div>
              <div className="text-sm text-gray-900 flex-1 min-w-0">
                <span className="text-gray-900 font-semibold">{String(row?.sanction_country_check ?? "No Match")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SectionHeaderWithFlags positiveFlags={[]} negativeFlags={[]} neutralFlags={[]} title="Web Search" icon={IconGlobe || undefined} allowCollapse={false} />
        <div className="mt-3">
          {webSearchSampleData.length > 0 ? (
            webSearchSampleData.map((item: any, idx: number) => (
              <div key={`web-search-${idx}`} className="bg-white rounded-md border border-gray-200 overflow-hidden mb-4 hover:shadow-sm transition-shadow duration-150">
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-1">
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {item.url ? (
                        <img src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(String(item.url))}`} alt="favicon" className="h-5 w-5 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <span className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-1 overflow-hidden">
                        <span className="shrink-0">{item.host}</span>
                        {item.display && <><span className="shrink-0">·</span><span className="shrink-0">{item.display}</span></>}
                        {item.followers && <><span className="shrink-0">·</span><span className="shrink-0">{String(item.followers).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} followers</span></>}
                      </div>
                      <div className="mb-2">
                        <a href={item.url || "#"} target="_blank" rel="noreferrer" className="text-lg text-blue-600 hover:underline font-normal block truncate">{item.title}</a>
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed line-clamp-2">{item.snippet}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState message="No web search results available." />
          )}
        </div>
      </div>

      <div className="mt-6">
        <SectionHeaderWithFlags positiveFlags={[]} negativeFlags={[]} neutralFlags={[]} title="Adverse Media Search" icon={IconFileSearch || undefined} allowCollapse={false} />
        <div className="mt-3">
          <EmptyState message="No adverse media results available." />
        </div>
      </div>

      <div className="mt-6">
        <SectionHeaderWithFlags positiveFlags={[]} negativeFlags={[]} neutralFlags={[]} title="External trust & Presence" icon={IconGlobe || undefined} titleRightElement={titleRight} allowCollapse={false} />
        <div className="mt-3">
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${artifactPanelCollapsed ? "md:grid-cols-2" : "md:grid-cols-2"} gap-4`}>
            {renderList.map((p: any, idx: number) => (
              <div key={`social-${idx}`} className="w-full">
                <SocialMediaCard 
                   name={p.name} 
                   iconName={p.iconName} 
                   status={p.status} 
                   followers={p.followers} 
                   posts={p.posts} 
                   url={p.url} 
                   employees={p.employees} 
                   connections={p.connections} 
                   subscribers={p.subscribers} 
                   onMoreDetails={p.onMoreDetails} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
