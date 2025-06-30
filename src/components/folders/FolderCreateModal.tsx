import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { FolderType } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useAppStore } from '../../stores/appStore';

interface FolderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (folderData: {
    name: string;
    description: string;
    type: FolderType;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const FolderCreateModal: React.FC<FolderCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
  isLoading = false
}) => {
  const { preferences } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'trading-cards' as FolderType
  });
  const [error, setError] = useState<string | null>(null);

  // Set default folder type from preferences when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        type: preferences.defaultFolderType || 'trading-cards',
      }));
    }
  }, [isOpen, preferences.defaultFolderType]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Folder name is required');
      return;
    }

    try {
      setError(null);
      await onCreateFolder({
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type
      });
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        type: 'trading-cards'
      });
      onClose();
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Failed to create folder. Please try again.');
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      type: 'trading-cards'
    });
    setError(null);
    onClose();
  };

  const getFolderIcon = (type: FolderType) => {
    const folderType = folderTypes.find(ft => ft.value === type);
    return folderType?.icon || '📦';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Folder"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-pixel-2">
        {/* Folder Name */}
        <Input
          label="Folder Name *"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Pokemon Cards, Marvel Figures..."
          fullWidth
          showCursor
          disabled={isLoading}
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
                  formData.type === type.value
                    ? 'border-retro-accent-light bg-retro-accent bg-opacity-10'
                    : 'hover:border-retro-accent-light hover:bg-retro-accent hover:bg-opacity-5'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
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
                  {formData.type === type.value && (
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
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="pixel-input w-full resize-none"
            placeholder="Brief description of what you'll store in this folder..."
            disabled={isLoading}
          />
        </div>

        {/* Error Display */}
        {error && (
          <Card variant="outlined" className="border-retro-error">
            <div className="flex items-center gap-2 text-retro-error">
              <X className="w-4 h-4" />
              <p className="font-pixel-sans text-sm">{error}</p>
            </div>
          </Card>
        )}

        {/* AI Optimization Info */}
        <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
          <div className="flex items-start gap-2">
            <span className="text-lg">{getFolderIcon(formData.type)}</span>
            <div>
              <h4 className="font-pixel text-retro-accent text-sm mb-1">
                AI Detection Optimization
              </h4>
              <p className="text-retro-accent-light font-pixel-sans text-xs">
                The AI will be optimized to detect {folderTypes.find(ft => ft.value === formData.type)?.label.toLowerCase()} 
                when you capture items for this folder, improving accuracy and detail extraction.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-pixel-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            icon={Plus}
            disabled={!formData.name.trim() || isLoading}
            isLoading={isLoading}
            glow
          >
            Create Folder
          </Button>
        </div>
      </form>
    </Modal>
  );
};