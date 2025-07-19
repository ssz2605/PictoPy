import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { convertFileSrc } from '@tauri-apps/api/core';
import { usePictoMutation, usePictoQuery } from '@/hooks/useQueryExtensio';
import { fetchAllImages } from '../../../api/api-functions/images';
import { addMultipleToAlbum } from '../../../api/api-functions/albums';
import { extractThumbnailPath } from '@/hooks/useImages';
import { useQueryClient } from '@tanstack/react-query';

interface ImageSelectionPageProps {
  albumName: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (title: string, error: unknown) => void;
}

const ImageSelectionPage: React.FC<ImageSelectionPageProps> = ({
  albumName,
  onClose,
  onSuccess,
  onError,
}) => {
  const queryClient = useQueryClient();

  // Fetch all images using custom hook
  const {
    successData: allImagesData,
    isLoading,
    errorMessage,
  } = usePictoQuery({
    queryFn: fetchAllImages,
    queryKey: ['all-images'],
  });

  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Mutation to add selected images to album
  const { mutate: addMultipleImages, isPending: isAddingImages } =
    usePictoMutation({
      mutationFn: addMultipleToAlbum,
      onSuccess: () => {
        // Refresh cache on success
        queryClient.invalidateQueries({ queryKey: ['view-album', albumName] });
        queryClient.invalidateQueries({ queryKey: ['all-albums'] });
      },
    });

  // Prepare image paths with thumbnail and file URLs
  const allImages: string[] = allImagesData?.image_files || [];
  const imagesWithThumbnails = allImages.map((imagePath) => ({
    imagePath,
    url: convertFileSrc(imagePath),
    thumbnailUrl: convertFileSrc(extractThumbnailPath(imagePath)),
  }));

  // Show error dialog if image fetching fails
  useEffect(() => {
    if (errorMessage && errorMessage !== 'Something went wrong') {
      onError('Error Fetching Images', errorMessage);
    }
  }, [errorMessage, onError]);

  // Toggle image selection
  const toggleImageSelection = (imagePath: string) => {
    setSelectedImages((prev) =>
      prev.includes(imagePath)
        ? prev.filter((path) => path !== imagePath)
        : [...prev, imagePath],
    );
  };

  // Add all selected images to album
  const handleAddSelectedImages = async () => {
    if (selectedImages.length > 0) {
      try {
        await addMultipleImages({
          album_name: albumName,
          paths: selectedImages,
        });
        onSuccess();
        setSelectedImages([]);
      } catch (err) {
        onError('Error Adding Images', err);
      }
    }
  };

  // Extract image name from full path
  const getImageName = (path: string) => {
    return path.split('\\').pop() || path;
  };

  // Handle loading and empty state
  if (isLoading) {
    return <div>Loading images...</div>;
  }

  if (!Array.isArray(allImages) || allImages.length === 0) {
    return <div>No images available. Please add some images first.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Select Images for {albumName}</h1>

      {/* Display images in a responsive grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {imagesWithThumbnails.map(({ imagePath, thumbnailUrl }, index) => {
          return (
            <div key={index} className="relative">
              {/* Selection indicator */}
              <div
                className={`absolute -top-2 -right-2 z-10 h-6 w-6 cursor-pointer rounded-full border-2 border-white ${
                  selectedImages.includes(imagePath)
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
                onClick={() => toggleImageSelection(imagePath)}
              />
              {/* Image preview */}
              <img
                src={thumbnailUrl}
                alt={`Image ${getImageName(imagePath)}`}
                className="h-40 w-full rounded-lg object-cover"
              />
              {/* Image file name */}
              <div className="bg-opacity-50 absolute right-0 bottom-0 left-0 truncate rounded-b-lg bg-black p-1 text-xs text-white">
                {getImageName(imagePath)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex justify-between">
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAddSelectedImages}
          disabled={isAddingImages || selectedImages.length === 0}
        >
          Add Selected Images ({selectedImages.length})
        </Button>
      </div>
    </div>
  );
};

export default ImageSelectionPage;
