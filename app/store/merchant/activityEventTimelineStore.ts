import { create } from 'zustand'; 
import { EventTimelineType, PaymentChannelsType, CommunicationsType, DocumentsList } from '@/app/types';
import { merchantService } from '@/app/services/merchantServices';

interface ActivityEventTimelineStore {
  eventTimeline: EventTimelineType;
  fetchEventTimeline: (merchantId: string) => Promise<void>;
  paymentChannels: PaymentChannelsType;
  fetchPaymentChannels: (merchantId: string) => Promise<void>;
  communications: CommunicationsType;
  fetchCommunications: (merchantId: string) => Promise<void>;
  documentsUploaded: DocumentsList;
  fetchDocumentsUploaded: (merchantId: string) => Promise<void>;
}

export const useActivityEventTimelineStore = create<ActivityEventTimelineStore>((set) => ({
  eventTimeline: { events: [] },
  fetchEventTimeline: async (merchantId: string) => {
    const timeline = await merchantService.getMerchantEventTimeline(merchantId);
    set({ eventTimeline: timeline });
  },
  paymentChannels: { payment_channels: [] },
  fetchPaymentChannels: async (merchantId: string) => {
    const paymentChannels = await merchantService.getMerchantPaymentChannels(merchantId);
    set({ paymentChannels });
  },
  communications: { communications: [] },
  fetchCommunications: async (merchantId: string) => {
    const communications = await merchantService.getMerchantCommunications(merchantId);
    set({ communications });
  },
  documentsUploaded: { documents_uploaded: [] },
  fetchDocumentsUploaded: async (merchantId: string) => {
    const documentsUploaded = await merchantService.getDocumentsUploaded(merchantId);
    set({ documentsUploaded });
  },
}));
