"use client";

import React, { FC, useState, useRef, useEffect } from "react";

interface TruncatableTextProps {
  text: string | string[];
  textColorClass: string;
  isSummary?: boolean;
  additionalClassName?: string;
  lineLimit?: number;
}

// Helper to turn plain text URLs into clickable links while preserving newlines
const linkifyNodes = (text: string): React.ReactNode => {
  if (!text) return null;

  const urlRegex = /\b(https?:\/\/[^\s]+|www\.[^\s]+)/g;

  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlRegex.exec(line)) !== null) {
      const urlText = match[0];
      const idx = match.index;

      if (idx > lastIndex) {
        nodes.push(line.substring(lastIndex, idx));
      }

      const href = urlText.startsWith("http") ? urlText : `https://${urlText}`;

      nodes.push(
        <a
          key={`link-${lineIdx}-${idx}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-words"
        >
          {urlText}
        </a>
      );

      lastIndex = idx + urlText.length;
    }

    if (lastIndex < line.length) {
      nodes.push(line.substring(lastIndex));
    }

    if (lineIdx < lines.length - 1) {
      nodes.push(<br key={`br-${lineIdx}`} />);
    }
  });

  return <>{nodes}</>;
};

export const TruncatableText: FC<TruncatableTextProps> = ({
  text,
  textColorClass,
  isSummary = false,
  additionalClassName = "",
  lineLimit = 3,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkTruncation = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
      const maxHeight = lineHeight * lineLimit;
      
      // If expanded, scrollHeight will equal clientHeight, so we measure against the theoretical max height
      const isOverflowing = el.scrollHeight > maxHeight;
      setNeedsTruncation(isOverflowing);
    };

    checkTruncation();
    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);

    return () => observer.disconnect();
  }, [text, lineLimit]);

  const textToRender = Array.isArray(text) ? text.join("\n") : text;
  const fontClass = additionalClassName.includes("font-") ? "" : "font-normal";
  const baseClasses = `whitespace-pre-wrap ${fontClass} ${textColorClass} ${additionalClassName}`;

  return (
    <div className="w-full relative">
      <div
        ref={textRef}
        className={baseClasses}
        style={(!isExpanded) ? {
          display: '-webkit-box',
          WebkitLineClamp: lineLimit,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        } : undefined}
      >
        {linkifyNodes(textToRender)}
      </div>
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 underline text-xs mt-1 cursor-pointer font-semibold block"
          type="button"
        >
          {isExpanded ? "Less" : "More"}
        </button>
      )}
    </div>
  );
};
