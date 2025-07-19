import { useCallback, useEffect, useMemo, useState } from 'react';
import FilterControls from './FilterControls';
import MediaGrid from '../Media/Mediagrid';
import { LoadingScreen } from '@/components/ui/LoadingScreen/LoadingScreen';
import MediaView from '../Media/MediaView';
import PaginationControls from '../ui/PaginationControls';
import { usePictoQuery } from '@/hooks/useQueryExtensio';
import { getAllImageObjects } from '../../../api/api-functions/images';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import ProgressiveFolderLoader from '../ui/ProgressiveLoader';

import { UserSearch } from 'lucide-react';
import ErrorPage from '@/components/ui/ErrorPage/ErrorPage';

// AIGallery component displays an AI-tagged image gallery with filtering, pagination, and folder-loading capabilities
export default function AIGallery({
  title,
  type,
}: {
  title: string;
  type: 'image' | 'video';
}) {
  // Fetches images with tags using a custom React Query hook
  const {
    successData,
    error,
    isLoading: isGeneratingTags,
  } = usePictoQuery({
    queryFn: async () => await getAllImageObjects(),
    queryKey: ['ai-tagging-images', 'ai'],
  });

  // Local UI and data states
  const [addedFolders, setAddedFolders] = useState<string[]>([]);
  let mediaItems = successData ?? [];
  const [filterTag, setFilterTag] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showMediaViewer, setShowMediaViewer] = useState<boolean>(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(0);
  const [isVisibleSelectedImage, setIsVisibleSelectedImage] =
    useState<boolean>(true);
  const [faceSearchResults, setFaceSearchResults] = useState<string[]>([]);

  const itemsPerRow: number = 3;
  const noOfPages: number[] = Array.from(
    { length: 41 },
    (_, index) => index + 10,
  );

  // Filters media based on selected tags and face search results
  const filteredMediaItems = useMemo(() => {
    let filtered = mediaItems;
    if (faceSearchResults.length > 0) {
      filtered = filtered.filter((item: any) =>
        faceSearchResults.includes(item.imagePath),
      );
    }

    return filterTag.length > 0
      ? filtered.filter((mediaItem: any) =>
          filterTag.some((tag) => mediaItem.tags.includes(tag)),
        )
      : filtered;
  }, [filterTag, mediaItems, isGeneratingTags, faceSearchResults]);

  const [pageNo, setpageNo] = useState<number>(20);

  // Slices filtered items for current page
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * pageNo;
    const indexOfFirstItem = indexOfLastItem - pageNo;
    return filteredMediaItems.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredMediaItems, currentPage, pageNo]);

  const totalPages = Math.ceil(filteredMediaItems.length / pageNo);

  // Opens media viewer for selected item
  const openMediaViewer = useCallback((index: number) => {
    setSelectedMediaIndex(index);
    setShowMediaViewer(true);
  }, []);

  // Closes the media viewer
  const closeMediaViewer = useCallback(() => {
    setShowMediaViewer(false);
  }, []);

  // Updates added folder list
  const handleFolderAdded = useCallback(async (newPaths: string[]) => {
    setAddedFolders(newPaths);
  }, []);

  // Reset to page 1 on tag or face search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTag, faceSearchResults]);

  // Error screen if image loading fails
  if (error) {
    return (
      <ErrorPage
        errorCode={500}
        errorMessage="Error loading media items."
        details="An unexpected error occurred while loading media items. This may be due to a server issue or database failure. Please try again later."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="w-full">
      <div className="dark:bg-background dark:text-foreground mx-auto px-2 pb-8">
        <div className="mb-2 flex items-center justify-between">
          {isVisibleSelectedImage && (
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">{title}</h1>
              {faceSearchResults.length > 0 && (
                // UI for active face filter badge
                <div className="ml-4 flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1 dark:bg-blue-900/30">
                  <UserSearch size={16} />
                  <span className="text-sm">
                    Face filter active ({faceSearchResults.length} matches)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setFaceSearchResults([])}
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Tag filtering and folder adding UI */}
          <FilterControls
            setFilterTag={setFilterTag}
            mediaItems={mediaItems}
            onFolderAdded={handleFolderAdded}
            isLoading={isGeneratingTags}
            isVisibleSelectedImage={isVisibleSelectedImage}
            setIsVisibleSelectedImage={setIsVisibleSelectedImage}
            setFaceSearchResults={setFaceSearchResults}
          />

          {/* UI to add folders progressively */}
          <ProgressiveFolderLoader
            additionalFolders={addedFolders}
            setAdditionalFolders={setAddedFolders}
          />
        </div>

        {isVisibleSelectedImage && (
          <>
            {/* Main image grid view */}
            <MediaGrid
              mediaItems={currentItems}
              itemsPerRow={itemsPerRow}
              openMediaViewer={openMediaViewer}
              type={type}
            />

            {/* Pagination & page-size control */}
            <div className="relative flex items-center justify-center gap-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />

              {/* Per page dropdown control */}
              <div className="absolute right-0 mt-5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="hover:bg-accent flex items-center gap-2 border-gray-500 dark:hover:bg-white/10"
                    >
                      <p className="hidden lg:inline">
                        Num of images per page : {pageNo}
                      </p>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="max-h-[500px] w-[200px] overflow-y-auto"
                    align="end"
                  >
                    <DropdownMenuRadioGroup
                      className="cursor-pointer overflow-auto bg-gray-950 p-4"
                      onValueChange={(value) => setpageNo(Number(value))}
                    >
                      {noOfPages.map((itemsPerPage) => (
                        <DropdownMenuRadioItem
                          key={itemsPerPage}
                          value={`${itemsPerPage}`}
                        >
                          {itemsPerPage}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </>
        )}

        {/* Loader or Media Viewer depending on state */}
        {isGeneratingTags ? (
          <LoadingScreen
            isLoading={isGeneratingTags}
            message="Generating tags..."
          />
        ) : (
          showMediaViewer && (
            <MediaView
              initialIndex={selectedMediaIndex}
              onClose={closeMediaViewer}
              allMedia={filteredMediaItems.map((item: any) => ({
                url: item.url,
                path: item?.imagePath,
              }))}
              currentPage={currentPage}
              itemsPerPage={pageNo}
              type={type}
            />
          )
        )}
      </div>
    </div>
  );
}
