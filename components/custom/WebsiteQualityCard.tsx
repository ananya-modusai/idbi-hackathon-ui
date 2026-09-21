"use client";

import React, { FC } from "react";
import { getIconByName } from "@/components/custom/CustomIconScheme";
import { useArtifactStore } from "@/app/store/artifact/artifactStore";
import WebsiteQualityArtifact from "./WebsiteQualityArtifact";
// import WebsiteQualityArtifact from './WebsiteQualityArtifact';

type QualityStatus = "yes" | "no";

interface WebsiteQualityCardProps {
  name: string;
  status: QualityStatus;
  reasoning?: string;
  // Optional policy data to show inside the artifact (used for 'Policy Section')
  policyData?: any[] | null;
  // When invert=true the semantics flip: 'yes' means a bad/alert state and
  // 'no' means good. This is used for behavioural flags / linkage cards where
  // presence of a flag (yes) is a negative.
  invert?: boolean;
  // When true the incoming status ("yes"/"no") was derived from an
  // API boolean where `true` indicates a negative/alert state. When set the
  // visual mapping will show a red alert for `status === 'yes'` and a
  // green check for `status === 'no'`.
  apiTrueIsAlert?: boolean;
  // Optional override handler when the card is clicked. If not provided the
  // card will open a default artifact tab showing a compact artifact view.
  onClick?: () => void;
  // When true, force a gray hyphen/dash icon for the card (used for linkage
  // cards in the overview where we want a neutral dash symbol).
  forceHyphenGray?: boolean;
  // When true, hide the trailing chevron/right-arrow on the card
  hideChevron?: boolean;
  // When false the card should be rendered as non-interactive (no button,
  // no hover or click). Default true.
  clickable?: boolean;
  // When true the card represents an explicit 'No Data' state from an API
  // (distinct from a 'yes'/'no' status). In this case we render an info
  // glyph with a neutral gray background instead of the usual success/fail
  // iconography.
  noData?: boolean;
}

export const WebsiteQualityCard: FC<WebsiteQualityCardProps> = ({
  name,
  status,
  policyData = null,
  invert = false,
  apiTrueIsAlert = false,
  onClick,
  reasoning,
  forceHyphenGray = false,
  hideChevron = false,
  clickable = true,
  noData = false,
}) => {
  const artifactStore = useArtifactStore();
  const openArtifact = () => {
    const artifactId = `websitequality-${name.replace(
      /\s+/g,
      "-"
    )}-${Date.now()}`;
    artifactStore.addTab({
      id: artifactId,
      title: name,
      renderArtifact: () => (
        <WebsiteQualityArtifact
          title={name}
          status={status === "yes"}
          reasoning={reasoning || `No reasoning data available.`}
          policyData={policyData}
          noData={noData}
        />
      ),
    });

    // Ensure focus/activation after add
    setTimeout(() => {
      const s = useArtifactStore.getState();
      s.forceActivateTab(artifactId);
      s.setCollapsed(false);
    }, 0);
  };

  const handleClick = () => {
    if (!clickable) return;
    if (typeof onClick === "function") return onClick();
    return openArtifact();
  };

  const CheckFallback: React.FC<{ className?: string }> = ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="20 6 9 17 4 12" stroke="currentColor" />
    </svg>
  );

  const AlertFallback: React.FC<{ className?: string }> = ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.29 3.86L1.82 18a1.75 1.75 0 0 0 1.5 2.64h17.36a1.75 1.75 0 0 0 1.5-2.64L13.71 3.86a1.75 1.75 0 0 0-3.42 0z"
        stroke="currentColor"
      />
      <line x1="12" y1="8" x2="12" y2="13" stroke="currentColor" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );

  const MinusFallback: React.FC<{ className?: string }> = ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" />
    </svg>
  );

  const CheckIcon = getIconByName("Check") || CheckFallback;
  const AlertIcon =
    getIconByName("AlertTriangle") ||
    getIconByName("Triangle") ||
    AlertFallback;
  const DotIcon = getIconByName("Circle") || getIconByName("Dot");
  const MinusIcon =
    getIconByName("Minus") ||
    getIconByName("Dash") ||
    getIconByName("MinusCircle") ||
    MinusFallback;
  const ChevronIcon =
    getIconByName("ChevronRight") ||
    getIconByName("Chevron") ||
    getIconByName("ArrowRight");

  // Use a uniform light background for all cards; per-status icon color
  // and glyph indicate the state.
  const bg = "bg-gray-50";
  let iconBg = "bg-gray-600";
  let border = "border-transparent";
  let Icon: any = DotIcon;
  // default icon class (color inside the round bg)
  let iconClass = "h-3 w-3 text-white";

  // Determine visual mapping. If invert=false (default):
  //   'yes' => green check (good)
  //   'no'  => red alert (bad)
  // If invert=true:
  //   'yes' => red alert (bad)
  //   'no'  => green hyphen (good)
  // noData should override everything and render the neutral info glyph.
  if (!noData) {
    // Special-case: some checklist sections derive their status from an
    // API boolean where `true` signals an alert/negative state. When the
    // caller sets `apiTrueIsAlert` we show a red alert for status==='yes'
    // and a green check for status==='no'. This intentionally differs from
    // the default mapping and from `invert` which uses a hyphen for the
    // inverted 'no' case.
    if (apiTrueIsAlert) {
      if (status === "yes") {
        iconBg = "bg-red-600";
        border = "border-red-100";
        Icon = AlertIcon;
      } else {
        iconBg = "bg-green-600";
        border = "border-green-100";
        // For false values in Website Quality Checklist, show dash/minus icon instead of check
        Icon = MinusIcon || DotIcon;
      }
    } else if (!invert) {
      if (status === "yes") {
        iconBg = "bg-green-600";
        border = "border-green-100";
        Icon = CheckIcon;
      } else {
        iconBg = "bg-red-600";
        border = "border-red-100";
        Icon = AlertIcon;
      }
    } else {
      if (status === "yes") {
        iconBg = "bg-red-600";
        border = "border-red-100";
        Icon = AlertIcon;
      } else {
        iconBg = "bg-green-600";
        border = "border-green-100";
        // For inverted 'no' we prefer a small hyphen/minus glyph (visual dash)
        // instead of a filled dot or check.
        Icon = MinusIcon || DotIcon;
      }
    }
  }

  // If caller requests a forced gray hyphen/dash icon, override the above
  // choices and render a neutral hyphen glyph in gray color with a light
  // background. This is used specifically for the Fraud Linkage cards in the
  // overview tab.
  if (forceHyphenGray) {
    iconBg = "bg-gray-600";
    border = "border-transparent";
    Icon = MinusIcon || DotIcon;
    iconClass = "h-3 w-3 text-gray-500";
  }

  // If the caller explicitly marks this card as a No-Data state, render an
  // Info glyph with a neutral gray background. This overrides other visual
  // mappings so the UI consistently shows "no data" instead of pass/fail.
  if (noData) {
    // Render a simple 'i' glyph without a surrounding circle. We create a
    // tiny inline SVG component so callers get a plain info mark (no circle).
    const InfoNoCircle: React.FC<{ className?: string }> = ({ className }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect x="11" y="7" width="2" height="7" fill="currentColor" rx="1" />
        <rect x="11" y="16" width="2" height="2" fill="currentColor" rx="1" />
      </svg>
    );

    iconBg = "bg-gray-200";
    border = "border-transparent";
    Icon = InfoNoCircle;
    iconClass = "h-5 w-5 text-gray-600";
  }

  const outerClass = `flex items-center justify-between gap-3 px-4 py-3 rounded-lg ${bg} ${border} w-full text-left ${
    clickable
      ? "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer"
      : ""
  }`;
  const content = (
    <>
      <div
        className={`flex items-center justify-center h-5 w-5 rounded-full ${iconBg} text-white`}
      >
        {Icon ? (
          <Icon className={iconClass} />
        ) : // Fallback glyphs. Prioritise the expected visual for each
        // combination of (status, invert, apiTrueIsAlert):
        // - apiTrueIsAlert & 'yes' => alert
        // - apiTrueIsAlert & 'no'  => minus
        // - non-invert & 'yes' => check
        // - non-invert & 'no'  => alert
        // - invert & 'yes'     => alert
        // - invert & 'no'      => hyphen
        apiTrueIsAlert && status === "no" ? (
          // Minus icon for false values in Website Quality Checklist
          <svg
            className="h-4 w-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" />
          </svg>
        ) : !invert && status === "yes" ? (
          <svg
            className="h-4 w-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polyline points="20 6 9 17 4 12" stroke="currentColor" />
          </svg>
        ) : (!invert && status === "no") || (invert && status === "yes") ? (
          <svg
            className="h-4 w-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.29 3.86L1.82 18a1.75 1.75 0 0 0 1.5 2.64h17.36a1.75 1.75 0 0 0 1.5-2.64L13.71 3.86a1.75 1.75 0 0 0-3.42 0z"
              stroke="currentColor"
            />
            <line x1="12" y1="8" x2="12" y2="13" stroke="currentColor" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        ) : invert && status === "no" ? (
          // hyphen/minus fallback
          <svg
            className="h-4 w-4 text-white"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="5"
              y="11"
              width="14"
              height="2"
              rx="1"
              fill="currentColor"
            />
          </svg>
        ) : (
          // last-resort dot
          <svg
            className="h-3 w-3 text-white"
            viewBox="0 0 8 8"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="4" cy="4" r="3" fill="white" />
          </svg>
        )}
      </div>
      <div className="text-sm font-medium flex-1">
        <div className="truncate">{name}</div>
      </div>

      {!hideChevron && (
        <div className="ml-3 flex-shrink-0">
          {ChevronIcon ? (
            <ChevronIcon className="h-4 w-4 text-gray-600" />
          ) : (
            <svg
              className="h-4 w-4 text-gray-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polyline points="9 18 15 12 9 6" stroke="currentColor" />
            </svg>
          )}
        </div>
      )}
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={outerClass}
        aria-pressed="false"
      >
        {content}
      </button>
    );
  }

  return <div className={outerClass}>{content}</div>;
};

export default WebsiteQualityCard;
