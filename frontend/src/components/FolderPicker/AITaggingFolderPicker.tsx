import React from 'react';
import { Button } from '@/components/ui/button';
import { open } from '@tauri-apps/plugin-dialog'; // Tauri dialog API to open folder picker
import { FolderPlus } from 'lucide-react';

interface FolderPickerProps {
  setFolderPath: (path: string[]) => void; // Callback to set selected folders
  className?: string; // Optional class for styling
  handleDeleteCache?: () => void; // Optional callback to clear cache
}

const AITaggingFolderPicker: React.FC<FolderPickerProps> = ({
  setFolderPath,
  className,
  handleDeleteCache,
}) => {
  // Function to open folder picker
  const pickFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: true,
        title: 'Select folders',
      });
      // If folders are selected, update state and clear cache if needed
      if (selected && Array.isArray(selected) && selected.length > 0) {
        setFolderPath(selected);
        console.log('Selected folder:', selected);
        if (handleDeleteCache) {
          handleDeleteCache();
        }
      }
    } catch (error) {
      console.error('Error picking folder:', error);
    }
  };

  return (
    <div className="flex w-full gap-3">
      <Button
        onClick={pickFolder}
        variant="outline"
        className={`hover:bg-accent flex items-center justify-center border-gray-500 text-gray-700 dark:text-gray-50 dark:hover:bg-white/10 ${className ?? ''} `}
      >
        <FolderPlus className="h-[18px] w-[18px]" />
        <p className={`ml-2 inline`}>Add folder</p>
      </Button>
    </div>
  );
};

export default AITaggingFolderPicker;
