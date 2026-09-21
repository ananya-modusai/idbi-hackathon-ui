import { API } from './axios';

export interface EmailResponse {
    message: string;
    email_id: string;
    message_id: string;
    thread_id: string;
}

export interface EmailDocument {
    document_id: string;
    filename: string;
    content_type: string;
    size: number;
    download_url: string;
    created_at: string;
}

export interface EmailDocumentsResponse {
    documents: EmailDocument[];
}

export const emailServices = {
    sendEmailWithoutAttachment: async (email: string, subject: string, message: string) => {
        const response = await API.post(`/api/v1/email-communication/send-without-attachments?to_email=${email}&subject=${subject}&content=${message}`)
        return response
    },

    // send email with attachment
    sendEmailWithAttachment: async (email: string, subject: string, message: string, attachment: File) => {
        const formData = new FormData();
        formData.append('attachments', attachment);

        const response = await API.post(
            `/api/v1/email-communication/send-with-attachments?to_email=${email}&subject=${subject}&content=${message}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response;
    },

    // reply to an email without attachment
    replyEmailWithoutAttachment: async (email_id: string, subject: string, message: string) => {
        const response = await API.post(`/api/v1/email-communication/reply-without-attachments/${email_id}?subject=${subject}&content=${message}`)
        return response
    },

    // reply to an email with attachment
    replyEmailWithAttachment: async (email_id: string, subject: string, message: string, attachment: File) => {
        const formData = new FormData();
        formData.append('attachments', attachment);

        const response = await API.post(`/api/v1/email-communication/reply-with-attachments/${email_id}?subject=${subject}&content=${message}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    },

    // get emails for a merchant
    getEmails: async (merchant_email: string) => {
        const response = await API.get(`/api/v1/email-communication/emails/${merchant_email}`)
        return response
    },
    
    // get documents for a particular email
    getEmailDocuments: async (email_id: string) => {
        const response = await API.get(`/api/v1/email-communication/email-documents/${email_id}`)
        return response
    },

    // get attachment for a particular email
    getAttachment: async (filename: string) => {
        const response = await API.get(`/api/v1/email-communication/attachment/${filename}`, {
            responseType: 'blob'
        });
        return response;
    },  

    // rag query for a particular email
    ragQuery: async (email: string, prompt: string, thread_id: string) => {
        const response = await API.post(`/api/v1/email-communication/rag-query`, { email, prompt, thread_id })
        return response
    },

    // suggest prompts for a particular email
    promptSuggestions: async (email: string, thread_id: string) => {
        const response = await API.post(`/api/v1/email-communication/suggest-prompts`, { email, thread_id })
        return response
    },

    // get summary for a particular email
    getEmailSummary: async (email: string) => {
        const encodedEmail = encodeURIComponent(email);
        const response = await API.get(`/api/v1/email-communication/email-summary/${encodedEmail}`);
        return response;
    },

    // get attachments for a merchant
    getEmailAttachments: async (merchant_email: string) => {
        const response = await API.post(`/api/v1/email-communication/email-attachments/${merchant_email}`)
        return response
    },

    // get summary for a particular document
    getDocumentSummary: async (document_id: string) => {
        const response = await API.post(`/api/v1/email-communication/document-summary`, { document_id })
        return response
    },

    // rag query for a particular document
    queryDocument: async (document_id: string, prompt: string) => {
        const response = await API.post(`/api/v1/email-communication/document-query`, { document_id, prompt })
        return response
    },

    // suggest prompts for a particular document
    suggestDocumentPrompts: async (document_id: string) => {
        const response = await API.post(`/api/v1/email-communication/suggest-document-prompts`, { document_id })
        return response
    }
}