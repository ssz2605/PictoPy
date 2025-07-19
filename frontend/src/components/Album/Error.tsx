import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorDialogProps } from '@/types/Album';

// Error dialog component to show error messages in a modal
const ErrorDialog: React.FC<ErrorDialogProps> = ({ content, onClose }) => {
  return (
    // Show dialog only if content exists
    <Dialog open={!!content} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          {/* Title of the error */}
          <DialogTitle>{content?.title}</DialogTitle>
          {/* Description shown in red */}
          <DialogDescription className="text-red-600">
            {content?.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {/* Close button */}
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorDialog;
