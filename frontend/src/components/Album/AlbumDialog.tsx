import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { EditAlbumDialogProps } from '@/types/Album';
import { queryClient, usePictoMutation } from '@/hooks/useQueryExtensio';
import { editAlbumDescription } from '../../../api/api-functions/albums';

const EditAlbumDialog: React.FC<EditAlbumDialogProps> = ({
  album,
  onClose,
  onSuccess,
  onError,
}) => {
  const { mutate: editDescription, isPending: isEditing } = usePictoMutation({
    mutationFn: editAlbumDescription, // Function to call for editing
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['view-album', album?.album_name], // Invalidate to refetch updated album
      });
    },
    autoInvalidateTags: ['all-albums'], // Also invalidates the tag for all albums
  });

  const [description, setDescription] = useState(album?.description || ''); // Local state for text

  useEffect(() => {
    setDescription(album?.description || ''); // Reset if album changes
  }, [album]);

  const handleEditAlbum = async () => {
    if (album) {
      try {
        await editDescription({ album_name: album?.album_name, description }); // Submit mutation
        onSuccess(); // Callback on success
      } catch (err) {
        onError('Error Editing Album', err); // Callback on error
      }
    }
  };

  return (
    <Dialog open={!!album} onOpenChange={onClose}>
      {' '}
      {/* Dialog opens if album is passed */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Album: {album?.album_name}</DialogTitle>{' '}
          {/* Dialog title */}
        </DialogHeader>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)} // Update description as user types
          placeholder="Album description"
          className="my-4"
        />
        <DialogFooter>
          <Button onClick={handleEditAlbum} disabled={isEditing}>
            {' '}
            {/* Save button */}
            {isEditing ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={onClose} variant="outline">
            {' '}
            {/* Cancel button */}
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAlbumDialog;
