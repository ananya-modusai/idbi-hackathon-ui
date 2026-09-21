import { FC } from 'react';
import { Code2, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ChatBubbleProps {
  isUser: boolean;
  children: React.ReactNode;
  code?: {
    language: string;
    content: string;
  } | null;
  graph?: {
    type: string;
    data: any;
  } | null;
  onViewCode?: () => void;
  onViewGraph?: () => void;
}

export const ChatBubble: FC<ChatBubbleProps> = ({ 
  isUser, 
  children, 
  code,
  graph,
  onViewCode,
  onViewGraph 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center mt-1 justify-center text-white font-medium ${
        isUser ? 'bg-orange-500' : 'bg-gray-600'
      }`}>
        {isUser ? 'U' : 'M'}
      </div>

      <div className={`relative max-w-full w-auto rounded-2xl px-4 py-2.5 ${
        isUser
          ? 'bg-blue-600 text-white rounded-br-none'
          : 'bg-gray-100 text-gray-900 rounded-bl-none'
      }`}>
        <div className="text-sm">{children}</div>
        
        {!isUser && (code || graph) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
            {code && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-xs gap-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                onClick={onViewCode}
              >
                <Code2 className="h-3.5 w-3.5" />
                View Code
              </Button>
            )}
            {graph && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-xs gap-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                onClick={onViewGraph}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                View Graph
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}; 