import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { StorageService } from './services/storage';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { Navigation } from './components/layout/Navigation';
import { CapturePage } from './pages/CapturePage';
import { FoldersPage } from './pages/FoldersPage';
import { ItemsPage } from './pages/ItemsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { AnimatedLogo } from './components/ui/AnimatedLogo';

const storageService = StorageService.getInstance();

function App() {
  const { 
    currentView, 
    selectedFolder,
    isLoading, 
    setLoading, 
    setError,
    navigateBack,
    preferences
  } = useAppStore();
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      // Remove existing theme classes
      root.removeAttribute('data-theme');
      
      // Apply new theme
      if (preferences.theme === 'auto') {
        root.setAttribute('data-theme', 'auto');
      } else {
        root.setAttribute('data-theme', preferences.theme);
      }
    };

    applyTheme();
  }, [preferences.theme]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        await storageService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError('Failed to initialize application. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [setLoading, setError]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-retro-bg-primary bg-pixel-grid flex items-center justify-center">
        <div className="text-center space-y-pixel-2">
          <AnimatedLogo size="lg" className="mx-auto" />
          
          <div>
            <h1 className="text-2xl font-pixel text-retro-accent mb-2">
              CacawInventory
            </h1>
            <p className="text-retro-accent-light font-pixel-sans">
              Initializing your retro collection manager...
            </p>
          </div>
          
          <LoadingSpinner size="lg" variant="accent" className="mx-auto" />
          
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-retro-accent animate-pixel-pulse pixel-perfect" />
            <div className="w-2 h-2 bg-retro-accent animate-pixel-pulse pixel-perfect" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-retro-accent animate-pixel-pulse pixel-perfect" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentView) {
      case 'capture':
        return <CapturePage />;
      case 'folders':
        return <FoldersPage />;
      case 'items':
        return selectedFolder ? (
          <ItemsPage 
            folder={selectedFolder} 
            onBack={navigateBack}
          />
        ) : (
          <FoldersPage />
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return <FoldersPage />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-retro-bg-primary bg-pixel-grid">
        <Navigation />
        <main>
          {renderCurrentPage()}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;