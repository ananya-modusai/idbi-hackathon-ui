"use client";

import * as React from "react";
import {
  Bookmark, Globe2, Heart, MessageCircle, Repeat2, Send, Share2, ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Generated portrait for the customer's profile picture — drawn rather than fetched, so
 * nothing leaves the app and the demo works offline.
 */
export const PortraitAvatar: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 64 64" className={className} aria-label="Profile photo" role="img">
    <defs>
      <linearGradient id="pa-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fde8d7" />
        <stop offset="100%" stopColor="#f6c9a8" />
      </linearGradient>
      <linearGradient id="pa-cloth" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1f5fa9" />
        <stop offset="100%" stopColor="#123e73" />
      </linearGradient>
      <clipPath id="pa-clip"><circle cx="32" cy="32" r="32" /></clipPath>
    </defs>
    <g clipPath="url(#pa-clip)">
      <rect width="64" height="64" fill="url(#pa-bg)" />
      {/* hair behind the shoulders */}
      <path d="M16 30c0-12 7-19 16-19s16 7 16 19v14c0 6-3 9-6 10H22c-3-1-6-4-6-10z" fill="#2a1c14" />
      {/* shoulders and kurta */}
      <path d="M8 64c1-12 10-18 24-18s23 6 24 18z" fill="url(#pa-cloth)" />
      <path d="M27 47l5 8 5-8-5-3z" fill="#e7b48c" />
      {/* neck and face */}
      <rect x="28" y="38" width="8" height="9" rx="4" fill="#dfa87e" />
      <ellipse cx="32" cy="29" rx="11" ry="13" fill="#e9b78e" />
      {/* fringe */}
      <path d="M21 28c0-9 5-15 11-15s11 6 11 15c-2-5-5-8-8-9-3 3-9 4-12 3-1 2-2 4-2 6z" fill="#2a1c14" />
      {/* features */}
      <ellipse cx="27.5" cy="29" rx="1.5" ry="1.8" fill="#2a1c14" />
      <ellipse cx="36.5" cy="29" rx="1.5" ry="1.8" fill="#2a1c14" />
      <path d="M25.5 25.6c1.3-1 3-1 4.2 0M34.3 25.6c1.3-1 3-1 4.2 0" stroke="#2a1c14" strokeWidth="1.1" strokeLinecap="round" fill="none" />
      <path d="M29.5 35.5c1.6 1.4 3.4 1.4 5 0" stroke="#b4705a" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="19.5" r="1.1" fill="#a3182f" />
      <circle cx="21.4" cy="31.5" r="1.4" fill="#d8a531" />
      <circle cx="42.6" cy="31.5" r="1.4" fill="#d8a531" />
    </g>
  </svg>
);

/** A stand-in photograph for an image post — an abstract shop floor, drawn inline. */
export const ShopFloorPhoto: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 400 300" className={className} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Shop floor photograph">
    <defs>
      <linearGradient id="sf-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#233247" />
        <stop offset="100%" stopColor="#3c4f68" />
      </linearGradient>
      <linearGradient id="sf-machine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8fa3bb" />
        <stop offset="100%" stopColor="#5b7490" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#sf-sky)" />
    {/* overhead lights */}
    {[70, 200, 330].map(x => (
      <g key={x}>
        <rect x={x - 26} y="28" width="52" height="7" rx="3" fill="#f2f6fb" opacity="0.9" />
        <path d={`M${x - 46} 35 L${x + 46} 35 L${x + 90} 300 L${x - 90} 300 Z`} fill="#ffffff" opacity="0.05" />
      </g>
    ))}
    {/* back wall panels */}
    <rect y="120" width="400" height="60" fill="#2c3d55" opacity="0.6" />
    {/* the machine */}
    <rect x="96" y="112" width="208" height="122" rx="10" fill="#93a8c0" />
    <rect x="112" y="128" width="104" height="72" rx="6" fill="#16202e" />
    <rect x="122" y="138" width="84" height="52" rx="3" fill="#2f6fd0" opacity="0.85" />
    <rect x="130" y="148" width="52" height="5" rx="2" fill="#bcd6ff" />
    <rect x="130" y="160" width="66" height="5" rx="2" fill="#7fb0f5" />
    <rect x="130" y="172" width="38" height="5" rx="2" fill="#7fb0f5" />
    <rect x="232" y="128" width="56" height="86" rx="6" fill="#7288a4" />
    <circle cx="260" cy="152" r="13" fill="#d8dee8" />
    <circle cx="260" cy="152" r="5" fill="#465a74" />
    <rect x="246" y="176" width="28" height="8" rx="4" fill="#e2b33c" />
    <rect x="246" y="190" width="28" height="8" rx="4" fill="#cfd8e4" />
    {/* floor and safety line */}
    <rect y="234" width="400" height="66" fill="#47596f" />
    <rect y="246" width="400" height="6" fill="#e2b33c" opacity="0.9" />
    <rect x="300" y="196" width="72" height="38" rx="4" fill="#6b7f98" />
    <rect x="308" y="204" width="56" height="8" rx="3" fill="#8ea3bc" />
  </svg>
);

interface PostProps {
  author: string;
  handle: string;
  meta: string;
  timeAgo: string;
  text: string;
  media?: string | null;
  engagement: Record<string, number>;
}

const n = (value: number) => value.toLocaleString("en-IN");

/** LinkedIn — avatar left, name + headline + time, body, reaction row, action bar. */
export const LinkedInPost: React.FC<PostProps> = ({ author, meta, timeAgo, text, engagement }) => (
  <div className="rounded-lg border border-slate-200 bg-white">
    <div className="flex items-start gap-2.5 px-3.5 pt-3.5">
      <PortraitAvatar className="size-12 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-sm font-semibold leading-tight text-slate-900">
          <span className="truncate">{author}</span>
          <span className="shrink-0 text-xs font-normal text-slate-400">· 1st</span>
        </p>
        <p className="truncate text-xs leading-tight text-slate-500">{meta}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
          {timeAgo} · <Globe2 className="size-3" />
        </p>
      </div>
    </div>

    <p className="whitespace-pre-line px-3.5 pb-3 pt-2.5 text-sm leading-6 text-slate-800">{text}</p>

    <div className="flex items-center justify-between px-3.5 pb-1.5 text-xs text-slate-500">
      <span className="flex items-center gap-1">
        <span className="flex -space-x-1">
          <span className="grid size-4 place-items-center rounded-full bg-[#0a66c2] text-white ring-2 ring-white"><ThumbsUp className="size-2.5" /></span>
          <span className="grid size-4 place-items-center rounded-full bg-[#df704d] text-white ring-2 ring-white"><Heart className="size-2.5" /></span>
        </span>
        {n(engagement.reactions ?? 0)}
      </span>
      <span>{n(engagement.comments ?? 0)} comments · {n(engagement.reposts ?? 0)} reposts</span>
    </div>

    <div className="mt-1 grid grid-cols-4 border-t border-slate-100 text-xs font-medium text-slate-500">
      {[
        { label: "Like", icon: ThumbsUp },
        { label: "Comment", icon: MessageCircle },
        { label: "Repost", icon: Repeat2 },
        { label: "Send", icon: Send },
      ].map(item => (
        <span key={item.label} className="flex items-center justify-center gap-1.5 py-2">
          <item.icon className="size-4" /> {item.label}
        </span>
      ))}
    </div>
  </div>
);

/** Instagram — gradient-ring avatar, square photo, action row, likes, caption. */
export const InstagramPost: React.FC<PostProps> = ({ author, meta, timeAgo, text, media, engagement }) => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <span className="rounded-full bg-[linear-gradient(135deg,#f9ce34,#ee2a7b_55%,#6228d7)] p-[2px]">
        <PortraitAvatar className="size-8 rounded-full bg-white ring-2 ring-white" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-slate-900">{author}</p>
        <p className="truncate text-xs leading-tight text-slate-500">{meta}</p>
      </div>
    </div>

    <p className="px-3 pb-1 text-sm leading-6 text-slate-800">{text}</p>

    <div className="flex items-center gap-4 border-t border-slate-100 px-3 pt-2.5 text-slate-800">
      <Heart className="size-5" />
      <MessageCircle className="size-5" />
      <Send className="size-5" />
      <Bookmark className="ml-auto size-5" />
    </div>

    <p className="px-3 pt-2 text-sm font-semibold text-slate-900">{n(engagement.likes ?? 0)} likes</p>
    <p className="px-3 pt-1 text-xs text-slate-500">View all {n(engagement.comments ?? 0)} comments</p>
    <p className="px-3 pb-3 pt-1 text-[11px] uppercase tracking-wide text-slate-400">{timeAgo} ago</p>
  </div>
);

/** X — avatar, name + handle + time on one line, text, then the action row. */
export const XPost: React.FC<PostProps> = ({ author, handle, timeAgo, text, engagement }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3.5">
    <div className="flex items-start gap-2.5">
      <PortraitAvatar className="size-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-1 text-sm leading-tight">
          <span className="truncate font-semibold text-slate-900">{author}</span>
          <span className="truncate text-slate-500">{handle}</span>
          <span className="shrink-0 text-slate-400">· {timeAgo}</span>
        </p>
        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-800">{text}</p>

        <div className="mt-2.5 flex items-center justify-between pr-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><MessageCircle className="size-4" /> {n(engagement.replies ?? 0)}</span>
          <span className="flex items-center gap-1.5"><Repeat2 className="size-4" /> {n(engagement.reposts ?? 0)}</span>
          <span className="flex items-center gap-1.5"><Heart className="size-4" /> {n(engagement.likes ?? 0)}</span>
          <span className="flex items-center gap-1.5"><Share2 className="size-4" /></span>
        </div>
      </div>
    </div>
  </div>
);

export const SocialPostBody: React.FC<PostProps & { platform: string }> = ({ platform, ...post }) => {
  if (platform === "Instagram") return <InstagramPost {...post} />;
  if (platform === "X") return <XPost {...post} />;
  return <LinkedInPost {...post} />;
};

export default SocialPostBody;
