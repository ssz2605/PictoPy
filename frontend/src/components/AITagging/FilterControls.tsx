// React & Hooks
import React, { useState, useRef } from 'react';

// UI components from internal design system
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// Custom types
import { MediaItem } from '@/types/Media';

// Internal components
import AITaggingFolderPicker from '../FolderPicker/AITaggingFolderPicker';
import DeleteSelectedImagePage from '../FolderPicker/DeleteSelectedImagePage';
import ErrorDialog from '../Album/Error';

// Icons
import { Trash2, Filter, UserSearch, Upload, Camera } from 'lucide-react';

// Face search API function
import { searchByFace } from '../../../api/api-functions/faceTagging';

// Dialog components for modal behavior
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

import WebcamCapture from './WebcamCapture';
import { LoadingScreen } from '../LoadingScreen/LoadingScreen';

// Props type for the component
interface FilterControlsProps {
  setFilterTag: (tag: string[]) => void;
  mediaItems: MediaItem[];
  onFolderAdded: (newPaths: string[]) => Promise<void>;
  isLoading: boolean;
  isVisibleSelectedImage: boolean;
  setIsVisibleSelectedImage: (value: boolean) => void;
  setFaceSearchResults: (paths: string[]) => void;
}

// Main functional component
export default function FilterControls({
  setFilterTag,
  mediaItems,
  onFolderAdded,
  isVisibleSelectedImage,
  setIsVisibleSelectedImage,
  setFaceSearchResults,
}: FilterControlsProps) {
  // Get unique tags from all media items
  const uniqueTags = React.useMemo(() => {
    const allTags = mediaItems.flatMap((item) => item.tags);
    return Array.from(new Set(allTags))
      .filter((tag): tag is string => typeof tag === 'string')
      .sort();
  }, [mediaItems]);

  // State for dropdown, dialogs, loading, and camera
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isFaceDialogOpen, setIsFaceDialogOpen] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track selected filters (including "All tags")
  const [selectedFlags, setSelectedFlags] = useState<
    { tag: string; isChecked: boolean }[]
  >([
    { tag: 'All tags', isChecked: false },
    ...uniqueTags.map((ele) => ({ tag: ele, isChecked: false })),
  ]);

  // Add tag to selected list
  const handleAddFlag = (idx: number) => {
    const updatedFlags = [...selectedFlags];
    updatedFlags[idx].isChecked = true;
    setSelectedFlags(updatedFlags);
  };

  // Remove tag from selected list
  const handleRemoveFlag = (idx: number) => {
    const updatedFlags = [...selectedFlags];
    updatedFlags[idx].isChecked = false;
    setSelectedFlags(updatedFlags);
  };

  // Apply selected tag filters
  const handleFilterFlag = () => {
    let flags: string[] = [];
    if (selectedFlags[0].isChecked) {
      setFilterTag([]);
      return;
    }
    selectedFlags.forEach((ele) => {
      if (ele.isChecked) flags.push(ele.tag);
    });
    console.log('Updated Filter Flags = ', flags);
    setFilterTag(flags);
  };

  // Toggle dropdown menu open/close
  const handleToggleDropdown = (event: Event) => {
    event.preventDefault();
    setIsDropdownOpen((prevState) => !prevState);
  };

  // Handle new folder added via picker
  const handleFolderPick = async (paths: string[]) => {
    try {
      await onFolderAdded(paths);
    } catch (error) {
      console.error('Error adding folder:', error);
    }
  };

  // Error dialog state
  const [errorDialogContent, setErrorDialogContent] = useState<{
    title: string;
    description: string;
  } | null>(null);

  // Show custom error dialog
  const showErrorDialog = (title: string, err: unknown) => {
    setErrorDialogContent({
      title,
      description:
        err instanceof Error ? err.message : 'An unknown error occurred',
    });
  };

  // Handle file input upload for face matching
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsSearching(true);
      setSearchError(null);

      const result = await searchByFace(file);

      if (result.success && result.data) {
        const matchedPaths = result.data.matches.map(
          (match: any) => match.path,
        );
        setFaceSearchResults(matchedPaths);
        setIsFaceDialogOpen(false);
      } else {
        setSearchError(result.message || 'Failed to search by face');
      }
    } catch (error: any) {
      console.error('Error in face search:', error);
      if (error.message?.includes('400')) {
        setSearchError('No person detected in the image');
      } else {
        setSearchError(error.message || 'An unknown error occurred');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger hidden file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Reset face search results
  const clearFaceSearch = () => {
    setFaceSearchResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle result from camera capture
  const handleCameraCapture = (
    matchedPaths: string[],
    errorMessage?: string,
  ) => {
    if (errorMessage) {
      setIsSearching(false);
      setSearchError(errorMessage);
      return;
    }

    setFaceSearchResults(matchedPaths);
    setShowCamera(false);
    setIsFaceDialogOpen(false);
  };

  // Show Delete page instead of filter controls if delete view is active
  if (!isVisibleSelectedImage) {
    return (
      <div>
        <DeleteSelectedImagePage
          setIsVisibleSelectedImage={setIsVisibleSelectedImage}
          onError={showErrorDialog}
          uniqueTags={uniqueTags}
          mediaItems={mediaItems}
        />
      </div>
    );
  }

  // Main filter and action control UI
  return (
    <>
      <div className="flex items-center gap-4 overflow-auto">
        {/* Folder Picker */}
        <AITaggingFolderPicker setFolderPath={handleFolderPick} />

        {/* Delete Images Button */}
        <Button
          onClick={() => setIsVisibleSelectedImage(false)}
          variant="outline"
          className="hover:bg-accent border-gray-500 dark:hover:bg-white/10"
        >
          <Trash2 className="h-4 w-4" />
          <p className="ml-1 hidden lg:inline">Delete Images</p>
        </Button>

        {/* Sort by Face Dialog */}
        <Dialog open={isFaceDialogOpen} onOpenChange={setIsFaceDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="hover:bg-accent border-gray-500 dark:hover:bg-white/10"
            >
              <UserSearch className="h-4 w-4" />
              <p className="ml-1 hidden lg:inline">Sort by Face</p>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sort by Face</DialogTitle>
            </DialogHeader>
            <div className="mt-4 flex flex-col gap-4">
              {/* Show loading / error / camera / upload */}
              {isSearching && <LoadingScreen />}
              {searchError && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                  {searchError}
                </div>
              )}

              {showCamera ? (
                <WebcamCapture
                  onCapture={handleCameraCapture}
                  onClose={() => setShowCamera(false)}
                />
              ) : (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />

                  <Button
                    onClick={triggerFileInput}
                    className="flex items-center justify-center gap-2"
                  >
                    <Upload size={18} />
                    Upload Photo
                  </Button>

                  <Button
                    onClick={() => setShowCamera(true)}
                    className="flex items-center justify-center gap-2"
                  >
                    <Camera size={18} />
                    Use Camera
                  </Button>

                  <Button
                    variant="outline"
                    onClick={clearFaceSearch}
                    className="mt-2"
                  >
                    Clear Face Search
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Filter by Tag Dropdown */}
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="hover:bg-accent flex cursor-default items-center gap-2 border-gray-500 p-2 dark:hover:bg-white/10"
              onClick={() => handleToggleDropdown}
            >
              <Filter className="h-4 w-4" />
              Filter by{' '}
              <div className="flex gap-2">
                {selectedFlags.map((ele, idx) =>
                  ele.isChecked ? (
                    <p
                      key={idx}
                      className="flex items-center justify-center gap-1 rounded-lg border-white bg-gray-800 pt-1 pr-2 pb-1 pl-2"
                    >
                      {ele.tag}
                    </p>
                  ) : null,
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="max-h-[500px] w-[200px] overflow-y-auto"
            align="end"
          >
            <DropdownMenuRadioGroup
              className="overflow-auto"
              onValueChange={handleFilterFlag}
            >
              {selectedFlags.map((ele, index) => (
                <DropdownMenuRadioItem
                  key={ele.tag}
                  value={ele.tag}
                  onSelect={(event) => {
                    selectedFlags[index].isChecked
                      ? handleRemoveFlag(index)
                      : handleAddFlag(index);
                    event.preventDefault();
                  }}
                  className="cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mr-2 cursor-pointer"
                    value={ele.tag}
                    checked={selectedFlags[index].isChecked}
                  />
                  {ele.tag}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Error Dialog */}
        <ErrorDialog
          content={errorDialogContent}
          onClose={() => setErrorDialogContent(null)}
        />
      </div>
    </>
  );
}
