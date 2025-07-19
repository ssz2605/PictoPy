import React from 'react';
import { Button } from '@/components/ui/button';

import { open } from '@tauri-apps/plugin-dialog'; // Tauri dialog API for file selection
import { FileIcon } from '../ui/Icons/Icons';

interface FilePickerProps {
  setFilePaths: (paths: string[]) => void; // Callback to pass selected file paths
  multiple?: boolean; // Whether multiple files can be selected
}

const FilePicker: React.FC<FilePickerProps> = ({
  setFilePaths,
  multiple = true,
}) => {
  const pickFiles = async () => {
    try {
      const selected = await open({
        multiple,
        filters: [
          {
            name: 'Image',
            extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'], // Only image formats
          },
        ],
      });
      if (selected) {
        if (Array.isArray(selected)) {
          setFilePaths(selected); // Pass multiple file paths
        } else if (typeof selected === 'string') {
          setFilePaths([selected]); // Pass single file path
        }
      }
    } catch (error) {
      console.error('Error picking files:', error); // Handle file picker errors
    }
  };

  return (
    <div className="flex gap-3">
      <Button
        onClick={pickFiles}
        variant="outline"
        className="text-black-50 border-gray-500 hover:bg-gray-700 dark:border-gray-500 dark:text-gray-50 dark:hover:bg-gray-700"
      >
        <FileIcon className="text-black-50 mr-2 h-5 w-5 dark:text-gray-50" />
        Choose {multiple ? 'Files' : 'File'}
      </Button>
    </div>
  );
};

export default FilePicker;
