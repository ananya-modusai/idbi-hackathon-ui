import { ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

import { useReportStore } from "@/app/store/report/reportStore";
import { ContextMenu } from "@/components/ui/context-menu";
import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuSeparator } from "@/components/ui/context-menu";
import type { ReportComponent } from "./report";
import { ReportArtifact } from './ReportArtifact';
import { useArtifactStore } from "@/app/store/artifact/artifactStore";
import { useInvestigatorDetailsStore } from "@/app/store/login/InvestigatorDetailsStore";
import { CreateReportDialog } from './CreateReportDialog';

export const ReportableSection = ({ type, children, data, title }: {
    type: ReportComponent['component_type'];
    children: React.ReactNode;
    data: any;
    title?: string;
  }) => {
    const { reports, createNewReport, addComponentToReport, fetchReportDetails } = useReportStore();
    const { addTab, setActiveTabId, setCollapsed } = useArtifactStore();
    const { investigatorEmail } = useInvestigatorDetailsStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newReportTitle, setNewReportTitle] = useState('');
    const sectionRef = useRef<HTMLDivElement>(null);

    // Memoize the handleAddToReport function to prevent recreation on each render
    const handleAddToReport = useCallback(async (reportId: string) => {
      try {
      // Only fetch report details if components are not present
      const existingReport = reports.find(r => r.id === reportId);
      const reportDetails = existingReport?.components ? 
        existingReport : 
        await fetchReportDetails(reportId);
      
      const updatedReport = await addComponentToReport(reportId, {
        frontend_component_id: uuidv4(),
        component_type: type,
        data: { ...data, title },
      });

      if (updatedReport) {
        addTab({
          id: `report-${reportId}`,
          title: `Report: ${updatedReport.report_title}`,
          renderArtifact: () => <ReportArtifact report={updatedReport} />
        });
        setActiveTabId(`report-${reportId}`);
        setCollapsed(false);
      }
      } catch (error) {
        console.error("Error adding component to report:", error);
      }
    }, [reports, fetchReportDetails, addComponentToReport, type, data, title, addTab, setActiveTabId, setCollapsed]);

    const handleNewReport = async () => {
      try {
      const newReport = await createNewReport(newReportTitle, investigatorEmail);
      // Get the newly created report
      if (newReport) {
        // Check if we have custom data stored from the event
        const customDataStr = sectionRef.current?.getAttribute('data-custom-data');
        const customData = customDataStr ? JSON.parse(customDataStr) : null;
        const dataToUse = customData || data;
        
        // Create component with the appropriate data
        const component = {
          frontend_component_id: uuidv4(),
          component_type: type,
          data: { ...dataToUse, title },
        };
        
        // Add the component to the new report
        const updatedReport = await addComponentToReport(newReport.id, component);
        
        if (updatedReport) {
          // Create the artifact tab for the new report
          addTab({
            id: `report-${newReport.id}`,
            title: `Report: ${updatedReport.report_title}`,
            renderArtifact: () => <ReportArtifact report={updatedReport} />
          });
          setActiveTabId(`report-${newReport.id}`);
          setCollapsed(false);
          
          // Clear the custom data attribute
          sectionRef.current?.removeAttribute('data-custom-data');
        }
      }
      } catch (error) {
        console.error("Error creating new report:", error);
      } finally {
      setIsDialogOpen(false);
      }
    };

    // Handle the generate-report event
    useEffect(() => {
      const currentSectionRef = sectionRef.current;
      
      // Handle add-to-report event (direct addition to existing report)
      const handleAddToReportEvent = (event: CustomEvent) => {
        event.stopPropagation();
        const { type: eventType, data: eventData, reportId } = event.detail;
        
        if (eventType === type && reportId) {
          // Use event data if provided, otherwise fall back to section data
          const dataToUse = eventData || data;
          
          // Create component with the appropriate data
          const component = {
            frontend_component_id: uuidv4(),
            component_type: type,
            data: { ...dataToUse, title },
          };
          
          // Directly add to the specified report with custom data
          addComponentToReport(reportId, component).then(updatedReport => {
            if (updatedReport) {
              addTab({
                id: `report-${reportId}`,
                title: `Report: ${updatedReport.report_title}`,
                renderArtifact: () => <ReportArtifact report={updatedReport} />
              });
              setActiveTabId(`report-${reportId}`);
              setCollapsed(false);
            }
          }).catch(error => {
            console.error("Error adding component to report:", error);
          });
        }
      };
      
      const handleGenerateReport = (event: CustomEvent) => {
        const { type: eventType, data: eventData } = event.detail;
        
        if (eventType === type) {
          // Store the event data for use when creating the new report
          if (eventData) {
            // Update the data ref to use event data for new report creation
            sectionRef.current?.setAttribute('data-custom-data', JSON.stringify(eventData));
          }
          
          // Open the dialog to create a new report
          setIsDialogOpen(true);
          // Optionally pre-populate the report title based on the section
          setNewReportTitle(`${title || type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')} Report`);
        }
      };
      
      if (currentSectionRef) {
        // Remove any existing event listeners to prevent duplicates
        currentSectionRef.removeEventListener('generate-report', handleGenerateReport as EventListener);
        currentSectionRef.removeEventListener('add-to-report', handleAddToReportEvent as EventListener);
        
        // Add fresh event listeners
        currentSectionRef.addEventListener('generate-report', handleGenerateReport as EventListener);
        currentSectionRef.addEventListener('add-to-report', handleAddToReportEvent as EventListener);
        
        // Add data attributes for DOM querying
        currentSectionRef.setAttribute('data-report-section', type);
        currentSectionRef.classList.add('reportable-section');
        currentSectionRef.setAttribute('data-type', type);
      }
      
      return () => {
        if (currentSectionRef) {
          currentSectionRef.removeEventListener('generate-report', handleGenerateReport as EventListener);
          currentSectionRef.removeEventListener('add-to-report', handleAddToReportEvent as EventListener);
        }
      };
    }, [type, title, handleAddToReport, data]);

    return (
      <div ref={sectionRef} className="reportable-section" data-report-section={type} data-type={type}>
        <ContextMenu>
          <ContextMenuTrigger>{children}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Add to Report</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {reports.map(report => (
                  <ContextMenuItem key={report.id} onClick={() => handleAddToReport(report.id)}>
                    {report.report_title}
                  </ContextMenuItem>
                ))}
                {reports.length > 0 && <ContextMenuSeparator />}
                <ContextMenuItem onClick={() => setIsDialogOpen(true)}>
                  Create New Report...
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>

        <CreateReportDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onCreateReport={handleNewReport}
          reportTitle={newReportTitle}
          onReportTitleChange={(value) => setNewReportTitle(value)}
        />
      </div>
    );
  };

export const RemoveFromReport = ({ id, reportId, children }: { id: string, reportId: string, children: React.ReactNode }) => {
  const { removeComponentFromReport } = useReportStore();
  const { addTab, setActiveTabId, setCollapsed, updateTab } = useArtifactStore();
  
  const handleRemoveFromReport = async () => {
    const updatedReport = await removeComponentFromReport(reportId, id);
    
    if (updatedReport) {
      // Update the existing tab instead of creating a new one
      updateTab(`report-${reportId}`, {
        title: `Report: ${updatedReport.report_title}`,
        renderArtifact: () => <ReportArtifact report={updatedReport} />
      });
      
      setActiveTabId(`report-${reportId}`);
      setCollapsed(false);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleRemoveFromReport}>Remove</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};