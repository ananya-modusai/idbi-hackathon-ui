import { create } from 'zustand';

interface LocalMessage {
  text: string;
  isUser: boolean;
  timestamp: number;
  code?: {
    language: string;
    content: string;
  } | null;
  graph?: {
    type: string;
    data: any;
  } | null;
  results?: any[];
}

interface LocalMessageStore {
  messages: LocalMessage[];
  addMessage: (message: Omit<LocalMessage, 'timestamp'>) => void;
  clearMessages: () => void;
  getMessages: () => LocalMessage[];
}

export const useLocalMessageStore = create<LocalMessageStore>((set, get) => ({
  messages: [],
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      ...message,
      timestamp: Date.now()
    }]
  })),
  
  clearMessages: () => set({ messages: [] }),
  
  getMessages: () => get().messages
})); 