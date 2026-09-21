import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatBubble } from "@/app/components/custom/ChatBubble"
import React, { useRef, useEffect } from "react"
import { FileText } from 'lucide-react'
import { SafeMarkdown } from '@/app/components/SafeMarkdown'
import { useDocChatStore } from '@/app/store/docChat/docChatStore'

interface DocChatArtifactProps {
  chatId: string;
}

export function DocChatArtifact({ chatId }: DocChatArtifactProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading } = useDocChatStore();

  // Always scroll to bottom when messages change or loading state changes
  useEffect(() => {
    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages, isLoading]);



  return (
    <div className="h-[calc(100vh-200px)] w-full flex flex-col relative">
      <ScrollArea
        ref={scrollAreaRef}
        className="h-full w-full"
      >
        {messages.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <FileText className="h-12 w-12 text-gray-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-lg font-medium text-gray-500">Chat with Document</p>
                <p className="text-sm text-gray-400">Ask questions about the document content</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-6 w-full">
            {messages.map((message, index: number) => (
              <ChatBubble
                key={index}
                isUser={message.isUser}
              >
                {message.isUser ? (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                ) : (
                  <SafeMarkdown className="prose prose-invert max-w-none">
                    {message.text}
                  </SafeMarkdown>
                )}
              </ChatBubble>
            ))}
            {isLoading && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
                <div className="flex items-center gap-2 bg-white rounded p-3 border border-gray-200">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-800">Processing, thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
} 