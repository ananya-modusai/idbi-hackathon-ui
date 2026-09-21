import { create } from 'zustand'

interface DocMessage {
  text: string;
  isUser: boolean;
}

interface DocChatState {
  messages: DocMessage[];
  isLoading: boolean;
  addMessage: (message: DocMessage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  sendMessage: (query: string) => Promise<void>;
}

export const useDocChatStore = create<DocChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  clearMessages: () => set({ messages: [] }),
  
  sendMessage: async (query: string) => {
    if (!query.trim()) return;

    const { addMessage, setLoading } = get();
    
    // Add user message
    addMessage({ text: query, isUser: true });
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/v1/ipo/documents/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth') || '{}').accessToken : ''}`
        },
        body: JSON.stringify({
          query: query,
          doc_id: "f66b1351-ba44-41b5-baa6-d71ccf4d0b6c"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        addMessage({ 
          text: data.data, 
          isUser: false 
        });
      } else {
        throw new Error('Invalid response from document chat API');
      }
    } catch (error) {
      console.error('Error in document chat:', error);
      addMessage({ 
        text: "Sorry, there was an error processing your document query. Please try again.", 
        isUser: false 
      });
    } finally {
      setLoading(false);
    }
  }
})); 