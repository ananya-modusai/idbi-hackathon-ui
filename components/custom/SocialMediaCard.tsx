import React, { FC, useState, useRef } from "react";
import { getIconByName } from "@/components/custom/CustomIconScheme";

// Map of normalized social platform keys -> remote logo image URL.
const socialLogoMap: Record<string, string> = {
  linkedin: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg",
  instagram: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg",
  facebook: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg",
  youtube: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg",
  twitter: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg",
  tiktok: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg",
  google: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/google.svg",
  amazon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/amazon.svg",
  flipkart: "https://tse1.mm.bing.net/th/id/OIP.M7Il561h_V38PLFGYbn2BAHaHa?w=474&h=379&c=7&p=0",
  justdial: "https://www.justdial.com/favicon.ico",
  indiamart: "https://www.indiamart.com/favicon.ico",
  meesho: "https://meesho.com/favicon.ico",
};

const normalize = (s?: string) =>
  String(s || "")
    .replace(/[\s\-_]/g, "")
    .toLowerCase();

// Simplified presence interpretation
const interpretPresence = (v: any): "Active" | "Not Found" | "N/A" | undefined => {
  if (v === null) return "N/A";
  if (typeof v === "undefined") return undefined;
  if (typeof v === "boolean") return v ? "Active" : "Not Found";
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "yes") return "Active";
    if (s === "false" || s === "no") return "Not Found";
    if (s === "na" || s === "n/a" || s === "null") return "N/A";
  }
  return undefined;
};

const StatusBadge: FC<{ status?: any }> = ({ status }) => {
  const s = typeof status === "string" ? status.trim().toLowerCase() : status;
  if (s === "active" || s === "true" || s === "yes" || status === true) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
        Active
      </span>
    );
  }
  if (s === "not found" || s === "false" || s === "no" || status === false) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
        Not Found
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      N/A
    </span>
  );
};

const SocialMediaCard: FC<any> = (props) => {
  const {
    iconName,
    name,
    status,
    accounts = [], // Array for carousel
    accountCount,  // optional explicit count for display
    onMoreDetails,
  } = props;

  // If accountCount is explicitly provided use it; otherwise derive from accounts array
  const displayCount: number | undefined =
    typeof accountCount === "number" ? accountCount : undefined;

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const Icon = iconName ? getIconByName(iconName) : null;
  const platformKey = normalize(iconName ?? name);
  const logoUrl = socialLogoMap[platformKey];
  
  const brandBackgroundMap: Record<string, string> = {
    linkedin: "#0A66C2",
    instagram: "linear-gradient(45deg,#feda75 0%,#fa7e1e 25%,#d62976 50%,#962fbf 75%,#4f5bd5 100%)",
    facebook: "#1877F2",
    youtube: "#FF0000",
    twitter: "#1DA1F2",
    tiktok: "#010101",
    google: "#4285F4",
    amazon: "#FF9900",
    flipkart: "#2874F0",
    justdial: "#FF6A00",
    indiamart: "#0A5AB3",
    meesho: "#FF3B8C",
  };
  const brandBackground = brandBackgroundMap[platformKey];

  const palette: Record<string, string> = {
    linkedin: "bg-blue-50 text-blue-700",
    instagram: "bg-pink-50 text-pink-600",
    facebook: "bg-blue-50 text-blue-700",
    youtube: "bg-red-50 text-red-700",
    google: "bg-blue-50 text-blue-700",
    amazon: "bg-amber-50 text-amber-700",
    flipkart: "bg-blue-50 text-blue-700",
  };
  const initial = name ? String(name).charAt(0).toUpperCase() : "?";
  const colorClass = palette[platformKey] || "bg-gray-50 text-gray-700";

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const width = scrollContainerRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== activeSlideIndex && accounts.length > 0) {
        setActiveSlideIndex(newIndex);
      }
    }
  };

  const currentAccount = accounts.length > 0 ? accounts[activeSlideIndex] : props;

  return (
    <div className="rounded-lg border border-gray-200 bg-white pt-4 pb-4 flex flex-col shadow-sm h-44 overflow-hidden relative">
      <div className="px-4 flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 flex-1">
          <div className={`flex items-center justify-center h-10 w-10 rounded-md ${Icon || logoUrl ? "bg-gray-50" : ""}`}>
            {logoUrl ? (
              (() => {
                const isSvg = String(logoUrl).toLowerCase().endsWith(".svg");
                if (isSvg && brandBackground) {
                  return <span aria-hidden className="rounded-sm" style={{
                    WebkitMask: `url(${logoUrl}) no-repeat center / contain`,
                    mask: `url(${logoUrl}) no-repeat center / contain`,
                    background: brandBackground,
                    display: "inline-block",
                    width: 24,
                    height: 24,
                  }} />;
                }
                return <img src={logoUrl} alt={`${name} logo`} className="h-6 w-6 object-contain" />;
              })()
            ) : Icon ? (
              <Icon className="h-6 w-6 text-gray-600" />
            ) : (
              <div className={`flex items-center justify-center h-8 w-8 rounded text-sm font-semibold ${colorClass}`}>{initial}</div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-gray-700 leading-tight truncate">{name}</span>
            {typeof displayCount === "number" && (
              <div className="mt-1">
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-flex leading-none ${
                    displayCount > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {displayCount > 0 ? `${displayCount} Found` : "Not Found"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Carousel Indicators */}
        {accounts.length > 1 && (
          <div className="flex gap-1.5 items-center justify-center absolute left-1/2 -translate-x-1/2 top-2.5 z-10">
            {accounts.map((_: any, i: number) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  activeSlideIndex === i ? "bg-blue-500 w-4" : "bg-gray-200 w-1.5"
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex-shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onMoreDetails?.(activeSlideIndex);
            }}
          >
            <span className="text-xs font-medium whitespace-nowrap">More {">"}</span>
            {(() => {
              const ChevronRightIcon = getIconByName("ChevronRight");
              return ChevronRightIcon ? <ChevronRightIcon className="h-4 w-4" /> : null;
            })()}
          </button>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-x-auto snap-x snap-mandatory flex scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {(accounts.length > 0 ? accounts : [props]).map((acc: any, idx: number) => (
          <div key={idx} className="min-w-full px-4 snap-start">
            {renderAccountDetails(name, acc)}
          </div>
        ))}
      </div>
    </div>
  );
};

const renderAccountDetails = (name: string, data: any) => {
  const lname = (name || "").toLowerCase();
  
  const Row = ({ label, value, isLink = false }: any) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 items-center">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-sm font-medium text-right text-gray-800 truncate">
        {isLink && value && value !== "N/A" ? (
          <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline" onClick={e=>e.stopPropagation()}>
            {value}
          </a>
        ) : (
          (typeof value === 'object' && value !== null) 
            ? (value.company_size ?? value.associated_members ?? value.text ?? JSON.stringify(value)) 
            : (value ?? "N/A")
        )}
      </div>
    </div>
  );

  if (lname.includes("linkedin")) {
    return (
      <div className="flex flex-col gap-1.5">
        <Row label="Employees" value={data.employees} />
        <Row label="Connection" value={data.connections} />
        <Row label="Link" value={data.url} isLink />
      </div>
    );
  }

  if (lname.includes("instagram") || lname.includes("facebook")) {
    return (
      <div className="flex flex-col gap-1.5">
        <Row label="Followers" value={data.followers} />
        <Row label="Posts" value={data.posts} />
        <Row label="Link" value={data.url} isLink />
      </div>
    );
  }

  if (lname.includes("youtube")) {
    return (
      <div className="flex flex-col gap-1.5">
        <Row label="Subscribers" value={data.subscribers} />
        <Row label="Posts" value={data.posts} />
        <Row label="Link" value={data.url} isLink />
      </div>
    );
  }

  // Marketplaces check
  const marketplaceKeys = ["google", "amazon", "flipkart", "justdial", "indiamart", "meesho"];
  if (marketplaceKeys.some(k => lname.includes(k))) {
    if (lname.includes("google")) {
      return (
        <div className="flex flex-col gap-1.5">
          <Row label="Rating" value={data.rating} />
          <Row label="No. of Rating" value={data.numRatings} />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1.5">
        <Row label="Rating" value={data.rating} />
        <Row label="Listing" value={data.listing} />
        <Row label="Verified Link" value={data.verifiedLink} isLink />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Row label="Followers" value={data.followers} />
      <Row label="Posts" value={data.posts} />
    </div>
  );
};

export default SocialMediaCard;
