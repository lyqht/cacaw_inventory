import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, FolderOpen } from 'lucide-react';
import { Folder } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface FolderDeleteModalProps {
  folder: Folder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (folder: Folder) => Promise<void>;
  isLoading?: boolean;
}

export const FolderDeleteModal: React.FC<FolderDeleteModalProps> = ({
  folder,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!folder) return null;

  const expectedText = folder.name;
  const isConfirmationValid = confirmationText === expectedText;

  const handleConfirm = async () => {
    if (!isConfirmationValid) {
      setError('Please type the folder name exactly as shown to confirm deletion.');
      return;
    }

    try {
      setError(null);
      await onConfirm(folder);
      setConfirmationText('');
      onClose();
    } catch (error) {
      console.error('Error deleting folder:', error);
      setError('Failed to delete folder. Please try again.');
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    setError(null);
    onClose();
  };

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      showCloseButton={false}
    >
      <div className="space-y-pixel-2">
        {/* Warning Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-retro-error rounded-pixel flex items-center justify-center mx-auto mb-pixel">
            <AlertTriangle className="w-8 h-8 text-white animate-pixel-pulse" />
          </div>
          
          <h2 className="text-xl font-pixel text-retro-error mb-2">
            Delete Folder
          </h2>
          <p className="text-retro-accent-light font-pixel-sans">
            This action cannot be undone. All items in this folder will also be deleted.
          </p>
        </div>

        {/* Folder Preview */}
        <Card variant="outlined" padding="md" className="border-retro-error">
          <div className="flex items-center gap-pixel">
            <div className="text-2xl">
              {getFolderIcon(folder.type)}
            </div>
            <div className="flex-1">
              <h3 className="font-pixel text-retro-accent">
                {folder.name}
              </h3>
              <p className="text-sm text-retro-accent-light font-pixel-sans">
                {folder.itemCount} items will be deleted
              </p>
              {folder.description && (
                <p className="text-xs text-retro-accent-light font-pixel-sans mt-1">
                  {folder.description}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Warning Details */}
        <Card variant="outlined" padding="md" className="bg-retro-error bg-opacity-10 border-retro-error">
          <h4 className="font-pixel text-retro-error mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            What will be deleted:
          </h4>
          <ul className="space-y-1 text-sm font-pixel-sans text-retro-accent-light">
            <li>• The folder "{folder.name}"</li>
            <li>• All {folder.itemCount} items inside this folder</li>
            <li>• All images and metadata associated with these items</li>
            <li>• All tags and notes for these items</li>
          </ul>
          
          {folder.totalValue && (
            <div className="mt-2 p-2 bg-retro-warning bg-opacity-20 border border-retro-warning rounded-pixel">
              <p className="text-retro-warning font-pixel-sans text-sm">
                ⚠️ Total estimated value: ${folder.totalValue.toFixed(2)}
              </p>
            </div>
          )}
        </Card>

        {/* Confirmation Input */}
        <div>
          <label className="block text-sm font-pixel text-retro-accent mb-2">
            Type the folder name to confirm deletion:
          </label>
          <div className="mb-2">
            <code className="bg-retro-bg-tertiary text-retro-accent font-pixel-sans px-2 py-1 rounded-pixel text-sm">
              {expectedText}
            </code>
          </div>
          <Input
            value={confirmationText}
            onChange={(e) => {
              setConfirmationText(e.target.value);
              setError(null);
            }}
            placeholder={`Type "${expectedText}" to confirm`}
            fullWidth
            showCursor
            disabled={isLoading}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-retro-error bg-opacity-20 border-2 border-retro-error rounded-pixel p-pixel">
            <p className="text-retro-error font-pixel-sans text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-pixel-2">
          <Button
            variant="ghost"
            icon={X}
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            variant="danger"
            icon={Trash2}
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isLoading}
            isLoading={isLoading}
          >
            Delete Forever
          </Button>
        </div>

        {/* Additional Safety Notice */}
        <div className="text-center pt-pixel">
          <p className="text-xs text-retro-accent-light font-pixel-sans">
            💡 Tip: Consider exporting your data before deleting important folders
          </p>
        </div>
      </div>
    </Modal>
  );
};