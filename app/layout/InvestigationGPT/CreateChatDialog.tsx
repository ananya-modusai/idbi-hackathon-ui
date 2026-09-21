import { FC, useState, useEffect, useRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search } from 'lucide-react';
import { usePromptsStore } from '@/app/store/prompts/promptsStore';

interface CreateChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: () => void;
  initialMessage: string;
  onInitialMessageChange: (value: string) => void;
  disabled?: boolean;
}

export const CreateChatDialog: FC<CreateChatDialogProps> = ({
  isOpen,
  onClose,
  onCreateChat,
  initialMessage,
  onInitialMessageChange,
  disabled = false
}) => {
  const { 
    dynamicPrompts, 
    fraudSuggestions, 
    fraudSuggestionsWithHighlights,
    fetchFraudInvestigationSuggestions, 
    fetchFraudInvestigationSuggestionsWithHighlighting,
    isLoadingFraudSuggestions 
  } = usePromptsStore();
  
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [filteredSuggestionsWithHighlights, setFilteredSuggestionsWithHighlights] = useState<Array<{
    suggestion: string;
    highlightRanges: Array<{start: number, end: number}>;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectionMade, setSelectionMade] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Load initial suggestions when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchFraudInvestigationSuggestionsWithHighlighting();
      // Reset states when dialog opens
      setSelectionMade(false);
      setShowSuggestions(true);
    }
  }, [isOpen, fetchFraudInvestigationSuggestionsWithHighlighting]);

  // Update suggestions when input changes
  useEffect(() => {
    const updateSuggestions = async () => {
      if (initialMessage.trim() === '') {
        // When input is empty, show any 5 suggestions
        const defaultSuggestions = fraudSuggestions.length > 0 
          ? fraudSuggestions.slice(0, 5) 
          : dynamicPrompts.slice(0, 5);
        setFilteredSuggestions(defaultSuggestions);
        setFilteredSuggestionsWithHighlights([]); // No highlights for default suggestions
        setShowSuggestions(!selectionMade);
      } else {
        // When input has characters, actively fetch suggestions with highlighting
        const searchResults = await fetchFraudInvestigationSuggestionsWithHighlighting(initialMessage);
        
        console.log(`Dialog search for "${initialMessage}" found:`, searchResults);
        
        // If we got results from the search, use them
        if (searchResults && searchResults.length > 0) {
          setFilteredSuggestionsWithHighlights(searchResults);
          setFilteredSuggestions(searchResults.map(item => item.suggestion));
          setShowSuggestions(!selectionMade);
        } else {
          // Fallback to local filtering if search returned no results
          const allSuggestions = [...fraudSuggestions, ...dynamicPrompts];
          const matched = allSuggestions
            .filter(suggestion => 
              suggestion.toLowerCase().includes(initialMessage.toLowerCase()))
            .slice(0, 5);
          
          setFilteredSuggestions(matched);
          setFilteredSuggestionsWithHighlights([]);
          // Only show suggestions dropdown if there are matches and no selection was made
          setShowSuggestions(matched.length > 0 && !selectionMade);
        }
      }
    };
    
    // Use a small delay for search to avoid too many API calls while typing
    const delayDebounceFn = setTimeout(() => {
      updateSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [initialMessage, dynamicPrompts, fraudSuggestions, fetchFraudInvestigationSuggestionsWithHighlighting, selectionMade]);

  // Helper function to render a suggestion with highlighted ranges
  const renderHighlightedText = (suggestion: string, highlightRanges: Array<{start: number, end: number}>): ReactNode[] => {
    if (!highlightRanges || highlightRanges.length === 0) {
      return [<span key="whole">{suggestion}</span>];
    }
    
    const result: ReactNode[] = [];
    let lastIndex = 0;
    
    // Sort ranges by start position (should already be sorted, but just in case)
    const sortedRanges = [...highlightRanges].sort((a, b) => a.start - b.start);
    
    for (const range of sortedRanges) {
      // Add text before this highlight
      if (range.start > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>{suggestion.substring(lastIndex, range.start)}</span>
        );
      }
      
      // Add the highlighted text
      result.push(
        <strong key={`match-${range.start}`} className="font-bold">
          {suggestion.substring(range.start, range.end)}
        </strong>
      );
      
      lastIndex = range.end;
    }
    
    // Add any remaining text after the last highlight
    if (lastIndex < suggestion.length) {
      result.push(
        <span key={`text-${lastIndex}`}>{suggestion.substring(lastIndex)}</span>
      );
    }
    
    return result;
  };

  // Fallback helper function to highlight matching characters in suggestions
  const highlightMatch = (text: string, query: string): ReactNode[] => {
    if (!query.trim()) {
      return [<span key="whole">{text}</span>];
    }
    
    // Simple implementation that just highlights the exact matches
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const result: ReactNode[] = [];
    let lastIndex = 0;
    
    let matchIndex = lowerText.indexOf(lowerQuery, lastIndex);
    
    while (matchIndex !== -1) {
      if (matchIndex > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>{text.substring(lastIndex, matchIndex)}</span>
        );
      }
      
      result.push(
        <strong key={`match-${matchIndex}`} className="font-bold">
          {text.substring(matchIndex, matchIndex + lowerQuery.length)}
        </strong>
      );
      
      lastIndex = matchIndex + lowerQuery.length;
      matchIndex = lowerText.indexOf(lowerQuery, lastIndex);
    }
    
    if (lastIndex < text.length) {
      result.push(
        <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>
      );
    }
    
    return result;
  };

  const handleSuggestionClick = (suggestion: string) => {
    onInitialMessageChange(suggestion);
    // Explicitly close the suggestions dropdown when a suggestion is clicked
    setShowSuggestions(false);
    // Set selection made to true to prevent dropdown from showing again
    setSelectionMade(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputFocus = () => {
    // Don't automatically show suggestions on focus after a selection has been made
    if (filteredSuggestions.length > 0 && !selectionMade) {
      setShowSuggestions(true);
    }
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== inputRef.current) {
      setShowSuggestions(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setSelectionMade(false);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md" onClick={handleClickOutside}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="flex flex-col items-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <MessageSquare className="h-12 w-12 text-blue-500" />
            </motion.div>
            <DialogTitle className="text-xl">Start a New Chat</DialogTitle>
          </DialogHeader>
          
          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="relative flex items-center">
                <Input
                  ref={inputRef}
                  value={initialMessage}
                  onChange={(e) => {
                    onInitialMessageChange(e.target.value);
                    // Reset selection state if user clears input
                    if (e.target.value.trim() === '') {
                      setSelectionMade(false);
                    }
                  }}
                  onFocus={handleInputFocus}
                  placeholder="Type your query in plain English..."
                  className="w-full pr-10"
                  disabled={disabled}
                />
                <Search className={`absolute right-3 h-4 w-4 ${isLoadingFraudSuggestions ? 'text-blue-500 animate-spin' : 'text-gray-400'}`} />
              </div>
              
              {showSuggestions && filteredSuggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg"
                >
                  <ul className="py-1 max-h-60 overflow-auto">
                    {filteredSuggestions.map((suggestion, index) => {
                      // Find matching highlight ranges for this suggestion if available
                      const highlightItem = filteredSuggestionsWithHighlights.find(
                        item => item.suggestion === suggestion
                      );
                      
                      return (
                        <li 
                          key={index}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="flex items-center">
                            <span className="mr-2 text-xs text-gray-400">{index + 1}</span>
                            <span>
                              {highlightItem 
                                ? renderHighlightedText(suggestion, highlightItem.highlightRanges)
                                : highlightMatch(suggestion, initialMessage)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </div>
            
            <div className="text-sm text-gray-500 italic">
              Enter a query for fraud investigation in plain English.
              Your query will be used to generate code to fetch relevant data.
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={onCreateChat}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!initialMessage.trim() || disabled}
              >
                Start Chat
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}; 