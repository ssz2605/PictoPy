import './App.css';
import React from 'react';
import { BrowserRouter } from 'react-router';
import { AppRoutes } from '@/routes/AppRoutes';
import { ThemeProvider } from '@/contexts/ThemeContext';
import QueryClientProviders from '@/config/QueryClientProvider';
import { GlobalLoader } from './components/Loader/GlobalLoader';
import { useSelector } from 'react-redux';
import { RootState } from './app/store';

const App: React.FC = () => {
  // Access global loading state from Redux
  const { loading, message } = useSelector((state: RootState) => state.loader);

  return (
    <ThemeProvider>
      {' '}
      {/* Provides theme (light/dark/system) context */}
      <QueryClientProviders>
        {' '}
        {/* React Query provider */}
        <BrowserRouter>
          {' '}
          {/* Enables client-side routing */}
          <AppRoutes />
        </BrowserRouter>
        <GlobalLoader loading={loading} message={message} />{' '}
        {/* Full-screen loader */}
      </QueryClientProviders>
    </ThemeProvider>
  );
};

export default App;
