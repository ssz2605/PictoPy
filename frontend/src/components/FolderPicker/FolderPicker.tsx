import React from 'react';
import { Button } from '@/components/ui/button';
import { open } from '@tauri-apps/plugin-dialog'; // Tauri API to open folder dialog
import { FolderPlus } from 'lucide-react'; // Icon for UI

interface FolderPickerProps {
  setFolderPaths: (paths: string[]) => void; // Callback to store selected folders
  className?: string; // Optional styling class
}

const FolderPicker: React.FC<FolderPickerProps> = ({
  setFolderPaths,
  className,
}) => {
  const pickFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: true, // Allow selecting multiple folders
        title: 'Select folders',
      });
      if (selected && Array.isArray(selected)) {
        setFolderPaths(selected); // Pass selected folder paths up
      }
    } catch (error) {
      console.error('Error picking folders:', error); // Handle any error
    }
  };

  return (
    <div className="flex w-full gap-3">
      <Button
        onClick={pickFolder}
        variant="outline"
        className={`hover:bg-accent flex items-center justify-center border-gray-500 text-gray-700 dark:text-gray-50 dark:hover:bg-white/10 ${className} `}
      >
        <FolderPlus className="h-[18px] w-[18px]" /> {/* Folder icon */}
        <p className={`ml-2 inline`}>Add folders</p> {/* Button label */}
      </Button>
    </div>
  );
};

export default FolderPicker;
