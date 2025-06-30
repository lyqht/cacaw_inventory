import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, X, Plus, GripVertical, Crop, RotateCcw, Check, Edit2, Trash2, Move, Search, Image as ImageIcon } from 'lucide-react';
import { DetectionResult, CollectibleData, ItemCondition, Folder } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ImageSearchModal } from '../components/capture/ImageSearchModal';

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
  const [alternativeImages, setAlternativeImages] = useState<Record<string, string>>({});
  const [cropMode, setCropMode] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editingTag, setEditingTag] = useState<{ itemId: string; tagIndex: number } | null>(null);
  const [newTagInputs, setNewTagInputs] = useState<Record<string, string>>({});
  const [showImageSearch, setShowImageSearch] = useState<string | null>(null);
  const [currentDisplayImage, setCurrentDisplayImage] = useState<string>(originalImage);
  
  // Refs for the main image and canvas
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const previewImageRefs = useRef<Record<string, HTMLImageElement | null>>({});
  
  // Ref for the original high-resolution image
  const originalImageRef = useRef<HTMLImageElement>(null);
  
  // Store the actual dimensions and object-fit properties of preview images
  const [previewImageInfo, setPreviewImageInfo] = useState<Record<string, {
    displayWidth: number;
    displayHeight: number;
    naturalWidth: number;
    naturalHeight: number;
    offsetX: number;
    offsetY: number;
    scale: number;
  }>>({});

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

  // Load the original image for high-quality cropping
  useEffect(() => {
    const img = new Image();
    img.src = originalImage;
    img.onload = () => {
      originalImageRef.current = img;
      console.log('Original high-resolution image loaded:', img.naturalWidth, 'x', img.naturalHeight);
    };
    img.onerror = (err) => {
      console.error('Failed to load original high-resolution image:', err);
    };
  }, [originalImage]);

  // Calculate and store preview image dimensions and object-fit properties
  const updatePreviewImageInfo = (itemId: string) => {
    const imgElement = previewImageRefs.current[itemId];
    if (!imgElement) return;
    
    // Get the actual displayed dimensions after object-fit: cover is applied
    const containerWidth = imgElement.parentElement?.clientWidth || 96; // Default to 24px * 4
    const containerHeight = imgElement.parentElement?.clientHeight || 96;
    
    const imgNaturalWidth = imgElement.naturalWidth;
    const imgNaturalHeight = imgElement.naturalHeight;
    
    // Calculate the scaling and positioning that object-fit: cover applies
    let scale: number;
    let offsetX = 0;
    let offsetY = 0;
    
    // Calculate how object-fit: cover works
    const containerRatio = containerWidth / containerHeight;
    const imageRatio = imgNaturalWidth / imgNaturalHeight;
    
    if (containerRatio > imageRatio) {
      // Container is wider than image (relative to their heights)
      // Image will be scaled to match container width
      scale = containerWidth / imgNaturalWidth;
      const scaledHeight = imgNaturalHeight * scale;
      offsetY = (containerHeight - scaledHeight) / 2;
    } else {
      // Container is taller than image (relative to their widths)
      // Image will be scaled to match container height
      scale = containerHeight / imgNaturalHeight;
      const scaledWidth = imgNaturalWidth * scale;
      offsetX = (containerWidth - scaledWidth) / 2;
    }
    
    const displayWidth = imgNaturalWidth * scale;
    const displayHeight = imgNaturalHeight * scale;
    
    console.log(`Preview image info for ${itemId}:`, {
      containerWidth,
      containerHeight,
      imgNaturalWidth,
      imgNaturalHeight,
      scale,
      offsetX,
      offsetY,
      displayWidth,
      displayHeight
    });
    
    setPreviewImageInfo(prev => ({
      ...prev,
      [itemId]: {
        displayWidth,
        displayHeight,
        naturalWidth: imgNaturalWidth,
        naturalHeight: imgNaturalHeight,
        offsetX,
        offsetY,
        scale
      }
    }));
  };

  // Get the current image for display (alternative > cropped > original)
  const getCurrentImage = (itemId?: string): string => {
    if (itemId) {
      return alternativeImages[itemId] || croppedImages[itemId] || currentDisplayImage;
    }
    return currentDisplayImage;
  };

  // Enhanced image cropping functionality with better event handling
  const startCrop = (itemId: string) => {
    setCropMode(itemId);
    setCropArea(null);
    setIsDragging(false);
    console.log('Started crop mode for item:', itemId);
    
    // Ensure we have the preview image info
    updatePreviewImageInfo(itemId);
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
  const handleCropMouseDown = (e: React.MouseEvent, itemId: string) => {
    if (!cropMode || cropMode !== itemId) {
      return;
    }
    
    const imgElement = previewImageRefs.current[itemId];
    if (!imgElement) {
      console.log('No image ref for item:', itemId);
      return;
    }
    
    // Prevent all default behaviors
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getRelativeCoordinates(e, imgElement);
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
      if (!imgElement || !cropMode) return;
      
      e.preventDefault();
      const coords = getRelativeCoordinates(e, imgElement);
      
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

  const handleImageLoad = (itemId: string) => {
    console.log('Image loaded for item:', itemId);
    updatePreviewImageInfo(itemId);
  };

  const applyCrop = async () => {
    if (!cropArea || !cropMode) {
      console.log('Missing requirements for crop:', { cropArea, cropMode });
      return;
    }
    
    const imgElement = previewImageRefs.current[cropMode];
    if (!imgElement || !canvasRef.current || !originalImageRef.current) {
      console.log('Missing image or canvas ref:', { 
        imgElement: !!imgElement, 
        canvasRef: !!canvasRef.current,
        originalImageRef: !!originalImageRef.current
      });
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

    // Get the preview image info for this item
    const info = previewImageInfo[cropMode];
    if (!info) {
      console.error('No preview image info available for item:', cropMode);
      return;
    }
    
    console.log('Preview image info:', info);
    
    // Convert the crop area from the preview image coordinates to the original image coordinates
    // This accounts for object-fit: cover and any scaling/positioning
    
    // First, convert from container coordinates to actual displayed image coordinates
    // (accounting for object-fit: cover positioning)
    const displayX = cropArea.x - info.offsetX;
    const displayY = cropArea.y - info.offsetY;
    
    // Then convert from displayed coordinates to original image coordinates
    const originalX = displayX / info.scale;
    const originalY = displayY / info.scale;
    const originalWidth = cropArea.width / info.scale;
    const originalHeight = cropArea.height / info.scale;
    
    // Ensure coordinates are within bounds of the original image
    const boundedX = Math.max(0, Math.min(originalX, originalImageRef.current.naturalWidth - 1));
    const boundedY = Math.max(0, Math.min(originalY, originalImageRef.current.naturalHeight - 1));
    const boundedWidth = Math.min(originalWidth, originalImageRef.current.naturalWidth - boundedX);
    const boundedHeight = Math.min(originalHeight, originalImageRef.current.naturalHeight - boundedY);
    
    // Set canvas size to the crop dimensions
    canvas.width = boundedWidth;
    canvas.height = boundedHeight;
    
    console.log('Original image crop coordinates:', {
      x: boundedX,
      y: boundedY,
      width: boundedWidth,
      height: boundedHeight
    });

    // Draw the cropped portion from the original high-resolution image
    ctx.drawImage(
      originalImageRef.current,
      boundedX,
      boundedY,
      boundedWidth,
      boundedHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Convert to data URL with high quality
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
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

  // Handle alternative image selection from search
  const handleAlternativeImageSelected = async (imageBlob: Blob, imageUrl: string, itemId: string) => {
    try {
      // Convert blob to data URL for storage
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });

      // Store the alternative image for this item
      setAlternativeImages(prev => ({ ...prev, [itemId]: dataUrl }));
      
      // Update the main display image if this is the first item or no specific item
      if (editingItems.length === 1 || !itemId) {
        setCurrentDisplayImage(dataUrl);
      }

      console.log('Alternative image set for item:', itemId);
    } catch (error) {
      console.error('Error processing alternative image:', error);
      alert('Failed to process the selected image. Please try again.');
    }
  };

  const resetToOriginalImage = (itemId: string) => {
    setAlternativeImages(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
    
    // Also reset crop if it exists
    setCroppedImages(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
    
    console.log('Reset to original image for item:', itemId);
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
        primaryImage: getCurrentImage(item.tempId),
        additionalImages: [],
        thumbnailImage: getCurrentImage(item.tempId),
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
    return editingItems.some(item => item.isSelected) || 
           Object.keys(croppedImages).length > 0 || 
           Object.keys(alternativeImages).length > 0;
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
            <h2 className="text-xl font-pixel text-retro-accent">
              Review & Edit Results
            </h2>
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
                <h3 className="font-pixel text-retro-accent">
                  {Object.keys(alternativeImages).length > 0 ? 'Selected Image' : 'Original Image'}
                </h3>
                <div className="flex gap-1">
                  {cropMode && (
                    <Badge variant="warning" glow>
                      <Move className="w-3 h-3 mr-1" />
                      Crop Mode Active
                    </Badge>
                  )}
                  {Object.keys(alternativeImages).length > 0 && (
                    <Badge variant="success" size="sm">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      Alternative
                    </Badge>
                  )}
                </div>
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
                  src={getCurrentImage()}
                  alt="Current image for editing"
                  className={`w-full h-auto border-2 border-retro-accent rounded-pixel transition-all duration-200 ${
                    cropMode 
                      ? 'cursor-crosshair border-retro-warning shadow-pixel-glow' 
                      : 'cursor-default'
                  }`}
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
              </div>
              
              {/* Image Controls */}
              <div className="mt-2 flex gap-2">
                
                {Object.keys(alternativeImages).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={RotateCcw}
                    onClick={() => {
                      setAlternativeImages({});
                      setCurrentDisplayImage(originalImage);
                    }}
                    disabled={cropMode !== null}
                  >
                    Use Original
                  </Button>
                )}
              </div>
               
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
                        {(croppedImages[item.tempId] || alternativeImages[item.tempId]) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={RotateCcw}
                            onClick={() => {
                              resetCrop(item.tempId);
                              resetToOriginalImage(item.tempId);
                            }}
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

                    {/* Image Preview with Crop Functionality */}
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-24 h-24 border-2 rounded-pixel overflow-hidden relative ${
                          alternativeImages[item.tempId] ? 'border-retro-primary' :
                          croppedImages[item.tempId] ? 'border-retro-success' : 'border-retro-accent'
                        }`}
                      >
                        <img
                          ref={el => {
                            previewImageRefs.current[item.tempId] = el;
                            if (el) {
                              // When the image loads, update its dimensions info
                              el.onload = () => handleImageLoad(item.tempId);
                            }
                          }}
                          src={getCurrentImage(item.tempId)}
                          alt={`Preview for ${item.name}`}
                          className={`w-full h-full object-cover ${
                            cropMode === item.tempId ? 'cursor-crosshair' : ''
                          }`}
                          onMouseDown={(e) => handleCropMouseDown(e, item.tempId)}
                          onContextMenu={handleContextMenu}
                          draggable={false}
                        />
                        
                        {/* Crop overlay - Only visible during crop mode */}
                        {cropMode === item.tempId && cropArea && cropArea.width > 0 && cropArea.height > 0 && (
                          <div
                            className="absolute border-2 border-retro-warning pointer-events-none"
                            style={{
                              left: cropArea.x,
                              top: cropArea.y,
                              width: cropArea.width,
                              height: cropArea.height,
                              backgroundColor: 'transparent'
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
                      <div className="flex flex-col gap-1">
                        {alternativeImages[item.tempId] && (
                          <Badge variant="default" size="sm">
                            🔍 Found Image
                          </Badge>
                        )}
                        {croppedImages[item.tempId] && (
                          <Badge variant="success" size="sm">
                            ✂️ Cropped
                          </Badge>
                        )}
                        {!alternativeImages[item.tempId] && !croppedImages[item.tempId] && (
                          <Badge variant="default" size="sm">
                            📷 Original
                          </Badge>
                        )}
                        
                        {/* Crop Controls - Only visible during crop mode */}
                        {cropMode === item.tempId && (
                          <div className="flex flex-col gap-1 mt-1">
                            <Button
                              variant="accent"
                              size="sm"
                              icon={Check}
                              onClick={applyCrop}
                              disabled={!cropArea || cropArea.width < 10 || cropArea.height < 10}
                              className="text-xs py-0.5 px-1 h-6 min-h-0"
                            >
                              Apply
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={X}
                              onClick={cancelCrop}
                              className="text-xs py-0.5 px-1 h-6 min-h-0"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

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
            {Object.keys(alternativeImages).length > 0 && (
              <span className="ml-2 text-retro-primary">
                • {Object.keys(alternativeImages).length} alternative image{Object.keys(alternativeImages).length !== 1 ? 's' : ''} found
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

      {/* Image Search Modal */}
      <ImageSearchModal
        isOpen={!!showImageSearch}
        onClose={() => setShowImageSearch(null)}
        onImageSelected={(imageBlob, imageUrl) => {
          if (showImageSearch) {
            handleAlternativeImageSelected(imageBlob, imageUrl, showImageSearch);
          }
          setShowImageSearch(null);
        }}
        itemName={showImageSearch ? editingItems.find(item => item.tempId === showImageSearch)?.name || '' : ''}
        itemType={showImageSearch ? editingItems.find(item => item.tempId === showImageSearch)?.type : undefined}
        series={showImageSearch ? editingItems.find(item => item.tempId === showImageSearch)?.series : undefined}
      />
    </div>
  );
};