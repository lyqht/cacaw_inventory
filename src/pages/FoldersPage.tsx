import React, { useEffect, useState } from 'react';
import { Plus, Search, Grid, List, Edit, Trash2, Upload, Download } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { StorageService } from '../services/storage';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { FolderCard } from '../components/folders/FolderCard';
import { FolderDeleteModal } from '../components/folders/FolderDeleteModal';
import { FolderCreateModal } from '../components/folders/FolderCreateModal';
import { FolderEditModal } from '../components/folders/FolderEditModal';
import { ExportImportModal } from '../components/folders/ExportImportModal';
import { Folder, FolderType } from '../types';

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
    navigateToFolder
  } = useAppStore();

  // Local state for folder management
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [exportImportMode, setExportImportMode] = useState<'export' | 'import'>('export');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      await storageService.initialize();
      const loadedFolders = await storageService.getFolders();
      console.log('Loaded folders:', loadedFolders);
      setFolders(loadedFolders);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Failed to load folders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (folderData: {
    name: string;
    description: string;
    type: FolderType;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for duplicate names
      const existingFolder = folders.find(f => 
        f.name.toLowerCase() === folderData.name.toLowerCase()
      );
      if (existingFolder) {
        throw new Error('A folder with this name already exists');
      }

      await storageService.createFolder({
        userId: 'default-user',
        name: folderData.name,
        description: folderData.description || undefined,
        type: folderData.type,
        source: 'local',
        tags: [],
        itemCount: 0,
        isArchived: false,
        syncStatus: 'local-only',
        metadata: {
          sortOrder: 'name',
          sortDirection: 'asc',
          viewMode: 'grid'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Reload folders to update the UI
      await loadFolders();
      
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFolder = async (folderId: string, updates: {
    name: string;
    description: string;
    type: FolderType;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for duplicate names (excluding current folder)
      const existingFolder = folders.find(f => 
        f.id !== folderId && f.name.toLowerCase() === updates.name.toLowerCase()
      );
      if (existingFolder) {
        throw new Error('A folder with this name already exists');
      }

      await storageService.updateFolder(folderId, {
        name: updates.name,
        description: updates.description || undefined,
        type: updates.type,
        updatedAt: new Date()
      });

      // Reload folders to update the UI
      await loadFolders();
      
      setEditingFolder(null);
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    try {
      setLoading(true);
      setError(null);
      
      // Delete the folder and all its items
      await storageService.deleteFolder(folder.id);
      
      // Reload folders to update the UI
      await loadFolders();
      
      setDeletingFolder(null);
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError('Failed to delete folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
  };

  const toggleFolderSelection = (folderId: string) => {
    setSelectedFolders(prev => 
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const selectAllFolders = () => {
    setSelectedFolders(filteredFolders.map(f => f.id));
  };

  const deselectAllFolders = () => {
    setSelectedFolders([]);
  };

  const openExportModal = () => {
    setExportImportMode('export');
    setShowExportImport(true);
  };

  const openImportModal = () => {
    setExportImportMode('import');
    setShowExportImport(true);
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
              variant="ghost"
              icon={Upload}
              size="sm"
              onClick={openExportModal}
            >
              Export
            </Button>
            <Button
              variant="ghost"
              icon={Download}
              size="sm"
              onClick={openImportModal}
            >
              Import
            </Button>
            <Button
              variant="accent"
              icon={Plus}
              glow
              onClick={() => setShowCreateModal(true)}
            >
              New Folder
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
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Your First Folder
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-pixel-2">
            {filteredFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onView={navigateToFolder}
                onEdit={handleEditFolder}
                onDelete={(folder) => setDeletingFolder(folder)}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <FolderCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateFolder={handleCreateFolder}
          isLoading={isLoading}
        />

        <FolderEditModal
          folder={editingFolder}
          isOpen={!!editingFolder}
          onClose={() => setEditingFolder(null)}
          onUpdateFolder={handleUpdateFolder}
          isLoading={isLoading}
        />

        <FolderDeleteModal
          folder={deletingFolder}
          isOpen={!!deletingFolder}
          onClose={() => setDeletingFolder(null)}
          onConfirm={handleDeleteFolder}
          isLoading={isLoading}
        />

        <ExportImportModal
          isOpen={showExportImport}
          onClose={() => setShowExportImport(false)}
          folders={folders}
          selectedFolders={selectedFolders}
          mode={exportImportMode}
          onImportComplete={() => {
            loadFolders();
          }}
        />
      </div>
    </div>
  );
};