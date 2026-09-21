import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Report, ReportComponent } from './report';
import { KeyMetricListType, RiskAssessment } from '@/app/types';
import { formatDateString } from '@/utils/timeFormat';

Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlfBBc9.ttf',
      fontWeight: 'bold',
    },
  ],
});

const colors = {
  primary: '#60A5FA',
  lightBlue: '#EFF6FF',
  border: '#BFDBFE',
  background: '#F9FAFB',
  danger: '#FECACA',
  dangerText: '#B91C1C',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    backgroundColor: colors.background,
    color: '#111827',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 3,
    color: '#4B5563',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.primary,
    textTransform: 'uppercase',
    borderBottom: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: 'auto',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeader: {
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    padding: 8,
    flex: 1,
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 8,
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tableCellAlt: {
    backgroundColor: colors.lightBlue,
  },
  referenceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  referenceItem: {
    fontSize: 10,
    color: '#374151',
  },
  infoBox: {
    backgroundColor: colors.danger,
    padding: 6,
    borderRadius: 4,
    marginTop: 6,
  },
  infoText: {
    fontSize: 9,
    color: colors.dangerText,
  },
});

export const PDFDocument = ({ report, components }: { report: Report; components: ReportComponent[] }) => {
  // Sort components by their natural order for reporting
  const sortedComponents = [...components].sort((a, b) => {
    // Define the order of component types for the report
    const orderMap: Record<string, number> = {
      'risk-score': 1,
      'key-stats': 2,
      // Other components follow in natural order
    };
    
    const orderA = orderMap[a.component_type] || 99;
    const orderB = orderMap[b.component_type] || 99;
    
    return orderA - orderB;
  });

  let sectionIndex = 1;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Modus Fraud Detection Report</Text>
          <Text style={styles.subtitle}>Merchant Risk Assessment and Investigation Report</Text>
          <Text style={styles.subtitle}>Fraud Detection and Prevention Division</Text>
          <Text style={styles.subtitle}>Generated via Modus Intelligence Platform</Text>
        </View>

        {/* Reference Info */}
        <View style={styles.referenceInfo}>
          <View>
            <Text style={styles.referenceItem}>Reference #: {report.id}</Text>
            <Text style={styles.referenceItem}>Jurisdiction: Cyber Crime Cell</Text>
          </View>
          <View>
            <Text style={styles.referenceItem}>Date: {new Date(report.last_updated).toLocaleDateString()}</Text>
            <Text style={styles.referenceItem}>Time: {new Date(report.last_updated).toLocaleTimeString()}</Text>
          </View>
        </View>

        {/* All Components */}
        {sortedComponents.map((component, idx) => {
          const { component_type, data } = component;
          // Ensure we have a valid string for section title
          const componentTitle = data?.title || component_type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const sectionTitle = `${sectionIndex++}. ${componentTitle}`;

          // Risk Score
          if (component_type === 'risk-score') {
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                {data?.riskAssessment && (
                  <View style={styles.table}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeader}>Overall Risk Score</Text>
                      <Text style={styles.tableCell}>{data.riskAssessment.overall?.percentile || 'N/A'}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeader}>Risk Level</Text>
                      <Text style={styles.tableCell}>{data.riskAssessment.risk_level || 'N/A'}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          }

          // Key Stats
          if (component_type === 'key-stats') {
            // Get metrics from either keyMetricList or companyMetrics
            const metrics = data?.keyMetricList?.key_metrics || data?.companyMetrics || [];
            const hasMetrics = metrics && metrics.length > 0;
            
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                {!hasMetrics && (
                  <Text style={styles.referenceItem}>No company metrics available</Text>
                )}
                {hasMetrics && (
                  <View style={[styles.table, { marginBottom: 10 }]}>
                    {metrics.map((metric: any, mIdx: number) => (
                      <View key={mIdx} style={styles.tableRow}>
                        <Text style={styles.tableHeader}>{metric.label}</Text>
                        <Text style={styles.tableCell}>{metric.value}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }

          // Intermediaries
          if (component_type === 'intermediaries') {
            const intermediaries = data?.intermediaries || [];
            
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                {intermediaries.length === 0 ? (
                  <Text style={styles.referenceItem}>No intermediaries available</Text>
                ) : (
                  intermediaries.map((intermediary: any, iIdx: number) => (
                    <View key={iIdx} style={[styles.table, { marginBottom: 10 }]}>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableHeader}>Name</Text>
                        <Text style={styles.tableCell}>{intermediary.name}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableHeader}>Type</Text>
                        <Text style={styles.tableCell}>{intermediary.orgType}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableHeader}>Contact Person</Text>
                        <Text style={styles.tableCell}>{intermediary.contactPerson}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableHeader}>Email</Text>
                        <Text style={styles.tableCell}>{intermediary.email}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableHeader}>Phone</Text>
                        <Text style={styles.tableCell}>{intermediary.telephone}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            );
          }

          // Chart Image
          if (data?.chartImage) {
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                <Image src={data.chartImage} style={{ width: 500, height: 200, marginBottom: 10 }} />
              </View>
            );
          }

          // Tables for known types
          if (component_type === 'single-investigation') {
            const inv = data?.investigation;
            return inv ? (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                <View style={styles.table}>
                  {[
                    ['Case Number', inv.case_number],
                    ['Title', inv.title],
                    ['Priority', inv.priority],
                    ['Status', inv.status],
                    ['Assigned To', inv.assignee_Name],
                  ].map(([label, value], i) => (
                    <View key={i} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>{label}</Text>
                      <Text style={styles.tableCell}>{value || 'N/A'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null;
          }

          if (component_type === 'transaction') {
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                <View style={styles.table}>
                  {[
                    ['Transaction ID', data?.transaction_id],
                    ['Amount', `₹${data?.amount || '0'}`],
                    ['Status', data?.status],
                    ['Channel', data?.payment_channel],
                  ].map(([label, value], i) => (
                    <View key={i} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>{label}</Text>
                      <Text style={styles.tableCell}>{value || 'N/A'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          }

          if (component_type === 'payout') {
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                <View style={styles.table}>
                  {[
                    ['Amount', `₹${data?.amount || '0'}`],
                    ['Status', data?.status],
                    ['Bank Account', data?.bank_account],
                  ].map(([label, value], i) => (
                    <View key={i} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>{label}</Text>
                      <Text style={styles.tableCell}>{value || 'N/A'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          }

          if (component_type === 'default-probability') {
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                <Text style={styles.referenceItem}>Analysis for merchant ID: {data?.merchantId || 'N/A'}</Text>
              </View>
            );
          }

          if (component_type === 'company-overview') {
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                
                {/* Company Filing Information */}
                <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>Company Filing Information</Text>
                <Text style={styles.referenceItem}>{data?.companyData?.about_the_company || 'N/A'}</Text>
                
                {/* External Information */}
                {data?.companyData?.about_company_external && (
                  <View style={{ marginTop: 15 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>External Information</Text>
                    <Text style={styles.referenceItem}>{data?.companyData?.about_company_external}</Text>
                    
                    {/* Sources */}
                    {data?.companyData?.about_company_external_sources?.length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 3 }}>Sources:</Text>
                        {data.companyData.about_company_external_sources.map((source: string, sIdx: number) => (
                          <Text key={sIdx} style={{ fontSize: 8, color: '#4B5563', marginBottom: 2 }}>
                            • {source}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}
                
                {/* Contact Information */}
                <View style={{ marginTop: 15 }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>Contact Information</Text>
                  <View style={styles.table}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeader}>Legal Name</Text>
                      <Text style={styles.tableCell}>{data?.companyData?.legal_name || 'N/A'}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeader}>Website</Text>
                      <Text style={styles.tableCell}>{data?.companyData?.website || 'N/A'}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeader}>Email</Text>
                      <Text style={styles.tableCell}>{data?.companyData?.email || 'N/A'}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeader}>Contact Email</Text>
                      <Text style={styles.tableCell}>{data?.companyData?.contact_email || 'N/A'}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeader}>Phone</Text>
                      <Text style={styles.tableCell}>{data?.companyData?.contact_phone || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
                
                {/* Registered Address */}
                {data?.companyData?.registered_address && (
                  <View style={{ marginTop: 15 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>Registered Address</Text>
                    <Text style={styles.referenceItem}>
                      {data.companyData.registered_address.address_line_1}{data.companyData.registered_address.address_line_2 ? `, ${data.companyData.registered_address.address_line_2}` : ''}{'\n'}
                      {data.companyData.registered_address.city}, {data.companyData.registered_address.state}{'\n'}
                      {data.companyData.registered_address.country} - {data.companyData.registered_address.pincode}
                    </Text>
                  </View>
                )}
              </View>
            );
          }

          if (component_type === 'industry-overview') {
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                
                {/* Industry Filing Information */}
                <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>Industry Filing Information</Text>
                <Text style={styles.referenceItem}>{data?.industryData?.about_the_industry || 'N/A'}</Text>
                
                {/* External Information */}
                {data?.industryData?.about_industry_external && (
                  <View style={{ marginTop: 15 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>External Information</Text>
                    <Text style={styles.referenceItem}>{data?.industryData?.about_industry_external}</Text>
                    
                    {/* Sources */}
                    {data?.industryData?.about_industry_external_sources?.length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 3 }}>Sources:</Text>
                        {data.industryData.about_industry_external_sources.map((source: string, sIdx: number) => (
                          <Text key={sIdx} style={{ fontSize: 8, color: '#4B5563', marginBottom: 2 }}>
                            • {source}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}
                
                {/* Industry Classification */}
                <View style={{ marginTop: 15 }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>Industry Classification</Text>
                  <Text style={styles.referenceItem}>{data?.industryData?.classification || 'N/A'}</Text>
                </View>
                
                {data?.industryData?.is_industry_risky === 'yes' && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      Industry Risk: {data?.industryData?.justification || 'Risk factors detected'}
                    </Text>
                  </View>
                )}
              </View>
            );
          }

          if (component_type === 'transaction-metrics') {
            const metrics = data?.transactionMetrics || [];
            const hasMetrics = metrics && metrics.length > 0;
            
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                {!hasMetrics && (
                  <Text style={styles.referenceItem}>No transaction metrics available</Text>
                )}
                {hasMetrics && (
                  <View style={[styles.table, { marginBottom: 10 }]}>
                    {metrics.map((metric: any, i: number) => {
                      // Skip if missing required properties
                      if (!metric || (typeof metric !== 'object')) return null;
                      
                      // Get the label and value
                      const label = metric.label;
                      const value = metric.value;
                      
                      // Skip if missing label or value
                      if (!label || value === undefined || value === null) return null;
                      
                      return (
                        <View key={i} style={styles.tableRow}>
                          <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>{label}</Text>
                          <Text style={styles.tableCell}>{String(value)}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          }

          if (component_type === 'peer-group') {
            const peerData = data?.peerGroupData || [];
            const columns = data?.columns || [];
            
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                {peerData.length === 0 ? (
                  <Text style={styles.referenceItem}>No peer group data available</Text>
                ) : (
                  <View style={[styles.table, { marginBottom: 10 }]}>
                    {/* Table Header */}
                    <View style={styles.tableRow}>
                      {columns.map((col: any, cIdx: number) => (
                        <Text key={cIdx} style={styles.tableHeader}>{col.header}</Text>
                      ))}
                    </View>
                    
                    {/* Table Rows */}
                    {peerData.slice(0, 10).map((peer: any, pIdx: number) => (
                      <View key={pIdx} style={styles.tableRow}>
                        {columns.map((col: any, cIdx: number) => {
                          const value = peer[col.key];
                          return (
                            <Text key={cIdx} style={styles.tableCell}>
                              {typeof value === 'object' ? 
                                (value?.props?.text || 'N/A') : 
                                (value !== undefined ? String(value) : 'N/A')}
                            </Text>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                )}
                <Text style={{ fontSize: 8, marginTop: 5, color: '#666' }}>
                  {data?.totalPeers > 10 ? `Showing 10 of ${data.totalPeers} peers` : `Total peers: ${data?.totalPeers || 0}`}
                </Text>
              </View>
            );
          }

          if (component_type === 'issue-details') {
            const tableData = data?.tableData || [];
            const columns = data?.columns || [];
            
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                {tableData.length === 0 ? (
                  <Text style={styles.referenceItem}>No issue details available</Text>
                ) : (
                  <>
                    <View style={[styles.table, { marginBottom: 10 }]}>
                      {/* Table Header */}
                      <View style={styles.tableRow}>
                        {columns.map((col: any, cIdx: number) => (
                          <Text key={cIdx} style={styles.tableHeader}>{col.header}</Text>
                        ))}
                      </View>
                      
                      {/* Table Rows */}
                      {tableData.map((row: any, rIdx: number) => (
                        <View key={rIdx} style={styles.tableRow}>
                          {columns.map((col: any, cIdx: number) => {
                            const value = row[col.key];
                            return (
                              <Text key={cIdx} style={styles.tableCell}>
                                {value !== undefined ? String(value) : 'N/A'}
                              </Text>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                    
                    {/* Totals */}
                    <View style={{ marginTop: 10, marginBottom: 5 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                        Total Shares: {data?.totalShares || 0} Crores
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                        Total Amount: ₹{data?.totalAmount || 0} Crores
                      </Text>
                    </View>
                  </>
                )}
              </View>
            );
          }

          if (component_type === 'icdr-compliance') {
            const tableData = data?.tableData || [];
            const columns = data?.columns || [];
            const summary = data?.summary;
            
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                
                {/* Summary Section */}
                {summary && (
                  <View style={[styles.table, { marginBottom: 15 }]}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeader}>Compliance Summary</Text>
                      <Text style={styles.tableHeader}>Count</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Total Requirements</Text>
                      <Text style={styles.tableCell}>{summary.totalRequirements}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Compliant</Text>
                      <Text style={[styles.tableCell, { color: '#16A34A' }]}>{summary.compliantCount}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Non-Compliant</Text>
                      <Text style={[styles.tableCell, { color: '#DC2626' }]}>{summary.nonCompliantCount}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Compliance Rate</Text>
                      <Text style={[styles.tableCell, { color: '#2563EB' }]}>{summary.compliancePercentage}%</Text>
                    </View>
                  </View>
                )}

                {/* Compliance Details Table */}
                {tableData.length === 0 ? (
                  <Text style={styles.referenceItem}>No compliance data available</Text>
                ) : (
                  <>
                    <View style={[styles.table, { marginBottom: 10 }]}>
                      {/* Table Header */}
                      <View style={styles.tableRow}>
                        {columns.map((col: any, cIdx: number) => (
                          <Text key={cIdx} style={styles.tableHeader}>{col.header}</Text>
                        ))}
                      </View>
                      
                      {/* Table Rows - Show all requirements */}
                      {tableData.map((row: any, rIdx: number) => (
                        <View key={rIdx} style={styles.tableRow}>
                                                     {columns.map((col: any, cIdx: number) => {
                             const value = row[col.key];
                             
                             // Apply color coding for compliance status
                             if (col.key === 'Compliant') {
                               if (value === 'Compliant') {
                                 return (
                                   <Text key={cIdx} style={[styles.tableCell, { color: '#16A34A', fontWeight: 'bold' }]}>
                                     {value !== undefined ? String(value) : 'N/A'}
                                   </Text>
                                 );
                               } else if (value === 'Non-Compliant') {
                                 return (
                                   <Text key={cIdx} style={[styles.tableCell, { color: '#DC2626', fontWeight: 'bold' }]}>
                                     {value !== undefined ? String(value) : 'N/A'}
                                   </Text>
                                 );
                               }
                             }
                             
                             return (
                               <Text key={cIdx} style={styles.tableCell}>
                                 {value !== undefined ? String(value) : 'N/A'}
                               </Text>
                             );
                           })}
                        </View>
                      ))}
                    </View>
                    
                    {/* Additional Info */}
                    <View style={{ marginTop: 10, marginBottom: 5 }}>
                      {data?.regulationType && (
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                          Regulation Type: {data.regulationType}
                        </Text>
                      )}
                      {data?.selectedCheckType && (
                        <Text style={{ fontSize: 10, marginTop: 2 }}>
                          Selected Check Type: {data.selectedCheckType}
                        </Text>
                      )}
                      {data?.dataSource && (
                        <Text style={{ fontSize: 10, marginTop: 2 }}>
                          Data Source: {data.dataSource}
                        </Text>
                      )}
                      <Text style={{ fontSize: 8, marginTop: 5, color: '#666' }}>
                        Total requirements shown: {tableData.length}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            );
          }

          if (component_type === 'management-promoters') {
            const tableData = data?.tableData || [];
            const columns = data?.columns || [];
            const summary = data?.summary;
            
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                
                {/* Summary Section */}
                {summary && (
                  <View style={[styles.table, { marginBottom: 15 }]}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeader}>Category</Text>
                      <Text style={styles.tableHeader}>Count</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Total Individuals</Text>
                      <Text style={styles.tableCell}>{summary.totalIndividuals}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Promoters</Text>
                      <Text style={[styles.tableCell, { color: '#2563EB' }]}>{summary.promotersCount}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Directors</Text>
                      <Text style={[styles.tableCell, { color: '#16A34A' }]}>{summary.directorsCount}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>KMPs</Text>
                      <Text style={[styles.tableCell, { color: '#7C3AED' }]}>{summary.kmpsCount}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Promoter Group</Text>
                      <Text style={[styles.tableCell, { color: '#059669' }]}>{summary.promoterGroupCount}</Text>
                    </View>
                  </View>
                )}

                {/* Risk Assessment Section */}
                {summary && (
                  <View style={[styles.table, { marginBottom: 15 }]}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeader}>Risk Assessment</Text>
                      <Text style={styles.tableHeader}>Count</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Wilful Defaulters</Text>
                      <Text style={[styles.tableCell, { color: '#DC2626' }]}>{summary.wilfulDefaulterCount}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>SEBI Debarred</Text>
                      <Text style={[styles.tableCell, { color: '#DC2626' }]}>{summary.sebiDebarredCount}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Disqualified under Companies Act</Text>
                      <Text style={[styles.tableCell, { color: '#DC2626' }]}>{summary.disqualifiedCount}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Overall Risk Rate</Text>
                      <Text style={[styles.tableCell, { color: '#EA580C' }]}>{summary.riskPercentage}%</Text>
                    </View>
                  </View>
                )}

                {/* Management & Promoters Details Table */}
                {tableData.length === 0 ? (
                  <Text style={styles.referenceItem}>No management and promoters data available</Text>
                ) : (
                  <>
                    <View style={[styles.table, { marginBottom: 10 }]}>
                      {/* Table Header */}
                      <View style={styles.tableRow}>
                        {columns.slice(0, 6).map((col: any, cIdx: number) => (
                          <Text key={cIdx} style={styles.tableHeader}>{col.header}</Text>
                        ))}
                      </View>
                      
                      {/* Table Rows - Show all individuals */}
                      {tableData.map((row: any, rIdx: number) => (
                        <View key={rIdx} style={styles.tableRow}>
                          {columns.slice(0, 6).map((col: any, cIdx: number) => {
                            const value = row[col.key];
                            
                            // Apply color coding for risk-related fields
                            if (col.key === 'Wilful Defaulter List' || col.key === 'SEBI Debarred' || col.key === 'Disqualified under Companies Act') {
                              if (value === 'Match Found') {
                                return (
                                  <Text key={cIdx} style={[styles.tableCell, { color: '#DC2626', fontWeight: 'bold' }]}>
                                    {value !== undefined ? String(value) : 'N/A'}
                                  </Text>
                                );
                              } else if (value === 'No Match') {
                                return (
                                  <Text key={cIdx} style={[styles.tableCell, { color: '#16A34A', fontWeight: 'bold' }]}>
                                    {value !== undefined ? String(value) : 'N/A'}
                                  </Text>
                                );
                              }
                            }
                            
                            return (
                              <Text key={cIdx} style={styles.tableCell}>
                                {value !== undefined ? String(value) : 'N/A'}
                              </Text>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                    
                    {/* Additional Info */}
                    <View style={{ marginTop: 10, marginBottom: 5 }}>
                      {data?.selectedCategory && (
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                          Selected Category: {data.selectedCategory}
                        </Text>
                      )}
                      {data?.dataSource && (
                        <Text style={{ fontSize: 10, marginTop: 2 }}>
                          Data Source: {data.dataSource}
                        </Text>
                      )}
                      <Text style={{ fontSize: 8, marginTop: 5, color: '#666' }}>
                        Total individuals shown: {tableData.length}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            );
          }

          if (component_type === 'offer-document-review') {
            const tableData = data?.tableData || [];
            const summary = data?.summary;
            
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                
                {/* Summary Section */}
                {summary && (
                  <View style={[styles.table, { marginBottom: 15 }]}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeader}>Observation Summary</Text>
                      <Text style={styles.tableHeader}>Count</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Total Observations</Text>
                      <Text style={styles.tableCell}>{summary.totalObservations}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Clarification Reqd</Text>
                      <Text style={[styles.tableCell, { color: '#2563EB' }]}>{summary.clarificationReqdCount}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Additional Info Reqd</Text>
                      <Text style={[styles.tableCell, { color: '#EAB308' }]}>{summary.additionalInfoReqdCount}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Potentially Inconsistent Information</Text>
                      <Text style={[styles.tableCell, { color: '#DC2626' }]}>{summary.potentiallyInconsistentInfoCount}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Disclosed Red Flags</Text>
                      <Text style={[styles.tableCell, { color: '#16A34A' }]}>{summary.disclosedRedFlagsCount}</Text>
                    </View>
                  </View>
                )}

                {/* Document Review Observations as Cards */}
                {tableData.length === 0 ? (
                  <Text style={styles.referenceItem}>No document review observations available</Text>
                ) : (
                  <>
                    {/* Show all observations as cards */}
                    {tableData.map((observation: any, obsIdx: number) => (
                      <View key={obsIdx} style={{
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 4,
                        marginBottom: 10,
                        backgroundColor: '#FFFFFF',
                      }}>
                        {/* Header with section and observation type */}
                        <View style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          padding: 8,
                          borderBottomWidth: 1,
                          borderBottomColor: '#E5E7EB',
                          backgroundColor: '#F9FAFB',
                        }}>
                          <View style={{ flexDirection: 'row', flex: 1 }}>
                            <Text style={{
                              fontSize: 8,
                              backgroundColor: '#DBEAFE',
                              color: '#1E40AF',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 12,
                              marginRight: 4,
                            }}>
                              {observation.Section || 'N/A'}
                            </Text>
                            <Text style={{
                              fontSize: 8,
                                            backgroundColor: 
                observation['Observation Type'] === 'Clarification Reqd' ? '#DBEAFE' :
                observation['Observation Type'] === 'Additional Info Reqd' ? '#FEF3C7' :
                observation['Observation Type'] === 'Potentially Inconsistent Information' ? '#FEE2E2' :
                observation['Observation Type'] === 'Disclosed Red Flags' ? '#D1FAE5' : '#F3F4F6',
              color:
                observation['Observation Type'] === 'Clarification Reqd' ? '#1E40AF' :
                observation['Observation Type'] === 'Additional Info Reqd' ? '#92400E' :
                observation['Observation Type'] === 'Potentially Inconsistent Information' ? '#991B1B' :
                observation['Observation Type'] === 'Disclosed Red Flags' ? '#065F46' : '#374151',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 12,
                            }}>
                              {observation['Observation Type'] || 'N/A'}
                            </Text>
                          </View>
                          <Text style={{
                            fontSize: 7,
                            color: '#6B7280',
                            fontFamily: 'Courier',
                          }}>
                            #{observation['Observation ID'] || 'N/A'}
                          </Text>
                        </View>

                        {/* Card content */}
                        <View style={{ padding: 8 }}>
                          {/* Original text in bold */}
                          {observation['Original Text'] && (
                            <View style={{ marginBottom: 6 }}>
                              <Text style={{
                                fontSize: 9,
                                fontWeight: 'bold',
                                color: '#111827',
                                lineHeight: 1.4,
                              }}>
                                "{observation['Original Text']}"
                              </Text>
                            </View>
                          )}

                          {/* Observation text */}
                          {observation.Observation && (
                            <View style={{ marginBottom: 6 }}>
                              <Text style={{
                                fontSize: 9,
                                color: '#374151',
                                lineHeight: 1.4,
                              }}>
                                {observation.Observation}
                              </Text>
                            </View>
                          )}

                          {/* Footer with additional info */}
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTopWidth: 1,
                            borderTopColor: '#F3F4F6',
                            paddingTop: 4,
                            marginTop: 4,
                          }}>
                            <View style={{ flexDirection: 'row' }}>
                              {observation['Page No'] && (
                                <Text style={{
                                  fontSize: 7,
                                  color: '#6B7280',
                                  marginRight: 8,
                                }}>
                                  Page {observation['Page No']}
                                </Text>
                              )}
                              {observation.Section && (
                                <Text style={{
                                  fontSize: 7,
                                  color: '#6B7280',
                                }}>
                                  Section: {observation.Section}
                                </Text>
                              )}
                            </View>
                            <Text style={{
                              fontSize: 7,
                              color: '#6B7280',
                              textTransform: 'capitalize',
                            }}>
                              {observation['Observation Type'] || 'N/A'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}


                    
                    {/* Additional Info */}
                    <View style={{ marginTop: 10, marginBottom: 5 }}>
                      {data?.selectedObservationType && (
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                          Selected Observation Type: {data.selectedObservationType}
                        </Text>
                      )}
                      {data?.dataSource && (
                        <Text style={{ fontSize: 10, marginTop: 2 }}>
                          Data Source: {data.dataSource}
                        </Text>
                      )}
                      <Text style={{ fontSize: 8, marginTop: 5, color: '#666' }}>
                        Total observations: {tableData.length}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            );
          }

          if (component_type === 'capital-structure') {
            const tableData = data?.tableData || [];
            const columns = data?.columns || [];
            
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                
                {/* Capital Structure table */}
                {tableData.length === 0 ? (
                  <Text style={styles.referenceItem}>No capital structure data available</Text>
                ) : (
                  <>
                    <View style={[styles.table, { marginBottom: 10 }]}>
                      {/* Table Header */}
                      <View style={styles.tableRow}>
                        {columns.map((col: any, cIdx: number) => (
                          <Text key={cIdx} style={styles.tableHeader}>{col.header}</Text>
                        ))}
                      </View>
                      
                      {/* Table Rows */}
                      {tableData.map((row: any, rIdx: number) => (
                        <View key={rIdx} style={styles.tableRow}>
                          {columns.map((col: any, cIdx: number) => {
                            const value = row[col.key];
                            
                            // Apply color coding for shareholding types
                            if (col.key === 'holdingType') {
                              if (value === 'Promoter') {
                                return (
                                  <Text key={cIdx} style={[styles.tableCell, { color: '#2563EB', fontWeight: 'bold' }]}>
                                    {value !== undefined ? String(value) : 'N/A'}
                                  </Text>
                                );
                              } else if (value === 'Promoter Group') {
                                return (
                                  <Text key={cIdx} style={[styles.tableCell, { color: '#059669', fontWeight: 'bold' }]}>
                                    {value !== undefined ? String(value) : 'N/A'}
                                  </Text>
                                );
                              } else if (value === 'Public') {
                                return (
                                  <Text key={cIdx} style={[styles.tableCell, { color: '#7C3AED', fontWeight: 'bold' }]}>
                                    {value !== undefined ? String(value) : 'N/A'}
                                  </Text>
                                );
                              }
                            }
                            
                            return (
                              <Text key={cIdx} style={styles.tableCell}>
                                {value !== undefined ? String(value) : 'N/A'}
                              </Text>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                    
                    {/* Additional Info */}
                    <View style={{ marginTop: 10, marginBottom: 5 }}>
                      {data?.totalShareholders && (
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                          Total Shareholders: {data.totalShareholders}
                        </Text>
                      )}
                      {data?.dataSource && (
                        <Text style={{ fontSize: 10, marginTop: 2 }}>
                          Data Source: {data.dataSource}
                        </Text>
                      )}
                      <Text style={{ fontSize: 8, marginTop: 5, color: '#666' }}>
                        Total records shown: {tableData.length}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            );
          }

          if (component_type === 'insolvency-red-flags') {
            const redFlags = data?.redFlags || [];
            const severityBreakdown = data?.severityBreakdown;
            const categoryBreakdown = data?.categoryBreakdown;
            
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                
                {/* Summary Section */}
                {severityBreakdown && (
                  <View style={[styles.table, { marginBottom: 15 }]}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableHeader}>Severity Summary</Text>
                      <Text style={styles.tableHeader}>Count</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Total Flags</Text>
                      <Text style={styles.tableCell}>{data?.totalFlags || 0}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Severe</Text>
                      <Text style={[styles.tableCell, { color: '#DC2626' }]}>{severityBreakdown.severe || 0}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>High</Text>
                      <Text style={[styles.tableCell, { color: '#EA580C' }]}>{severityBreakdown.high || 0}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Medium</Text>
                      <Text style={[styles.tableCell, { color: '#EAB308' }]}>{severityBreakdown.medium || 0}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Low</Text>
                      <Text style={[styles.tableCell, { color: '#6B7280' }]}>{severityBreakdown.low || 0}</Text>
                    </View>
                  </View>
                )}

                {/* Red Flags as Cards */}
                {redFlags.length === 0 ? (
                  <Text style={styles.referenceItem}>No red flags available</Text>
                ) : (
                  <>
                    {/* Show all red flags as cards */}
                    {redFlags.map((flag: any, flagIdx: number) => (
                      <View key={flagIdx} style={{
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 4,
                        marginBottom: 10,
                        backgroundColor: '#FFFFFF',
                      }}>
                        {/* Header with severity and rule type */}
                        <View style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          padding: 8,
                          borderBottomWidth: 1,
                          borderBottomColor: '#E5E7EB',
                          backgroundColor: '#F9FAFB',
                        }}>
                          <View style={{ flexDirection: 'row', flex: 1 }}>
                            <Text style={{
                              fontSize: 8,
                              backgroundColor: 
                                flag.severity?.toLowerCase() === 'severe' ? '#FEE2E2' :
                                flag.severity?.toLowerCase() === 'high' ? '#FED7AA' :
                                flag.severity?.toLowerCase() === 'medium' ? '#FEF3C7' :
                                flag.severity?.toLowerCase() === 'low' ? '#F3F4F6' : '#F3F4F6',
                              color:
                                flag.severity?.toLowerCase() === 'severe' ? '#991B1B' :
                                flag.severity?.toLowerCase() === 'high' ? '#C2410C' :
                                flag.severity?.toLowerCase() === 'medium' ? '#92400E' :
                                flag.severity?.toLowerCase() === 'low' ? '#374151' : '#374151',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 12,
                              marginRight: 4,
                            }}>
                              {flag.severity?.toUpperCase() || 'UNKNOWN'}
                            </Text>
                            <Text style={{
                              fontSize: 8,
                              backgroundColor: '#DBEAFE',
                              color: '#1E40AF',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 12,
                            }}>
                              {flag.rule_type?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                            </Text>
                          </View>
                          <Text style={{
                            fontSize: 7,
                            color: '#6B7280',
                            fontFamily: 'Courier',
                          }}>
                            {flag.rule_code || 'N/A'}
                          </Text>
                        </View>

                        {/* Card content */}
                        <View style={{ padding: 8 }}>
                          {/* Flag description */}
                          <View style={{ marginBottom: 6 }}>
                            <Text style={{
                              fontSize: 9,
                              color: '#111827',
                              lineHeight: 1.4,
                            }}>
                              {flag.description || 'No description available'}
                            </Text>
                          </View>

                          {/* Rule name if available */}
                          {flag.rule_name && (
                            <View style={{ marginBottom: 4 }}>
                              <Text style={{
                                fontSize: 8,
                                color: '#6B7280',
                                fontWeight: 'bold',
                              }}>
                                Rule: {flag.rule_name}
                              </Text>
                            </View>
                          )}

                          {/* Footer with timestamp */}
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTopWidth: 1,
                            borderTopColor: '#F3F4F6',
                            paddingTop: 4,
                            marginTop: 4,
                          }}>
                            <View>
                              {flag.created_at && (
                                <Text style={{
                                  fontSize: 7,
                                  color: '#6B7280',
                                }}>
                                  Created: {new Date(flag.created_at).toLocaleDateString()}
                                </Text>
                              )}
                            </View>
                            <Text style={{
                              fontSize: 7,
                              color: '#6B7280',
                              textTransform: 'capitalize',
                            }}>
                              {flag.severity || 'Unknown'} Risk
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}


                    
                    {/* Additional Info */}
                    <View style={{ marginTop: 10, marginBottom: 5 }}>
                      {data?.merchantId && (
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                          Merchant ID: {data.merchantId}
                        </Text>
                      )}
                      {data?.dataSource && (
                        <Text style={{ fontSize: 10, marginTop: 2 }}>
                          Data Source: {data.dataSource}
                        </Text>
                      )}
                      <Text style={{ fontSize: 8, marginTop: 5, color: '#666' }}>
                        Total red flags: {redFlags.length}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            );
          }

          if (component_type === 'external-insights') {
            const insights = data?.insights || [];
            const totalSelected = data?.totalSelected || 0;
            
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                
                {/* Summary Section */}
                <View style={[styles.table, { marginBottom: 15 }]}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableHeader}>External Insights Summary</Text>
                    <Text style={styles.tableHeader}>Details</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Total Insights</Text>
                    <Text style={styles.tableCell}>{totalSelected}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Context ID</Text>
                    <Text style={styles.tableCell}>{data?.contextId || 'N/A'}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.tableCellAlt, { fontWeight: 'bold' }]}>Data Source</Text>
                    <Text style={styles.tableCell}>{data?.dataSource || 'N/A'}</Text>
                  </View>
                </View>

                {/* Insights as Cards */}
                {insights.length === 0 ? (
                  <Text style={styles.referenceItem}>No external insights selected</Text>
                ) : (
                  <>
                    {insights.map((insight: any, insightIdx: number) => (
                      <View key={insightIdx} style={{
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 4,
                        marginBottom: 10,
                        backgroundColor: '#FFFFFF',
                      }}>
                        {/* Header with section and date */}
                        <View style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          padding: 8,
                          borderBottomWidth: 1,
                          borderBottomColor: '#E5E7EB',
                          backgroundColor: '#F9FAFB',
                        }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: 8,
                              backgroundColor: '#DBEAFE',
                              color: '#1E40AF',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 12,
                              marginRight: 4,
                              alignSelf: 'flex-start',
                            }}>
                              {insight.sectionTitle || insight.sectionKey || 'N/A'}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{
                              fontSize: 7,
                              color: '#6B7280',
                              marginRight: 4,
                            }}>
                              📅
                            </Text>
                            <Text style={{
                              fontSize: 7,
                              color: '#6B7280',
                            }}>
                              {insight.item.date ? formatDateString(insight.item.date) : 'N/A'}
                            </Text>
                          </View>
                        </View>

                        {/* Card content */}
                        <View style={{ padding: 8 }}>
                          {/* Insight title */}
                          <View style={{ marginBottom: 6 }}>
                            <Text style={{
                              fontSize: 10,
                              color: '#111827',
                              fontWeight: 'bold',
                              lineHeight: 1.4,
                            }}>
                              {insight.item.title || 'No title available'}
                            </Text>
                          </View>

                          {/* Insight content */}
                          <View style={{ marginBottom: 6 }}>
                            <Text style={{
                              fontSize: 9,
                              color: '#374151',
                              lineHeight: 1.4,
                            }}>
                              {insight.item.summary || 'No summary available'}
                            </Text>
                          </View>

                          {/* Priority badge if available */}
                          {insight.item.severity && (
                            <View style={{ marginBottom: 6 }}>
                              <Text style={{
                                fontSize: 8,
                                backgroundColor: 
                                  insight.item.severity === 'high' ? '#FEE2E2' :
                                  insight.item.severity === 'medium' ? '#FEF3C7' :
                                  '#DCFCE7',
                                color:
                                  insight.item.severity === 'high' ? '#991B1B' :
                                  insight.item.severity === 'medium' ? '#92400E' :
                                  '#166534',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 12,
                                alignSelf: 'flex-start',
                              }}>
                              {insight.item.severity.charAt(0).toUpperCase() + insight.item.severity.slice(1)} Priority
                              </Text>
                            </View>
                          )}

                          {/* Sources if available */}
                          {insight.item.source_urls && insight.item.source_urls.length > 0 && (
                            <View style={{ marginBottom: 4 }}>
                              <Text style={{
                                fontSize: 8,
                                color: '#6B7280',
                              }}>
                                Sources: {insight.item.source_urls.length} link(s)
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                    
                    {/* Additional Info */}
                    <View style={{ marginTop: 10, marginBottom: 5 }}>
                      {data?.contextId && (
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                          Context ID: {data.contextId}
                        </Text>
                      )}
                      {data?.dataSource && (
                        <Text style={{ fontSize: 10, marginTop: 2 }}>
                          Data Source: {data.dataSource}
                        </Text>
                      )}
                      <Text style={{ fontSize: 8, marginTop: 5, color: '#666' }}>
                        Total external insights: {insights.length}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            );
          }

          if (component_type === 'transactions-visualizations') {
            return (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                <Text style={styles.referenceItem}>Transaction visualization data not available</Text>
              </View>
            );
          }

          // Default fallback
          return (
            <View key={idx} style={styles.section}>
              <Text style={styles.sectionTitle}>{sectionTitle}</Text>
              <Text style={{ fontSize: 10 }}>Component data not available for rendering</Text>
            </View>
          );
        })}
      </Page>
    </Document>
  );
}; 