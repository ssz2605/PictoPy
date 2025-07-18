import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  usePictoQuery,
  usePictoMutation,
  queryClient,
} from '@/hooks/useQueryExtensio';
import {
  delMultipleImages,
  fetchAllImages,
} from '../../../api/api-functions/images';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';
import { MediaItem } from '@/types/Media';
import DeleteImagesDialog from './DeleteImageDialog';

// Props definition for the delete images page
interface DeleteSelectedImageProps {
  setIsVisibleSelectedImage: (value: boolean) => void;
  onError: (title: string, err: any) => void;
  uniqueTags: string[];
  mediaItems: MediaItem[];
}

const DeleteSelectedImagePage: React.FC<DeleteSelectedImageProps> = ({
  setIsVisibleSelectedImage,
  onError,
  uniqueTags,
  mediaItems,
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Fetch all image paths
  const { successData: response, isLoading } = usePictoQuery({
    queryFn: fetchAllImages,
    queryKey: ['all-images'],
  });

  // Mutation for deleting multiple images
  const { mutate: deleteMultipleImages, isPending: isAddingImages } =
    usePictoMutation({
      mutationFn: (variables: { paths: string[]; isFromDevice: boolean }) =>
        delMultipleImages(variables.paths, variables.isFromDevice),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['all-images'] });
      },
      autoInvalidateTags: ['ai-tagging-images', 'ai'],
    });

  // Get all image paths
  const allImages: string[] = response?.image_files || [];

  // Toggle individual image selection
  const toggleImageSelection = (imagePath: string) => {
    setSelectedImages((prev) =>
      prev.includes(imagePath)
        ? prev.filter((path) => path !== imagePath)
        : [...prev, imagePath],
    );
  };

  const [openDialog, setOpenDialog] = useState<boolean>(false);

  // Final delete function after dialog confirm
  const handleAddSelectedImages = async (isFromDevice: boolean) => {
    setOpenDialog(true);
    console.log('Selected Images = ', selectedImages);
    if (isFromDevice) {
      console.log('Yes , Want to delete from this Device too');
    } else {
      console.log('Only want to delete from this Application');
    }
    if (selectedImages.length > 0) {
      try {
        await deleteMultipleImages({ paths: selectedImages, isFromDevice });
        console.log('Selected Images : ', selectedImages);
        setSelectedImages([]);
        if (!isLoading) {
          setIsVisibleSelectedImage(true);
        }
      } catch (err) {
        onError('Error during deleting images', err);
      }
    }
  };

  const [filterTag, setFilterTag] = useState<string>(uniqueTags[0]);

  // Handle filter change and update selection
  const handleFilterTag = (value: string) => {
    setSelectedImages([]);
    setFilterTag(value);

    if (value.length === 0) {
      setSelectedImages(allImages);
      return;
    }

    const selectedImagesPaths: string[] = [];

    mediaItems.forEach((ele) => {
      if (ele.tags?.includes(value)) {
        ele.imagePath && selectedImagesPaths.push(ele.imagePath);
      }
    });

    console.log('Selected Images Path = ', selectedImagesPaths);
    setSelectedImages(selectedImagesPaths);
  };

  // Extract name from image path
  const getImageName = (path: string) => {
    return path.split('\\').pop() || path;
  };

  // Loading state
  if (isLoading) {
    return <div>Loading images...</div>;
  }

  // Empty state
  if (!Array.isArray(allImages) || allImages.length === 0) {
    return <div>No images available. Please add some images first.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between">
        <h1 className="mb-4 text-2xl font-bold">Select Images</h1>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="hover:bg-accent flex items-center gap-2 rounded-lg border-gray-500 px-4 py-2 shadow-sm transition duration-300 ease-in-out dark:hover:bg-white/10"
              >
                <Filter className="h-4 w-4 text-gray-700 dark:text-white" />
                <p className="hidden text-sm text-gray-700 lg:inline dark:text-white">
                  Select Tag : {filterTag || 'tags'}
                </p>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="z-50 max-h-[500px] w-[200px] overflow-y-auto rounded-lg bg-gray-800 p-2 shadow-lg dark:bg-gray-900"
              align="end"
            >
              <DropdownMenuRadioGroup
                className="overflow-auto rounded-lg bg-gray-950 text-white"
                value={filterTag}
                onValueChange={(value) => handleFilterTag(value)}
              >
                <DropdownMenuRadioItem
                  value=""
                  className="rounded-md px-4 py-2 text-sm transition-colors duration-200 hover:bg-gray-700 hover:text-white"
                >
                  All tags
                </DropdownMenuRadioItem>
                {uniqueTags.map((tag) => (
                  <DropdownMenuRadioItem
                    key={tag}
                    value={tag}
                    className="rounded-md px-4 py-2 text-sm transition-colors duration-200 hover:bg-gray-700 hover:text-white"
                  >
                    {tag}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* <button onClick={handleSelectAllImages}>Select All</button> */}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {mediaItems.map(({ imagePath, thumbnailUrl }, index) => {
          return (
            <div key={index} className="relative">
              <div
                className={`absolute -top-2 -right-2 z-10 h-6 w-6 cursor-pointer rounded-full border-2 border-white ${
                  imagePath && selectedImages.includes(imagePath)
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
                onClick={() => imagePath && toggleImageSelection(imagePath)}
              />
              <img
                src={thumbnailUrl}
                alt={`Image ${imagePath && getImageName(imagePath)}`}
                className="h-40 w-full rounded-lg object-cover"
              />
              <div className="bg-opacity-50 absolute right-0 bottom-0 left-0 truncate rounded-b-lg bg-black p-1 text-xs text-white">
                {imagePath && getImageName(imagePath)}
              </div>
            </div>
          );
        })}
      </div>
      {openDialog && (
        <DeleteImagesDialog
          isOpen={openDialog}
          setIsOpen={setOpenDialog}
          executeDeleteImages={handleAddSelectedImages}
        />
      )}
      <div className="fixed right-0 bottom-0 left-0 z-50 mb-4 flex justify-evenly bg-transparent p-4 shadow-lg">
        <Button
          variant="secondary"
          onClick={() => setIsVisibleSelectedImage(true)}
        >
          Cancel
        </Button>
        <Button
          onClick={() => setOpenDialog(true)}
          variant="destructive"
          disabled={isAddingImages || selectedImages.length === 0}
        >
          Delete Selected Images ({selectedImages.length})
        </Button>
      </div>
    </div>
  );
};

export default DeleteSelectedImagePage;
