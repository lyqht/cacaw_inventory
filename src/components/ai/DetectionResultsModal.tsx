import React, { useState } from 'react';
import { Check, X, Edit, Sparkles, AlertTriangle, RefreshCw, Save, Eye } from 'lucide-react';
import { DetectionResult, CollectibleData, ItemCondition } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface DetectionResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectionResult: DetectionResult | null;
  originalImage: string | null;
  onSaveItems: (items: Omit<CollectibleData, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  onRetryDetection: () => void;
  isLoading?: boolean;
}

export const DetectionResultsModal: React.FC<DetectionResultsModalProps> = ({
  isOpen,
  onClose,
  detectionResult,
  originalImage,
  onSaveItems,
  onRetryDetection,
  isLoading = false
}) => {
  const [editingItems, setEditingItems] = useState<Partial<CollectibleData>[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showRawResponse, setShowRawResponse] = useState(false);

  // Initialize editing items when detection result changes
  React.useEffect(() => {
    if (detectionResult?.items) {
      setEditingItems([...detectionResult.items]);
      // Select all items by default
      setSelectedItems(new Set(detectionResult.items.map((_, index) => index)));
    }
  }, [detectionResult]);

  if (!detectionResult) return null;

  const conditions: ItemCondition[] = [
    'mint', 'near-mint', 'excellent', 'good', 'fair', 'poor', 'damaged'
  ];

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'mint':
        return 'text-retro-success';
      case 'near-mint':
        return 'text-green-400';
      case 'excellent':
        return 'text-retro-accent';
      case 'good':
        return 'text-yellow-400';
      case 'fair':
        return 'text-orange-400';
      case 'poor':
        return 'text-red-400';
      case 'damaged':
        return 'text-retro-error';
      default:
        return 'text-retro-accent-light';
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="AI Detection Results"
      showCloseButton={false}
    >
      <div className="space-y-pixel-2">
        {/* Header with Overall Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-retro-accent rounded-pixel flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-retro-bg-primary animate-pixel-pulse" />
            </div>
            <div>
              <h2 className="font-pixel text-retro-accent">
                {detectionResult.items.length} Item{detectionResult.items.length !== 1 ? 's' : ''} Detected
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-pixel-sans text-retro-accent-light">
                  Confidence: 
                </span>
                <span className={`font-pixel-sans ${getConfidenceColor(detectionResult.confidence)}`}>
                  {Math.round(detectionResult.confidence)}%
                </span>
                <span className="font-pixel-sans text-retro-accent-light">
                  • {detectionResult.processingTime}ms
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              icon={RefreshCw}
              size="sm"
              onClick={onRetryDetection}
              disabled={isLoading}
            >
              Retry
            </Button>
            <Button
              variant="ghost"
              icon={X}
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Error State */}
        {hasError && (
          <Card variant="outlined" className="border-retro-error">
            <div className="flex items-center gap-2 text-retro-error">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <h3 className="font-pixel">Detection Failed</h3>
                <p className="font-pixel-sans text-sm mt-1">
                  {detectionResult.error || 'No items could be detected in this image.'}
                </p>
              </div>
            </div>
            <div className="mt-pixel flex gap-2">
              <Button
                variant="accent"
                icon={RefreshCw}
                size="sm"
                onClick={onRetryDetection}
                disabled={isLoading}
              >
                Try Again
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Low Confidence Warning */}
        {!hasError && hasLowConfidence && (
          <Card variant="outlined" className="border-retro-warning">
            <div className="flex items-center gap-2 text-retro-warning">
              <AlertTriangle className="w-4 h-4" />
              <p className="font-pixel-sans text-sm">
                Low confidence detection. Please review the results carefully before saving.
              </p>
            </div>
          </Card>
        )}

        {/* Image Preview */}
        {originalImage && (
          <Card variant="outlined" padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-retro-accent" />
              <span className="font-pixel text-retro-accent text-sm">Original Image</span>
            </div>
            <div className="max-h-48 overflow-hidden rounded-pixel border border-retro-accent">
              <img
                src={originalImage}
                alt="Analyzed image"
                className="w-full h-full object-contain bg-retro-bg-tertiary"
              />
            </div>
          </Card>
        )}

        {/* Items List */}
        {!hasError && detectionResult.items.length > 0 && (
          <>
            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-pixel-sans text-retro-accent-light text-sm">
                  {selectedItems.size} of {editingItems.length} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllItems}
                  disabled={selectedItems.size === editingItems.length}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllItems}
                  disabled={selectedItems.size === 0}
                >
                  Deselect All
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                icon={Eye}
                onClick={() => setShowRawResponse(!showRawResponse)}
              >
                {showRawResponse ? 'Hide' : 'Show'} Raw Response
              </Button>
            </div>

            {/* Raw Response */}
            {showRawResponse && (
              <Card variant="outlined" padding="md">
                <h4 className="font-pixel text-retro-accent mb-2">Raw AI Response</h4>
                <pre className="text-xs font-pixel-sans text-retro-accent-light bg-retro-bg-tertiary p-2 rounded-pixel overflow-auto max-h-32">
                  {detectionResult.rawResponse}
                </pre>
              </Card>
            )}

            {/* Items Grid */}
            <div className="space-y-pixel">
              {editingItems.map((item, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  padding="md"
                  className={`transition-all duration-200 ${
                    selectedItems.has(index)
                      ? 'border-retro-accent-light bg-retro-accent bg-opacity-10'
                      : 'border-retro-accent hover:border-retro-accent-light'
                  }`}
                >
                  <div className="space-y-pixel">
                    {/* Item Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(index)}
                          onChange={() => toggleItemSelection(index)}
                          className="w-4 h-4 text-retro-accent bg-retro-bg-tertiary border-retro-accent rounded focus:ring-retro-accent"
                        />
                        <div>
                          <h3 className="font-pixel text-retro-accent">
                            Item {index + 1}
                          </h3>
                          {item.aiConfidence && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-pixel-sans text-retro-accent-light">
                                Confidence:
                              </span>
                              <Badge
                                variant={item.aiConfidence >= 80 ? 'success' : item.aiConfidence >= 60 ? 'default' : 'warning'}
                                size="sm"
                              >
                                {Math.round(item.aiConfidence)}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-pixel">
                      <Input
                        label="Name"
                        value={item.name || ''}
                        onChange={(e) => updateItem(index, { name: e.target.value })}
                        placeholder="Item name..."
                        fullWidth
                      />

                      <Input
                        label="Type"
                        value={item.type || ''}
                        onChange={(e) => updateItem(index, { type: e.target.value })}
                        placeholder="Item type..."
                        fullWidth
                      />

                      <Input
                        label="Series"
                        value={item.series || ''}
                        onChange={(e) => updateItem(index, { series: e.target.value })}
                        placeholder="Series or set..."
                        fullWidth
                      />

                      <div>
                        <label className="block text-sm font-pixel text-retro-accent mb-1">
                          Condition
                        </label>
                        <select
                          value={item.condition || 'good'}
                          onChange={(e) => updateItem(index, { condition: e.target.value as ItemCondition })}
                          className="pixel-input w-full"
                        >
                          {conditions.map(condition => (
                            <option key={condition} value={condition}>
                              {condition.split('-').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label="Estimated Value"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.estimatedValue?.toString() || ''}
                        onChange={(e) => updateItem(index, { 
                          estimatedValue: e.target.value ? Number(e.target.value) : undefined 
                        })}
                        placeholder="0.00"
                        fullWidth
                      />

                      <div>
                        <label className="block text-sm font-pixel text-retro-accent mb-1">
                          Currency
                        </label>
                        <select
                          value={item.currency || 'USD'}
                          onChange={(e) => updateItem(index, { currency: e.target.value })}
                          className="pixel-input w-full"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CAD">CAD ($)</option>
                          <option value="JPY">JPY (¥)</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-pixel text-retro-accent mb-1">
                        Description
                      </label>
                      <textarea
                        value={item.description || ''}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        rows={2}
                        className="pixel-input w-full resize-none"
                        placeholder="Item description..."
                      />
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div>
                        <label className="block text-sm font-pixel text-retro-accent mb-1">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="default" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* OCR Text */}
                    {item.ocrText && (
                      <div>
                        <label className="block text-sm font-pixel text-retro-accent mb-1">
                          Detected Text
                        </label>
                        <p className="text-xs font-pixel-sans text-retro-accent-light bg-retro-bg-tertiary p-2 rounded-pixel">
                          {item.ocrText}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-pixel-2 border-t border-retro-accent border-opacity-30">
          <Button
            variant="ghost"
            icon={X}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>

          {!hasError && (
            <Button
              variant="accent"
              icon={Save}
              onClick={handleSaveSelected}
              disabled={selectedItems.size === 0 || isLoading}
              isLoading={isLoading}
              glow
            >
              Save {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};