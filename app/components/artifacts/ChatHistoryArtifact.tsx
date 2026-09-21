import { FC, useEffect, useState } from 'react';
import { chatService } from '@/app/services/chat';
import { InvestigationGPTChat } from '@/app/layout/InvestigationGPT/InvestigationGPTChat';

interface ChatHistoryArtifactProps {
  chatId: string;
}

// Define ChatMessage interface based on the API response
interface ChatMessage {
  message_id: string;
  chat_id: string;
  merchant_id: string;
  user_id: string;
  visualization: boolean;
  visualization_id: string | null;
  sender: 'user' | 'assistant';
  message: any; // Can be an object with different structures or a string
  status: string;
  created_at: string;
  updated_at: string;
  meta_data: any;
}

export const ChatHistoryArtifact: FC<ChatHistoryArtifactProps> = ({ chatId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/v1/chat2/${chatId}/chatHistory`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth') || '{}').accessToken : ''}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setMessages(data.data);
        } else {
          throw new Error('Failed to load chat history');
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();
  }, [chatId]);

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading chat history...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <p className="text-sm text-gray-500">{messages.length} messages</p>
      </div>
      
      <div className="flex-1 p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.message_id}
            className={`flex ${
              msg.sender === 'user' 
                ? 'justify-end' 
                : 'justify-start'
            }`}
          >
            <div className={`p-3 rounded-lg max-w-3/4 ${
              msg.sender === 'user' 
                ? 'bg-blue-100' 
                : 'bg-gray-100'
            }`}>
              <div className="text-xs text-gray-500 mb-1">
                {msg.sender === 'user' ? 'You' : 'Assistant'} • {formatDate(msg.created_at)}
              </div>
              
              {/* User message display */}
              {msg.sender === 'user' && typeof msg.message === 'object' && msg.message.message && (
                <div className="whitespace-pre-wrap">{msg.message.message}</div>
              )}

              {/* Assistant message display */}
              {msg.sender === 'assistant' && (
                <div>
                  {/* Regular message */}
                  {msg.message && typeof msg.message === 'object' && msg.message.message && (
                    <div className="whitespace-pre-wrap">{msg.message.message}</div>
                  )}

                  {/* Report type message */}
                  {msg.message && typeof msg.message === 'object' && msg.message.type === 'REPORT_QUERY' && (
                    <div>
                      <div className="whitespace-pre-wrap">{msg.message.message}</div>
                      {msg.message.report && (
                        <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                          <div className="text-sm font-medium">Report Data:</div>
                          
                          {/* Financial metrics */}
                          {msg.message.report.financial && msg.message.report.financial.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-600">Financial Metrics</div>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                {msg.message.report.financial.map((item: any, index: number) => (
                                  <div key={index} className="text-xs flex justify-between">
                                    <span>{item.label}:</span>
                                    <span className="font-medium">{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Red flags */}
                          {msg.message.report.red_flags && Object.keys(msg.message.report.red_flags).length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-600">Red Flags</div>
                              {Object.entries(msg.message.report.red_flags).map(([category, flags]: [string, any]) => (
                                <div key={category} className="mt-1">
                                  <div className="text-xs italic">{category.replace(/_/g, ' ')}</div>
                                  <ul className="list-disc pl-5 text-xs">
                                    {Array.isArray(flags) && flags.map((flag: any) => (
                                      <li key={flag.id} className="mt-1">
                                        <div className="flex items-start">
                                          <span className={`inline-block w-2 h-2 rounded-full mt-1 mr-1 ${
                                            flag.severity === 'severe' ? 'bg-red-600' : 
                                            flag.severity === 'high' ? 'bg-red-500' : 
                                            flag.severity === 'medium' ? 'bg-yellow-500' : 'bg-yellow-400'
                                          }`}></span>
                                          <span>{flag.description}</span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 