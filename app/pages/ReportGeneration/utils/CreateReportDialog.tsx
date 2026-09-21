import { FC } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText } from 'lucide-react';

interface CreateReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateReport: () => void;
  reportTitle: string;
  onReportTitleChange: (value: string) => void;
}

export const CreateReportDialog: FC<CreateReportDialogProps> = ({
  isOpen,
  onClose,
  onCreateReport,
  reportTitle,
  onReportTitleChange
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="flex flex-col items-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <FileText className="h-12 w-12 text-blue-500" />
            </motion.div>
            <DialogTitle className="text-xl">Create New Report</DialogTitle>
          </DialogHeader>
          
          <div className="mt-6 space-y-4">
            <Input
              value={reportTitle}
              onChange={(e) => onReportTitleChange(e.target.value)}
              placeholder="Report Title"
              className="w-full"
            />
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={onCreateReport}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!reportTitle.trim()}
              >
                Create Report
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}; 