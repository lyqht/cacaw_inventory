import React, { useState } from 'react';
import { ChevronDown, FolderOpen, Check } from 'lucide-react';
import { Folder } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';

interface FolderSelectorProps {
  selectedFolder: Folder | null;
  folders: Folder[];
  onFolderSelect: (folder: Folder) => void;
  className?: string;
}

export const FolderSelector: React.FC<FolderSelectorProps> = ({
  selectedFolder,
  folders,
  onFolderSelect,
  className = ''
}) => {
  const [showFolderModal, setShowFolderModal] = useState(false);

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

  const handleFolderSelect = (folder: Folder) => {
    onFolderSelect(folder);
    setShowFolderModal(false);
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
        onClose={() => setShowFolderModal(false)}
        title="Select Destination Folder"
        size="md"
      >
        <div className="space-y-pixel-2">
          <p className="text-retro-accent-light font-pixel-sans text-sm">
            Choose which folder to add the detected items to. The AI will be optimized for that folder's collectible type.
          </p>

          <div className="space-y-pixel">
            {folders.length === 0 ? (
              <Card variant="outlined" padding="md" className="text-center">
                <div className="space-y-2">
                  <div className="text-4xl">📁</div>
                  <div>
                    <h3 className="font-pixel text-retro-accent">No Folders Available</h3>
                    <p className="text-retro-accent-light font-pixel-sans text-sm">
                      Create a folder first to organize your items
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
              onClick={() => setShowFolderModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};