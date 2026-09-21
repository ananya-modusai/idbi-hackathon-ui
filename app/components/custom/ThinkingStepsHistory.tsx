import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThinkingStep {
  stage: string;
  step: string;
  type?: string;
  visible?: boolean;
}

interface ThinkingStepsHistoryProps {
  steps: ThinkingStep[];
  isComplete: boolean;
}

export const ThinkingStepsHistory: React.FC<ThinkingStepsHistoryProps> = ({ 
  steps, 
  isComplete 
}) => {
  const [visibleSteps, setVisibleSteps] = useState<(ThinkingStep & { visible: boolean, status: string })[]>([]);

  // Process steps and make them visible sequentially
  useEffect(() => {
    if (steps.length === 0) {
      setVisibleSteps([]);
      return;
    }

    // Process steps to handle status transitions
    const processedSteps = processStepsWithStatus(steps);

    // Convert steps to our internal format with visibility flag
    const enhancedSteps = processedSteps.map((step, index) => ({
      ...step,
      visible: false,
      status: getStepStatus(step)
    }));

    // Update visible steps over time to create animation sequence
    const revealSteps = async () => {
      for (let i = 0; i < enhancedSteps.length; i++) {
        // Wait briefly before showing next step
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        // Update state to make this step visible
        setVisibleSteps(current => {
          const updated = [...current];
          if (i < updated.length) {
            updated[i].visible = true;
          }
          return updated;
        });
      }
    };

    setVisibleSteps(enhancedSteps);
    
    // Start the reveal animation for steps
    if (enhancedSteps.length > 0) {
      revealSteps();
    }
  }, [steps]);

  // Function to process steps and update status based on success/failure patterns
  const processStepsWithStatus = (steps: ThinkingStep[]): ThinkingStep[] => {
    const processedSteps = [...steps];
    const stageStatusMap: Record<string, string> = {};
    
    // First pass: identify success/failure status for each stage
    for (const step of processedSteps) {
      const lowerStep = step.step.toLowerCase();
      const stepType = step.type || '';
      
      // If we have an explicit type, use it
      if (stepType === 'success' || 
          lowerStep.includes('success') || 
          lowerStep.includes('complete') || 
          lowerStep.includes('is relevant')) {
        stageStatusMap[step.stage] = 'success';
      } else if (stepType === 'error' || 
                lowerStep.includes('error') || 
                lowerStep.includes('failed') ||
                lowerStep.includes('timeout')) {
        stageStatusMap[step.stage] = 'error';
      }
    }
    
    // Second pass: update steps based on stage status
    for (const step of processedSteps) {
      // If this stage has a definitive status and current step doesn't
      if (stageStatusMap[step.stage]) {
        // Only override if step doesn't have an explicit type
        if (!step.type) {
          // For loading steps of the same stage, apply the stage's final status
          const lowerStep = step.step.toLowerCase();
          if (lowerStep.includes('checking') || 
              lowerStep.includes('loading') || 
              lowerStep.includes('searching') || 
              lowerStep.includes('processing') || 
              lowerStep.includes('detecting') || 
              lowerStep.includes('improving')) {
            step.type = stageStatusMap[step.stage];
          }
        }
      }
    }
    
    return processedSteps;
  };

  // Determine status for each step
  const getStepStatus = (step: ThinkingStep): string => {
    // If step has explicit type, use it
    if (step.type) {
      return step.type;
    }
    
    if (!step.step) return 'pending';
    
    const lowerStep = step.step.toLowerCase();
    
    if (lowerStep.includes('error') || 
        lowerStep.includes('failed') || 
        lowerStep.includes('timeout')) {
      return 'error';
    }
    
    if (lowerStep.includes('success') || 
        lowerStep.includes('complete') || 
        lowerStep.includes('finished') ||
        lowerStep.includes('is relevant') ||
        lowerStep.includes('done')) {
      return 'success';
    }
    
    // Default to 'loading' for in-progress steps
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

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Processing Steps</h3>
      <div className="space-y-2">
        <AnimatePresence>
          {visibleSteps.map((step, index) => (
            step.visible && (
              <motion.div
                key={`${step.stage}-${index}`}
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded border border-gray-200 overflow-hidden"
              >
                <div className="flex items-start gap-3 p-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-gray-700 uppercase tracking-wide">
                          {step.stage}
                        </span>
                        <span className="text-xs text-gray-400">
                          Step {index + 1}
                        </span>
                      </div>
                      <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                        step.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : step.status === 'error' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {step.status === 'success' 
                          ? 'Complete' 
                          : step.status === 'error' 
                            ? 'Error' 
                            : 'Processing'}
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