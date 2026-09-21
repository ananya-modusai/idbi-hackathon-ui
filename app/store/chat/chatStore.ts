import { create } from 'zustand';
import { chatService } from '@/app/services/chat';
import { detectLanguage } from '@/app/utils/codeUtils';
import { ChatHistoryItem } from '@/app/types';
import { useAuthStore } from '../authentication/authStore';
import { useMerchantIdStore } from '../merchant/merchantIdStore';
import { v4 as uuidv4 } from 'uuid';

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
    metadata?: any;
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

// Thinking step interface
interface ThinkingStep {
  stage: string;
  step: string;
  timestamp?: number;
  type?: string; // Add type property for tracking loading/success/error
}

interface ChatInfo {
  chat_id: string;
  has_visualization: boolean;
  has_report: boolean;
  created_at: string;
  chat_title: string | null;
  user_id: string;
  merchant_id: string;
  visualization_id: string | null;
}

interface ChatStore {
  messages: Message[];
  isLoading: boolean;
  currentMessage: string;
  streamingMessage: string;
  activeChatId: string | null;
  allChatIds: ChatInfo[];
  processingStep: string;
  processingProgress: string;
  isHistoryLoading: boolean;
  initializationStep: string;
  relevanceCheckStep: string;
  requirementAnalysisStep: string;
  codeGenerationStep: string;
  codeValidationStep: string;
  codeExecutionStep: string;
  dbStatus: string;
  thinkingSteps: ThinkingStep[];
  isThinkingComplete: boolean;
  processingStatus: string | null;
  
  // Actions
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setCurrentMessage: (message: string) => void;
  setStreamingMessage: (message: string) => void;
  clearMessages: () => void;
  setActiveChatId: (id: string) => void;
  addThinkingStep: (step: ThinkingStep) => void;
  clearThinkingSteps: () => void;
  setThinkingComplete: (isComplete: boolean) => void;
  setProcessingStatus: (status: string | null) => void;
  
  // Chat Service Actions
  getNewChatId: (isVisualization?: boolean, visualizationId?: string | null) => Promise<string | null>;
  sendMessage: (message: string, addUserMessage?: boolean) => Promise<void>;
  sendWebSearchMessage: (message: string, addUserMessage?: boolean) => Promise<void>;
  sendGraphVisualizationMessage: (message: string, addUserMessage?: boolean) => Promise<void>;
  fetchChatHistory: (chatId: string) => Promise<void>;
  fetchAllChatIds: () => Promise<void>;
  handleStreamData: (data: any) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  currentMessage: "",
  streamingMessage: "",
  activeChatId: null,
  allChatIds: [],
  processingStep: '',
  processingProgress: '',
  isHistoryLoading: false,
  initializationStep: '',
  relevanceCheckStep: '',
  requirementAnalysisStep: '',
  codeGenerationStep: '',
  codeValidationStep: '',
  codeExecutionStep: '',
  dbStatus: '',
  thinkingSteps: [],
  isThinkingComplete: false,
  processingStatus: null,

  // Basic actions
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setCurrentMessage: (message) => set({ currentMessage: message }),
  setStreamingMessage: (message) => set({ streamingMessage: message }),
  clearMessages: () => set({ messages: [], streamingMessage: "" }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  addThinkingStep: (step) => set((state) => {
    // Determine step type if not provided
    let stepType = step.type;
    if (!stepType) {
      const lowerStep = step.step.toLowerCase();
      if (lowerStep.includes('error') || lowerStep.includes('failed') || lowerStep.includes('timeout')) {
        stepType = 'error';
      } else if (
        lowerStep.includes('success') || 
        lowerStep.includes('complete') || 
        lowerStep.includes('finished') ||
        lowerStep.includes('is relevant')
      ) {
        stepType = 'success';
      } else {
        // Default to loading for most processing steps
        stepType = 'loading';
      }
    }
    
    return { 
      thinkingSteps: [...state.thinkingSteps, { 
        ...step, 
        type: stepType, 
        timestamp: Date.now() 
      }] 
    };
  }),
  clearThinkingSteps: () => set({ thinkingSteps: [], isThinkingComplete: false }),
  setThinkingComplete: (isComplete) => set({ isThinkingComplete: isComplete }),
  setProcessingStatus: (status) => set({ processingStatus: status }),

  // Chat service actions
  getNewChatId: async (isVisualization: boolean = false, visualizationId: string | null = null) => {
    try {
      // Get merchant info
      const merchantState = useMerchantIdStore.getState();
      
      // Use selected merchant ID or a default value
      const merchantId = merchantState.selectedMerchantId || 'default-merchant';
      
      // Keep passing userId to maintain API compatibility, but it's ignored in the service now
      const userId = merchantId; 
      
      console.log('Creating new chat with merchant ID:', merchantId);
      
      // Call the API endpoint
      const chatId = await chatService.createNewChat(
        userId, // Not used by the API anymore, but kept for function signature compatibility
        merchantId,
        isVisualization,
        visualizationId
      );
      
      if (!chatId) {
        console.error('No chat ID returned from API');
        throw new Error('No chat ID returned from API');
      }
      
      console.log('New chat created with ID:', chatId);
      set({ activeChatId: chatId, messages: [] });
      return chatId;
    } catch (error) {
      console.error('Error getting new chat ID:', error);
      set({ isLoading: false });
      
      // Only show alert if there was an actual error
      if (error) {
        alert('Failed to create a new chat. Please try again.');
      }
      
      return null;
    }
  },

  sendMessage: async (message: string, addUserMessage: boolean = true) => {
    const state = get();
    if (!state.activeChatId) return;

    // Get merchant info
    const merchantState = useMerchantIdStore.getState();
    const merchantId = merchantState.selectedMerchantId || 'default-merchant';
    const userId = merchantId;

    // Add user message if requested
    if (addUserMessage) {
      const userMessage = { text: message, isUser: true };
      const lastMessage = state.messages.length > 0 ? state.messages[state.messages.length - 1] : null;
      const isDuplicate = lastMessage && lastMessage.isUser && lastMessage.text === message;
      
      if (!isDuplicate) {
        set(state => ({ messages: [...state.messages, userMessage] }));
      }
    }
    
    // Set loading state
    set({ isLoading: true });

    try {
      // Step 1: Initiate chat and get message_id
      console.log('[ChatStore] Initiating chat with message:', message);
      
      // Log the parameters being sent
      console.log('[ChatStore] Send parameters:', {
        chatId: state.activeChatId,
        userId,
        merchantId,
        message
      });
      
      // Send the message and get message_id
      const messageId = await chatService.sendChatMessage(
        state.activeChatId, 
        userId, 
        merchantId, 
        message
      );
      
      console.log('[ChatStore] Chat initiated successfully, message_id:', messageId);

      if (!messageId) {
        throw new Error('No message ID returned from API');
      }

      // Step 2: Poll for updates until completed
      console.log('[ChatStore] Starting to poll for updates with message_id:', messageId);
      
      let isComplete = false;
      let maxAttempts = 300; // 5 minutes maximum (1 second intervals)
      let attempts = 0;

      while (!isComplete && attempts < maxAttempts) {
        attempts++;
        
        try {
          // Get step updates
          console.log(`[ChatStore] Poll attempt ${attempts} for message_id: ${messageId}`);
          
          const response = await chatService.getStepUpdates(messageId);
          console.log('[ChatStore] Step update raw response:', JSON.stringify(response));
          
          if (!response || !response.success) {
            console.error('[ChatStore] Invalid or error response:', response);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          if (!response.data) {
            console.error('[ChatStore] Response missing data field:', response);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          // Process steps - show progress
          if (response.data.steps) {
            const { stage, status, message: stepMessage } = response.data.steps;
            console.log(`[ChatStore] Step update - Stage: ${stage}, Status: ${status}, Message: ${stepMessage}`);
            
            // Update thinking steps UI if needed
            if (get().thinkingSteps.length === 0 || 
                !get().thinkingSteps.some(s => s.stage === stage && s.step === stepMessage)) {
              get().addThinkingStep({
                stage,
                step: stepMessage,
                type: status === 'completed' ? 'success' : 'loading'
              });
            }
          }
          
          // Check if processing is complete
          if (response.data.current_status === 'completed') {
            console.log('[ChatStore] Processing completed with status:', response.data.current_status);
            isComplete = true;
            
            // Get the final message
            const finalMessage = response.data.message;
            console.log('[ChatStore] Final message object:', JSON.stringify(finalMessage));
            
            // Determine the text content based on message structure
            let messageText = '';
            
            if (typeof finalMessage === 'string') {
              messageText = finalMessage;
              console.log('[ChatStore] Message is a string:', messageText);
            } 
            else if (finalMessage && typeof finalMessage === 'object') {
              // Check various possible message formats
              if (finalMessage.message) {
                messageText = finalMessage.message;
                console.log('[ChatStore] Found message in .message:', messageText);
              } 
              else if (finalMessage.report && finalMessage.report.message) {
                messageText = finalMessage.report.message;
                console.log('[ChatStore] Found message in .report.message:', messageText);
              }
              else {
                messageText = 'Message received';
                console.log('[ChatStore] Using default message text');
              }
            }
            else {
              messageText = 'Message received';
              console.log('[ChatStore] Using default message text (no message found)');
            }
            
            console.log('[ChatStore] Final extracted message text:', messageText);
            
            // Add assistant message to chat
            const assistantMessage: Message = {
              text: messageText,
              isUser: false,
              code: null,
              graph: null
            };
            
            console.log('[ChatStore] Adding assistant message to chat:', assistantMessage);
            
            set(state => ({
              messages: [...state.messages, assistantMessage],
              isLoading: false
            }));
            
            break;
          }
          
          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('[ChatStore] Error polling for updates:', error);
          // Wait and try again, but only for a limited number of retries
          if (attempts > 5) {
            throw error; // Re-throw after several attempts
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Handle timeout case
      if (!isComplete) {
        console.error('[ChatStore] Polling timed out after', attempts, 'attempts');
        throw new Error('Response timed out after ' + attempts + ' attempts');
      }
    } catch (error) {
      console.error('[ChatStore] Fatal error in chat process:', error);
      
      // Show error message
      const errorMessage = {
        text: "Sorry, there was an error processing your request. Please try again.",
        isUser: false,
        code: null,
        graph: null
      };
      
      console.log('[ChatStore] Adding error message to chat:', errorMessage);
      
      set(state => ({
        messages: [...state.messages, errorMessage],
        isLoading: false
      }));
    }
  },

  sendWebSearchMessage: async (message: string, addUserMessage: boolean = true) => {
    return get().sendMessage(message, addUserMessage);
  },

  sendGraphVisualizationMessage: async (message: string, addUserMessage: boolean = true) => {
    return get().sendMessage(message, addUserMessage);
  },

  fetchChatHistory: async (chatId: string) => {
    try {
      set({ isHistoryLoading: true });
      
      console.log(`Fetching chat history for chat ID: ${chatId}`);
      
      if (!chatId) {
        console.error("Cannot fetch history: No chat ID provided");
        set({ isHistoryLoading: false });
        return;
      }
      
      // For now, we'll just set an empty history for new API chats
      if (chatId.includes("new-chat") || chatId === "undefined") {
        console.log("New chat detected, setting empty history");
        set({ messages: [], isHistoryLoading: false });
        return;
      }
      
      // Get history from API endpoint
      const history: ChatHistoryItem[] = await chatService.getActiveChatHistory(chatId);
      console.log("Fetched history:", history);
      
      // Sort history to ensure oldest messages appear first
      const sortedHistory = [...history].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const messages: Message[] = sortedHistory.map((item: ChatHistoryItem) => {
        if (item.writer === 'user') {
          return {
            text: item.message,
            isUser: true,
            code: null,
            graph: null
          };
        } else {
          return parseAssistantMessage(item.message);
        }
      });

      set({ messages });
    } catch (error) {
      console.error('Error in fetchChatHistory:', error);
    } finally {
      set({ isHistoryLoading: false });
    }
  },

  fetchAllChatIds: async () => {
    try {
      const chatIds = await chatService.getActiveChatIds();
      set({ allChatIds: chatIds });
    } catch (error) {
      console.error('Error fetching chat IDs:', error);
    }
  },

  // Handle stream data events
  handleStreamData: (data) => {
    if (!data.type) return;
    
    switch (data.type) {
      case 'init':
        set({ initializationStep: data.content });
        break;
      case 'status':
        switch (data.step) {
          case 'relevance_check':
            set({ relevanceCheckStep: data.content });
            break;
          case 'requirement_analysis':
            set({ requirementAnalysisStep: data.content });
            break;
          case 'processing':
            set({ processingStep: data.content });
            break;
        }
        break;
      case 'progress':
        set({ processingProgress: data.content });
        break;
      case 'code_gen':
        set({ codeGenerationStep: data.content });
        break;
      case 'validation':
        set({ codeValidationStep: data.content });
        break;
      case 'execution_status':
        set({ codeExecutionStep: data.content });
        break;
      case 'execution_result':
        // Handle code execution results
        if (data.success && data.data && data.data.reply_message) {
          // Check if the message starts with "Here are the results" which indicates results data
          const isResultsMessage = typeof data.data.reply_message.message === 'string' && 
            data.data.reply_message.message.startsWith('Here are the results');
          
          // Create a message with the results for table rendering
          const resultMessage: Message = {
            // If there's code or results message, only show the success message, otherwise show the full message
            text: data.data.reply_message.code || isResultsMessage 
              ? "Code execution completed successfully" 
              : data.data.reply_message.message,
            isUser: false,
            code: data.data.reply_message.code ? {
              language: detectLanguage(data.data.reply_message.code),
              content: data.data.reply_message.code
            } : null,
            // Include results if they exist
            results: data.data.reply_message.results || undefined
          };
          
          set((state) => ({
            messages: [...state.messages, resultMessage],
            isLoading: false
          }));
        }
        break;
      case 'db_status':
        set({ dbStatus: data.content });
        break;
      // ... other cases remain the same
    }
  }
}));

const parseAssistantMessage = (messageStr: string): Message => {
  try {
    // Special case for messages that start with "Here are the results"
    if (messageStr.startsWith('Here are the results')) {
      try {
        // Try to extract JSON from the message
        const jsonStart = messageStr.indexOf('[');
        const jsonEnd = messageStr.lastIndexOf(']') + 1;
        
        if (jsonStart > 0 && jsonEnd > jsonStart) {
          const jsonStr = messageStr.substring(jsonStart, jsonEnd);
          const results = JSON.parse(jsonStr);
          
          if (Array.isArray(results)) {
            return {
              text: "Code execution completed successfully",
              isUser: false,
              code: null,
              graph: null,
              results: results
            };
          }
        }
      } catch (e) {
        console.error('Error parsing results from message:', e);
      }
    }
    
    const events = JSON.parse(messageStr);
    const message: Message = {
      text: '',
      isUser: false,
      code: null,
      graph: null,
      results: undefined
    };

    for (const event of events) {
      switch (event.type) {
        case 'assistant':
          if (event.is_final) {
            message.text = event.content;
          }
          break;
        case 'code': 
          message.code = {
            language: detectLanguage(event.content),
            content: event.content
          };
          break;
        case 'graph_code':
          message.code = {
            language: detectLanguage(event.content),
            content: event.content
          };
          break;
        case 'graph_data':
          message.graph = {
            type: 'visualization',
            data: event.content
          };
          break;
        case 'graph_metadata':
          if (message.graph) {
            message.graph = {
              ...message.graph,
              metadata: event.content
            };
          }
          break;
        case 'results':
          // Include results if they exist
          if (event.content && Array.isArray(event.content)) {
            message.results = event.content;
          }
          break;
      }
    }

    return message;
  } catch (error) {
    console.error('Error parsing assistant message:', error);
    return {
      text: messageStr,
      isUser: false,
      code: null,
      graph: null
    };
  }
};