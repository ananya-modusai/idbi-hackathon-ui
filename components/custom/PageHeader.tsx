import { FC, useCallback } from 'react';
import { Copy, Bot, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { MerchantItemType } from '@/app/types';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/app/store/chat/chatStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type IdentifierType = 'MID' | 'CIN' | 'CXID' | 'Case ID';

interface SecondaryIdOption {
  value: string;
  label: string;
}

interface PageHeaderProps {
  name: string;
  id: string;
  identifierType: IdentifierType;
  secondaryId?: {
    options: SecondaryIdOption[];
    value: string;
    onChange: (value: string) => void;
    label: string;
  };
  actionButton?: React.ReactNode;
}

// We don't need a separate error component anymore as we're using the built-in flow
export const PageHeader: FC<PageHeaderProps> = ({ name, id, identifierType, secondaryId, actionButton }) => {
  const copyId = () => {
    navigator.clipboard.writeText(id);
  };

  const { getNewChatId, sendMessage, addMessage, setLoading } = useChatStore();

  // Use useCallback to ensure this doesn't cause re-renders
  const handleCreateAIReport = useCallback(async () => {
    try {
      setLoading(true);
      
      // Creating a new chat - exactly like in InvestigationGPT.tsx
      const newChatId = await getNewChatId(false);
      
      if (!newChatId) {
        console.error("Failed to create new chat");
        setLoading(false);
        return;
      }
      
      // Prepare the initial message
      const initialMessage = "Create a Report with Company details";
      
      // Add user message to the store - This will trigger the useEffect in InvestigationGPT
      // which creates the tab automatically
      addMessage({
        text: initialMessage,
        isUser: true
      });
      
      // Send the message after a delay, just like in handleCreateNewChat
      setTimeout(async () => {
        try {
          console.log("Sending initial message to chat:", initialMessage);
          await sendMessage(initialMessage);
          console.log("Initial message sent successfully");
          setLoading(false);
        } catch (error) {
          console.error("Error sending initial message:", error);
          setLoading(false);
        }
      }, 200);
      
    } catch (error) {
      console.error("Error creating AI report:", error);
      setLoading(false);
    }
  }, [addMessage, getNewChatId, sendMessage, setLoading]);

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-blue-600 leading-none">{name}</h2>
          <div className="flex items-center gap-1 text-sm text-gray-500 leading-none">
            <span>[{identifierType} {id}]</span>
            <button 
              onClick={copyId}
              className="text-blue-500 hover:text-blue-700 flex items-center justify-center h-4"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {secondaryId && (
            <div className="flex items-center gap-2">
              {secondaryId.label && (
                <span className="text-sm text-gray-500">{secondaryId.label}:</span>
              )}
              <Select
                value={secondaryId.value}
                onValueChange={secondaryId.onChange}
              >
                <SelectTrigger className="w-[180px] h-8 text-sm">
                  <SelectValue placeholder={`Select ${secondaryId.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {secondaryId.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {actionButton}
        </div>
      </div>
    </motion.div>
  );
};