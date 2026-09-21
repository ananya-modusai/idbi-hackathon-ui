import { forwardRef } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon, LucideProps } from "lucide-react";
import { ColorScheme } from "./CustomColorScheme";

/**
 * General-purpose icon registry utility.
 * Maps icon name strings to Lucide React icon components.
 *
 * This utility is project-agnostic and can be used across different applications.
 * First checks the iconRegistry, then falls back to direct LucideIcons lookup.
 *
 * @param iconName - The name of the icon (must match a Lucide icon name or registry key)
 * @returns The corresponding LucideIcon component, or null if not found
 */
export const getIconByName = (iconName: string): LucideIcon | null => {
  if (!iconName) return null;

  // Normalize incoming name (remove spaces/dashes, lowercase) to support
  // variants like "LinkedIn", "linkedIn", "youtube", "YouTube" etc.
  const normalize = (s: string) =>
    String(s || "")
      .replace(/[\s\-]/g, "")
      .toLowerCase();
  const requested = normalize(iconName);

  // Build a normalized lookup map from registry keys -> normalized key
  // (cached via closure semantics is fine since this file loads once)
  const registryKeys = Object.keys(iconRegistry) as string[];
  for (const key of registryKeys) {
    if (normalize(key) === requested) {
      return iconRegistry[key as IconName];
    }
  }

  // Also try a case-insensitive direct lookup into LucideIcons (many names
  // match the Lucide export exactly but with different casing from callers)
  const lucideKeys = Object.keys(LucideIcons) as Array<
    keyof typeof LucideIcons
  >;
  for (const k of lucideKeys) {
    if (
      normalize(String(k)) === requested &&
      typeof LucideIcons[k] === "function"
    ) {
      return LucideIcons[k] as LucideIcon;
    }
  }

  return null;
};

/**
 * Creates a type-safe icon registry from a type definition.
 * This function takes a record of icon names to Lucide icons and returns it typed correctly.
 *
 * @param iconMap - A record where keys are icon names and values are the corresponding Lucide icons
 * @returns The same record, typed as Record<T, LucideIcon>
 */
export const createIconRegistry = <T extends string>(
  iconMap: Record<T, LucideIcon>
): Record<T, LucideIcon> => {
  return iconMap;
};

/**
 * Pre-built icon registry for common Lucide icons.
 * This is the single source of truth for all icons.
 * The registry object defines both the available icons and their mappings.
 *
 * To use with a specific icon name type, import this and use it with type assertion:
 * const myRegistry = iconRegistry as Record<MyIconNameType, LucideIcon>;
 */
const IndiaFlagIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <rect width="24" height="24" rx="4" fill="#ffffff" />
    <rect width="24" height="8" rx="4" fill="#FF9933" />
    <rect y="8" width="24" height="8" fill="#ffffff" />
    <rect y="16" width="24" height="8" fill="#128807" />
    <circle
      cx="12"
      cy="12"
      r="2.5"
      stroke="#233A7A"
      strokeWidth="1"
      fill="none"
    />
    <circle cx="12" cy="12" r="0.4" fill="#233A7A" />
    <line
      x1="12"
      y1="9.5"
      x2="12"
      y2="14.5"
      stroke="#233A7A"
      strokeWidth="0.6"
    />
    <line
      x1="9.5"
      y1="12"
      x2="14.5"
      y2="12"
      stroke="#233A7A"
      strokeWidth="0.6"
    />
    <line
      x1="10.2"
      y1="10.2"
      x2="13.8"
      y2="13.8"
      stroke="#233A7A"
      strokeWidth="0.6"
    />
    <line
      x1="13.8"
      y1="10.2"
      x2="10.2"
      y2="13.8"
      stroke="#233A7A"
      strokeWidth="0.6"
    />
  </svg>
));

const UsaFlagIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <rect width="24" height="24" rx="4" fill="#ffffff" />
    <rect y="2" width="24" height="3" fill="#B22234" />
    <rect y="7" width="24" height="3" fill="#B22234" />
    <rect y="12" width="24" height="3" fill="#B22234" />
    <rect y="17" width="24" height="3" fill="#B22234" />
    <rect x="2" y="2" width="11" height="9" rx="2" fill="#3C3B6E" />
    <circle cx="5" cy="4" r="0.6" fill="#ffffff" />
    <circle cx="7.5" cy="5.8" r="0.6" fill="#ffffff" />
    <circle cx="10" cy="4" r="0.6" fill="#ffffff" />
    <circle cx="5" cy="7.6" r="0.6" fill="#ffffff" />
    <circle cx="7.5" cy="4" r="0.6" fill="#ffffff" />
    <circle cx="10" cy="7.6" r="0.6" fill="#ffffff" />
  </svg>
));

// NOTE: social brand SVGs (LinkedIn/Instagram/Facebook/YouTube) were removed
// from the inline registry to prefer CDN-hosted app logos. Social platform
// consumers (e.g., `SocialMediaCard`) should use remote logos (simple-icons
// CDN or other) by looking up platform names and rendering an <img/>. This
// keeps brand assets centralized and avoids duplication of SVGs here.

const SitemapIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {/* Top node */}
    <rect x="9" y="2" width="6" height="4" rx="1" />
    {/* Link to middle */}
    <path d="M12 6v3" />
    {/* Middle connector */}
    <rect x="10" y="10" width="4" height="3" rx="1" />
    {/* Links to bottom nodes */}
    <path d="M8 13v3" />
    <path d="M16 13v3" />
    <path d="M12 13v3" />
    {/* Bottom left */}
    <rect x="2" y="17" width="5" height="4" rx="1" />
    {/* Bottom center */}
    <rect x="9.5" y="17" width="5" height="4" rx="1" />
    {/* Bottom right */}
    <rect x="17" y="17" width="5" height="4" rx="1" />
    {/* Connections from middle connector to bottoms */}
    <path d="M12 13v4" />
    <path d="M10 13l-4 4" />
    <path d="M14 13l4 4" />
  </svg>
));

export const iconRegistry = {
  Activity: LucideIcons.Activity,
  AlertTriangle: LucideIcons.AlertTriangle,
  ArrowDown: LucideIcons.ArrowDown,
  ArrowUp: LucideIcons.ArrowUp,
  Banknote: LucideIcons.Banknote,
  Ban: LucideIcons.Ban,
  BadgeAlert: LucideIcons.BadgeAlert,
  BadgeCheck: LucideIcons.BadgeCheck,
  BadgeInfo: LucideIcons.BadgeInfo,
  BarChart3: LucideIcons.BarChart3,
  CalendarClock: LucideIcons.CalendarClock,
  CheckCircle2: LucideIcons.CheckCircle2,
  Copy: LucideIcons.Copy,
  Copyright: LucideIcons.Copyright,
  CornerRightUp: LucideIcons.CornerRightUp,
  Currency: LucideIcons.IndianRupee,
  FileText: LucideIcons.FileText,
  FileSearch: LucideIcons.FileSearch,
  Flag: LucideIcons.Flag,
  FlagTriangleRight: LucideIcons.FlagTriangleRight,
  Globe: LucideIcons.Globe,
  Hash: LucideIcons.Hash,
  CreditCard: LucideIcons.CreditCard,
  DebitCard: LucideIcons.CreditCard,
  Heading: LucideIcons.Heading,
  Info: LucideIcons.Info,
  Layers: LucideIcons.Layers,
  Languages: LucideIcons.Languages,
  Link: LucideIcons.Link,
  List: LucideIcons.List,
  ListChecks: LucideIcons.ListChecks,
  ListOrdered: LucideIcons.ListOrdered,
  Lock: LucideIcons.Lock,
  LogIn: LucideIcons.LogIn,
  Mail: LucideIcons.Mail,
  Yen: LucideIcons.JapaneseYen,
  MapPin: LucideIcons.MapPin,
  MapPinned: LucideIcons.MapPinned,
  MessagesSquare: LucideIcons.MessagesSquare,
  MoreHorizontal: LucideIcons.MoreHorizontal,
  Navigation: LucideIcons.Navigation,
  IndiaFlag: IndiaFlagIcon,
  UsaFlag: UsaFlagIcon,
  Dollar: LucideIcons.DollarSign,
  PanelLeftOpen: LucideIcons.PanelLeftOpen,
  Phone: LucideIcons.Phone,
  Power: LucideIcons.Power,
  RefreshCcw: LucideIcons.RefreshCcw,
  Scale: LucideIcons.Scale,
  Server: LucideIcons.Server,
  Share2: LucideIcons.Share2,
  Sitemap: SitemapIcon,
  Shield: LucideIcons.Shield,
  ShieldCheck: LucideIcons.ShieldCheck,
  ShoppingCart: LucideIcons.ShoppingCart,
  SpellCheck: LucideIcons.SpellCheck,
  Timer: LucideIcons.Timer,
  User: LucideIcons.User,
  UserX: LucideIcons.UserX,
  Users: LucideIcons.Users,
  Wifi: LucideIcons.Wifi,
  Sun: LucideIcons.Sun,
  Moon: LucideIcons.Moon,
  Star: LucideIcons.Star,
  Clock: LucideIcons.Clock,
  Image: LucideIcons.Image,
} as const satisfies Record<string, LucideIcon>;

/**
 * Type representing all available icon names.
 * Derived from the iconRegistry keys to ensure type safety.
 */
export type IconName = keyof typeof iconRegistry;

/**
 * Array of all available icon names in the registry.
 * Derived from the iconRegistry keys to avoid duplication.
 */
export const iconNames = Object.keys(iconRegistry) as IconName[];

/**
 * Value sentiment icon mapping.
 * Maps sentiment values to their corresponding icons and colors.
 * This is a general utility that can be used for any sentiment-based icon display.
 */
export type ValueSentiment = "info" | "neutral" | "positive" | "negative";

export interface SentimentIconConfig {
  Icon: LucideIcon;
  color: ColorScheme;
}

export const valueSentimentIconMap: Record<
  ValueSentiment,
  SentimentIconConfig
> = {
  info: { Icon: LucideIcons.Info, color: "blue" },
  neutral: { Icon: LucideIcons.MinusCircle, color: "gray" },
  positive: { Icon: LucideIcons.CheckCircle2, color: "green" },
  negative: { Icon: LucideIcons.AlertTriangle, color: "red" },
};

/**
 * Helper function to get sentiment icon configuration.
 *
 * @param sentiment - The sentiment value
 * @returns The icon configuration for the sentiment, or a default if not found
 */
export const getSentimentIcon = (
  sentiment: ValueSentiment
): SentimentIconConfig => {
  return valueSentimentIconMap[sentiment] || valueSentimentIconMap.info;
};
