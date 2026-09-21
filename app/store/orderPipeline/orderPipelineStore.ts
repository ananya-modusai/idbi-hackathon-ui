import { create } from 'zustand';
import { pipelineHistoryItemsSeed, PipelineHistoryItem } from '@/app/sampleData/orderPipelineSampleData';

export type { PipelineHistoryItem };

export interface QueueItem {
  id: number;
  file: string;
  source: 'manual' | 'auto';
  status: 'queued' | 'processing' | 'processed' | 'paused';
  progress: number;
  step: string;
  addedAt: string;
  paused: boolean;
  authority: string;
  orderType: string;
  orderDate: string;
}

interface OrderPipelineStore {
  items: QueueItem[];
  historyItems: PipelineHistoryItem[];
  addItem: (item: Omit<QueueItem, 'id' | 'status' | 'progress' | 'step' | 'paused' | 'orderType'>) => void;
  updateItem: (id: number, updates: Partial<QueueItem>) => void;
  removeItem: (id: number) => void;
  togglePause: (id: number) => void;
  moveToHistory: (id: number) => void;
}

export const useOrderPipelineStore = create<OrderPipelineStore>((set, get) => ({
  items: [],
  historyItems: pipelineHistoryItemsSeed,

  addItem: (item) => {
    const newItem: QueueItem = {
      ...item,
      id: Date.now(),
      status: 'queued',
      progress: 0,
      step: 'in Queue',
      orderType: 'Freeze Order',
      paused: false,
    };
    set((state) => ({ items: [newItem, ...state.items] }));
  },

  updateItem: (id, updates) => {
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  },

  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  },

  moveToHistory: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const fullDateStr = `${dateStr}, ${timeStr}`;

    const historyItem: PipelineHistoryItem = {
      orderNo: item.file.replace(/\.pdf$/, ''),
      authority: item.authority || 'SEBI',
      orderType: item.orderType || 'Freeze Order',
      captureMethod: item.source,
      issuedOn: item.orderDate || fullDateStr,
      receivedOn: fullDateStr,
      capturedOn: fullDateStr,
    };

    set((state) => ({
      historyItems: [historyItem, ...state.historyItems],
      items: state.items.filter((i) => i.id !== id),
    }));
  },

  togglePause: (id) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item;
        if (item.paused) return { ...item, paused: false, status: 'processing' };
        return { ...item, paused: true, status: 'paused' };
      }),
    }));
  },
}));
