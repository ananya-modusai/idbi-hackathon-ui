'use client';

import React from 'react';
import { format } from 'date-fns';

interface RedFlag {
  id: string;
  description?: string;
  severity?: string;
  rule_type?: string;
  rule_name?: string;
  rule_code?: string;
  created_at?: string;
  metric_values?: Record<string, number | string>;
}

interface RedFlagItemProps {
  flag: RedFlag;
  getTagCategory: (ruleType: string) => string;
  getSeverityConfig: (severity: string) => { text: string; className: string };
}

const RedFlagItem: React.FC<RedFlagItemProps> = ({ flag, getTagCategory, getSeverityConfig }) => {
  const severityConfig = getSeverityConfig(flag.severity || 'low');
  const category = getTagCategory(flag.rule_type || '');
  const formattedDate = flag.created_at
    ? format(new Date(flag.created_at), 'dd/M/yyyy')
    : 'No date';
  const formattedTime = flag.created_at
    ? format(new Date(flag.created_at), 'HH:mm aa')
    : '';

  return (
    <div key={flag.id} className="pdf-redflag-item">
      <div className="pdf-redflag-layout">
        {/* Left: Date and Time */}
        <div className="pdf-datetime-section">
          <div className="pdf-date">{formattedDate}</div>
          <div className="pdf-time">{formattedTime}</div>
        </div>

        {/* Middle: Title and Description */}
        <div className="pdf-content-section">
          <div className={`pdf-flag-title ${severityConfig.className}`}>
            {flag.rule_name ? flag.rule_name : (`${category} Red Flag` || 'Untitled Flag')}
          </div>
          <div className="pdf-flag-description">
            {flag.description || flag.rule_name || 'No description available'}
          </div>
        </div>

        {/* Right: Severity and Category Badges */}
        <div className="pdf-badges-section">
          <div className={`pdf-severity-badge ${severityConfig.className}`}>
            {severityConfig.text}
          </div>
          <div className="pdf-category-badge">
            {category}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedFlagItem;
