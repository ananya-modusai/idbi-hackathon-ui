import React, { useEffect, useState } from 'react';
import { useChatStore } from '@/app/store/chat/chatStore';
import { CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StepData {
  stage: string;
  step: string;
  status: string;
  visible: boolean;
}

export const ThinkingSteps: React.FC = () => {
  const {
    relevanceCheckStep,
    initializationStep,
    requirementAnalysisStep,
    processingStep,
    codeGenerationStep,
    codeValidationStep,
    codeExecutionStep,
    dbStatus
  } = useChatStore();

  // State to track which steps are visible (for animation sequence)
  const [visibleSteps, setVisibleSteps] = useState<StepData[]>([]);

  // Only show component if we have at least one step
  const hasAnySteps = relevanceCheckStep || initializationStep || requirementAnalysisStep || 
    processingStep || codeGenerationStep || codeValidationStep || codeExecutionStep || dbStatus;

  // Determine status for each step
  const getStepStatus = (step: string) => {
    if (!step) return 'pending';
    
    const lowerStep = step.toLowerCase();
    
    if (lowerStep.includes('error') || 
        lowerStep.includes('failed') || 
        lowerStep.includes('timeout')) {
      return 'error';
    }
    
    if (lowerStep.includes('loading') || 
        lowerStep.includes('processing') || 
        lowerStep.includes('checking') ||
        lowerStep.includes('waiting')) {
      return 'loading';
    }
    
    if (lowerStep.includes('success') || 
        lowerStep.includes('complete') || 
        lowerStep.includes('finished') ||
        lowerStep.includes('done')) {
      return 'success';
    }
    
    // Default to 'loading' for most in-progress steps
    return 'loading';
  };

  // Get icon for step status
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-300" />;
    }
  };

  // Collect all active steps
  useEffect(() => {
    // Create array of all steps with their current status
    const steps: StepData[] = [];
    
    if (relevanceCheckStep) steps.push({ 
      stage: "Relevance", 
      step: relevanceCheckStep, 
      status: getStepStatus(relevanceCheckStep),
      visible: false
    });
    
    if (initializationStep) steps.push({ 
      stage: "Initialization", 
      step: initializationStep,
      status: getStepStatus(initializationStep),
      visible: false
    });
    
    if (requirementAnalysisStep) steps.push({ 
      stage: "Analysis", 
      step: requirementAnalysisStep,
      status: getStepStatus(requirementAnalysisStep),
      visible: false
    });
    
    if (processingStep) steps.push({ 
      stage: "Processing", 
      step: processingStep,
      status: getStepStatus(processingStep),
      visible: false
    });
    
    if (codeGenerationStep) steps.push({ 
      stage: "Code Generation", 
      step: codeGenerationStep,
      status: getStepStatus(codeGenerationStep),
      visible: false
    });
    
    if (codeValidationStep) steps.push({ 
      stage: "Code Validation", 
      step: codeValidationStep,
      status: getStepStatus(codeValidationStep),
      visible: false
    });
    
    if (codeExecutionStep) steps.push({ 
      stage: "Code Execution", 
      step: codeExecutionStep,
      status: getStepStatus(codeExecutionStep),
      visible: false
    });
    
    if (dbStatus) steps.push({ 
      stage: "Database", 
      step: dbStatus,
      status: getStepStatus(dbStatus),
      visible: false
    });

    // Update visible steps array with new steps that weren't there before
    setVisibleSteps(currentSteps => {
      // If there are no current steps, just use the new ones but make first one visible
      if (currentSteps.length === 0 && steps.length > 0) {
        const updatedSteps = [...steps];
        updatedSteps[0].visible = true;
        return updatedSteps;
      }
      
      // Otherwise, merge with existing steps, preserving visibility
      const mergedSteps = [...steps];
      
      // Find new steps that weren't in the previous array
      let lastVisibleIndex = -1;
      
      // Mark steps as visible that were already visible or are new
      for (let i = 0; i < mergedSteps.length; i++) {
        const currentStep = mergedSteps[i];
        const existingStepIndex = currentSteps.findIndex(
          s => s.stage === currentStep.stage && s.step === currentStep.step
        );
        
        // If step was already there and was visible, keep it visible
        if (existingStepIndex >= 0 && currentSteps[existingStepIndex].visible) {
          currentStep.visible = true;
          lastVisibleIndex = i;
        }
      }
      
      // Make the next step visible if we have one
      if (lastVisibleIndex < mergedSteps.length - 1) {
        mergedSteps[lastVisibleIndex + 1].visible = true;
      } else if (lastVisibleIndex === -1 && mergedSteps.length > 0) {
        // No visible steps yet, make the first one visible
        mergedSteps[0].visible = true;
      }
      
      return mergedSteps;
    });
  }, [
    relevanceCheckStep, 
    initializationStep, 
    requirementAnalysisStep, 
    processingStep, 
    codeGenerationStep, 
    codeValidationStep, 
    codeExecutionStep, 
    dbStatus
  ]);

  // Show loading indicator when no steps are available
  if (!hasAnySteps) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md bg-gray-50 border border-gray-200 mb-4">
        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
        <span className="text-sm text-gray-600">Processing request...</span>
      </div>
    );
  }

  // Sequentially show each step with animations
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Request Processing</h3>
      <div className="space-y-3">
        <AnimatePresence>
          {visibleSteps.map((step, index) => (
            step.visible && (
              <motion.div
                key={`${step.stage}-${index}`}
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-md border border-gray-200 overflow-hidden"
              >
                <div className="flex items-start gap-3 p-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-medium text-xs text-gray-700 uppercase tracking-wide">
                        {step.stage}
                      </span>
                      <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                        step.status === 'success' ? 'bg-green-100 text-green-800' : 
                        step.status === 'error' ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {step.status === 'success' ? 'Complete' : 
                         step.status === 'error' ? 'Error' : 
                         'In Progress'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1 break-words">{step.step}</p>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}; 