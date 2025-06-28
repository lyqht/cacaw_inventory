import React, { useState, useEffect } from 'react';
import { Save, X, Camera, Tag, DollarSign, FileText, Image, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ImageUploader } from '../images/ImageUploader';
import { CameraCapture } from '../capture/CameraCapture';
import { CollectibleData, ItemCondition, FolderType } from '../../types';

interface ImageFile {
  id: string;
  file: File;
  url: string;
  altText: string;
  isEdited: boolean;
  originalFile?: File;
}

interface ItemFormProps {
  item?: CollectibleData;
  folderId: string;
  folderType: FolderType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<CollectibleData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  isLoading?: boolean;
}

export const ItemForm: React.FC<ItemFormProps> = ({
  item,
  folderId,
  folderType,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    series: '',
    condition: 'excellent' as ItemCondition,
    description: '',
    notes: '',
    estimatedValue: '',
    purchasePrice: '',
    currency: 'USD',
    tags: [] as string[]
  });

  const [images, setImages] = useState<ImageFile[]>([]);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  
  // Track initial state to detect real changes
  const [initialFormData, setInitialFormData] = useState(formData);
  const [initialImageUrls, setInitialImageUrls] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('ItemForm: Initializing form for item:', item?.id);
      
      const newFormData = item ? {
        name: item.name,
        type: item.type || '',
        series: item.series || '',
        condition: item.condition,
        description: item.description || '',
        notes: item.notes || '',
        estimatedValue: item.estimatedValue?.toString() || '',
        purchasePrice: item.purchasePrice?.toString() || '',
        currency: item.currency,
        tags: [...item.tags]
      } : {
        name: '',
        type: getDefaultType(folderType),
        series: '',
        condition: 'excellent' as ItemCondition,
        description: '',
        notes: '',
        estimatedValue: '',
        purchasePrice: '',
        currency: 'USD',
        tags: []
      };

      // Set form data
      setFormData(newFormData);
      setInitialFormData(newFormData);

      // Set initial image URLs for comparison
      const imageUrls = item ? [
        item.primaryImage,
        ...item.additionalImages
      ].filter(Boolean) : [];
      
      setInitialImageUrls(imageUrls);

      // Load existing images
      const existingImages: ImageFile[] = [];
      if (item?.primaryImage) {
        existingImages.push({
          id: 'primary',
          file: new File([], 'primary.jpg'),
          url: item.primaryImage,
          altText: `${item.name} - Primary Image`,
          isEdited: false
        });
      }
      item?.additionalImages.forEach((url, index) => {
        existingImages.push({
          id: `additional-${index}`,
          file: new File([], `additional-${index}.jpg`),
          url,
          altText: `${item.name} - Image ${index + 2}`,
          isEdited: false
        });
      });
      setImages(existingImages);

      // Reset other states
      setErrors({});
      setNewTag('');
      
      // Mark as initialized after a brief delay to allow ImageUploader to settle
      setTimeout(() => {
        setIsInitialized(true);
        console.log('ItemForm: Initialization complete');
      }, 100);
    } else {
      // Reset when modal closes
      setIsInitialized(false);
    }
  }, [item, folderType, isOpen]);

  const getDefaultType = (folderType: FolderType): string => {
    switch (folderType) {
      case 'trading-cards':
        return 'Trading Card';
      case 'action-figures':
        return 'Action Figure';
      case 'plushies':
        return 'Plushie';
      case 'comics':
        return 'Comic Book';
      case 'games':
        return 'Video Game';
      default:
        return '';
    }
  };

  const conditions: { value: ItemCondition; label: string; color: string }[] = [
    { value: 'mint', label: 'Mint', color: 'text-retro-success' },
    { value: 'near-mint', label: 'Near Mint', color: 'text-green-400' },
    { value: 'excellent', label: 'Excellent', color: 'text-retro-accent' },
    { value: 'good', label: 'Good', color: 'text-yellow-400' },
    { value: 'fair', label: 'Fair', color: 'text-orange-400' },
    { value: 'poor', label: 'Poor', color: 'text-red-400' },
    { value: 'damaged', label: 'Damaged', color: 'text-retro-error' }
  ];

  // Check if form data has actually changed
  const hasFormDataChanged = (): boolean => {
    if (!isInitialized) return false;
    
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  };

  // Check if images have actually changed
  const hasImagesChanged = (): boolean => {
    if (!isInitialized) return false;
    
    const currentImageUrls = images.map(img => img.url);
    
    // Compare lengths first
    if (currentImageUrls.length !== initialImageUrls.length) {
      return true;
    }
    
    // Compare URLs in order
    for (let i = 0; i < currentImageUrls.length; i++) {
      if (currentImageUrls[i] !== initialImageUrls[i]) {
        return true;
      }
    }
    
    // Check if any images have been edited
    return images.some(img => img.isEdited);
  };

  // Check if there are any unsaved changes
  const hasUnsavedChanges = (): boolean => {
    return hasFormDataChanged() || hasImagesChanged();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (formData.estimatedValue && isNaN(Number(formData.estimatedValue))) {
      newErrors.estimatedValue = 'Must be a valid number';
    }

    if (formData.purchasePrice && isNaN(Number(formData.purchasePrice))) {
      newErrors.purchasePrice = 'Must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagesChange = (newImages: ImageFile[]) => {
    console.log('Images changed in form:', newImages.length, 'images');
    setImages(newImages);
  };

  const handleCameraCapture = (imageBlob: Blob) => {
    // Convert camera capture to ImageFile format
    const imageUrl = URL.createObjectURL(imageBlob);
    const newImage: ImageFile = {
      id: crypto.randomUUID(),
      file: new File([imageBlob], 'camera-capture.jpg', { type: 'image/jpeg' }),
      url: imageUrl,
      altText: 'Camera capture',
      isEdited: false
    };

    // Add to existing images
    setImages(prev => [newImage, ...prev]);
    setShowCameraCapture(false);
  };

  // Convert image files to data URLs for storage
  const processImagesForSave = async (imageFiles: ImageFile[]): Promise<{
    primaryImage?: string;
    additionalImages: string[];
    thumbnailImage?: string;
  }> => {
    const processedImages = {
      primaryImage: undefined as string | undefined,
      additionalImages: [] as string[],
      thumbnailImage: undefined as string | undefined
    };

    if (imageFiles.length === 0) {
      return processedImages;
    }

    // Convert first image to primary
    if (imageFiles[0]) {
      try {
        // If it's already a data URL or blob URL, use it directly
        if (imageFiles[0].url.startsWith('data:') || imageFiles[0].url.startsWith('blob:')) {
          // For blob URLs, convert to data URL for persistence
          if (imageFiles[0].url.startsWith('blob:')) {
            const dataUrl = await fileToDataUrl(imageFiles[0].file);
            processedImages.primaryImage = dataUrl;
            processedImages.thumbnailImage = dataUrl;
          } else {
            processedImages.primaryImage = imageFiles[0].url;
            processedImages.thumbnailImage = imageFiles[0].url;
          }
        } else {
          // For new files, convert to data URL
          const dataUrl = await fileToDataUrl(imageFiles[0].file);
          processedImages.primaryImage = dataUrl;
          processedImages.thumbnailImage = dataUrl;
        }
      } catch (error) {
        console.error('Error processing primary image:', error);
      }
    }

    // Convert additional images
    for (let i = 1; i < imageFiles.length; i++) {
      try {
        if (imageFiles[i].url.startsWith('data:')) {
          processedImages.additionalImages.push(imageFiles[i].url);
        } else if (imageFiles[i].url.startsWith('blob:')) {
          const dataUrl = await fileToDataUrl(imageFiles[i].file);
          processedImages.additionalImages.push(dataUrl);
        } else {
          const dataUrl = await fileToDataUrl(imageFiles[i].file);
          processedImages.additionalImages.push(dataUrl);
        }
      } catch (error) {
        console.error(`Error processing additional image ${i}:`, error);
      }
    }

    console.log('Processed images for save:', processedImages);
    return processedImages;
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size === 0) {
        // This is likely an existing image placeholder
        reject(new Error('Empty file'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Show confirmation if there are unsaved image changes
    if (hasImagesChanged() && images.some(img => img.isEdited)) {
      if (!window.confirm('You have edited images. Do you want to save these changes?')) {
        return;
      }
    }

    try {
      // Process images for storage
      const processedImages = await processImagesForSave(images);

      const itemData: Omit<CollectibleData, 'id' | 'createdAt' | 'updatedAt'> = {
        folderId,
        userId: 'default-user', // Will be replaced with actual auth
        name: formData.name.trim(),
        type: formData.type.trim() || undefined,
        series: formData.series.trim() || undefined,
        condition: formData.condition,
        description: formData.description.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : undefined,
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
        currency: formData.currency,
        tags: formData.tags,
        primaryImage: processedImages.primaryImage,
        additionalImages: processedImages.additionalImages,
        thumbnailImage: processedImages.thumbnailImage,
        aiDetected: false,
        aiConfidence: undefined,
        aiPromptUsed: undefined,
        ocrText: undefined,
        lastViewedAt: undefined,
        syncStatus: 'local-only',
        isArchived: false
      };

      console.log('Saving item with data:', itemData);
      await onSave(itemData);
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      setErrors({ submit: 'Failed to save item. Please try again.' });
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleClose = () => {
    const unsavedChanges = hasUnsavedChanges();
    console.log('Attempting to close form. Has unsaved changes:', unsavedChanges);
    
    if (unsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={item ? 'Edit Item' : 'Add New Item'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-pixel-2">
          {/* Enhanced Images Section - Matching Capture Page */}
          <Card variant="outlined" padding="md">
            <div className="space-y-pixel-2">
              <div className="flex items-center justify-between">
                <h3 className="font-pixel text-retro-accent flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Images {images.length > 0 && `(${images.length})`}
                </h3>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    icon={Camera}
                    onClick={() => setShowCameraCapture(true)}
                    disabled={isLoading}
                  >
                    Take Photo
                  </Button>
                </div>
              </div>

              {/* Camera Capture or Image Uploader */}
              {showCameraCapture ? (
                <div className="space-y-pixel-2">
                  <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-5 h-5 text-retro-accent" />
                      <h4 className="font-pixel text-retro-accent">Camera Capture</h4>
                    </div>
                    <CameraCapture
                      onImageCapture={handleCameraCapture}
                      onCancel={() => setShowCameraCapture(false)}
                    />
                  </Card>
                </div>
              ) : (
                <ImageUploader
                  existingImages={item ? [item.primaryImage, ...item.additionalImages].filter(Boolean) : []}
                  onImagesChange={handleImagesChange}
                  maxFiles={10}
                  maxFileSize={5}
                />
              )}
              
              {isInitialized && hasImagesChanged() && (
                <div className="p-2 bg-retro-warning bg-opacity-20 border border-retro-warning rounded-pixel">
                  <p className="text-retro-warning font-pixel-sans text-sm">
                    ⚠️ You have unsaved image changes. Save the item to apply these changes.
                  </p>
                </div>
              )}

              {/* AI Detection Info */}
              <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-retro-accent" />
                  <h4 className="font-pixel text-retro-accent text-sm">Pro Tip</h4>
                </div>
                <p className="text-retro-accent-light font-pixel-sans text-xs">
                  For best results, use the <strong>Capture page</strong> with AI detection to automatically 
                  identify items and extract details. This form is for manual entry or editing existing items.
                </p>
              </Card>
            </div>
          </Card>

          {/* Basic Information */}
          <Card variant="outlined" padding="md">
            <h3 className="font-pixel text-retro-accent mb-pixel-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-pixel-2">
              <Input
                label="Item Name *"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                error={errors.name}
                placeholder="Enter item name..."
                fullWidth
                showCursor
              />
              
              <Input
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                placeholder="e.g., Pokemon Card, Funko Pop..."
                fullWidth
              />
              
              <Input
                label="Series/Set"
                value={formData.series}
                onChange={(e) => setFormData(prev => ({ ...prev, series: e.target.value }))}
                placeholder="e.g., Base Set, Marvel..."
                fullWidth
              />
              
              <div>
                <label className="block text-sm font-pixel text-retro-accent mb-1">
                  Condition *
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as ItemCondition }))}
                  className="pixel-input w-full"
                >
                  {conditions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Valuation */}
          <Card variant="outlined" padding="md">
            <h3 className="font-pixel text-retro-accent mb-pixel-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valuation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-pixel-2">
              <Input
                label="Estimated Value"
                type="number"
                step="0.01"
                min="0"
                value={formData.estimatedValue}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: e.target.value }))}
                error={errors.estimatedValue}
                placeholder="0.00"
                fullWidth
              />
              
              <Input
                label="Purchase Price"
                type="number"
                step="0.01"
                min="0"
                value={formData.purchasePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                error={errors.purchasePrice}
                placeholder="0.00"
                fullWidth
              />
              
              <div>
                <label className="block text-sm font-pixel text-retro-accent mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
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
          </Card>

          {/* Tags */}
          <Card variant="outlined" padding="md">
            <h3 className="font-pixel text-retro-accent mb-pixel-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </h3>
            
            <div className="space-y-pixel">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  Add
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="default"
                      className="cursor-pointer hover:bg-retro-error transition-colors"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Description & Notes */}
          <Card variant="outlined" padding="md">
            <h3 className="font-pixel text-retro-accent mb-pixel-2">
              Additional Details
            </h3>
            
            <div className="space-y-pixel-2">
              <div>
                <label className="block text-sm font-pixel text-retro-accent mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="pixel-input w-full resize-none"
                  placeholder="Brief description of the item..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-pixel text-retro-accent mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="pixel-input w-full resize-none"
                  placeholder="Personal notes, storage location, etc..."
                />
              </div>
            </div>
          </Card>

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-retro-error bg-opacity-20 border-2 border-retro-error rounded-pixel p-pixel">
              <p className="text-retro-error font-pixel-sans text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-pixel-2">
            <Button
              type="button"
              variant="ghost"
              icon={X}
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="accent"
              icon={Save}
              isLoading={isLoading}
              glow
            >
              {item ? 'Update Item' : 'Save Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Camera Capture Modal */}
      {showCameraCapture && (
        <Modal
          isOpen={showCameraCapture}
          onClose={() => setShowCameraCapture(false)}
          title="Take Photo"
          size="lg"
        >
          <CameraCapture
            onImageCapture={handleCameraCapture}
            onCancel={() => setShowCameraCapture(false)}
          />
        </Modal>
      )}
    </>
  );
};