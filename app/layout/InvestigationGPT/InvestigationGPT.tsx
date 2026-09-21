"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { InvestigationGPTInput } from "./InvestigationGPTInput"
import { InvestigationGPTSuggestions } from "./InvestigationGPTSuggestions"
import { InvestigationGPTChat } from "./InvestigationGPTChat"
import { DocChatArtifact } from "./DocChatArtifact"
import { Button } from "@/components/ui/button"
import { Send, Plus } from "lucide-react"
import { useState, useEffect, useRef } from 'react'
import { useArtifactStore } from "@/app/store/artifact/artifactStore"
import { useChatStore } from "@/app/store/chat/chatStore"
import { MessageMode } from "@/app/types"
import { CreateChatDialog } from "./CreateChatDialog"
import { usePromptsStore } from "@/app/store/prompts/promptsStore"
import { useMerchantIdStore } from "@/app/store/merchant/merchantIdStore"
import { useDocChatStore } from "@/app/store/docChat/docChatStore"
import { chatService } from "@/app/services/chat"

export function InvestigationGPT() {
  const { addTab, setActiveTabId, setCollapsed } = useArtifactStore()
  const { 
    messages, 
    isLoading, 
    currentMessage,
    activeChatId,
    addMessage,
    setLoading,
    setCurrentMessage,
    getNewChatId,
    setProcessingStatus,
    processingStatus
  } = useChatStore()  
  
  const { fetchFraudInvestigationSuggestions } = usePromptsStore()
  const { selectedMerchantId } = useMerchantIdStore()
  const { sendMessage: sendDocMessage } = useDocChatStore()

  const [mode, setMode] = useState<MessageMode>('chat')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [initialChatMessage, setInitialChatMessage] = useState('')
  
  // Add state for polling
  const [processingMessageId, setProcessingMessageId] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!activeChatId) return
    console.log("activeChatId in investigationgpt", activeChatId)

    // Get the first user message if it exists
    const firstUserMessage = messages.find(message => message.isUser)?.text || '';
    
    // Truncate to first 20 characters or use "blank chat" if no message
    const messageSummary = firstUserMessage 
      ? firstUserMessage.substring(0, 20) + (firstUserMessage.length > 20 ? '...' : '') 
      : 'Blank Chat';
    
    // Create unique tab ID with prefix
    const tabId = `chat-artifact-${activeChatId || 'new-chat'}`
    
    addTab({
      id: tabId,
      title: `${messageSummary} - N ${activeChatId}`,
      renderArtifact: () => (
        <InvestigationGPTChat chatId={activeChatId || 'new-chat'} />
      )
    })
    setActiveTabId(tabId)
    setCollapsed(false)
  }, [activeChatId, messages])

  // Add polling effect similar to VisualizationArtifact
  useEffect(() => {
    if (!processingMessageId) {
      console.log('No processing message ID to poll for');
      return;
    }

    console.log(`Setting up polling for message ID: ${processingMessageId}`);
    
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      console.log('Clearing existing polling interval');
      clearInterval(pollingIntervalRef.current);
    }

    setProcessingStatus('Processing');
    console.log('Starting to poll for updates with message ID:', processingMessageId);
    
    let retryCount = 0;
    const maxRetries = 120; // Max 4 minutes of polling (at 2 seconds each)
    
    // Define the polling function
    const pollStepUpdates = async () => {
      if (!processingMessageId) {
        console.log('No message ID available for polling');
        return;
      }
      
      console.log(`Polling step updates for message ID: ${processingMessageId}, attempt: ${retryCount + 1}`);
      
      try {
        // Make the API call to get step updates
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ''}api/v1/chat2/${processingMessageId}/getStepUdates`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth') || '{}').accessToken : ''}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Step updates response:', data);
        
        // Check if we have a valid response with data
        if (data && data.data) {
          // If processing is completed
          if (data.data.current_status === 'completed') {
            console.log('Processing completed successfully');
            
            // Update status
            setProcessingStatus('completed');
            
            // Get the final message
            const finalMessage = data.data.message;
            console.log('Final message:', finalMessage);
            
            // Determine message text from response
            let messageText = '';
            if (typeof finalMessage === 'string') {
              messageText = finalMessage;
            } else if (finalMessage && typeof finalMessage === 'object') {
              messageText = finalMessage.message || 
                          (finalMessage.report && finalMessage.report.message) || 
                          'Message received';
            }
            
            // Add assistant message to chat
            addMessage({
              text: messageText,
              isUser: false,
              code: null,
              graph: null
            });
            
            // Stop polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            // Update loading state
            setLoading(false);
            
            // Clear processing message ID
            setProcessingMessageId(null);
            setProcessingStatus(null);
            return;
          }
          
          // If still processing, update status
          if (data.data.steps && data.data.steps.stage) {
            console.log(`Processing status: ${data.data.steps.stage}`);
            setProcessingStatus(data.data.steps.stage);
          }
        } else {
          console.warn('Invalid response structure from step updates API:', data);
          retryCount++;
        }
      } catch (err) {
        console.error('Error polling for step updates:', err);
        retryCount++;
      }
      
      // Stop polling if max retries reached
      if (retryCount >= maxRetries) {
        console.log('Max retries reached, stopping polling');
        setProcessingStatus('timed_out');
        
        // Add error message to chat
        addMessage({
          text: "Processing timed out. Please try again.",
          isUser: false,
          code: null,
          graph: null
        });
        
        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Update loading state
        setLoading(false);
        
        // Clear processing message ID
        setProcessingMessageId(null);
      }
    };
    
    // Execute immediately
    pollStepUpdates();
    
    // Set up interval for polling every 2 seconds
    console.log('Setting up polling interval (every 2 seconds)');
    pollingIntervalRef.current = setInterval(pollStepUpdates, 2000);
    
    // Clean up on unmount
    return () => {
      console.log('Cleaning up polling interval');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setProcessingStatus(null);
    };
  }, [processingMessageId]);

  const handleNewChat = async () => {
    console.log("Plus button clicked - creating new chat");
    
    // Fetch initial fraud investigation suggestions for the dialog
    // Using empty query to get the default 5 suggestions
    await fetchFraudInvestigationSuggestions();
    
    // Clear any previously entered message
    setInitialChatMessage('');
    
    // Open the dialog
    setIsDialogOpen(true);
  }

  const handleDocumentMessage = async (query: string) => {
    if (!query.trim()) return;

    // Create or switch to document chat tab first
    const docTabId = 'doc-chat-artifact';
    
    // Check if tab already exists, if not create it
    const existingTab = useArtifactStore.getState().tabs.find(tab => tab.id === docTabId);
    if (!existingTab) {
      addTab({
        id: docTabId,
        title: 'Document Chat',
        renderArtifact: () => <DocChatArtifact chatId="doc-chat" />
      });
    }
    setActiveTabId(docTabId);
    setCollapsed(false);

    // Send message using the store
    await sendDocMessage(query);
  };

  const handleCreateNewChat = async () => {
    console.log("Creating new chat from dialog with initial message:", initialChatMessage);
    
    const mId = selectedMerchantId || 'default-merchant';
    console.log("Using merchant ID:", mId);
    
    try {
      // Create new chat with has_visualization=false
      const newChatId = await getNewChatId(false);
      console.log("New chat created with ID:", newChatId);
      
      if (newChatId && initialChatMessage) {
        // Explicitly add the user message to the store first
        addMessage({
          text: initialChatMessage,
          isUser: true
        });
        
        // Set loading state
        setLoading(true);
        
        try {
          // Send message directly to API and get message_id
          console.log("Sending initial message to chat:", initialChatMessage);
          const messageId = await chatService.sendChatMessage(
            newChatId,
            mId, 
            mId,
            initialChatMessage
          );
          
          console.log("Message initiated, got message_id:", messageId);
          
          // Start polling for updates
          setProcessingMessageId(messageId);
          
        } catch (error) {
          console.error("Error sending initial message:", error);
          setLoading(false);
          
          // Show error message
          addMessage({
            text: "Sorry, there was an error sending your message. Please try again.",
            isUser: false,
            code: null,
            graph: null
          });
        }
      } else if (!newChatId) {
        console.error("Failed to create new chat - no chat ID returned");
      }
      
      // Close the dialog and reset the initial message
      setIsDialogOpen(false);
      setInitialChatMessage('');
    } catch (error) {
      console.error("Error in handleCreateNewChat:", error);
      // Dialog will remain open so user can try again
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    console.log("Submitting message:", currentMessage);
    console.log("Current mode:", mode);
    
    const messageToSend = currentMessage;
    setCurrentMessage("");

    // Handle document chat mode
    if (mode === 'document') {
      // Send document chat message
      await handleDocumentMessage(messageToSend);
      return;
    }

    // Handle regular chat and web search modes
    const mId = selectedMerchantId || 'default-merchant';
    console.log("Using merchant ID:", mId);

    setLoading(true);

    try {
      // Check if the artifact panel is collapsed
      const isArtifactCollapsed = useArtifactStore.getState().isCollapsed;
      
      // If the artifact is collapsed or there's no active chat, start a new chat first
      if (isArtifactCollapsed || !activeChatId) {
        console.log("Creating new chat before sending message");
        // Create a new chat with has_visualization=false
        const newChatId = await getNewChatId(false);
        console.log("New chat created with ID:", newChatId);
        
        if (newChatId) {
          // Explicitly add the user message to the store first
          addMessage({
            text: messageToSend,
            isUser: true
          });
          
          try {
            // Send message directly to API and get message_id
            console.log("Sending message to new chat:", messageToSend);
            const messageId = await chatService.sendChatMessage(
              newChatId,
              mId, 
              mId,
              messageToSend
            );
            
            console.log("Message initiated, got message_id:", messageId);
            
            // Start polling for updates
            setProcessingMessageId(messageId);
            
          } catch (error) {
            console.error("Error sending message to new chat:", error);
            setLoading(false);
            
            // Show error message
            addMessage({
              text: "Sorry, there was an error sending your message. Please try again.",
              isUser: false,
              code: null,
              graph: null
            });
          }
        } else {
          console.error("Failed to create new chat");
          setLoading(false);
        }
      } else {
        // Artifact is already open and there's an active chat
        console.log("Sending message to existing chat:", activeChatId);
        
        // Explicitly add the user message to the store first
        addMessage({
          text: messageToSend,
          isUser: true
        });
        
        try {
          // Send message directly to API and get message_id
          console.log("Sending message to existing chat:", messageToSend);
          const messageId = await chatService.sendChatMessage(
            activeChatId,
            mId, 
            mId,
            messageToSend
          );
          
          console.log("Message initiated, got message_id:", messageId);
          
          // Start polling for updates
          setProcessingMessageId(messageId);
          
        } catch (error) {
          console.error("Error sending message to existing chat:", error);
          setLoading(false);
          
          // Show error message
          addMessage({
            text: "Sorry, there was an error sending your message. Please try again.",
            isUser: false,
            code: null,
            graph: null
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("messages in investigationgpt", messages);
    console.log("activeChatId in investigationgpt", activeChatId);
  }, [messages, activeChatId]);

  return (
    <div className="flex-shrink-0 bg-white rounded-lg p-2 h-12">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 flex items-center gap-2">
          <Button
            onClick={handleNewChat}
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0"
            disabled={isLoading}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="sr-only">New chat</span>
          </Button>
          <div className="flex-1">
            <InvestigationGPTSuggestions 
              onPromptClick={(prompt) => setCurrentMessage(prompt)}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center gap-2">
            <InvestigationGPTInput 
              message={currentMessage}
              setMessage={setCurrentMessage}
              mode={mode}
              setMode={setMode}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSubmit}
              type="button"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-3.5 w-3.5 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Processing status indicator */}
      {/* {processingStatus && processingMessageId && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>
              {processingStatus === 'Processing' 
                ? 'Processing your request...' 
                : `Processing: ${processingStatus.replace(/_/g, ' ')}`}
            </span>
          </div>
        </div>
      )} */}

      <CreateChatDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreateChat={handleCreateNewChat}
        initialMessage={initialChatMessage}
        onInitialMessageChange={(value) => setInitialChatMessage(value)}
        disabled={isLoading}
      />
    </div>
  )
}
