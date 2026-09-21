import { useReportStore } from '@/app/store/report/reportStore';
import { Button } from '@/components/ui/button';
import { RemoveFromReport } from './ReportSectionHelpers';
import { KeyMetrics } from '@/components/custom/KeyMetrics';
import { useEffect, useState, useCallback } from 'react';
import type { ReportArtifactProps, ReportComponent } from './report';
import { AlertTriangle, Printer, CreditCard, Banknote, FileText, Calendar } from 'lucide-react';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { formatTimestamp, formatDateString } from '@/utils/timeFormat';
import './reportPrint.css';
import { pdf } from '@react-pdf/renderer';
import { PDFDocument } from './PDFTemplate';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { RiskAssessmentSection } from '../../Merchant/MerchantInsolvency/Components/RiskAssessmentSection';

// Helper function to safely stringify objects with circular references
const safeStringify = (obj: any, maxDepth = 2, depth = 0): string => {
  if (depth > maxDepth) return '[Object]';
  
  try {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj !== 'object') return String(obj);
    
    // Handle DOM nodes and React elements
    if (obj instanceof Element) return '[DOM Element]';
    if (obj.$$typeof && typeof obj.$$typeof === 'symbol') return '[React Element]';
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => safeStringify(item, maxDepth, depth + 1)).join(', ') + ']';
    }
    
    // Handle objects
    const result = Object.keys(obj).reduce<Record<string, string>>((acc, key) => {
      try {
        const value = obj[key];
        acc[key] = safeStringify(value, maxDepth, depth + 1);
      } catch (e) {
        acc[key] = '[Circular or Error]';
      }
      return acc;
    }, {});
    
    return JSON.stringify(result);
  } catch (e) {
    return '[Circular or Error]';
  }
};

export function ReportArtifact({ report }: ReportArtifactProps) {
  const components = report.components || [];
  const { updateReportComponents } = useReportStore();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showAllIntermediariesMap, setShowAllIntermediariesMap] = useState<Record<string, boolean>>({});

  // Helper functions to get and set expansion state for a specific section
  const getMetricsExpanded = (sectionId: string) => {
    return expandedSections[sectionId] || false;
  };
  
  const setMetricsExpanded = (sectionId: string, isExpanded: boolean) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: isExpanded
    }));
  };

  const toggleShowAllIntermediaries = (componentId: string) => {
    setShowAllIntermediariesMap(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }));
  };

  // Add debug logging for component data
  useEffect(() => {
    // Component data logging can be enabled for debugging if needed
  }, [components]);

  const renderComponentContent = (component: ReportComponent) => {
    switch (component.component_type) {
      case 'risk-score':
        return <RiskAssessmentSection riskAssessment={component.data.riskAssessment} keyMetricList={component.data.keyMetricList} />;
      case 'key-stats':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">{component.data.title || "Company Metrics"}</h3>
          {component.data.keyMetricList?.key_metrics && component.data.keyMetricList.key_metrics.length > 0 ? (
            <KeyMetrics
              keyMetricList={component.data.keyMetricList}
              isMetricsExpanded={getMetricsExpanded(component.frontend_component_id)}
              setIsMetricsExpanded={(isExpanded) => setMetricsExpanded(component.frontend_component_id, isExpanded)}
            />
          ) : component.data.companyMetrics ? (
            <KeyMetrics
              keyMetricList={{ key_metrics: component.data.companyMetrics }}
              isMetricsExpanded={getMetricsExpanded(component.frontend_component_id)}
              setIsMetricsExpanded={(isExpanded) => setMetricsExpanded(component.frontend_component_id, isExpanded)}
            />
          ) : component.data.tableData ? (
            <div className="mt-4 overflow-x-auto">
              <CustomTableView
                columns={component.data.columns || []}
                data={component.data.tableData}
                initialRowLimit={10}
                isExpanded={true}
                hasTotalRow={false}
                className="min-w-full"
              />
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <pre className="overflow-auto p-2 bg-gray-50 rounded">
                {safeStringify(component.data, 2)}
              </pre>
            </div>
          )}
        </div>;
      case 'peer-group':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">{component.data.title || "Peer Group Analysis"}</h3>
          <div className="mt-4 overflow-x-auto">
            {component.data.peerGroupData && component.data.columns ? (
              <CustomTableView
                columns={component.data.columns || []}
                data={component.data.peerGroupData.map((peer: any) => {
                  // Create a new object with safe string values
                  const safePeer: Record<string, any> = {};
                  if (component.data.columns) {
                    component.data.columns.forEach((col: any) => {
                      const key = col.key;
                      const value = peer[key];
                      
                      // Handle React elements (like BubbleTag) by extracting text
                      if (value && typeof value === 'object' && value.props && value.props.text) {
                        safePeer[key] = value.props.text;
                      } else {
                        safePeer[key] = value;
                      }
                    });
                  }
                  return safePeer;
                }) || []}
                initialRowLimit={10}
                isExpanded={true}
                hasTotalRow={false}
                className="min-w-full"
              />
            ) : (
              <div className="text-sm text-gray-500">No peer group data available</div>
            )}
          </div>
        </div>;
      case 'issue-details':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">{component.data.title || "Issue Details"}</h3>
          <div className="mt-4 overflow-x-auto">
            {component.data.tableData && component.data.columns ? (
              <>
                <CustomTableView
                  columns={component.data.columns || []}
                  data={component.data.tableData || []}
                  initialRowLimit={10}
                  isExpanded={true}
                  hasTotalRow={true}
                  className="min-w-full"
                />
                <div className="mt-3 text-sm text-gray-700">
                  <p><strong>Total Shares:</strong> {component.data.totalShares} Crores</p>
                  <p><strong>Total Amount:</strong> ₹{component.data.totalAmount} Crores</p>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">No issue details available</div>
            )}
          </div>
        </div>;
      case 'company-overview':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">Company Overview</h3>
          
          {/* Company Filing Information */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Company Filing Information</h4>
            <div className="text-sm">{component.data.companyData?.about_the_company}</div>
          </div>
          
          {/* External Information */}
          {component.data.companyData?.about_company_external && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">External Information</h4>
              <div className="text-sm">{component.data.companyData.about_company_external}</div>
              
              {/* Sources */}
              {component.data.companyData.about_company_external_sources?.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium mb-1">Sources:</h5>
                  <div className="flex flex-wrap gap-2">
                    {component.data.companyData.about_company_external_sources.map((source: string, index: number) => (
                      <a 
                        key={index}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        <span className="mr-1">🔗</span>
                        {new URL(source).hostname}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Contact Information */}
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Legal Name:</span> {component.data.companyData?.legal_name}</div>
              <div><span className="font-medium">Website:</span> {component.data.companyData?.website}</div>
              <div><span className="font-medium">Email:</span> {component.data.companyData?.email}</div>
              <div><span className="font-medium">Contact Email:</span> {component.data.companyData?.contact_email}</div>
              <div><span className="font-medium">Phone:</span> {component.data.companyData?.contact_phone}</div>
            </div>
          </div>
          
          {/* Registered Address */}
          {component.data.companyData?.registered_address && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Registered Address</h4>
              <div className="text-sm">
                <p>{component.data.companyData.registered_address.address_line_1}</p>
                {component.data.companyData.registered_address.address_line_2 && (
                  <p>{component.data.companyData.registered_address.address_line_2}</p>
                )}
                <p>{component.data.companyData.registered_address.city}, {component.data.companyData.registered_address.state}</p>
                <p>{component.data.companyData.registered_address.country} - {component.data.companyData.registered_address.pincode}</p>
              </div>
            </div>
          )}
          
          {component.data.companyMetrics &&
            <KeyMetrics
              keyMetricList={{ key_metrics: component.data.companyMetrics }}
              isMetricsExpanded={getMetricsExpanded(component.frontend_component_id)}
              setIsMetricsExpanded={(isExpanded) => setMetricsExpanded(component.frontend_component_id, isExpanded)}
            />
          }
        </div>;
      case 'industry-overview':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">Industry Overview</h3>
          
          {/* Industry Filing Information */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Industry Filing Information</h4>
            <div className="text-sm">{component.data.industryData?.about_the_industry}</div>
          </div>
          
          {/* External Information */}
          {component.data.industryData?.about_industry_external && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">External Information</h4>
              <div className="text-sm">{component.data.industryData.about_industry_external}</div>
              
              {/* Sources */}
              {component.data.industryData.about_industry_external_sources?.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium mb-1">Sources:</h5>
                  <div className="flex flex-wrap gap-2">
                    {component.data.industryData.about_industry_external_sources.map((source: string, index: number) => (
                      <a 
                        key={index}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        <span className="mr-1">🔗</span>
                        {new URL(source).hostname}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Industry Classification */}
          <div className="mt-2">
            <h4 className="text-sm font-medium mb-1">Industry Classification:</h4>
            <div className="text-sm">{component.data.industryData?.classification}</div>
          </div>
          
          {component.data.industryData?.is_industry_risky === 'yes' && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Industry Risk Assessment</h4>
              <p className="text-sm text-red-700">{component.data.industryData.justification}</p>
            </div>
          )}
        </div>;
      case 'default-probability':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">Probability of Default Analysis</h3>
          <div className="text-sm">Analysis for merchant ID: {component.data.merchantId}</div>
        </div>;
      case 'transaction-metrics':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">Transaction Metrics</h3>
          {component.data.transactionMetrics &&
            <KeyMetrics
              keyMetricList={{ key_metrics: component.data.transactionMetrics }}
              isMetricsExpanded={getMetricsExpanded(component.frontend_component_id)}
              setIsMetricsExpanded={(isExpanded) => setMetricsExpanded(component.frontend_component_id, isExpanded)}
            />
          }
        </div>;
      case 'transaction':
        return (
          <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:bg-white">
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-sm font-medium block truncate">
                Transaction #{component.data?.transaction_id || 'Unknown'}
              </span>
              <p className="text-sm text-gray-600">
                Amount: ₹{component.data?.amount || '0'}
              </p>
            </div>
            <div className="flex flex-col items-end justify-between">
              <div className="flex items-center gap-2">
                {component.data?.status && (
                  <BubbleTag
                    text={component.data.status}
                    color={(component.data.status?.toLowerCase?.() === 'completed') ? 'green' : 'yellow'}
                  />
                )}
                {component.data?.payment_channel && (
                  <BubbleTag
                    text={component.data.payment_channel.toUpperCase?.() || component.data.payment_channel}
                    color="blue"
                  />
                )}
                {component.data?.timestamp && (
                  <span className="text-xs text-gray-500 ml-2">
                    {formatTimestamp(component.data.timestamp, 'relative')}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 mt-2">
                Customer: {component.data?.customer_name || 'Anonymous'}
              </span>
            </div>
          </div>
        );
      case 'payout':
        return (
          <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:bg-white">
            <div className="flex items-center">
              <Banknote className="h-4 w-4 text-green-500" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-sm font-medium block truncate">
                Payout to {component.data?.bank_account || 'Bank'}
              </span>
              <p className="text-sm text-gray-600">
                Amount: ₹{component.data?.amount || '0'}
              </p>
            </div>
            <div className="flex flex-col items-end justify-between">
              <div className="flex items-center gap-2">
                {component.data?.status && (
                  <BubbleTag
                    text={component.data.status}
                    color={
                      component.data.status === 'processed' ? 'green' :
                        component.data.status === 'pending' ? 'yellow' :
                          'red'
                    }
                  />
                )}
                {component.data?.timestamp && (
                  <span className="text-xs text-gray-500 ml-2">
                    {formatTimestamp(component.data.timestamp, 'relative')}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 mt-2">
                Reference: {component.data?.reference_id || 'N/A'}
              </span>
            </div>
          </div>
        );
      case 'single-investigation':
        return (
          <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:bg-white">
            <div className="flex items-center">
              <AlertTriangle className={`h-4 w-4 ${component.data?.investigation?.priority === 'High' ? 'text-red-500' : 'text-yellow-500'
                }`} />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-sm font-medium block truncate">
                {component.data?.investigation?.case_number ? (
                  <>Case #{component.data.investigation.case_number} - {component.data.investigation.title}</>
                ) : (
                  <>Investigation</>
                )}
              </span>
              <p className="text-sm text-gray-600">Investigation details</p>
            </div>
            <div className="flex flex-col items-end justify-between">
              <div className="flex items-center gap-2">
                {component.data?.investigation?.status && (
                  <BubbleTag
                    text={component.data.investigation.status}
                    color="blue"
                  />
                )}
                {component.data?.investigation?.priority && (
                  <BubbleTag
                    text={`${component.data.investigation.priority} Priority`}
                    color={component.data.investigation.priority === 'High' ? 'red' : 'yellow'}
                  />
                )}
                {component.data?.investigation?.created_at && (
                  <span className="text-xs text-gray-500 ml-2">
                    {formatTimestamp(component.data.investigation.created_at, 'relative')}
                  </span>
                )}
              </div>
              {component.data?.investigation?.assignee_Name && (
                <span className="text-xs text-gray-500 mt-2">
                  Investigator: {component.data.investigation.assignee_Name}
                </span>
              )}
            </div>
          </div>
        );
      case 'intermediaries':
        const showAll = showAllIntermediariesMap[component.frontend_component_id] || false;
        const displayIntermediaries = showAll 
          ? component.data.intermediaries 
          : component.data.intermediaries?.slice(0, 5);

        return (
          <div className="p-4">
            <h3 className="text-md font-medium mb-2">{component.data.title || "Listing Intermediaries"}</h3>
            <div className="mt-4 overflow-x-auto">
              <CustomTableView
                columns={component.data.columns || []}
                data={component.data.tableData}
                initialRowLimit={10}
                isExpanded={true}
                hasTotalRow={false}
                className="min-w-full"
              />
            </div>
            <div className="mt-4">
              {displayIntermediaries?.map((intermediary: any, index: number) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{intermediary.name}</h4>
                      <p className="text-sm text-gray-600">{intermediary.orgType}</p>
                    </div>
                    <BubbleTag
                      text={intermediary.orgType}
                      color={
                        intermediary.orgType === 'Banker' ? 'red' :
                        intermediary.orgType === 'Registrar' ? 'green' :
                        intermediary.orgType === 'Legal Counsel' ? 'blue' :
                        intermediary.orgType === 'Auditor' ? 'yellow' : 'gray'
                      }
                    />
                  </div>
                  <div className="mt-2 text-sm">
                    <p><strong>Contact:</strong> {intermediary.contactPerson}</p>
                    <p><strong>Email:</strong> {intermediary.email}</p>
                    <p><strong>Phone:</strong> {intermediary.telephone}</p>
                  </div>
                </div>
              ))}
              {component.data.intermediaries?.length > 5 && (
                <button
                  onClick={() => toggleShowAllIntermediaries(component.frontend_component_id)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {showAll ? 'Show Less' : `Show ${component.data.intermediaries.length - 5} More`}
                </button>
              )}
            </div>
          </div>
        );
      case 'icdr-compliance':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">{component.data.title || "ICDR Compliance Analysis"}</h3>
          
          {/* Summary metrics */}
          {component.data.summary && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Total Requirements:</span>
                  <p className="text-lg font-semibold">{component.data.summary.totalRequirements}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Compliant:</span>
                  <p className="text-lg font-semibold text-green-600">{component.data.summary.compliantCount}</p>
                </div>
                <div>
                  <span className="font-medium text-red-700">Non-Compliant:</span>
                  <p className="text-lg font-semibold text-red-600">{component.data.summary.nonCompliantCount}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Compliance Rate:</span>
                  <p className="text-lg font-semibold text-blue-600">{component.data.summary.compliancePercentage}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Compliance table */}
          <div className="mt-4 overflow-x-auto">
            {component.data.tableData && component.data.columns ? (
              <CustomTableView
                columns={component.data.columns || []}
                data={component.data.tableData || []}
                initialRowLimit={10}
                isExpanded={true}
                hasTotalRow={false}
                className="min-w-full"
              />
            ) : (
              <div className="text-sm text-gray-500">No compliance data available</div>
            )}
          </div>

          {/* Regulation info */}
          {component.data.regulationType && (
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Regulation Type:</strong> {component.data.regulationType}</p>
              <p><strong>Data Source:</strong> {component.data.dataSource}</p>
              {component.data.selectedCheckType && (
                <p><strong>Selected Check Type:</strong> {component.data.selectedCheckType}</p>
              )}
            </div>
          )}
        </div>;
      case 'management-promoters':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">{component.data.title || "Management & Promoters Analysis"}</h3>
          
          {/* Summary metrics */}
          {component.data.summary && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <span className="font-medium text-gray-700">Total Individuals:</span>
                  <p className="text-lg font-semibold">{component.data.summary.totalIndividuals}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Promoters:</span>
                  <p className="text-lg font-semibold text-blue-600">{component.data.summary.promotersCount}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Directors:</span>
                  <p className="text-lg font-semibold text-green-600">{component.data.summary.directorsCount}</p>
                </div>
                <div>
                  <span className="font-medium text-purple-700">KMPs:</span>
                  <p className="text-lg font-semibold text-purple-600">{component.data.summary.kmpsCount}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-red-700">Wilful Defaulters:</span>
                  <p className="text-lg font-semibold text-red-600">{component.data.summary.wilfulDefaulterCount}</p>
                </div>
                <div>
                  <span className="font-medium text-red-700">SEBI Debarred:</span>
                  <p className="text-lg font-semibold text-red-600">{component.data.summary.sebiDebarredCount}</p>
                </div>
                <div>
                  <span className="font-medium text-red-700">Disqualified:</span>
                  <p className="text-lg font-semibold text-red-600">{component.data.summary.disqualifiedCount}</p>
                </div>
                <div>
                  <span className="font-medium text-orange-700">Risk Rate:</span>
                  <p className="text-lg font-semibold text-orange-600">{component.data.summary.riskPercentage}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Management & Promoters table */}
          <div className="mt-4 overflow-x-auto">
            {component.data.tableData && component.data.columns ? (
              <CustomTableView
                columns={component.data.columns || []}
                data={component.data.tableData || []}
                initialRowLimit={10}
                isExpanded={true}
                hasTotalRow={false}
                className="min-w-full"
              />
            ) : (
              <div className="text-sm text-gray-500">No management and promoters data available</div>
            )}
          </div>

          {/* Additional info */}
          {(component.data.selectedCategory || component.data.dataSource) && (
            <div className="mt-4 text-sm text-gray-600">
              {component.data.selectedCategory && (
                <p><strong>Selected Category:</strong> {component.data.selectedCategory}</p>
              )}
              {component.data.dataSource && (
                <p><strong>Data Source:</strong> {component.data.dataSource}</p>
              )}
            </div>
          )}
        </div>;
      case 'offer-document-review':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">{component.data.title || "Offer Document Review Analysis"}</h3>
          
          {/* Summary metrics */}
          {component.data.summary && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Total Observations:</span>
                  <p className="text-lg font-semibold">{component.data.summary.totalObservations}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Clarification Reqd:</span>
                  <p className="text-lg font-semibold text-blue-600">{component.data.summary.clarificationReqdCount}</p>
                </div>
                <div>
                  <span className="font-medium text-yellow-700">Additional Info Reqd:</span>
                  <p className="text-lg font-semibold text-yellow-600">{component.data.summary.additionalInfoReqdCount}</p>
                </div>
                <div>
                  <span className="font-medium text-red-700">Potentially Inconsistent Information:</span>
                  <p className="text-lg font-semibold text-red-600">{component.data.summary.potentiallyInconsistentInfoCount}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Disclosed Red Flags:</span>
                  <p className="text-lg font-semibold text-green-600">{component.data.summary.disclosedRedFlagsCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Document review observations as cards */}
          <div className="mt-4 space-y-4">
            {component.data.tableData && component.data.tableData.length > 0 ? (
              <>
                {/* Show first 3 cards */}
                {component.data.tableData.slice(0, 3).map((observation: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                    {/* Header with section and observation type */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-2">
                        {observation.Section && (
                          <BubbleTag
                            text={observation.Section}
                            color="blue"
                          />
                        )}
                        {observation['Observation Type'] && (
                          <BubbleTag
                            text={observation['Observation Type']}
                            color={
                              observation['Observation Type'] === 'Clarification Reqd' ? 'blue' :
                              observation['Observation Type'] === 'Additional Info Reqd' ? 'yellow' :
                              observation['Observation Type'] === 'Incorrect Info' ? 'red' :
                              observation['Observation Type'] === 'Disclosed Red Flags' ? 'green' : 'gray'
                            }
                          />
                        )}
                      </div>
                      {observation['Observation ID'] && (
                        <span className="text-xs text-gray-500 font-mono">
                          #{observation['Observation ID']}
                        </span>
                      )}
                    </div>

                    {/* Original text in bold */}
                    {observation['Original Text'] && (
                      <div className="mb-3">
                        <p className="text-sm font-bold text-gray-900 leading-relaxed">
                          "{observation['Original Text']}"
                        </p>
                      </div>
                    )}

                    {/* Observation text */}
                    {observation.Observation && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {observation.Observation}
                        </p>
                      </div>
                    )}

                    {/* Footer with additional small info */}
                    <div className="flex justify-between items-end text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex gap-4">
                        {observation['Page No'] && (
                          <span>Page {observation['Page No']}</span>
                        )}
                        {observation.Section && (
                          <span>Section: {observation.Section}</span>
                        )}
                      </div>
                      <div>
                        {observation['Observation Type'] && (
                          <span className="capitalize">{observation['Observation Type']}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show More accordion for remaining cards */}
                {component.data.tableData.length > 3 && (
                  <div className="border border-gray-200 rounded-lg bg-gray-50">
                    <button
                      onClick={() => setExpandedSections(prev => ({
                        ...prev,
                        [`${component.frontend_component_id}-observations`]: !prev[`${component.frontend_component_id}-observations`]
                      }))}
                      className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-100 transition-colors rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        Show {component.data.tableData.length - 3} More Observations
                      </span>
                      <span className="text-gray-500">
                        {expandedSections[`${component.frontend_component_id}-observations`] ? '−' : '+'}
                      </span>
                    </button>
                    
                    {expandedSections[`${component.frontend_component_id}-observations`] && (
                      <div className="px-4 pb-4 space-y-4">
                        {component.data.tableData.slice(3).map((observation: any, index: number) => (
                          <div key={index + 3} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                            {/* Header with section and observation type */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex flex-wrap gap-2">
                                {observation.Section && (
                                  <BubbleTag
                                    text={observation.Section}
                                    color="blue"
                                  />
                                )}
                                {observation['Observation Type'] && (
                                  <BubbleTag
                                    text={observation['Observation Type']}
                                    color={
                                      observation['Observation Type'] === 'Clarification Reqd' ? 'blue' :
                                      observation['Observation Type'] === 'Additional Info Reqd' ? 'yellow' :
                                      observation['Observation Type'] === 'Incorrect Info' ? 'red' :
                                      observation['Observation Type'] === 'Disclosed Red Flags' ? 'green' : 'gray'
                                    }
                                  />
                                )}
                              </div>
                              {observation['Observation ID'] && (
                                <span className="text-xs text-gray-500 font-mono">
                                  #{observation['Observation ID']}
                                </span>
                              )}
                            </div>

                            {/* Original text in bold */}
                            {observation['Original Text'] && (
                              <div className="mb-3">
                                <p className="text-sm font-bold text-gray-900 leading-relaxed">
                                  "{observation['Original Text']}"
                                </p>
                              </div>
                            )}

                            {/* Observation text */}
                            {observation.Observation && (
                              <div className="mb-3">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {observation.Observation}
                                </p>
                              </div>
                            )}

                            {/* Footer with additional small info */}
                            <div className="flex justify-between items-end text-xs text-gray-500 pt-2 border-t border-gray-100">
                              <div className="flex gap-4">
                                {observation['Page No'] && (
                                  <span>Page {observation['Page No']}</span>
                                )}
                                {observation.Section && (
                                  <span>Section: {observation.Section}</span>
                                )}
                              </div>
                              <div>
                                {observation['Observation Type'] && (
                                  <span className="capitalize">{observation['Observation Type']}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">
                No document review observations available
              </div>
            )}
          </div>

          {/* Additional info */}
          {(component.data.selectedObservationType || component.data.dataSource) && (
            <div className="mt-4 text-sm text-gray-600">
              {component.data.selectedObservationType && (
                <p><strong>Selected Observation Type:</strong> {component.data.selectedObservationType}</p>
              )}
              {component.data.dataSource && (
                <p><strong>Data Source:</strong> {component.data.dataSource}</p>
              )}
            </div>
          )}
        </div>;
      case 'capital-structure':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">{component.data.title || "Capital Structure Analysis"}</h3>
          
          {/* Capital Structure table */}
          <div className="mt-4 overflow-x-auto">
            {component.data.tableData && component.data.columns ? (
              <CustomTableView
                columns={component.data.columns || []}
                data={component.data.tableData || []}
                initialRowLimit={10}
                isExpanded={true}
                hasTotalRow={false}
                className="min-w-full"
              />
            ) : (
              <div className="text-sm text-gray-500">No capital structure data available</div>
            )}
          </div>

          {/* Summary info */}
          {component.data.totalShareholders && (
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Total Shareholders:</strong> {component.data.totalShareholders}</p>
              {component.data.dataSource && (
                <p><strong>Data Source:</strong> {component.data.dataSource}</p>
              )}
            </div>
          )}
        </div>;
      case 'insolvency-red-flags':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">{component.data.title || "Insolvency Red Flags Analysis"}</h3>
          
          {/* Summary metrics */}
          {component.data.severityBreakdown && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Total Flags:</span>
                  <p className="text-lg font-semibold">{component.data.totalFlags || 0}</p>
                </div>
                <div>
                  <span className="font-medium text-red-700">Severe:</span>
                  <p className="text-lg font-semibold text-red-600">{component.data.severityBreakdown.severe || 0}</p>
                </div>
                <div>
                  <span className="font-medium text-orange-700">High:</span>
                  <p className="text-lg font-semibold text-orange-600">{component.data.severityBreakdown.high || 0}</p>
                </div>
                <div>
                  <span className="font-medium text-yellow-700">Medium:</span>
                  <p className="text-lg font-semibold text-yellow-600">{component.data.severityBreakdown.medium || 0}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                <div>
                  <span className="font-medium text-gray-700">Low:</span>
                  <p className="text-lg font-semibold text-gray-600">{component.data.severityBreakdown.low || 0}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Merchant ID:</span>
                  <p className="text-sm text-blue-600">{component.data.merchantId || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Data Source:</span>
                  <p className="text-sm text-green-600">{component.data.dataSource || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Red flags list */}
          <div className="mt-4 space-y-3">
            {component.data.redFlags && component.data.redFlags.length > 0 ? (
              <>
                {/* Show first 5 flags */}
                {component.data.redFlags.slice(0, 5).map((flag: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                    {/* Header with severity and category */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-2">
                        {flag.severity && (
                          <BubbleTag
                            text={flag.severity.toUpperCase()}
                            color={
                              flag.severity.toLowerCase() === 'severe' ? 'red' :
                              flag.severity.toLowerCase() === 'high' ? 'orange' :
                              flag.severity.toLowerCase() === 'medium' ? 'yellow' :
                              flag.severity.toLowerCase() === 'low' ? 'gray' : 'gray'
                            }
                          />
                        )}
                        {flag.rule_type && (
                          <BubbleTag
                            text={flag.rule_type.replace(/_/g, ' ').toUpperCase()}
                            color="blue"
                          />
                        )}
                      </div>
                      {flag.rule_code && (
                        <span className="text-xs text-gray-500 font-mono">
                          {flag.rule_code}
                        </span>
                      )}
                    </div>

                    {/* Flag description */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {flag.description || 'No description available'}
                      </p>
                    </div>

                    {/* Rule name if available */}
                    {flag.rule_name && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 font-medium">
                          Rule: {flag.rule_name}
                        </p>
                      </div>
                    )}

                    {/* Metric values if available */}
                    {flag.metric_values && Object.keys(flag.metric_values).length > 0 && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600 font-medium mb-1">Metric Values:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(flag.metric_values).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600">{key}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer with timestamp */}
                    <div className="flex justify-between items-end text-xs text-gray-500 pt-2 border-t border-gray-100 mt-3">
                      <div>
                        {flag.created_at && (
                          <span>Created: {new Date(flag.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div>
                        <span className="capitalize">{flag.severity || 'Unknown'} Risk</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show More accordion for remaining flags */}
                {component.data.redFlags.length > 5 && (
                  <div className="border border-gray-200 rounded-lg bg-gray-50">
                    <button
                      onClick={() => setExpandedSections(prev => ({
                        ...prev,
                        [`${component.frontend_component_id}-red-flags`]: !prev[`${component.frontend_component_id}-red-flags`]
                      }))}
                      className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-100 transition-colors rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        Show {component.data.redFlags.length - 5} More Red Flags
                      </span>
                      <span className="text-gray-500">
                        {expandedSections[`${component.frontend_component_id}-red-flags`] ? '−' : '+'}
                      </span>
                    </button>
                    
                    {expandedSections[`${component.frontend_component_id}-red-flags`] && (
                      <div className="px-4 pb-4 space-y-3">
                        {component.data.redFlags.slice(5).map((flag: any, index: number) => (
                          <div key={index + 5} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                            {/* Header with severity and category */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex flex-wrap gap-2">
                                {flag.severity && (
                                  <BubbleTag
                                    text={flag.severity.toUpperCase()}
                                    color={
                                      flag.severity.toLowerCase() === 'severe' ? 'red' :
                                      flag.severity.toLowerCase() === 'high' ? 'orange' :
                                      flag.severity.toLowerCase() === 'medium' ? 'yellow' :
                                      flag.severity.toLowerCase() === 'low' ? 'gray' : 'gray'
                                    }
                                  />
                                )}
                                {flag.rule_type && (
                                  <BubbleTag
                                    text={flag.rule_type.replace(/_/g, ' ').toUpperCase()}
                                    color="blue"
                                  />
                                )}
                              </div>
                              {flag.rule_code && (
                                <span className="text-xs text-gray-500 font-mono">
                                  {flag.rule_code}
                                </span>
                              )}
                            </div>

                            {/* Flag description */}
                            <div className="mb-3">
                              <p className="text-sm text-gray-900 leading-relaxed">
                                {flag.description || 'No description available'}
                              </p>
                            </div>

                            {/* Rule name if available */}
                            {flag.rule_name && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-600 font-medium">
                                  Rule: {flag.rule_name}
                                </p>
                              </div>
                            )}

                            {/* Metric values if available */}
                            {flag.metric_values && Object.keys(flag.metric_values).length > 0 && (
                              <div className="mt-3 p-2 bg-gray-50 rounded">
                                <p className="text-xs text-gray-600 font-medium mb-1">Metric Values:</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {Object.entries(flag.metric_values).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="text-gray-600">{key}:</span>
                                      <span className="font-medium">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Footer with timestamp */}
                            <div className="flex justify-between items-end text-xs text-gray-500 pt-2 border-t border-gray-100 mt-3">
                              <div>
                                {flag.created_at && (
                                  <span>Created: {new Date(flag.created_at).toLocaleDateString()}</span>
                                )}
                              </div>
                              <div>
                                <span className="capitalize">{flag.severity || 'Unknown'} Risk</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">
                No red flags available
              </div>
            )}
          </div>

          {/* Category breakdown if available */}
          {component.data.categoryBreakdown && Object.keys(component.data.categoryBreakdown).length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Category Breakdown:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {Object.entries(component.data.categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{category.replace(/_/g, ' ')}:</span>
                    <span className="font-medium">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>;
      case 'external-insights':
        return <div className="p-4">
          <h3 className="text-md font-medium mb-2">{component.data.title || "External Insights Analysis"}</h3>
          
          {/* Summary metrics */}
          {component.data.totalSelected && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Total Insights:</span>
                  <p className="text-lg font-semibold">{component.data.totalSelected}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Context ID:</span>
                  <p className="text-sm text-blue-600">{component.data.contextId || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Data Source:</span>
                  <p className="text-sm text-green-600">{component.data.dataSource || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

                                {/* Insights list */}
           <div className="mt-4 space-y-4">
             {component.data.insights && component.data.insights.length > 0 ? (
               component.data.insights.map((insight: any, index: number) => (
                 <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                   {/* Section badge */}
                   <div className="flex items-center justify-between mb-3">
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                       {insight.sectionTitle || insight.sectionKey}
                     </span>
                     <div className="flex items-center text-xs text-gray-500">
                       <Calendar className="h-3 w-3 mr-1" />
                       {insight.item.date ? formatDateString(insight.item.date) : 'N/A'}
                     </div>
                   </div>
                   
                   {/* Insight header */}
                   <h5 className="font-medium text-gray-900 mb-2">{insight.item.title}</h5>
                   
                   {/* Insight content */}
                   <div className="text-sm text-gray-700 mb-3">
                     {insight.item.summary}
                   </div>
                   
                   {/* Additional info */}
                   <div className="flex justify-between items-center text-xs text-gray-500">
                     <div className="flex items-center gap-3">
                       {insight.item.severity && (
                         <span className={`px-2 py-1 rounded-full ${
                           insight.item.severity === 'high' ? 'bg-red-100 text-red-700' :
                           insight.item.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                           'bg-green-100 text-green-700'
                         }`}>
                           {insight.item.severity.charAt(0).toUpperCase() + insight.item.severity.slice(1)} Priority
                         </span>
                       )}
                       {(insight.item.source_urls && insight.item.source_urls.length > 0) && (
                         <span>Sources: {insight.item.source_urls.length}</span>
                       )}
                     </div>
                   </div>
                 </div>
               ))
             ) : (
               <div className="text-sm text-gray-500 text-center py-8">
                 No external insights selected
               </div>
             )}
           </div>

          {/* Additional info */}
          {(component.data.contextId || component.data.dataSource) && (
            <div className="mt-4 text-sm text-gray-600">
              {component.data.contextId && (
                <p><strong>Context ID:</strong> {component.data.contextId}</p>
              )}
              {component.data.dataSource && (
                <p><strong>Data Source:</strong> {component.data.dataSource}</p>
              )}
            </div>
          )}
        </div>;
      default:
        if (component.data?.chartImage) {
          return (
            <div>
              <h3 className="text-lg font-semibold mb-2">{component.data?.title}</h3>
              <img src={component.data.chartImage} alt={component.data?.title || 'Visualization'} style={{ width: '100%', maxHeight: 250, objectFit: 'contain', marginBottom: 8 }} />
            </div>
          );
        }
        return (
          <div className="p-4">
            <h3 className="text-md font-medium mb-2">{component.component_type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h3>
            <div className="text-sm">Component data not available for rendering</div>
          </div>
        );
    }
  };

  // Keep components in their original order
  const orderedComponents = [...components];

  return (
    <div className="space-y-6 p-4">
      <div id="report-content">
        <h2 className="text-xl font-semibold mb-6">{report.report_title}</h2>
        <div className="space-y-6">
          {/* Render components in their original order */}
          {orderedComponents.map((component, index) => (
            <div className="gap-6" key={`${component.frontend_component_id || index}`}>
              <RemoveFromReport
                key={component.frontend_component_id}
                id={component.frontend_component_id}
                reportId={report.id}
              >
                <div className="border rounded-lg shadow-sm bg-white overflow-hidden">
                  <div className="p-2 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium">
                        {component.data?.title || component.component_type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                  </div>
                  <div>
                    {renderComponentContent(component)}
                  </div>
                </div>
              </RemoveFromReport>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 no-print">
        <Button
          className="mt-4"
          onClick={() => updateReportComponents(report)}
        >
          Save Report
        </Button>
        <Button
          className="mt-4"
          variant="outline"
          onClick={async () => {
            try {
              const blob = await pdf(
                <PDFDocument report={report} components={components} />
              ).toBlob();
              
              // Create a URL from the blob
              const url = URL.createObjectURL(blob);
              
              // Create a temporary link element
              const link = document.createElement('a');
              link.href = url;
              link.download = `Modus_Fraud_Report_${report.id}_${new Date().toISOString().split('T')[0]}.pdf`;
              
              // Append the link to body, click it, and remove it
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              // Release the URL object
              URL.revokeObjectURL(url);
            } catch (error) {
              console.error('Error generating PDF:', error);
            }
          }}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </Button>
      </div>
    </div>
  );
}