export interface EmailThread {
  threadId: string;
  subject: string;
  sender: string;
  receiver: string;
  timestamp: string;
  content: string;
  messageId?: string;
}

export interface EmailMessage {
  messageId: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  references?: string[];
  inReplyTo?: string;
}

export interface EmailCredentials {
  email: string;
  password: string;
} 