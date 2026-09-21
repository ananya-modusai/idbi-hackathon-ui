import { create } from 'zustand';
import { emailServices, EmailResponse, EmailDocument, EmailDocumentsResponse } from '@/app/services/emailServices';

// New interfaces for the email thread structure
export interface EmailMessage {
    id: string;
    parent_message_id: string | null;
    receiver: string;
    content: string;
    created_at: string;
    message_id: string;
    sender: string;
    thread_id: string;
    subject: string;
    timestamp: string;
    attachments: string[] | null;
}

export interface EmailThread {
    thread_id: string;
    emails: EmailMessage[];
}

export interface EmailThreadsResponse {
    threads: EmailThread[];
}

interface LoadingStates {
  sendingEmail: boolean;
  sendingEmailWithAttachment: boolean;
  replying: boolean;
  replyingWithAttachment: boolean;
  fetchingEmails: boolean;
  fetchingAttachment: boolean;
  fetchingEmailAttachments: boolean;
  gettingEmailSummary: boolean;
  gettingDocumentSummary: boolean;
  queryingEmail: boolean;
  queryingDocument: boolean;
  gettingSuggestedPrompts: boolean;
  gettingDocumentPrompts: boolean;
}

export interface EmailSummary {
    email_summary: string;
    document_insights: string;
    key_topics: string[];
    communication_pattern: string;
    total_emails: number;
    total_documents: number;
    last_communication: string;
  }

// Add these interfaces
interface DocumentSummary {
  summary: string;
  key_points: string[];
  document_type: string;
  metadata: Record<string, string>;
}

export interface EmailStore {
    // State
    threads: EmailThread[];
    emailSummaries: Record<string, EmailSummary>;
    documents: EmailDocument[];
    loadingStates: LoadingStates;
    error: string | null;
    
    // Email Actions
    sendEmail: (senderEmail: string, receiverEmail: string, subject: string, message: string) => Promise<void>;
    sendEmailWithAttachment: (senderEmail: string, receiverEmail: string, subject: string, message: string, attachment: File) => Promise<void>;
    replyToEmail: (emailId: string, subject: string, message: string) => Promise<void>;
    replyToEmailWithAttachment: (emailId: string, subject: string, message: string, attachment: File) => Promise<void>;
    
    // Fetch Actions
    fetchEmails: (merchantEmail: string) => Promise<void>;
    fetchAttachment: (filename: string) => Promise<any>;
    fetchEmailAttachments: (merchantEmail: string) => Promise<void>;
    fetchEmailDocuments: (emailId: string) => Promise<any>;
    
    // AI/RAG Actions
    getEmailSummary: (email: string, threadId: string) => Promise<any>;
    getDocumentSummary: (documentId: string) => Promise<any>;
    queryEmail: (email: string, prompt: string, threadId: string) => Promise<any>;
    queryDocument: (documentId: string, prompt: string) => Promise<any>;
    getSuggestedPrompts: (email: string, threadId: string) => Promise<any>;
    getDocumentPrompts: (documentId: string) => Promise<any>;
    
    // Summary Actions
    setEmailSummary: (threadId: string, summary: any) => void;
    getThreadSummary: (threadId: string) => EmailSummary | null;
    
    // Add new storage properties
    documentSummaries: Record<string, DocumentSummary>;
    emailPrompts: Record<string, string[]>;
    documentPrompts: Record<string, string[]>;
    
    // Add new actions
  setDocumentSummary: (documentId: string, summary: DocumentSummary) => void;
  getStoredDocumentSummary: (documentId: string) => DocumentSummary | null;
  
  setEmailPrompts: (threadId: string, prompts: string[]) => void;
  getStoredEmailPrompts: (threadId: string) => string[] | null;
  
  setDocumentPrompts: (documentId: string, prompts: string[]) => void;
  getStoredDocumentPrompts: (documentId: string) => string[] | null;
}

export const useEmailStore = create<EmailStore>((set, get) => ({
    // Initial State
    threads: [],
    documents: [],
    loadingStates: {
        sendingEmail: false,
        sendingEmailWithAttachment: false,
        replying: false,
        replyingWithAttachment: false,
        fetchingEmails: false,
        fetchingAttachment: false,
        fetchingEmailAttachments: false,
        gettingEmailSummary: false,
        gettingDocumentSummary: false,
        queryingEmail: false,
        queryingDocument: false,
        gettingSuggestedPrompts: false,
        gettingDocumentPrompts: false,
    },
    emailSummaries: {},
    error: null,
    documentSummaries: {},
  emailPrompts: {},
  documentPrompts: {},

    // Email Actions
    sendEmail: async (senderEmail: string, receiverEmail: string, subject: string, message: string) => {
        set(state => ({ loadingStates: { ...state.loadingStates, sendingEmail: true }, error: null }));
        try {
            const response = await emailServices.sendEmailWithoutAttachment(receiverEmail, subject, message);
            const newEmail: EmailMessage = {
                id: response.data.email_id,
                parent_message_id: null,
                receiver: receiverEmail,
                content: message,
                created_at: new Date().toISOString(),
                message_id: response.data.message_id,
                sender: senderEmail, // This should be the logged-in user's email
                thread_id: response.data.thread_id,
                subject: subject,
                timestamp: new Date().toISOString(),
                attachments: []
            };
            
            set((state) => ({
                threads: [
                    ...state.threads,
                    { thread_id: response.data.thread_id, emails: [newEmail] }
                ]
            }));
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to send email' });
        } finally {
            set(state => ({ loadingStates: { ...state.loadingStates, sendingEmail: false } }));
        }
    },

    sendEmailWithAttachment: async (senderEmail: string, receiverEmail: string, subject: string, message: string, attachment: File) => {
        set(state => ({ loadingStates: { ...state.loadingStates, sendingEmailWithAttachment: true }, error: null }));
        try {
            const response = await emailServices.sendEmailWithAttachment(receiverEmail, subject, message, attachment);
            const newEmail: EmailMessage = {
                id: response.data.email_id,
                parent_message_id: null,
                receiver: receiverEmail,
                content: message,
                created_at: new Date().toISOString(),
                message_id: response.data.message_id,
                sender: senderEmail, // This should be the logged-in user's email
                thread_id: response.data.thread_id,
                subject: subject,
                timestamp: new Date().toISOString(),
                attachments: [attachment.name] // Store the attachment filename
            };
            
            set((state) => ({
                threads: [
                    ...state.threads,
                    { thread_id: response.data.thread_id, emails: [newEmail] }
                ]
            }));
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to send email with attachment' });
        } finally {
            set(state => ({ loadingStates: { ...state.loadingStates, sendingEmailWithAttachment: false } }));
        }
    },

    replyToEmail: async (emailId: string, subject: string, message: string) => {
        set(state => ({ loadingStates: { ...state.loadingStates, replying: true }, error: null }));
        try {
            const response = await emailServices.replyEmailWithoutAttachment(emailId, subject, message);
            const newEmail: EmailMessage = {
                id: response.data.email_id,
                parent_message_id: emailId,
                receiver: '', // This should be set based on the original email
                content: message,
                created_at: new Date().toISOString(),
                message_id: response.data.message_id,
                sender: '', // This should be the logged-in user's email
                thread_id: response.data.thread_id,
                subject: subject,
                timestamp: new Date().toISOString(),
                attachments: []
            };
            
            set((state) => ({
                threads: state.threads.map(thread => 
                    thread.thread_id === response.data.thread_id
                        ? { ...thread, emails: [...thread.emails, newEmail] }
                        : thread
                )
            }));
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to reply to email' });
        } finally {
            set(state => ({ loadingStates: { ...state.loadingStates, replying: false } }));
        }
    },

    replyToEmailWithAttachment: async (emailId: string, subject: string, message: string, attachment: File) => {
        set(state => ({ loadingStates: { ...state.loadingStates, replyingWithAttachment: true }, error: null }));
        try {
            const response = await emailServices.replyEmailWithAttachment(emailId, subject, message, attachment);
            const newEmail: EmailMessage = {
                id: response.data.email_id,
                parent_message_id: emailId,
                receiver: '', // This should be set based on the original email
                content: message,
                created_at: new Date().toISOString(),
                message_id: response.data.message_id,
                sender: '', // This should be the logged-in user's email
                thread_id: response.data.thread_id,
                subject: subject,
                timestamp: new Date().toISOString(),
                attachments: [attachment.name]
            };
            
            set((state) => ({
                threads: state.threads.map(thread => 
                    thread.thread_id === response.data.thread_id
                        ? { ...thread, emails: [...thread.emails, newEmail] }
                        : thread
                )
            }));
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to reply with attachment' });
        } finally {
            set(state => ({ loadingStates: { ...state.loadingStates, replyingWithAttachment: false } }));
        }
    },

    // Fetch Actions
    fetchEmails: async (merchantEmail: string) => {
        set(state => ({ loadingStates: { ...state.loadingStates, fetchingEmails: true }, error: null }));
        try {
            const response = await emailServices.getEmails(merchantEmail);
            const emailThreads: EmailThreadsResponse = response.data;
            set({ threads: emailThreads.threads });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to fetch emails' });
        } finally {
            set(state => ({ loadingStates: { ...state.loadingStates, fetchingEmails: false } }));
        }
    },

    fetchAttachment: async (filename: string) => {
        set(state => ({ loadingStates: { ...state.loadingStates, fetchingAttachment: true }, error: null }));
        try {
            const response = await emailServices.getAttachment(filename);
            return response.data;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to fetch attachment' });
            throw error;
        } finally {
            set(state => ({ loadingStates: { ...state.loadingStates, fetchingAttachment: false } }));
        }
    },

    fetchEmailAttachments: async (merchantEmail: string) => {
        set(state => ({ loadingStates: { ...state.loadingStates, fetchingEmailAttachments: true }, error: null }));
        try {
            const response = await emailServices.getEmailAttachments(merchantEmail);
            set({ documents: response.data.documents });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to fetch email attachments' });
        } finally {
            set(state => ({ loadingStates: { ...state.loadingStates, fetchingEmailAttachments: false } }));
        }
    },

    fetchEmailDocuments: async (emailId: string) => {
        set(state => ({ loadingStates: { ...state.loadingStates, fetchingEmailDocuments: true }, error: null }));
        console.log("emailId in email store", emailId);
        try {
            const response = await emailServices.getEmailDocuments(emailId);
            console.log("response in email store", response.data);
            set({ documents: response.data.documents });
            // console.log("response in email store", response.data);
            return response.data.documents;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to fetch email documents' });
        } finally {
            set(state => ({ loadingStates: { ...state.loadingStates, fetchingEmailDocuments: false } }));
        }
    },

    // AI/RAG Actions
    getEmailSummary: async (email: string, threadId: string) => {
        set(state => ({ loadingStates: { ...state.loadingStates, gettingEmailSummary: true }, error: null }));
        try {
            const response = await emailServices.getEmailSummary(email);
            const summary = response.data;
            
            // Store the summary in our state
            get().setEmailSummary(threadId, summary);
            
            return summary;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to get email summary' });
        } finally {
            set(state => ({ loadingStates: { ...state.loadingStates, gettingEmailSummary: false } }));
        }
    },

    getDocumentSummary: async (documentId: string) => {
        const state = get();
        const existingSummary = state.getStoredDocumentSummary(documentId);
        if (existingSummary) return existingSummary;
    
        set(state => ({ loadingStates: { ...state.loadingStates, gettingDocumentSummary: true }}));
        try {
          const response = await emailServices.getDocumentSummary(documentId);
          get().setDocumentSummary(documentId, response.data);
          return response.data;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to get document summary' });
        } finally {
          set(state => ({ loadingStates: { ...state.loadingStates, gettingDocumentSummary: false }}));
        }
      },

    queryEmail: async (email: string, prompt: string, threadId: string) => {
        set(state => ({ loadingStates: { ...state.loadingStates, queryingEmail: true }, error: null }));
        try {
            const response = await emailServices.ragQuery(email, prompt, threadId);
            return response.data;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to query email' });
        } finally {
            set(state => ({ loadingStates: { ...state.loadingStates, queryingEmail: false } }));
        }
    },

    queryDocument: async (documentId: string, prompt: string) => {
        set(state => ({ loadingStates: { ...state.loadingStates, queryingDocument: true }, error: null }));
        try {
            const response = await emailServices.queryDocument(documentId, prompt);
            return response.data;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to query document' });
        } finally {
            set(state => ({ loadingStates: { ...state.loadingStates, queryingDocument: false } }));
        }
    },

    getSuggestedPrompts: async (email: string, threadId: string) => {
        const state = get();
        const existingPrompts = state.getStoredEmailPrompts(threadId);
        if (existingPrompts) return { prompts: existingPrompts };
    
        set(state => ({ loadingStates: { ...state.loadingStates, gettingSuggestedPrompts: true }}));
        try {
          const response = await emailServices.promptSuggestions(email, threadId);
          get().setEmailPrompts(threadId, response.data.prompts);
          return response.data;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to get suggested prompts' });
        } finally {
          set(state => ({ loadingStates: { ...state.loadingStates, gettingSuggestedPrompts: false }}));
        }
      },

      getDocumentPrompts: async (documentId: string) => {
        const state = get();
        const existingPrompts = state.getStoredDocumentPrompts(documentId);
        if (existingPrompts) return existingPrompts;
    
        set(state => ({ loadingStates: { ...state.loadingStates, gettingDocumentPrompts: true }}));
        try {
          const response = await emailServices.suggestDocumentPrompts(documentId);
          const prompts = response.data.prompts;
          get().setDocumentPrompts(documentId, prompts);
          return prompts;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to get document prompts' });
        } finally {
          set(state => ({ loadingStates: { ...state.loadingStates, gettingDocumentPrompts: false }}));
        }
      },

    // Summary Actions
    setEmailSummary: (threadId: string, summary: EmailSummary) => 
        set(state => ({
            emailSummaries: {
                ...state.emailSummaries,
                [threadId]: summary
            }
        })
    ),

    getThreadSummary: (threadId: string) => {
        const state = get();
        return state.emailSummaries[threadId] || null;
    },
    // ... existing initial state ...
  

  // Add new actions
  setDocumentSummary: (documentId, summary) => 
    set(state => ({
      documentSummaries: {
        ...state.documentSummaries,
        [documentId]: summary
      }
    })),

  getStoredDocumentSummary: (documentId) => {
    const state = get();
    return state.documentSummaries[documentId] || null;
  },

  setEmailPrompts: (threadId, prompts) => 
    set(state => ({
      emailPrompts: {
        ...state.emailPrompts,
        [threadId]: prompts
      }
    })),

  getStoredEmailPrompts: (threadId) => {
    const state = get();
    return state.emailPrompts[threadId] || null;
  },

  setDocumentPrompts: (documentId, prompts) => 
    set(state => ({
      documentPrompts: {
        ...state.documentPrompts,
        [documentId]: prompts
      }
    })),

  getStoredDocumentPrompts: (documentId) => {
    const state = get();
    return state.documentPrompts[documentId] || null;
  },

}));
