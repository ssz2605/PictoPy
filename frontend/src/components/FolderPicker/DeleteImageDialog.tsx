import { FC } from 'react';
import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Props for delete confirmation dialog
interface DeleteImagesDialogProps {
  isOpen: boolean; // Dialog open state
  setIsOpen: (e: boolean) => void; // Function to close the dialog
  executeDeleteImages: (e: boolean) => void; // Callback for delete action
}

const DeleteImagesDialog: FC<DeleteImagesDialogProps> = ({
  isOpen,
  setIsOpen,
  executeDeleteImages,
}) => {
  // Handles user's choice and closes the dialog
  const handleDeleteImages = (status: boolean) => {
    executeDeleteImages(status);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Do you also want to delete these images from Device ?
          </DialogTitle>
        </DialogHeader>

        <DialogFooter>
          <Button onClick={() => handleDeleteImages(true)}>
            {/* Confirm delete */}
            Yes
          </Button>
          <Button variant="outline" onClick={() => handleDeleteImages(false)}>
            {/* Cancel delete */}
            No
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteImagesDialog;
