import React from 'react';
import {
  Building2,
  FileCheck,
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  Wallet,
  FileWarning,
  AlertTriangle,
  Percent,
  Scale,
  Coins,
  Calculator,
  CreditCard,
  Activity,
  Shield
  ,Store, Tag, Briefcase, Banknote, BarChart3
} from 'lucide-react';

interface MetricItem {
  label: string;
  value: string | number | null | undefined;
  // icon may be a string identifier or a React node (component). For PDFs
  // we render a small colored badge; if a React node is provided we render it
  // inside the badge.
  icon?: React.ReactNode | string;
}

interface MetricsProps {
  metrics: MetricItem[];
  /**
   * layout: 'table' will render a 4-column table (used for company metrics)
   * layout: 'grid' will render a simple grid of metric cards (used for financial metrics)
   */
  layout?: 'table' | 'grid';
  columns?: number; // used for table layout; defaults to 4
  truncateLength?: number; // truncate long string values
}

const Metrics: React.FC<MetricsProps> = ({ metrics, layout = 'grid', columns = 4, truncateLength = 20 }) => {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  const formatValue = (v: string | number | null | undefined) => {
    if (v === null || v === undefined || v === '') return '-';
    if (typeof v === 'number') return v.toString();
    const s = String(v);
    if (s.length > truncateLength) return `${s.substring(0, truncateLength)}...`;
    return s || '-';
  };

  // Helper: map icon name strings (from API) to actual components
  const iconMap: Record<string, any> = {
    Building2,
    FileCheck,
    ShieldCheck,
    Calendar,
    MapPin,
    Clock,
    Users,
    TrendingUp,
    Wallet,
    FileWarning,
    AlertTriangle
  };
  // Add additional icons used by financial metrics
  Object.assign(iconMap, {
    Percent,
    Scale,
    Coins,
    Calculator,
    CreditCard,
    Activity,
    Shield
    ,Store, Tag, Briefcase, Banknote, BarChart3
  });

  // Map common tailwind text color classes to hex + light bg variants
  const colorMap: Record<string, string> = {
    'text-blue-500': '#2563eb',
    'text-red-500': '#dc2626',
    'text-green-500': '#16a34a'
  };

  const bgMap: Record<string, string> = {
    'text-blue-500': '#eef2ff',
    'text-red-500': '#fef2f2',
    'text-green-500': '#ecfdf5'
  };

  if (layout === 'table') {
    // Render as table with `columns` per row
    const rows = Math.ceil(metrics.length / columns);
    return (
      <div className="pdf-metrics-table-wrapper">
        <table className="pdf-metrics-table">
          <tbody>
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }, (_, colIndex) => {
                  const metricIndex = rowIndex * columns + colIndex;
                  const metric = metrics[metricIndex];
                  return (
                    <td key={colIndex} className={`pdf-metrics-td ${!metric ? 'empty' : ''}`}>
                      {metric && (
                        <div className="pdf-metric-card">
                          <div className="pdf-metric-card-inner">
                            {/* Icon badge */}
                            {(() => {
                              // metric.icon may be a string like
                              // "<Building2 className=\"h-5 w-5 text-blue-500\" />"
                              const iconStr = typeof metric.icon === 'string' ? metric.icon : '';
                              const nameMatch = iconStr.match(/^<\s*([A-Za-z0-9_]+)/);
                              const compName = nameMatch ? nameMatch[1] : null;
                              const classMatch = iconStr.match(/className=["']([^"']+)["']/);
                              const classStr = classMatch ? classMatch[1] : '';
                              const colorClass = classStr.split(/\s+/).find(c => c.startsWith('text-')) || '';
                              const iconColor = colorMap[colorClass] || '#1f2937';
                              const bg = bgMap[colorClass] || (['#eef2ff','#fff7ed','#ecfdf5','#eff6ff','#fef2f2'][Math.abs(metric.label.length) % 5]);
                              const IconComp = compName ? iconMap[compName] : null;

                              return (
                                <div className="pdf-metric-icon" style={{ backgroundColor: bg }}>
                                  {IconComp ? (
                                    <IconComp size={18} stroke={iconColor} />
                                  ) : (
                                    (typeof metric.icon === 'string' && metric.icon.trim().length > 0) ? (
                                      // If it's a short text, show first char
                                      metric.icon.charAt(0).toUpperCase()
                                    ) : (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                        <path d="M15 6L9 12L15 18" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )
                                  )}
                                </div>
                              );
                            })()}
                            <div className="pdf-metric-card-cell">
                              <div className="pdf-metric-label">{metric.label}</div>
                              <div className="pdf-metric-value">{formatValue(metric.value)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // default: grid layout
  return (
    <div className="pdf-metrics-grid">
      {metrics.map((metric, idx) => (
        <div key={idx} className="pdf-metric-card">
          <div className="pdf-metric-card-inner">
            {(() => {
              const iconStr = typeof metric.icon === 'string' ? metric.icon : '';
              const nameMatch = iconStr.match(/^<\s*([A-Za-z0-9_]+)/);
              const compName = nameMatch ? nameMatch[1] : null;
              const classMatch = iconStr.match(/className=["']([^"']+)["']/);
              const classStr = classMatch ? classMatch[1] : '';
              const colorClass = classStr.split(/\s+/).find(c => c.startsWith('text-')) || '';
              const iconColor = colorMap[colorClass] || '#1f2937';
              const bg = bgMap[colorClass] || (['#eef2ff','#fff7ed','#ecfdf5','#eff6ff','#fef2f2'][Math.abs(metric.label.length) % 5]);
              const IconComp = compName ? iconMap[compName] : null;

              return (
                <div className="pdf-metric-icon" style={{ backgroundColor: bg }}>
                  {IconComp ? (
                    <IconComp size={16} stroke={iconColor} />
                  ) : (
                    (typeof metric.icon === 'string' && metric.icon.trim().length > 0) ? (
                      metric.icon.charAt(0).toUpperCase()
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M15 6L9 12L15 18" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )
                  )}
                </div>
              );
            })()}
            <div className="pdf-metric-card-cell">
              <div className="pdf-metric-label">{metric.label}</div>
              <div className="pdf-metric-value">{formatValue(metric.value)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Metrics;
