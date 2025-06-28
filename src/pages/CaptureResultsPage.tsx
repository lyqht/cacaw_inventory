import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, X, Plus, GripVertical, Crop, RotateCcw, Check, Edit2, Trash2, Move } from 'lucide-react';
import { DetectionResult, CollectibleData, ItemCondition, Folder } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface CaptureResultsPageProps {
  detectionResult: DetectionResult;
  originalImage: string;
  selectedFolder: Folder;
  onSave: (items: Omit<CollectibleData, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  onCancel: () => void;
  onRetryDetection: () => void;
  isLoading?: boolean;
}

interface EditableItem extends Partial<CollectibleData> {
  tempId: string;
  isSelected: boolean;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CaptureResultsPage: React.FC<CaptureResultsPageProps> = ({
  detectionResult,
  originalImage,
  selectedFolder,
  onSave,
  onCancel,
  onRetryDetection,
  isLoading = false
}) => {
  const [editingItems, setEditingItems] = useState<EditableItem[]>([]);
  const [croppedImages, setCroppedImages] = useState<Record<string, string>>({});
  const [cropMode, setCropMode] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editingTag, setEditingTag] = useState<{ itemId: string; tagIndex: number } | null>(null);
  const [newTagInputs, setNewTagInputs] = useState<Record<string, string>>({});
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const conditions: { value: ItemCondition; label: string; color: string }[] = [
    { value: 'mint', label: 'Mint', color: 'text-retro-success' },
    { value: 'near-mint', label: 'Near Mint', color: 'text-green-400' },
    { value: 'excellent', label: 'Excellent', color: 'text-retro-accent' },
    { value: 'good', label: 'Good', color: 'text-yellow-400' },
    { value: 'fair', label: 'Fair', color: 'text-orange-400' },
    { value: 'poor', label: 'Poor', color: 'text-red-400' },
    { value: 'damaged', label: 'Damaged', color: 'text-retro-error' }
  ];

  // Initialize editing items
  useEffect(() => {
    if (detectionResult?.items) {
      const items = detectionResult.items.map((item, index) => ({
        ...item,
        tempId: `item-${index}`,
        isSelected: true,
        condition: item.condition || 'good',
        currency: item.currency || 'USD',
        tags: item.tags || []
      }));
      setEditingItems(items);
    }
  }, [detectionResult]);

  // Enhanced image cropping functionality with better event handling
  const startCrop = (itemId: string) => {
    setCropMode(itemId);
    setCropArea(null);
    setIsDragging(false);
    console.log('Started crop mode for item:', itemId);
  };

  const cancelCrop = () => {
    setCropMode(null);
    setCropArea(null);
    setIsDragging(false);
    console.log('Cancelled crop mode');
  };

  const getRelativeCoordinates = (e: React.MouseEvent | MouseEvent, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const clientX = 'clientX' in e ? e.clientX : e.clientX;
    const clientY = 'clientY' in e ? e.clientY : e.clientY;
    
    return {
      x: Math.max(0, Math.min(clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(clientY - rect.top, rect.height))
    };
  };

  // Mouse event handlers for cropping
  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!cropMode || !imageRef.current) {
      console.log('Not in crop mode or no image ref');
      return;
    }
    
    // Prevent all default behaviors
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getRelativeCoordinates(e, imageRef.current);
    console.log('Mouse down at:', coords);
    
    setIsDragging(true);
    setDragStart(coords);
    setCropArea({ 
      x: coords.x, 
      y: coords.y, 
      width: 0, 
      height: 0 
    });

    // Add global mouse event listeners for better tracking
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!imageRef.current || !cropMode) return;
      
      e.preventDefault();
      const coords = getRelativeCoordinates(e, imageRef.current);
      
      setCropArea({
        x: Math.min(dragStart.x, coords.x),
        y: Math.min(dragStart.y, coords.y),
        width: Math.abs(coords.x - dragStart.x),
        height: Math.abs(coords.y - dragStart.y)
      });
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
      console.log('Mouse up - crop selection complete');
      
      // Remove global listeners
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    // Add global listeners
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  // Prevent context menu and other interactions during crop
  const handleContextMenu = (e: React.MouseEvent) => {
    if (cropMode) {
      e.preventDefault();
    }
  };

  const handleImageLoad = () => {
    console.log('Image loaded, ready for cropping');
  };

  const applyCrop = async () => {
    if (!cropArea || !cropMode || !imageRef.current || !canvasRef.current) {
      console.log('Missing requirements for crop:', { cropArea, cropMode, imageRef: !!imageRef.current, canvasRef: !!canvasRef.current });
      return;
    }
    
    // Validate crop area
    if (cropArea.width < 10 || cropArea.height < 10) {
      alert('Crop area is too small. Please select a larger area (minimum 10x10 pixels).');
      return;
    }
    
    console.log('Applying crop with area:', cropArea);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    // Calculate actual crop dimensions
    const actualCrop = {
      x: cropArea.x * scaleX,
      y: cropArea.y * scaleY,
      width: cropArea.width * scaleX,
      height: cropArea.height * scaleY
    };

    console.log('Actual crop dimensions:', actualCrop);

    // Set canvas size to crop area
    canvas.width = actualCrop.width;
    canvas.height = actualCrop.height;

    // Draw cropped portion
    ctx.drawImage(
      img,
      actualCrop.x,
      actualCrop.y,
      actualCrop.width,
      actualCrop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Convert to data URL with high quality
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCroppedImages(prev => ({ ...prev, [cropMode]: croppedDataUrl }));
    
    console.log('Crop applied successfully for item:', cropMode);
    
    // Exit crop mode
    cancelCrop();
  };

  const resetCrop = (itemId: string) => {
    setCroppedImages(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
    console.log('Reset crop for item:', itemId);
  };

  // Tag management
  const addTag = (itemId: string) => {
    const newTag = newTagInputs[itemId]?.trim();
    if (!newTag) return;

    setEditingItems(prev => prev.map(item => 
      item.tempId === itemId 
        ? { ...item, tags: [...(item.tags || []), newTag] }
        : item
    ));
    
    setNewTagInputs(prev => ({ ...prev, [itemId]: '' }));
  };

  const removeTag = (itemId: string, tagIndex: number) => {
    setEditingItems(prev => prev.map(item => 
      item.tempId === itemId 
        ? { ...item, tags: item.tags?.filter((_, index) => index !== tagIndex) || [] }
        : item
    ));
  };

  const updateTag = (itemId: string, tagIndex: number, newValue: string) => {
    setEditingItems(prev => prev.map(item => 
      item.tempId === itemId 
        ? { 
            ...item, 
            tags: item.tags?.map((tag, index) => index === tagIndex ? newValue : tag) || []
          }
        : item
    ));
    setEditingTag(null);
  };

  const moveTag = (itemId: string, fromIndex: number, toIndex: number) => {
    setEditingItems(prev => prev.map(item => {
      if (item.tempId !== itemId || !item.tags) return item;
      
      const newTags = [...item.tags];
      const [movedTag] = newTags.splice(fromIndex, 1);
      newTags.splice(toIndex, 0, movedTag);
      
      return { ...item, tags: newTags };
    }));
  };

  // Item management
  const updateItem = (itemId: string, updates: Partial<EditableItem>) => {
    setEditingItems(prev => prev.map(item =>
      item.tempId === itemId ? { ...item, ...updates } : item
    ));
  };

  const toggleItemSelection = (itemId: string) => {
    setEditingItems(prev => prev.map(item =>
      item.tempId === itemId ? { ...item, isSelected: !item.isSelected } : item
    ));
  };

  const handleSave = async () => {
    const selectedItems = editingItems.filter(item => item.isSelected);
    
    if (selectedItems.length === 0) {
      alert('Please select at least one item to save.');
      return;
    }

    try {
      const itemsToSave = selectedItems.map(item => ({
        folderId: selectedFolder.id,
        userId: 'default-user',
        name: item.name || 'Unknown Item',
        type: item.type,
        series: item.series,
        condition: item.condition || 'good',
        description: item.description,
        notes: item.notes,
        estimatedValue: item.estimatedValue,
        purchasePrice: item.purchasePrice,
        currency: item.currency || 'USD',
        tags: item.tags || [],
        primaryImage: croppedImages[item.tempId] || originalImage,
        additionalImages: [],
        thumbnailImage: croppedImages[item.tempId] || originalImage,
        aiDetected: true,
        aiConfidence: item.aiConfidence,
        aiPromptUsed: detectionResult.rawResponse ? 'Gemini 2.0 Flash detection' : undefined,
        ocrText: item.ocrText,
        lastViewedAt: undefined,
        syncStatus: 'local-only' as const,
        isArchived: false
      }));

      await onSave(itemsToSave);
    } catch (error) {
      console.error('Error saving items:', error);
      alert('Failed to save items. Please try again.');
    }
  };

  const hasUnsavedChanges = () => {
    return editingItems.some(item => item.isSelected) || Object.keys(croppedImages).length > 0;
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-retro-bg-primary bg-pixel-grid flex items-center justify-center">
        <LoadingSpinner size="lg" variant="accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-bg-primary bg-pixel-grid p-pixel-2">
      <div className="max-w-7xl mx-auto space-y-pixel-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-pixel text-retro-accent">
              Review & Edit Results
            </h1>
            <p className="text-retro-accent-light font-pixel-sans text-sm">
              {editingItems.filter(item => item.isSelected).length} of {editingItems.length} items selected
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onRetryDetection}
              disabled={isLoading}
            >
              Retry Detection
            </Button>
            <Button
              variant="accent"
              icon={Save}
              onClick={handleSave}
              disabled={editingItems.filter(item => item.isSelected).length === 0 || isLoading}
              glow
            >
              Save Items
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-pixel-2">
          {/* Original Image */}
          <div className="lg:col-span-1">
            <Card variant="outlined" padding="md">
              <div className="flex items-center justify-between mb-pixel-2">
                <h3 className="font-pixel text-retro-accent">Original Image</h3>
                {cropMode && (
                  <Badge variant="warning" glow>
                    <Move className="w-3 h-3 mr-1" />
                    Crop Mode Active
                  </Badge>
                )}
              </div>
              
              <div 
                ref={cropContainerRef}
                className="relative select-none"
                style={{ 
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                <img
                  ref={imageRef}
                  src={originalImage}
                  alt="Original capture"
                  className={`w-full h-auto border-2 border-retro-accent rounded-pixel transition-all duration-200 ${
                    cropMode 
                      ? 'cursor-crosshair border-retro-warning shadow-pixel-glow' 
                      : 'cursor-default'
                  }`}
                  onMouseDown={handleCropMouseDown}
                  onContextMenu={handleContextMenu}
                  onLoad={handleImageLoad}
                  onDragStart={(e) => e.preventDefault()}
                  draggable={false}
                  style={{ 
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    WebkitUserDrag: 'none',
                    WebkitTouchCallout: 'none'
                  }}
                />
                
                {/* Crop overlay - ONLY shows selection area, not blocking overlay */}
                {cropMode && cropArea && cropArea.width > 0 && cropArea.height > 0 && (
                  <div
                    className="absolute border-2 border-retro-warning bg-retro-warning bg-opacity-20 pointer-events-none"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                    }}
                  >
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-retro-warning border border-retro-bg-primary" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-retro-warning border border-retro-bg-primary" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-retro-warning border border-retro-bg-primary" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-retro-warning border border-retro-bg-primary" />
                    
                    {/* Size indicator */}
                    <div className="absolute top-1 left-1 bg-retro-warning text-retro-bg-primary px-1 text-xs font-pixel-sans">
                      {Math.round(cropArea.width)}×{Math.round(cropArea.height)}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Crop Instructions - BELOW the image, not overlaying it */}
              {cropMode && (
                <div className="mt-2 p-3 bg-retro-warning bg-opacity-20 border border-retro-warning rounded-pixel">
                  <div className="flex items-center gap-2 mb-2">
                    <Move className="w-4 h-4 text-retro-warning animate-pixel-pulse" />
                    <p className="font-pixel text-retro-warning text-sm">
                      CROP MODE ACTIVE
                    </p>
                  </div>
                  <p className="font-pixel-sans text-xs text-retro-warning mb-2">
                    <strong>Click and drag on the image above</strong> to select the area you want to keep
                  </p>
                  <p className="font-pixel-sans text-xs text-retro-accent-light">
                    Drag from top-left to bottom-right • Minimum size: 10×10 pixels
                  </p>
                  
                  {/* Crop controls */}
                  <div className="flex justify-center gap-2 mt-3">
                    <Button
                      variant="accent"
                      size="sm"
                      icon={Check}
                      onClick={applyCrop}
                      disabled={!cropArea || cropArea.width < 10 || cropArea.height < 10}
                      glow={cropArea && cropArea.width >= 10 && cropArea.height >= 10}
                    >
                      Apply Crop
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={X}
                      onClick={cancelCrop}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Crop Tips - Only show when NOT in crop mode */}
              {!cropMode && (
                <div className="mt-2 p-2 bg-retro-bg-tertiary border border-retro-accent rounded-pixel">
                  <p className="text-retro-accent font-pixel-sans text-xs">
                    <strong>🎯 Cropping Tips:</strong>
                  </p>
                  <ul className="text-retro-accent-light font-pixel-sans text-xs mt-1 space-y-1">
                    <li>• Click "Crop" button next to any item to start</li>
                    <li>• Click and drag on the image to select area</li>
                    <li>• Yellow border indicates crop mode is active</li>
                    <li>• Cropped images get a green checkmark</li>
                  </ul>
                </div>
              )}
              
              {/* Debug info for development */}
              {cropMode && cropArea && (
                <div className="mt-2 p-2 bg-retro-bg-tertiary border border-retro-accent rounded-pixel">
                  <p className="text-retro-accent-light font-pixel-sans text-xs">
                    Debug: {Math.round(cropArea.x)}, {Math.round(cropArea.y)} - {Math.round(cropArea.width)}×{Math.round(cropArea.height)}
                    {isDragging && <span className="text-retro-warning"> (dragging)</span>}
                  </p>
                </div>
              )}
              
              {/* Hidden canvases for image processing */}
              <canvas ref={canvasRef} className="hidden" />
              <canvas ref={cropCanvasRef} className="hidden" />
            </Card>
          </div>

          {/* Items List */}
          <div className="lg:col-span-2">
            <div className="space-y-pixel-2">
              {editingItems.map((item, index) => (
                <Card
                  key={item.tempId}
                  variant="outlined"
                  padding="md"
                  className={`transition-all duration-200 ${
                    item.isSelected
                      ? 'border-retro-accent-light bg-retro-accent bg-opacity-10'
                      : 'border-retro-accent opacity-60'
                  } ${
                    cropMode === item.tempId ? 'ring-2 ring-retro-warning' : ''
                  }`}
                >
                  <div className="space-y-pixel-2">
                    {/* Item Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.isSelected}
                          onChange={() => toggleItemSelection(item.tempId)}
                          className="w-4 h-4 text-retro-accent bg-retro-bg-tertiary border-retro-accent rounded focus:ring-retro-accent"
                        />
                        <div>
                          <h3 className="font-pixel text-retro-accent">
                            Item {index + 1}
                            {cropMode === item.tempId && (
                              <span className="ml-2 text-retro-warning text-xs animate-pixel-pulse">
                                (Cropping Active)
                              </span>
                            )}
                          </h3>
                          {item.aiConfidence && (
                            <Badge variant="default" size="sm">
                              {Math.round(item.aiConfidence)}% confidence
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Image Controls */}
                      <div className="flex gap-1">
                        {croppedImages[item.tempId] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={RotateCcw}
                            onClick={() => resetCrop(item.tempId)}
                            title="Reset to original"
                            disabled={cropMode === item.tempId}
                          />
                        )}
                        <Button
                          variant={cropMode === item.tempId ? 'warning' : 'ghost'}
                          size="sm"
                          icon={Crop}
                          onClick={() => {
                            if (cropMode === item.tempId) {
                              cancelCrop();
                            } else {
                              startCrop(item.tempId);
                            }
                          }}
                          title={cropMode === item.tempId ? "Cancel crop" : "Crop image"}
                          glow={cropMode === item.tempId}
                        >
                          {cropMode === item.tempId ? 'Cancel' : 'Crop'}
                        </Button>
                      </div>
                    </div>

                    {/* Image Preview */}
                    {(croppedImages[item.tempId] || originalImage) && (
                      <div className="flex items-center gap-2">
                        <div className={`w-24 h-24 border-2 rounded-pixel overflow-hidden ${
                          croppedImages[item.tempId] ? 'border-retro-success' : 'border-retro-accent'
                        }`}>
                          <img
                            src={croppedImages[item.tempId] || originalImage}
                            alt={`Preview for ${item.name}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {croppedImages[item.tempId] && (
                          <Badge variant="success" size="sm">
                            ✂️ Cropped
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Editable Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-pixel">
                      <Input
                        label="Name"
                        value={item.name || ''}
                        onChange={(e) => updateItem(item.tempId, { name: e.target.value })}
                        placeholder="Item name..."
                        fullWidth
                      />

                      <Input
                        label="Type"
                        value={item.type || ''}
                        onChange={(e) => updateItem(item.tempId, { type: e.target.value })}
                        placeholder="Item type..."
                        fullWidth
                      />

                      <Input
                        label="Series"
                        value={item.series || ''}
                        onChange={(e) => updateItem(item.tempId, { series: e.target.value })}
                        placeholder="Series or set..."
                        fullWidth
                      />

                      <div>
                        <label className="block text-sm font-pixel text-retro-accent mb-1">
                          Condition
                        </label>
                        <select
                          value={item.condition || 'good'}
                          onChange={(e) => updateItem(item.tempId, { condition: e.target.value as ItemCondition })}
                          className="pixel-input w-full"
                        >
                          {conditions.map(condition => (
                            <option key={condition.value} value={condition.value}>
                              {condition.label}
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
                        onChange={(e) => updateItem(item.tempId, { 
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
                          onChange={(e) => updateItem(item.tempId, { currency: e.target.value })}
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
                        onChange={(e) => updateItem(item.tempId, { description: e.target.value })}
                        rows={2}
                        className="pixel-input w-full resize-none"
                        placeholder="Item description..."
                      />
                    </div>

                    {/* Tags Management */}
                    <div>
                      <label className="block text-sm font-pixel text-retro-accent mb-2">
                        Tags
                      </label>
                      
                      {/* Existing Tags */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(item.tags || []).map((tag, tagIndex) => (
                          <div
                            key={tagIndex}
                            className="group flex items-center gap-1 bg-retro-accent text-retro-bg-primary px-2 py-1 text-xs font-pixel rounded-pixel border border-retro-accent-teal"
                          >
                            <GripVertical className="w-3 h-3 cursor-move opacity-50 group-hover:opacity-100" />
                            
                            {editingTag?.itemId === item.tempId && editingTag?.tagIndex === tagIndex ? (
                              <input
                                type="text"
                                value={tag}
                                onChange={(e) => updateTag(item.tempId, tagIndex, e.target.value)}
                                onBlur={() => setEditingTag(null)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    setEditingTag(null);
                                  }
                                }}
                                className="bg-transparent border-none outline-none text-retro-bg-primary w-16"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => setEditingTag({ itemId: item.tempId, tagIndex })}
                                className="cursor-pointer"
                              >
                                {tag}
                              </span>
                            )}
                            
                            <button
                              onClick={() => removeTag(item.tempId, tagIndex)}
                              className="opacity-50 hover:opacity-100 hover:text-retro-error"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Add New Tag */}
                      <div className="flex gap-2">
                        <Input
                          value={newTagInputs[item.tempId] || ''}
                          onChange={(e) => setNewTagInputs(prev => ({ 
                            ...prev, 
                            [item.tempId]: e.target.value 
                          }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addTag(item.tempId);
                            }
                          }}
                          placeholder="Add tag..."
                          className="flex-1"
                        />
                        <Button
                          variant="accent"
                          size="sm"
                          icon={Plus}
                          onClick={() => addTag(item.tempId)}
                          disabled={!newTagInputs[item.tempId]?.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>

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
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-pixel-2 border-t border-retro-accent border-opacity-30">
          <div className="text-sm font-pixel-sans text-retro-accent-light">
            {editingItems.filter(item => item.isSelected).length} items selected for saving
            {Object.keys(croppedImages).length > 0 && (
              <span className="ml-2 text-retro-success">
                • {Object.keys(croppedImages).length} image{Object.keys(croppedImages).length !== 1 ? 's' : ''} cropped
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              icon={Save}
              onClick={handleSave}
              disabled={editingItems.filter(item => item.isSelected).length === 0 || isLoading}
              isLoading={isLoading}
              glow
            >
              Save {editingItems.filter(item => item.isSelected).length} Item{editingItems.filter(item => item.isSelected).length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};