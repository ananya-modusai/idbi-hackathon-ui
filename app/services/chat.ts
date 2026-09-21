import { ChatHistoryItem, ChatDetailedMessage } from '../types';
import { API } from './axios';
import { useMerchantIdStore } from '../store/merchant/merchantIdStore';

export const chatService = {
    getActiveChatIds: async (): Promise<{chat_id: string, has_visualization: boolean, has_report: boolean, created_at: string, chat_title: string, merchant_id: string, user_id: string, visualization_id: string | null}[]> => {
        // Get merchant ID from the store
        const merchantState = useMerchantIdStore.getState();
        const merchantId = merchantState.selectedMerchantId;
        
        if (!merchantId) {
            console.error('No merchant ID available for fetching active chats');
            return [];
        }
        
        // Use the new API endpoint
        try {
            const response = await API.get(`/api/v1/chat2/${merchantId}/get-active-chats`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching active chats:', error);
            return [];
        }
    }, 

    getNewChatId: async (): Promise<string> => {
        const response = await API.get(`/api/v1/chat/new-chat`);
        return response.data.chat_id;
    },

    createNewChat: async (userId: string, merchantId: string, hasVisualization: boolean = false, visualizationId: string | null = null): Promise<string> => {
        console.log('Creating new chat with:', { merchantId, hasVisualization, visualizationId });
        const requestBody = {
            merchant_id: merchantId,
            has_visualization: hasVisualization,
            visualization_id: visualizationId
        };
        
        try {
            const response = await API.post(`/api/v1/chat2/new-chat`, requestBody);
            console.log('New chat created with API response:', response);
            
            // Extract the chat ID from the response
            if (response.data && response.data.data && response.data.data.chat_id) {
                // Format: { success: true, message: "New chat created", data: { chat_id: "uuid" } }
                console.log('Extracted chat ID from data.data.chat_id:', response.data.data.chat_id);
                return response.data.data.chat_id;
            } else if (response.data && typeof response.data === 'string') {
                // If the response is directly the chat ID as a string
                console.log('Extracted chat ID from string response:', response.data);
                return response.data;
            } else if (response.data && response.data.chat_id) {
                // Format: { chat_id: "uuid" }
                console.log('Extracted chat ID from data.chat_id:', response.data.chat_id);
                return response.data.chat_id;
            } else {
                console.error('Unexpected response format:', response.data);
                throw new Error('Unexpected response format from API');
            }
        } catch (error) {
            console.error('Error creating new chat:', error);
            throw error;
        }
    },

    sendChatMessage: async (chatId: string, userId: string, merchantId: string, message: string): Promise<string> => {
        try {
            if (!chatId) {
                throw new Error('Chat ID is required');
            }
            
            console.log('Sending message to chat with ID:', chatId);
            console.log('Message details:', { message });
            
            // Make the API call with simplified parameters
            console.log('Making initiate-chat API call with parameters:', {
                chat_id: chatId,
                message
            });
            
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}api/v1/chat2/initiate-chat`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth') || '{}').accessToken : ''}`
                    },
                    body: JSON.stringify({ 
                        chat_id: chatId,
                        message: message
                    })
                }
            );

            // Handle HTTP errors
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}, body:`, errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Parse the response data
            const responseData = await response.json();
            console.log('Chat initiation response:', responseData);

            // Verify we have the expected data
            if (!responseData.data || !responseData.data.message_id) {
                console.error('Invalid response structure:', responseData);
                throw new Error('Invalid response from API: No message_id found');
            }
            
            // Return the message_id for polling
            const responseMessageId = responseData.data.message_id;
            console.log('Successfully got message_id from API:', responseMessageId);
            return responseMessageId;
        } catch (error) {
            console.error('Error sending chat message:', error);
            throw error;
        }
    },

    getStepUpdates: async (messageId: string): Promise<any> => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}api/v1/chat2/${messageId}/getStepUdates`,
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
            return data;
        } catch (error) {
            console.error('Error getting step updates:', error);
            throw error;
        }
    },

    getNewVisualizationChatId: async (): Promise<string> => {
        const response = await API.get(`/api/v1/chat/new-visualization-chat`);
        return response.data.chat_id;
    },

    getActiveChatHistory: async (chatId: string): Promise<ChatHistoryItem[]> => {
        try {
            console.log(`Fetching chat history for chat ID: ${chatId}`);
            const response = await API.get(`/api/v1/chat2/${chatId}/chat-history`);
            
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                // Transform the new API format to match the old one's expected structure
                return response.data.data.map((msg: any) => ({
                    created_at: msg.created_at,
                    message: msg.message?.message || msg.message,
                    writer: msg.sender === 'user' ? 'user' : 'assistant'
                }));
            }
            return [];
        } catch (error) {
            console.error("Error fetching chat history:", error);
            return [];
        }
    },

    getChatVisualizationStatus: async (chatId: string): Promise<boolean> => {
        const response = await API.get(`/api/v1/chat/chat/${chatId}/has-visualization`);
        return response.data.has_visualization;
    },

    getChatDetailedHistory: async (chatId: string): Promise<ChatDetailedMessage[]> => {
        try {
            console.log(`Fetching chat history for chat ID: ${chatId}`);
            const response = await API.get(`/api/v1/chat2/${chatId}/chat-history`);
            console.log('Chat history API response:', response.data);
            
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                // Log each message as we process it
                response.data.data.forEach((msg: any, index: number) => {
                    console.log(`Message ${index}:`, msg);
                    console.log(`Message ${index} content:`, msg.message);
                });
                
                // Simply return the data - it's already in the right format
                return response.data.data;
            } else if (response.data && response.data.data) {
                // If data exists but is not an array, wrap it
                console.warn('Chat history response data is not an array:', response.data.data);
                return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            }
            console.error('Unexpected response format:', response.data);
            return [];
        } catch (error) {
            console.error('Error fetching detailed chat history:', error);
            throw error;
        }
    },

    deleteChat: async (chatId: string): Promise<boolean> => {
        try {
            const response = await API.get(`/api/v1/chat2/${chatId}/delete-chat`);
            return response.data.success;
        } catch (error) {
            console.error('Error deleting chat:', error);
            throw error;
        }
    },
};