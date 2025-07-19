import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { CreateAlbumFormProps } from '@/types/Album';
import { usePictoMutation } from '@/hooks/useQueryExtensio';
import { createAlbums } from '../../../api/api-functions/albums';

const CreateAlbumForm: React.FC<CreateAlbumFormProps> = ({
  isOpen,
  closeForm,
  onError,
}) => {
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [isHidden, setIsHidden] = useState(false); // Controls visibility toggle
  const [password, setPassword] = useState(''); // Password for hidden album

  const { mutate: createAlbum, isPending: isCreating } = usePictoMutation({
    mutationFn: createAlbums,
    onSuccess: (response) => {
      if (response.success) {
        // Clear form and close if successful
        setNewAlbumName('');
        setNewAlbumDescription('');
        closeForm();
      } else {
        onError('Error Creating Album', new Error(response.error)); // Show error if failed
      }
    },
    autoInvalidateTags: ['all-albums'], // Invalidate album list cache
  });

  const handleCreateAlbum = async () => {
    if (newAlbumName.trim()) {
      try {
        createAlbum({
          name: newAlbumName.trim(),
          description: newAlbumDescription.trim(),
          is_hidden: isHidden,
          password: isHidden ? password : '', // Only send password if hidden
        });
        // Reset form
        setNewAlbumName('');
        setNewAlbumDescription('');
        setPassword('');
        setIsHidden(false);
        closeForm();
      } catch (err) {
        onError('Error Creating Album', err);
      }
    } else {
      onError('Invalid Album Name', new Error('Album name cannot be empty')); // Validation check
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeForm}>
      {' '}
      {/* Dialog visibility */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Album</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="text"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            placeholder="New album name"
            required
          />
          <Textarea
            value={newAlbumDescription}
            onChange={(e) => setNewAlbumDescription(e.target.value)}
            placeholder="Album description (optional)"
          />
          <div>
            <label>
              <input
                type="checkbox"
                checked={isHidden}
                onChange={() => setIsHidden(!isHidden)} // Toggle hidden flag
              />
              Mark as Hidden
            </label>
          </div>
          {isHidden && (
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // Password input for hidden albums
              placeholder="Enter password for hidden album"
              required
            />
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreateAlbum}
            disabled={isCreating || !newAlbumName.trim()} // Disable if invalid or creating
          >
            {isCreating ? 'Creating...' : 'Create Album'}
          </Button>
          <Button onClick={closeForm} variant="outline">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAlbumForm;
