import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface SuccessNotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export const SuccessNotification: FC<SuccessNotificationProps> = ({
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
          className="fixed bottom-24 right-4 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 z-50"
          onClick={onClose}
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <CheckCircle className="h-6 w-6 text-green-500" />
            </motion.div>
            <p className="text-green-800 font-medium">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 