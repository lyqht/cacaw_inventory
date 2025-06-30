import React, { useState, useEffect } from 'react';
import { Check, X, Edit, Sparkles, AlertTriangle, RefreshCw, Save, Eye } from 'lucide-react';
import { DetectionResult, CollectibleData, ItemCondition, Folder } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CaptureResultsPage } from '../../pages/CaptureResultsPage';

interface DetectionResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectionResult: DetectionResult | null;
  originalImage: string | null;
  onSaveItems: (items: Omit<CollectibleData, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  onRetryDetection: () => void;
  isLoading?: boolean;
  folderId?: string;
  folderType?: string;
}

// Utility to generate a thumbnail from an image URL
const generateThumbnail = async (imageUrl: string, maxSize = 96): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.naturalWidth;
      let height = img.naturalHeight;
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

export const DetectionResultsModal: React.FC<DetectionResultsModalProps> = ({
  isOpen,
  onClose,
  detectionResult,
  originalImage,
  onSaveItems,
  onRetryDetection,
  isLoading = false,
  folderId,
  folderType
}) => {
  const [editingItems, setEditingItems] = useState<Partial<CollectibleData>[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  // Initialize editing items when detection result changes
  useEffect(() => {
    if (detectionResult?.items) {
      setEditingItems([...detectionResult.items]);
      // Select all items by default
      setSelectedItems(new Set(detectionResult.items.map((_, index) => index)));
    }
  }, [detectionResult]);

  // Generate thumbnails for each detected item when the modal opens or the image changes
  useEffect(() => {
    let isMounted = true;
    if (originalImage && detectionResult?.items?.length) {
      Promise.all(
        detectionResult.items.map(() => generateThumbnail(originalImage, 96))
      ).then((thumbs) => {
        if (isMounted) setThumbnails(thumbs);
      });
    } else {
      setThumbnails([]);
    }
    return () => { isMounted = false; };
  }, [originalImage, detectionResult]);

  // Construct a dummy Folder object for CaptureResultsPage
  const dummyFolder: Folder = {
    id: folderId || 'temp-folder',
    userId: 'default-user',
    name: 'Detected Items',
    type: folderType || 'other',
    source: 'local',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    itemCount: 0,
    isArchived: false,
    syncStatus: 'local-only',
    metadata: {
      color: undefined,
      icon: undefined,
      sortOrder: 'name',
      sortDirection: 'asc',
      viewMode: 'grid',
    },
  };

  if (!detectionResult) return null;

  const conditions: ItemCondition[] = [
    'mint', 'near-mint', 'excellent', 'good', 'fair', 'poor', 'damaged'
  ];

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'mint':
        return 'text-retro-success font-bold';
      case 'near-mint':
        return 'text-green-300 font-bold';
      case 'excellent':
        return 'text-retro-accent font-bold';
      case 'good':
        return 'text-yellow-300 font-bold';
      case 'fair':
        return 'text-orange-300 font-bold';
      case 'poor':
        return 'text-red-300 font-bold';
      case 'damaged':
        return 'text-retro-error font-bold';
      default:
        return 'text-retro-accent-light font-bold';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-retro-success';
    if (confidence >= 60) return 'text-retro-accent';
    if (confidence >= 40) return 'text-yellow-400';
    return 'text-retro-error';
  };

  const updateItem = (index: number, updates: Partial<CollectibleData>) => {
    const newItems = [...editingItems];
    newItems[index] = { ...newItems[index], ...updates };
    setEditingItems(newItems);
  };

  const toggleItemSelection = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const selectAllItems = () => {
    setSelectedItems(new Set(editingItems.map((_, index) => index)));
  };

  const deselectAllItems = () => {
    setSelectedItems(new Set());
  };

  const handleSaveSelected = async () => {
    const selectedItemsData = Array.from(selectedItems)
      .map(index => editingItems[index])
      .filter(item => item) as Omit<CollectibleData, 'id' | 'createdAt' | 'updatedAt'>[];

    if (selectedItemsData.length === 0) {
      alert('Please select at least one item to save.');
      return;
    }

    try {
      await onSaveItems(selectedItemsData);
      onClose();
    } catch (error) {
      console.error('Error saving items:', error);
      alert('Failed to save items. Please try again.');
    }
  };

  const hasError = detectionResult.error || detectionResult.items.length === 0;
  const hasLowConfidence = detectionResult.confidence < 50;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="AI Detection Results" showCloseButton={false}>
      {detectionResult && originalImage && (
        <CaptureResultsPage
          detectionResult={detectionResult}
          originalImage={originalImage}
          selectedFolder={dummyFolder}
          onSave={onSaveItems}
          onCancel={onClose}
          onRetryDetection={onRetryDetection}
          isLoading={isLoading}
        />
      )}
    </Modal>
  );
};