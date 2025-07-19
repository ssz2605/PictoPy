import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import ImageSelectionPage from './ImageSelection';
import { usePictoMutation, usePictoQuery } from '@/hooks/useQueryExtensio';
import { removeFromAlbum, viewYourAlbum } from 'api/api-functions/albums';

// Props expected by this dialog
interface ImageManagementDialogProps {
  albumName: string | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (title: string, error: unknown) => void;
}

// Main component to manage images in an album
const ImageManagementDialog: React.FC<ImageManagementDialogProps> = ({
  albumName,
  onClose,
  onSuccess,
  onError,
}) => {
  // Fetch album details
  const {
    successData: viewedAlbum,
    isLoading: isViewingAlbum,
    errorMessage: viewError,
  } = usePictoQuery({
    queryFn: async () => await viewYourAlbum({ album_name: albumName || '' }),
    queryKey: ['view-album', albumName],
  });

  // Mutation for removing images
  const { mutate: removeImage, isPending: isRemovingImage } = usePictoMutation({
    mutationFn: removeFromAlbum,
    autoInvalidateTags: ['view-album', albumName || ''],
  });

  const [showImageSelection, setShowImageSelection] = useState(false);

  // Handle removal of an image
  const handleRemoveImage = async (imageUrl: string) => {
    if (albumName) {
      try {
        await removeImage({ album_name: albumName, path: imageUrl });
        onSuccess();
      } catch (err) {
        onError('Error Removing Image', err);
      }
    }
  };

  // Extract file name from path
  const getImageName = (path: string) => {
    return path.split('\\').pop() || path.split('/').pop() || path;
  };

  // Handle error while viewing album
  if (viewError && viewError !== 'Something went wrong') {
    return <div>Error loading album: {viewError}</div>;
  }

  // Show loading state
  if (isViewingAlbum) {
    return <div>Loading...</div>;
  }

  // Show image selection UI if triggered
  if (showImageSelection) {
    return (
      <ImageSelectionPage
        albumName={albumName || ''}
        onClose={() => setShowImageSelection(false)}
        onSuccess={() => {
          setShowImageSelection(false);
          onSuccess();
        }}
        onError={onError}
      />
    );
  }

  // Main dialog content
  return (
    <Dialog open={!!albumName} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Images: {albumName}</DialogTitle>
        </DialogHeader>

        {/* Button to add new images */}
        <div className="my-4">
          <Button onClick={() => setShowImageSelection(true)}>
            Add Images to Album
          </Button>
        </div>

        {/* Grid of existing images */}
        <div className="grid grid-cols-3 gap-4">
          {viewedAlbum?.image_paths?.map((image: string, index: number) => {
            const srcc = convertFileSrc(image);
            return (
              <div key={index} className="relative">
                <img
                  src={srcc}
                  alt={`Album image ${getImageName(image)}`}
                  className="h-32 w-full rounded-lg object-cover"
                />
                {/* Remove image button */}
                <Button
                  onClick={() => handleRemoveImage(image)}
                  disabled={isRemovingImage}
                  className="absolute top-0 right-0 rounded-full bg-red-500 p-1 text-white"
                >
                  X
                </Button>
                {/* Image name overlay */}
                <div className="bg-opacity-50 absolute right-0 bottom-0 left-0 truncate rounded-b-lg bg-black p-1 text-xs text-white">
                  {getImageName(image)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close dialog */}
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageManagementDialog;
