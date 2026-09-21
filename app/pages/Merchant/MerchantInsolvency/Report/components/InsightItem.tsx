"use client";

import React from "react";

interface InsightItemType {
  title: string;
  summary: string;
  date: string;
  source?: string;
  sources?: string | string[];
  source_urls?: string[];
  risk_segment?: "severe" | "high" | "medium";
  tag?: "redflag" | string;
  severity?:
    | "severe"
    | "high"
    | "medium"
    | "low"
    | "good"
    | "veryGood"
    | string;
  risk_level?: string;
  insight?: string;
  created_at?: string;
  year?: string | number;
  filename?: string;
  page_number?: string | number;
  bare_text?: string;
  financial_year?: string | number;
  [key: string]: unknown;
}

interface InsightItemProps {
  insight: InsightItemType;
  sectionKey: string;
  formatDate: (dateString: string) => string;
  extractDomain: (url: string) => string;
  getSeverityConfig: (severity: string) => { text: string; className: string };
}

const InsightItem: React.FC<InsightItemProps> = ({
  insight,
  sectionKey,
  formatDate,
  extractDomain,
  getSeverityConfig,
}) => {
  const isAudit = sectionKey.includes("audit");
  const isAnnual = sectionKey.includes("annual");

  // Clean up display text for sources that are not real URLs.
  // Decodes percent-encoded strings (e.g. 'audit%20report') and removes spaces
  // so the PDF shows 'auditreport' as requested.
  const cleanSourceDisplay = (raw: string) => {
    if (!raw) return raw;
    try {
      // Decode any percent encoding first
      let decoded = decodeURIComponent(String(raw));
      // Remove whitespace so "audit report" or "audit report" becomes "auditreport"
      return decoded.replace(/\s+/g, "");
    } catch (e) {
      // If decode fails, fallback to removing spaces from the original
      return String(raw).replace(/\s+/g, "");
    }
  };

  return (
    <div className="pdf-insight-item">
      <div className="pdf-insight-header">
        <div className="pdf-insight-title">
          {insight.title}
          {isAnnual && insight.filename && (
            <span className="pdf-insight-filename">
              (
              {String(insight.filename)
                .replace("AnnualReport_", "")
                .replace(".pdf", "")}
              )
            </span>
          )}
        </div>
        <div className="pdf-insight-meta">
          <div className="pdf-insight-date">
            {isAudit && insight.year
              ? `FY ${insight.year}`
              : isAnnual && insight.financial_year
              ? `FY ${insight.financial_year}`
              : formatDate(insight.date)}
          </div>
          {(isAudit || isAnnual) && insight.severity && (
            <div
              className={`pdf-insight-severity ${
                getSeverityConfig(String(insight.severity)).className
              }`}
            >
              {getSeverityConfig(String(insight.severity)).text.toUpperCase()}
            </div>
          )}
          {!(isAudit || isAnnual) && insight.risk_segment && (
            <div
              className={`pdf-insight-risk ${
                getSeverityConfig(String(insight.risk_segment)).className
              }`}
            >
              {getSeverityConfig(
                String(insight.risk_segment)
              ).text.toUpperCase()}
            </div>
          )}
          {isAnnual && insight.page_number && (
            <div className="pdf-insight-page">Page {insight.page_number}</div>
          )}
        </div>
      </div>

      <div className="pdf-insight-content">
        <div className="pdf-insight-summary">
          {insight.insight || insight.summary}
        </div>

        {(() => {
          if (insight.sources) {
            try {
              const sourcesArray =
                typeof insight.sources === "string"
                  ? JSON.parse(insight.sources)
                  : insight.sources;
              if (Array.isArray(sourcesArray) && sourcesArray.length > 0) {
                return (
                  <div className="pdf-insight-sources">
                    <span className="pdf-sources-label">Sources: </span>
                    {sourcesArray.map((url: string, i: number) => {
                      const rawDisplay = extractDomain(url);
                      const display = cleanSourceDisplay(rawDisplay);
                      return (
                        <span key={i} className="pdf-source-item">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pdf-source-link"
                            style={{ color: "blue" }}
                          >
                            {display}
                          </a>
                          {i < sourcesArray.length - 1 && (
                            <span className="pdf-source-separator"> • </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                );
              }
            } catch (error) {
              console.warn("Failed to parse sources:", error);
            }
          }

          if (insight.source) {
            return (
              <div className="pdf-insight-sources">
                <span className="pdf-sources-label">Source: </span>
                <span className="pdf-source-item">
                  {cleanSourceDisplay(extractDomain(String(insight.source)))}
                </span>
              </div>
            );
          }

          if (insight.source_urls && insight.source_urls.length > 0) {
            return (
              <div className="pdf-insight-sources">
                <span className="pdf-sources-label">Sources: </span>
                {insight.source_urls.map((url: string, i: number) => (
                  <span key={i} className="pdf-source-item">
                    {cleanSourceDisplay(extractDomain(url))}
                    {i < insight.source_urls!.length - 1 && (
                      <span className="pdf-source-separator"> • </span>
                    )}
                  </span>
                ))}
              </div>
            );
          }

          return null;
        })()}
      </div>
    </div>
  );
};

export default InsightItem;
