import React, { useEffect } from 'react';
import { Plus, Search, Grid, List } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { StorageService } from '../services/storage';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const storageService = StorageService.getInstance();

export const FoldersPage: React.FC = () => {
  const {
    folders,
    setFolders,
    isLoading,
    setLoading,
    error,
    setError,
    searchQuery,
    setSearchQuery,
    setCurrentView
  } = useAppStore();

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      await storageService.initialize();
      const loadedFolders = await storageService.getFolders();
      setFolders(loadedFolders);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Failed to load folders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFolderIcon = (type: string) => {
    switch (type) {
      case 'trading-cards':
        return '🃏';
      case 'action-figures':
        return '🤖';
      case 'plushies':
        return '🧸';
      case 'comics':
        return '📚';
      case 'games':
        return '🎮';
      default:
        return '📦';
    }
  };

  const getFolderTypeLabel = (type: string) => {
    switch (type) {
      case 'trading-cards':
        return 'Trading Cards';
      case 'action-figures':
        return 'Action Figures';
      case 'plushies':
        return 'Plushies';
      case 'comics':
        return 'Comics';
      case 'games':
        return 'Games';
      default:
        return 'Other';
    }
  };

  if (isLoading && folders.length === 0) {
    return (
      <div className="min-h-screen bg-retro-bg-primary bg-pixel-grid flex items-center justify-center">
        <LoadingSpinner size="lg" variant="accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-bg-primary bg-pixel-grid p-pixel-2">
      <div className="max-w-7xl mx-auto space-y-pixel-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-pixel-2">
          <div>
            <h1 className="text-3xl font-pixel text-retro-accent">
              My Collections
            </h1>
            <p className="text-retro-accent-light font-pixel-sans mt-1">
              Organize your collectibles into retro folders
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="accent"
              icon={Plus}
              glow
              onClick={() => {
                // TODO: Implement create folder modal
                console.log('Create folder clicked');
              }}
            >
              New Folder
            </Button>
            
            <Button
              variant="primary"
              onClick={() => setCurrentView('capture')}
            >
              Add Items
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-pixel-2">
          <div className="flex-1">
            <Input
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              fullWidth
              showCursor
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" icon={Grid} size="sm" glow>
              Grid
            </Button>
            <Button variant="ghost" icon={List} size="sm">
              List
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card variant="outlined" className="border-retro-error">
            <div className="text-center py-pixel-2">
              <p className="text-retro-error font-pixel-sans animate-pixel-pulse">{error}</p>
              <Button
                variant="ghost"
                onClick={loadFolders}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Folders Grid */}
        {filteredFolders.length === 0 ? (
          <Card className="text-center py-pixel-6" glow>
            <div className="space-y-pixel-2">
              <div className="text-6xl animate-pixel-float">📁</div>
              <div>
                <h3 className="text-lg font-pixel text-retro-accent mb-2">
                  {searchQuery ? 'No folders found' : 'No folders yet'}
                </h3>
                <p className="text-retro-accent-light font-pixel-sans">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Create your first folder to start organizing your collectibles'
                  }
                </p>
              </div>
              
              {!searchQuery && (
                <Button
                  variant="accent"
                  icon={Plus}
                  glow
                  onClick={() => {
                    // TODO: Implement create folder modal
                    console.log('Create first folder clicked');
                  }}
                >
                  Create Your First Folder
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-pixel-2">
            {filteredFolders.map((folder) => (
              <Card
                key={folder.id}
                hoverable
                glow
                onClick={() => {
                  // TODO: Navigate to folder items view
                  console.log('Folder clicked:', folder.name);
                }}
                className="transition-transform hover:scale-105"
              >
                <div className="space-y-pixel">
                  {/* Folder Header */}
                  <div className="flex items-start justify-between">
                    <div className="text-3xl animate-pixel-float">
                      {getFolderIcon(folder.type)}
                    </div>
                    <div className="text-right">
                      <Badge variant="default" glow>
                        {folder.itemCount} items
                      </Badge>
                      {folder.totalValue && (
                        <div className="text-sm font-pixel-sans text-retro-accent font-medium mt-1">
                          ${folder.totalValue.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Folder Info */}
                  <div>
                    <h3 className="font-pixel text-retro-accent text-lg mb-1">
                      {folder.name}
                    </h3>
                    <Badge variant="default" size="sm">
                      {getFolderTypeLabel(folder.type)}
                    </Badge>
                    {folder.description && (
                      <p className="text-sm text-retro-accent-light font-pixel-sans mt-1 line-clamp-2">
                        {folder.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Folder Tags */}
                  {folder.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {folder.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="default"
                          size="sm"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {folder.tags.length > 3 && (
                        <Badge variant="default" size="sm">
                          +{folder.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};