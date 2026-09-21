import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface ErrorNotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export const ErrorNotification: FC<ErrorNotificationProps> = ({
  message,
  isVisible,
  onClose
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg shadow-lg p-4"
          onClick={onClose}
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <AlertCircle className="h-6 w-6 text-red-500" />
            </motion.div>
            <p className="text-red-800">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 