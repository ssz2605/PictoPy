import React, { useEffect, useState } from 'react';
import { SetupScreen } from '@/components/SetupScreen';
import { FolderService } from '@/hooks/folderService';
import { useDispatch } from 'react-redux';
import { markCompleted } from '@/features/onboardingSlice';

interface FolderSetupStepProps {
  stepIndex: number;
}

export const FolderSetupStep: React.FC<FolderSetupStepProps> = ({
  stepIndex,
}) => {
  const dispatch = useDispatch();

  // Load saved folder paths initially
  const [folderPaths, setFolderPaths] = useState<string[]>(
    FolderService.getSavedFolderPaths(),
  );

  // Show setup screen only if no folders are saved
  const [showSetupScreen, setShowSetupScreen] = useState<boolean>(
    folderPaths.length === 0,
  );

  useEffect(() => {
    if (folderPaths.length > 0) {
      setShowSetupScreen(false); // Hide setup screen if folders exist
      dispatch(markCompleted(stepIndex)); // Mark this step as done
    }
  }, [folderPaths, stepIndex, dispatch]);

  // Update folder paths and persist them
  const handleFolderPathsChange = (paths: string[]) => {
    setFolderPaths(paths);
    FolderService.saveFolderPaths(paths);
  };

  // Show setup screen if no folders selected
  return showSetupScreen ? (
    <SetupScreen onFolderPathsChange={handleFolderPathsChange} />
  ) : null;
};
