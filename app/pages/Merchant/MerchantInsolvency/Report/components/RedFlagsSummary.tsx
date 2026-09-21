import React from 'react';

interface RedFlag {
  id: string;
  description?: string;
  severity?: string;
}

interface Props {
  redFlags: RedFlag[];
}

const RedFlagsSummary: React.FC<Props> = ({ redFlags }) => {
  const severityBreakdown = {
    severe: redFlags.filter(f => f.severity?.toLowerCase() === 'severe').length,
    high: redFlags.filter(f => f.severity?.toLowerCase() === 'high').length,
    medium: redFlags.filter(f => f.severity?.toLowerCase() === 'medium').length,
  };

  return (
    <div className="pdf-redflags-summary">
      <div className="pdf-section-header">
        <h2 className="pdf-section-title">Red Flags</h2>
      </div>
      <div className="pdf-section-content">
        <div className="pdf-summary-grid">
          <div className="pdf-summary-item">
            <div className="pdf-summary-label">Total Red Flags</div>
            <div className="pdf-summary-value">{redFlags.length}</div>
          </div>
          <div className="pdf-summary-item severity-severe">
            <div className="pdf-summary-label">Severe</div>
            <div className="pdf-summary-value">{severityBreakdown.severe}</div>
          </div>
          <div className="pdf-summary-item severity-high">
            <div className="pdf-summary-label">High</div>
            <div className="pdf-summary-value">{severityBreakdown.high}</div>
          </div>
          <div className="pdf-summary-item severity-medium">
            <div className="pdf-summary-label">Medium</div>
            <div className="pdf-summary-value">{severityBreakdown.medium}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedFlagsSummary;
