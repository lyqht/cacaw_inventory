import React, { useState } from 'react';
import { ChevronDown, FolderOpen, Check, Plus, X } from 'lucide-react';
import { Folder, FolderType } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { StorageService } from '../../services/storage';

interface FolderSelectorProps {
  selectedFolder: Folder | null;
  folders: Folder[];
  onFolderSelect: (folder: Folder) => void;
  onFolderCreated?: (folder: Folder) => void;
  className?: string;
}

export const FolderSelector: React.FC<FolderSelectorProps> = ({
  selectedFolder,
  folders,
  onFolderSelect,
  onFolderCreated,
  className = ''
}) => {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Form state for new folder
  const [newFolderData, setNewFolderData] = useState({
    name: '',
    description: '',
    type: 'trading-cards' as FolderType
  });

  const storageService = StorageService.getInstance();

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

  const folderTypes: { value: FolderType; label: string; icon: string; description: string }[] = [
    { 
      value: 'trading-cards', 
      label: 'Trading Cards', 
      icon: '🃏',
      description: 'Pokemon, Magic, sports cards, etc.'
    },
    { 
      value: 'action-figures', 
      label: 'Action Figures', 
      icon: '🤖',
      description: 'Funko Pops, anime figures, collectible toys'
    },
    { 
      value: 'plushies', 
      label: 'Plushies', 
      icon: '🧸',
      description: 'Stuffed animals, soft toys, character plushies'
    },
    { 
      value: 'comics', 
      label: 'Comics', 
      icon: '📚',
      description: 'Comic books, manga, graphic novels'
    },
    { 
      value: 'games', 
      label: 'Games', 
      icon: '🎮',
      description: 'Video games, board games, card games'
    },
    { 
      value: 'other', 
      label: 'Other', 
      icon: '📦',
      description: 'Miscellaneous collectibles'
    }
  ];

  const handleFolderSelect = (folder: Folder) => {
    onFolderSelect(folder);
    setShowFolderModal(false);
    setShowCreateForm(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderData.name.trim()) {
      setCreateError('Folder name is required');
      return;
    }

    // Check for duplicate names
    const existingFolder = folders.find(f => 
      f.name.toLowerCase() === newFolderData.name.trim().toLowerCase()
    );
    if (existingFolder) {
      setCreateError('A folder with this name already exists');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const folderId = await storageService.createFolder({
        userId: 'default-user',
        name: newFolderData.name.trim(),
        description: newFolderData.description.trim() || undefined,
        type: newFolderData.type,
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

      // Get the created folder
      const createdFolder = await storageService.getFolder(folderId);
      if (createdFolder) {
        // Notify parent component about the new folder
        onFolderCreated?.(createdFolder);
        
        // Select the newly created folder
        onFolderSelect(createdFolder);
        
        // Close modals and reset form
        setShowFolderModal(false);
        setShowCreateForm(false);
        setNewFolderData({
          name: '',
          description: '',
          type: 'trading-cards'
        });
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      setCreateError('Failed to create folder. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setNewFolderData({
      name: '',
      description: '',
      type: 'trading-cards'
    });
    setCreateError(null);
  };

  const handleModalClose = () => {
    setShowFolderModal(false);
    setShowCreateForm(false);
    setNewFolderData({
      name: '',
      description: '',
      type: 'trading-cards'
    });
    setCreateError(null);
  };

  return (
    <>
      <Card 
        variant="outlined" 
        padding="md" 
        className={`cursor-pointer hover:border-retro-accent-light transition-all duration-200 ${className}`}
        onClick={() => setShowFolderModal(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {selectedFolder ? getFolderIcon(selectedFolder.type) : '📁'}
            </span>
            <div>
              <h3 className="font-pixel text-retro-accent">
                Adding to: {selectedFolder ? selectedFolder.name : 'Select Folder'}
              </h3>
              <p className="text-retro-accent-light font-pixel-sans text-sm">
                {selectedFolder 
                  ? `AI will be optimized for ${getFolderTypeLabel(selectedFolder.type).toLowerCase()} detection`
                  : 'Choose which folder to add detected items to'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronDown}
              className="flex-shrink-0"
            >
              Change
            </Button>
          </div>
        </div>
      </Card>

      {/* Folder Selection Modal */}
      <Modal
        isOpen={showFolderModal}
        onClose={handleModalClose}
        title={showCreateForm ? "Create New Folder" : "Select Destination Folder"}
        size="md"
      >
        <div className="space-y-pixel-2">
          {!showCreateForm ? (
            <>
              {/* Folder Selection View */}
              <p className="text-retro-accent-light font-pixel-sans text-sm">
                Choose which folder to add the detected items to. The AI will be optimized for that folder's collectible type.
              </p>

              {/* Create New Folder Button */}
              <Card variant="outlined" padding="md" className="border-retro-success">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-retro-success rounded-pixel flex items-center justify-center">
                      <Plus className="w-4 h-4 text-retro-bg-primary" />
                    </div>
                    <div>
                      <h3 className="font-pixel text-retro-success">Create New Folder</h3>
                      <p className="text-retro-accent-light font-pixel-sans text-sm">
                        Add a new folder for your collectibles
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="accent"
                    size="sm"
                    icon={Plus}
                    onClick={() => setShowCreateForm(true)}
                    glow
                  >
                    Create
                  </Button>
                </div>
              </Card>

              {/* Existing Folders */}
              <div className="space-y-pixel">
                {folders.length === 0 ? (
                  <Card variant="outlined" padding="md" className="text-center">
                    <div className="space-y-2">
                      <div className="text-4xl">📁</div>
                      <div>
                        <h3 className="font-pixel text-retro-accent">No Folders Available</h3>
                        <p className="text-retro-accent-light font-pixel-sans text-sm">
                          Create your first folder to organize your items
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  folders.map((folder) => (
                    <Card
                      key={folder.id}
                      variant="outlined"
                      padding="md"
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedFolder?.id === folder.id
                          ? 'border-retro-accent-light bg-retro-accent bg-opacity-10'
                          : 'hover:border-retro-accent-light hover:bg-retro-accent hover:bg-opacity-5'
                      }`}
                      onClick={() => handleFolderSelect(folder)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {getFolderIcon(folder.type)}
                          </span>
                          <div>
                            <h3 className="font-pixel text-retro-accent">
                              {folder.name}
                            </h3>
                            <p className="text-retro-accent-light font-pixel-sans text-sm">
                              {getFolderTypeLabel(folder.type)} • {folder.itemCount} items
                            </p>
                            {folder.description && (
                              <p className="text-retro-accent-light font-pixel-sans text-xs mt-1">
                                {folder.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {selectedFolder?.id === folder.id && (
                          <div className="w-6 h-6 bg-retro-success rounded-pixel flex items-center justify-center">
                            <Check className="w-4 h-4 text-retro-bg-primary" />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>

              <div className="flex justify-end gap-2 pt-pixel-2">
                <Button
                  variant="ghost"
                  onClick={handleModalClose}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Create Folder Form */}
              <p className="text-retro-accent-light font-pixel-sans text-sm">
                Create a new folder to organize your collectibles. Choose the type that best matches what you'll be storing.
              </p>

              <div className="space-y-pixel-2">
                {/* Folder Name */}
                <Input
                  label="Folder Name *"
                  value={newFolderData.name}
                  onChange={(e) => setNewFolderData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Pokemon Cards, Marvel Figures..."
                  fullWidth
                  showCursor
                  disabled={isCreating}
                />

                {/* Folder Type */}
                <div>
                  <label className="block text-sm font-pixel text-retro-accent mb-2">
                    Folder Type *
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {folderTypes.map((type) => (
                      <Card
                        key={type.value}
                        variant="outlined"
                        padding="sm"
                        className={`cursor-pointer transition-all duration-200 ${
                          newFolderData.type === type.value
                            ? 'border-retro-accent-light bg-retro-accent bg-opacity-10'
                            : 'hover:border-retro-accent-light hover:bg-retro-accent hover:bg-opacity-5'
                        }`}
                        onClick={() => setNewFolderData(prev => ({ ...prev, type: type.value }))}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{type.icon}</span>
                            <div>
                              <h4 className="font-pixel text-retro-accent text-sm">
                                {type.label}
                              </h4>
                              <p className="text-retro-accent-light font-pixel-sans text-xs">
                                {type.description}
                              </p>
                            </div>
                          </div>
                          {newFolderData.type === type.value && (
                            <div className="w-5 h-5 bg-retro-success rounded-pixel flex items-center justify-center">
                              <Check className="w-3 h-3 text-retro-bg-primary" />
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-pixel text-retro-accent mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newFolderData.description}
                    onChange={(e) => setNewFolderData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="pixel-input w-full resize-none"
                    placeholder="Brief description of what you'll store in this folder..."
                    disabled={isCreating}
                  />
                </div>

                {/* Error Display */}
                {createError && (
                  <Card variant="outlined" className="border-retro-error">
                    <div className="flex items-center gap-2 text-retro-error">
                      <X className="w-4 h-4" />
                      <p className="font-pixel-sans text-sm">{createError}</p>
                    </div>
                  </Card>
                )}

                {/* AI Optimization Info */}
                <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getFolderIcon(newFolderData.type)}</span>
                    <div>
                      <h4 className="font-pixel text-retro-accent text-sm mb-1">
                        AI Detection Optimization
                      </h4>
                      <p className="text-retro-accent-light font-pixel-sans text-xs">
                        The AI will be optimized to detect {getFolderTypeLabel(newFolderData.type).toLowerCase()} 
                        when you capture items for this folder, improving accuracy and detail extraction.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex justify-end gap-2 pt-pixel-2">
                <Button
                  variant="ghost"
                  onClick={handleCancelCreate}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  onClick={handleCreateFolder}
                  disabled={!newFolderData.name.trim() || isCreating}
                  isLoading={isCreating}
                  glow
                >
                  Create Folder
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};