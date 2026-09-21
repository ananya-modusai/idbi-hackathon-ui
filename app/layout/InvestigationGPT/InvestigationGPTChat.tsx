import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatBubble } from "@/app/components/custom/ChatBubble"
import React, { useRef, useEffect, useState, useMemo } from "react"
import { LoadingMessage } from "@/components/custom/LoadingMessage"
import { useChatStore } from "@/app/store/chat/chatStore"
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Components } from 'react-markdown'
import { MessageSquare, Loader2 } from 'lucide-react'
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import { CodeArtifact } from '@/app/components/artifacts/CodeArtifact';
import { GraphArtifact } from '@/app/components/artifacts/GraphArtifact';
import { chatService } from '@/app/services/chat';
import { visualizations } from '@/app/data/hardcodeddata/dashboardStructures';
import { SafeMarkdown } from '@/app/components/SafeMarkdown';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ThinkingSteps } from "@/app/components/custom/ThinkingSteps";
import { ThinkingStepsHistory } from "@/app/components/custom/ThinkingStepsHistory";
import { StandardVisualizationData } from '@/app/config/visualizationConfig';

interface Message {
  text: string;
  isUser: boolean;
  code?: {
    language: string;
    content: string;
  } | null;
  graph?: {
    type: string;
    data: any;
    xAxisKey?: string;
    yAxisKeys?: any[];
    groupBy?: string;
    errorColumn?: string;
    stacking?: "none" | "normal" | "percent";
    normalization?: boolean;
    missingNullHandling?: string;
  } | null;
  results?: any[];
}

interface InvestigationGPTChatProps {
  chatId: string;
  initialVisualizationData?: StandardVisualizationData;
}

export function InvestigationGPTChat({chatId, initialVisualizationData}: InvestigationGPTChatProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const {
    messages: storeMessages,
    isLoading,
    thinkingSteps,
    isThinkingComplete,
    processingStatus
  } = useChatStore();

  const { addTab, setActiveTabId, setCollapsed } = useArtifactStore();

  // Create messages from initial visualization data if provided
  const messages = useMemo(() => {
    if (initialVisualizationData && storeMessages.length === 0) {
      // Create a message with the visualization data
      const vizMessage: Message = {
        text: `Editing Visualization: ${initialVisualizationData.title}`,
        isUser: false,
        graph: {
          type: initialVisualizationData.type,
          data: initialVisualizationData.data,
          xAxisKey: initialVisualizationData.xAxisKey,
          yAxisKeys: initialVisualizationData.yAxisKeys,
          groupBy: undefined,
          errorColumn: undefined,
          stacking: (initialVisualizationData.settings?.general?.stacking || "none") as "none" | "normal" | "percent",
          normalization: initialVisualizationData.settings?.general?.normalizeToPercentage || false,
          missingNullHandling: "0"
        }
      };
      return [vizMessage];
    }
    return storeMessages;
  }, [initialVisualizationData, storeMessages]);

  // Extract visualization info
  const visualizationId = initialVisualizationData?.visualizationId || (() => {
    if (storeMessages.length > 0 && storeMessages[0].isUser) {
      const message = storeMessages[0].text;
      const match = message.match(/Editing Visualization: ([a-zA-Z0-9-_]+)/);
      return match?.[1];
    }
    return undefined;
  })();

  const dashboardId = initialVisualizationData?.dashboardId || (() => {
    if (visualizationId && visualizations[visualizationId]) {
      return visualizations[visualizationId].dashboard_id;
    }
    return undefined;
  })();

  // Always scroll to bottom when messages change or loading state changes
  useEffect(() => {
    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleViewCode = (code: { language: string; content: string }, text: string) => {
    const tabId = `code-artifact-${text}`

    addTab({
      id: tabId,
      title: `Code Snippet for ${text}`,
      renderArtifact: () => <CodeArtifact code={code} />
    });
    setActiveTabId(tabId);
    setCollapsed(false);
  };

  const handleViewGraph = (graph: { type: string; data: any }, text: string) => {
    const tabId = `graph-artifact-${text}`

    addTab({
      id: tabId,
      title: `Graph for : ${text}`,
      renderArtifact: () => <GraphArtifact graph={graph} />
    });
    setActiveTabId(tabId);
    setCollapsed(false);
  };

  // Function to check if a message contains execution results
  const hasExecutionResults = (message: Message): boolean => {
    if (message.results && Array.isArray(message.results) && message.results.length > 0) {
      return true;
    }

    if (typeof message.text === 'string' && message.text.includes('[') && message.text.includes(']')) {
      try {
        const jsonStart = message.text.indexOf('[');
        const jsonEnd = message.text.lastIndexOf(']') + 1;

        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = message.text.substring(jsonStart, jsonEnd);
          const results = JSON.parse(jsonStr);

          if (Array.isArray(results) && results.length > 0) {
            message.results = results;
            return true;
          }
        }
      } catch (e) {
        console.error('Error parsing JSON from message text:', e);
      }
    }

    return false;
  };

  // Helper function to format a value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return JSON.stringify(value);
      }
      return JSON.stringify(value);
    }

    return String(value);
  };

  // Function to flatten nested objects for table display
  const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    if (!obj) return {};

    return Object.keys(obj).reduce((acc, key) => {
      const prefixedKey = prefix ? `${prefix}_${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) && Object.keys(obj[key]).length < 5) {
        // Recursively flatten nested objects with few properties
        const flattened = flattenObject(obj[key], prefixedKey);
        return { ...acc, ...flattened };
      } else {
        // Use the key as is
        return { ...acc, [prefixedKey]: obj[key] };
      }
    }, {});
  };

  // Function to render results as a table
  const renderResultsTable = (results: any[]) => {
    if (!results || results.length === 0) return null;

    // Flatten nested objects in results
    const flattenedResults = results.map(item => flattenObject(item));

    // Get all unique keys from the flattened results
    const allKeys = Array.from(
      new Set(flattenedResults.flatMap(result => Object.keys(result)))
    );

    return (
      <div className="w-full overflow-x-auto mb-4">
        <Table className="w-full border-collapse border border-gray-200">
          <TableHeader>
            <TableRow className="bg-gray-100">
              {allKeys.map((key) => (
                <TableHead key={key} className="font-semibold text-gray-700 px-4 py-2 border border-gray-200">
                  {key.replace(/_/g, ' ')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {flattenedResults.map((result, idx) => (
              <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {allKeys.map((key) => (
                  <TableCell key={`${idx}-${key}`} className="px-4 py-2 border border-gray-200">
                    {formatValue(result[key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Function to render nested objects and arrays in a structured way
  const NestedObjectDisplay = ({ data }: { data: any }) => {
    if (data === null || data === undefined) {
      return <span className="text-gray-400">-</span>;
    }

    if (typeof data !== 'object') {
      return <span>{String(data)}</span>;
    }

    if (Array.isArray(data)) {
      return (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="px-2 py-1 bg-gray-50 rounded border border-gray-200">
              <NestedObjectDisplay data={item} />
            </div>
          ))}
        </div>
      );
    }

    // It's an object
    return (
      <div className="grid gap-1">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="grid grid-cols-2 gap-2">
            <span className="text-xs font-medium text-gray-500">{key}:</span>
            <div className="text-sm">
              <NestedObjectDisplay data={value} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Improved function to render complex results
  const renderComplexResultsTable = (results: any[]) => {
    if (!results || results.length === 0) return null;

    // Get all top-level keys from the results
    const allKeys = Array.from(
      new Set(results.flatMap(result => Object.keys(result)))
    );

    return (
      <div className="w-full overflow-x-auto mb-4">
        <Table className="w-full border-collapse border border-gray-200">
          <TableHeader>
            <TableRow className="bg-gray-100">
              {allKeys.map((key) => (
                <TableHead key={key} className="font-semibold text-gray-700 px-4 py-2 border border-gray-200">
                  {key.replace(/_/g, ' ')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, idx) => (
              <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {allKeys.map((key) => (
                  <TableCell key={`${idx}-${key}`} className="px-4 py-2 border border-gray-200">
                    <NestedObjectDisplay data={result[key]} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Helper to check if the results are merchant data
  const isMerchantData = (results: any[]): boolean => {
    if (!results || results.length === 0) return false;

    // Check if any result has merchant_id, merchant_name, etc.
    return results.some(result =>
      result.merchant_id &&
      (result.merchant_name || result.business_type || result.contact_email || result.registered_address)
    );
  };

  // Function to better format object values for display
  const formatObjectValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return String(value);
      }
    }

    return String(value);
  };

  // Specialized component for metric values in merchant data
  const MetricValue = ({ value }: { value: any }): JSX.Element => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>;
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return <span className="text-gray-400">Empty array</span>;
        }
        return (
          <div className="text-xs space-y-1">
            {value.map((item, i) => (
              <div key={i} className="p-1 bg-gray-100 rounded">
                {typeof item === 'object' ? formatObjectValue(item) : String(item)}
              </div>
            ))}
          </div>
        );
      }

      // Regular object - format as key-value pairs
      return (
        <div className="text-xs space-y-1">
          {Object.keys(value).length === 0 ? (
            <span className="text-gray-400">Empty object</span>
          ) : (
            Object.entries(value).map(([k, v], i) => (
              <div key={i} className="flex items-start gap-1">
                <span className="font-medium min-w-[60px]">{k}:</span>
                <span>{typeof v === 'object' ? formatObjectValue(v) : String(v)}</span>
              </div>
            ))
          )}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  // Update the MetricCard component
  const MetricCard = ({ name, value }: { name: string; value: any }) => (
    <div className="bg-gray-50 p-3 rounded border border-gray-200">
      <p className="text-xs font-medium text-gray-500">{name.replace(/_/g, ' ')}</p>
      <div className="mt-1 text-sm font-semibold">
        <MetricValue value={value} />
      </div>
    </div>
  );

  // Specialized renderer for merchant data
  const renderMerchantDataTable = (results: any[]) => {
    if (!results || results.length === 0) return null;

    return (
      <div className="w-full space-y-6 mb-4">
        {results.map((merchant: any, idx: number) => (
          <div key={idx} className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-blue-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
              <h3 className="font-medium text-blue-800">
                {merchant.merchant_name || 'Merchant'}
                <span className="ml-2 text-sm text-gray-500">
                  {merchant.merchant_id && `(ID: ${merchant.merchant_id.substring(0, 8)}...)`}
                </span>
              </h3>
              <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {merchant.business_type || 'Business'}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 p-4">
              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 border-b pb-1">Contact Information</h4>

                {merchant.contact_email && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <div className="space-y-1">
                      {Array.isArray(merchant.contact_email) ?
                        merchant.contact_email.map((email: any, i: number) => (
                          <div key={i} className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                            {email.emailId || email.email || JSON.stringify(email)}
                          </div>
                        )) :
                        <div className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                          {typeof merchant.contact_email === 'string' ? merchant.contact_email : JSON.stringify(merchant.contact_email)}
                        </div>
                      }
                    </div>
                  </div>
                )}

                {merchant.contact_phone && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <div className="space-y-1">
                      {Array.isArray(merchant.contact_phone) ?
                        merchant.contact_phone.map((phone: any, i: number) => (
                          <div key={i} className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                            {phone.phoneNumber || phone.phone || JSON.stringify(phone)}
                            {phone.status && <span className="ml-2 text-xs text-gray-400">({phone.status})</span>}
                          </div>
                        )) :
                        <div className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                          {typeof merchant.contact_phone === 'string' ? merchant.contact_phone : JSON.stringify(merchant.contact_phone)}
                        </div>
                      }
                    </div>
                  </div>
                )}

                {merchant.website && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Website</p>
                    <div className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                      {merchant.website}
                    </div>
                  </div>
                )}

                {merchant.pan && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">PAN</p>
                    <div className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                      {merchant.pan}
                    </div>
                  </div>
                )}

                {merchant.cin && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">CIN</p>
                    <div className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                      {merchant.cin}
                    </div>
                  </div>
                )}
              </div>

              {/* Address Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 border-b pb-1">Address Information</h4>

                {merchant.registered_address && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Registered Address</p>
                    <div className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                      {merchant.registered_address.full_address || (
                        <>
                          {merchant.registered_address.address_line1 && <div>{merchant.registered_address.address_line1}</div>}
                          {merchant.registered_address.address_line2 && <div>{merchant.registered_address.address_line2}</div>}
                          {merchant.registered_address.city && <span>{merchant.registered_address.city}, </span>}
                          {merchant.registered_address.state && <span>{merchant.registered_address.state} </span>}
                          {merchant.registered_address.pincode && <span>{merchant.registered_address.pincode}</span>}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {merchant.business_address && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Business Address</p>
                    <div className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                      {merchant.business_address.full_address || (
                        <>
                          {merchant.business_address.address_line1 && <div>{merchant.business_address.address_line1}</div>}
                          {merchant.business_address.address_line2 && <div>{merchant.business_address.address_line2}</div>}
                          {merchant.business_address.city && <span>{merchant.business_address.city}, </span>}
                          {merchant.business_address.state && <span>{merchant.business_address.state} </span>}
                          {merchant.business_address.pincode && <span>{merchant.business_address.pincode}</span>}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            {merchant.metrics && typeof merchant.metrics === 'object' && (
              <div className="w-full border-t border-gray-200 px-4 py-3">
                <h4 className="font-medium text-gray-700 mb-3">Key Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(merchant.metrics).map(([key, value]) => (
                    <MetricCard key={key} name={key} value={value} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Main function to render results based on their type
  const renderSmartResults = (results: any[]) => {
    if (!results || results.length === 0) return null;

    // Use specialized renderer for merchant data
    if (isMerchantData(results)) {
      return renderMerchantDataTable(results);
    }

    // Use complex renderer for other data
    return renderComplexResultsTable(results);
  };

  return (
    <div className="h-[calc(100vh-200px)] w-full flex flex-col relative">
      <ScrollArea
        ref={scrollAreaRef}
        className="h-full w-full"
      >
        {messages.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-lg font-medium text-gray-500">No Messages Yet</p>
                <p className="text-sm text-gray-400">Start typing to begin your investigation</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-6 w-full">
            {messages.map((message: Message, index: number) => (
              <ChatBubble
                key={index}
                isUser={message.isUser}
                code={message.code}
                graph={message.graph}
                onViewCode={() => message.code && handleViewCode(message.code, message.text)}
                onViewGraph={() => message.graph && handleViewGraph(message.graph, message.text)}
              >
                {message.isUser ? (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                ) : (
                  hasExecutionResults(message) ? (
                    renderSmartResults(message.results!)
                  ) : (
                    <SafeMarkdown className="prose prose-invert max-w-none">
                      {message.text}
                    </SafeMarkdown>
                  )
                )}
              </ChatBubble>
            ))}
            {isLoading && processingStatus && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Processing Status</h3>
                <div className="flex items-center gap-2 bg-white rounded p-3 border border-gray-200">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-800">
                    {processingStatus === 'Processing' 
                      ? 'Processing your request...' 
                      : `Processing: ${processingStatus.replace(/_/g, ' ')}`}
                  </span>
                </div>
              </div>
            )}
            {isLoading && thinkingSteps.length > 0 && !processingStatus && (
              <ThinkingStepsHistory
                steps={thinkingSteps}
                isComplete={isThinkingComplete}
              />
            )}
          </div>
        )}
      </ScrollArea>

      {/* {visualizationId && dashboardId && (
        <VisualizationPanel
          messages={messages}
          onViewGraph={handleViewGraph}
          visualizationId={visualizationId}
          dashboardId={dashboardId}
        />
      )} */}
    </div>
  );
}
