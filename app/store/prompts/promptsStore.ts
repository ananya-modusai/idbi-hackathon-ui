import { promptsService } from '@/app/services/promptsService';
import { create } from 'zustand';
// import { useWorkspaceStore } from '../workspace/workspaceStore';

interface PromptsStore {
  dynamicPrompts: string[];
  fraudSuggestions: string[];
  fraudSuggestionsWithHighlights: Array<{
    suggestion: string;
    highlightRanges: Array<{start: number, end: number}>;
  }>;
  isLoadingPrompts: boolean;
  isLoadingFraudSuggestions: boolean;
  setDynamicPrompts: (prompts: string[]) => void;
  setLoadingPrompts: (loading: boolean) => void;
  fetchContextBasedPrompts: (context: any) => Promise<void>;
  fetchFraudInvestigationSuggestions: (query?: string) => Promise<string[]>;
  fetchFraudInvestigationSuggestionsWithHighlighting: (query?: string) => Promise<Array<{
    suggestion: string;
    highlightRanges: Array<{start: number, end: number}>;
  }>>;
}

export const usePromptsStore = create<PromptsStore>((set, get) => ({
  dynamicPrompts: [],
  fraudSuggestions: [],
  fraudSuggestionsWithHighlights: [],
  isLoadingPrompts: false,
  isLoadingFraudSuggestions: false,
  
  setDynamicPrompts: (prompts) => set({ dynamicPrompts: prompts }),
  setLoadingPrompts: (loading) => set({ isLoadingPrompts: loading }),
  
  fetchContextBasedPrompts: async (context) => {
    set({ isLoadingPrompts: true });
    try {
      const prompts = await promptsService.postInvestigationGptPrompts(context);
      set({ 
        dynamicPrompts: prompts,
        isLoadingPrompts: false 
      });
    } catch (error) {
      console.error('Error fetching prompts:', error);
      set({ 
        dynamicPrompts: [],
        isLoadingPrompts: false 
      });
    }
  },

  fetchFraudInvestigationSuggestions: async (query?: string) => {
    set({ isLoadingFraudSuggestions: true });
    try {
      const suggestions = await promptsService.getFraudInvestigationSuggestions(query);
      
      set({ 
        fraudSuggestions: !query ? suggestions : get().fraudSuggestions,
        isLoadingFraudSuggestions: false 
      });
      
      return suggestions;
    } catch (error) {
      console.error('Error fetching fraud investigation suggestions:', error);
      set({ 
        isLoadingFraudSuggestions: false 
      });
      return [];
    }
  },

  fetchFraudInvestigationSuggestionsWithHighlighting: async (query?: string) => {
    set({ isLoadingFraudSuggestions: true });
    try {
      const suggestionsWithHighlights = await promptsService.getFraudInvestigationSuggestionsWithHighlighting(query);
      
      // Also update the regular suggestions list for compatibility
      const simpleSuggestions = suggestionsWithHighlights.map(item => item.suggestion);
      
      set({ 
        fraudSuggestions: !query ? simpleSuggestions : get().fraudSuggestions,
        fraudSuggestionsWithHighlights: suggestionsWithHighlights,
        isLoadingFraudSuggestions: false 
      });
      
      return suggestionsWithHighlights;
    } catch (error) {
      console.error('Error fetching fraud investigation suggestions with highlighting:', error);
      set({ 
        isLoadingFraudSuggestions: false 
      });
      return [];
    }
  }
})); 

// export const tabPrompts: Record<string, string[]> = {
//   overview: [
//     "What are the key risk factors? overview",
//     "Summarize recent activity overview",
//     "Generate investigation report overview"
//   ],
//   timeline: [
//     "Analyze timeline patterns timeline",
//     "Find suspicious events timeline",
//     "Identify key dates timeline"
//   ],
//   documents: [
//     "Review document authenticity documents",
//     "Check for inconsistencies documents",
//     "Verify signatures documents"
//   ]
// }; 