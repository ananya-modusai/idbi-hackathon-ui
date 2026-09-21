import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatBubble } from "@/app/components/custom/ChatBubble"
import { useRef, useEffect } from "react"
import { useChatStore } from "@/app/store/chat/chatStore"
import { chatService } from '@/app/services/chat';
import { visualizations } from '@/app/data/hardcodeddata/dashboardStructures';
import { withArtifactData } from '@/app/layout/Artifact/withArtifactData';

// Interface for the data needed by this component
interface ChatData {
  messages: any[];
  hasVisualization: boolean;
  visualizationId?: string;
  dashboardId?: string;
}

// Props for the base component
interface ChatComponentProps {
  chatId: string;
  data: ChatData; // This will be injected by the HOC
}

// Base component that receives data from our HOC
function ChatComponent({ chatId, data }: ChatComponentProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { isLoading } = useChatStore();
  
  // Use the data provided by the HOC
  const { messages, hasVisualization, visualizationId, dashboardId } = data;

  // Scroll to bottom when messages change
  useEffect(() => {
    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea ref={scrollAreaRef} className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {messages.map((message, index) => (
          <ChatBubble 
            key={index}
            isUser={message.isUser}
          >
            {message.text}
          </ChatBubble>
        ))}
        
        {hasVisualization && (
          <div className="p-4 bg-blue-50 rounded-lg mt-4">
            <p className="text-sm text-blue-700">
              This chat contains a visualization: {visualizationId}
            </p>
            {dashboardId && (
              <p className="text-xs text-blue-500 mt-1">
                Dashboard ID: {dashboardId}
              </p>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// Wrap our component with the data loading HOC
export const EnhancedChatComponent = withArtifactData<{ chatId: string }, ChatData>(
  ChatComponent,
  // Extract tab ID from props
  (props) => `chat-artifact-${props.chatId}`,
  // Define data fetching logic
  async (props) => {
    const { chatId } = props;
    const { fetchChatHistory } = useChatStore.getState();
    
    // Fetch chat history
    await fetchChatHistory(chatId);
    console.log("Enhanced: fetching chat history", chatId);
    
    // Check visualization status
    let hasViz = false;
    try {
      hasViz = await chatService.getChatVisualizationStatus(chatId);
    } catch (error) {
      console.error('Error checking visualization status:', error);
    }
    
    // Get current messages from store
    const currentMessages = useChatStore.getState().messages;
    
    // Extract visualization info from first message
    let vizId = undefined;
    let dashId = undefined;
    
    if (currentMessages.length > 0 && currentMessages[0].isUser) {
      const message = currentMessages[0].text;
      const match = message.match(/Editing Visualization: ([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        vizId = match[1];
        
        // Get dashboard ID from visualization
        if (visualizations[vizId]) {
          dashId = visualizations[vizId].dashboard_id;
        }
      }
    }
    
    // Return data object
    return {
      messages: currentMessages,
      hasVisualization: hasViz,
      visualizationId: vizId,
      dashboardId: dashId
    };
  },
  // Define dependencies that should trigger refetching
  (props) => [props.chatId]
); 