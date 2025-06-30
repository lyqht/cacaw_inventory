import React, { useState, useEffect } from 'react';
import { Save, X, Camera, Tag, DollarSign, FileText, Image, Sparkles, Zap, AlertTriangle, Key } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ImageUploader } from '../images/ImageUploader';
import { CameraCapture } from '../capture/CameraCapture';
import { DetectionResultsModal } from '../ai/DetectionResultsModal';
import { ApiKeySetup } from '../ai/ApiKeySetup';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CollectibleData, ItemCondition, FolderType, DetectionResult } from '../../types';
import { AIDetectionService } from '../../services/aiDetection';
import { StorageService } from '../../services/storage';

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
  
  // AI Detection states
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [showDetectionResults, setShowDetectionResults] = useState(false);
  const [capturedImageForDetection, setCapturedImageForDetection] = useState<string | null>(null);
  const [remainingDetections, setRemainingDetections] = useState<number>(5);
  const [isUsingCustomKey, setIsUsingCustomKey] = useState(false);
  
  // NEW: AI Detection checkbox state
  const [runAIDetection, setRunAIDetection] = useState(true);
  const [pendingImageForDetection, setPendingImageForDetection] = useState<ImageFile | null>(null);
  
  // Track initial state to detect real changes
  const [initialFormData, setInitialFormData] = useState(formData);
  const [initialImageUrls, setInitialImageUrls] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const aiService = AIDetectionService.getInstance();
  const storageService = StorageService.getInstance();

  // Load API key and usage info on component mount
  useEffect(() => {
    const loadApiInfo = async () => {
      try {
        const savedApiKey = await storageService.getSetting('gemini_api_key');
        if (savedApiKey) {
          setApiKey(savedApiKey);
          aiService.setApiKey(savedApiKey);
        }
        
        // Load usage information
        const { remaining, isUsingCustomKey: usingCustom } = await aiService.canUseDetection();
        setRemainingDetections(remaining);
        setIsUsingCustomKey(usingCustom);
      } catch (error) {
        console.error('Error loading API info:', error);
      }
    };
    
    if (isOpen) {
      loadApiInfo();
    }
  }, [isOpen]);

  // Refresh usage info when API key changes
  useEffect(() => {
    const refreshUsageInfo = async () => {
      try {
        const { remaining, isUsingCustomKey: usingCustom } = await aiService.canUseDetection();
        setRemainingDetections(remaining);
        setIsUsingCustomKey(usingCustom);
        
        console.log('🔄 Refreshed usage info:', {
          remaining,
          isUsingCustomKey: usingCustom
        });
      } catch (error) {
        console.error('Error refreshing usage info:', error);
      }
    };

    if (apiKey) {
      refreshUsageInfo();
    }
  }, [apiKey]);

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
      setDetectionResult(null);
      setShowDetectionResults(false);
      setCapturedImageForDetection(null);
      setPendingImageForDetection(null);
      
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

  const handleImagesChange = async (newImages: ImageFile[]) => {
    console.log('Images changed in form:', newImages.length, 'images');
    setImages(newImages);
    
    // NEW: Check if we should run AI detection on new images
    if (runAIDetection && newImages.length > 0) {
      // Find the newest image (one that wasn't in the previous images array)
      const previousUrls = images.map(img => img.url);
      const newImage = newImages.find(img => !previousUrls.includes(img.url));
      
      if (newImage && newImage.file.size > 0) {
        console.log('New image detected, checking if AI detection should run...');
        setPendingImageForDetection(newImage);
        
        // Automatically trigger AI detection after a short delay
        setTimeout(() => {
          handleAIDetectionForImage(newImage);
        }, 500);
      }
    }
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
    
    // NEW: Automatically run AI detection if enabled
    if (runAIDetection) {
      setPendingImageForDetection(newImage);
      setTimeout(() => {
        handleAIDetectionForImage(newImage);
      }, 500);
    }
  };

  // NEW: AI Detection functionality for uploaded images
  const handleAIDetectionForImage = async (imageFile: ImageFile) => {
    // Check if AI detection is available
    const { canUse, remaining, isUsingCustomKey: usingCustom } = await aiService.canUseDetection();
    
    if (!canUse) {
      setShowApiSetup(true);
      return;
    }

    setIsDetecting(true);
    setCapturedImageForDetection(imageFile.url);

    try {
      console.log('Starting AI detection for uploaded image');
      
      const result = await aiService.detectItems(
        imageFile.file,
        folderType,
        undefined // Use default prompt
      );

      console.log('AI Detection Result:', result);
      setDetectionResult(result);
      setShowDetectionResults(true);

      // Update usage info after detection
      const { remaining: newRemaining, isUsingCustomKey: newUsingCustom } = await aiService.canUseDetection();
      setRemainingDetections(newRemaining);
      setIsUsingCustomKey(newUsingCustom);

    } catch (error) {
      console.error('Error in AI detection:', error);
      
      // Create error result
      const errorResult: DetectionResult = {
        items: [],
        confidence: 0,
        processingTime: 0,
        rawResponse: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      setDetectionResult(errorResult);
      setShowDetectionResults(true);
    } finally {
      setIsDetecting(false);
      setPendingImageForDetection(null);
    }
  };

  // AI Detection functionality
  const handleAIDetection = async (imageBlob: Blob, imageUrl: string) => {
    // Check if AI detection is available
    const { canUse, remaining, isUsingCustomKey: usingCustom } = await aiService.canUseDetection();
    
    if (!canUse) {
      setShowApiSetup(true);
      return;
    }

    setIsDetecting(true);
    setCapturedImageForDetection(imageUrl);

    try {
      console.log('Starting AI detection for captured image');
      
      const result = await aiService.detectItems(
        imageBlob,
        folderType,
        undefined // Use default prompt
      );

      console.log('AI Detection Result:', result);
      setDetectionResult(result);
      setShowDetectionResults(true);

      // Update usage info after detection
      const { remaining: newRemaining, isUsingCustomKey: newUsingCustom } = await aiService.canUseDetection();
      setRemainingDetections(newRemaining);
      setIsUsingCustomKey(newUsingCustom);

    } catch (error) {
      console.error('Error in AI detection:', error);
      
      // Create error result
      const errorResult: DetectionResult = {
        items: [],
        confidence: 0,
        processingTime: 0,
        rawResponse: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      setDetectionResult(errorResult);
      setShowDetectionResults(true);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCameraCaptureWithAI = async (imageBlob: Blob) => {
    // First add the image to the form
    handleCameraCapture(imageBlob);
    
    // Then run AI detection on it if enabled
    if (runAIDetection) {
      const imageUrl = URL.createObjectURL(imageBlob);
      await handleAIDetection(imageBlob, imageUrl);
    }
  };

  const handleDetectionResultsSave = async (items: Omit<CollectibleData, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    if (items.length > 0) {
      // Take the first detected item and populate the form
      const detectedItem = items[0];
      
      setFormData(prev => ({
        ...prev,
        name: detectedItem.name || prev.name,
        type: detectedItem.type || prev.type,
        series: detectedItem.series || prev.series,
        condition: detectedItem.condition || prev.condition,
        description: detectedItem.description || prev.description,
        estimatedValue: detectedItem.estimatedValue?.toString() || prev.estimatedValue,
        currency: detectedItem.currency || prev.currency,
        tags: validateAndFilterTags([...prev.tags, ...(detectedItem.tags || [])], detectedItem.type)
      }));
      
      console.log('Populated form with AI detection results');
    }
    
    setShowDetectionResults(false);
    setDetectionResult(null);
    if (capturedImageForDetection) {
      URL.revokeObjectURL(capturedImageForDetection);
      setCapturedImageForDetection(null);
    }
  };

  const handleApiKeySet = async (newApiKey: string) => {
    setApiKey(newApiKey);
    aiService.setApiKey(newApiKey);
    
    // Save API key to local storage
    try {
      await storageService.setSetting('gemini_api_key', newApiKey);
      console.log('API key saved successfully');
      
      // Update usage info
      const { remaining, isUsingCustomKey: usingCustom } = await aiService.canUseDetection();
      setRemainingDetections(remaining);
      setIsUsingCustomKey(usingCustom);
    } catch (error) {
      console.error('Error saving API key:', error);
    }
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

  // NEW: Tag validation function to prevent duplicates with item type
  const validateAndFilterTags = (tags: string[], itemType?: string): string[] => {
    if (!itemType) return tags;
    
    const normalizedType = itemType.toLowerCase().trim();
    
    // Filter out tags that exactly match the item type (case-insensitive)
    const filteredTags = tags.filter(tag => {
      const normalizedTag = tag.toLowerCase().trim();
      return normalizedTag !== normalizedType;
    });
    
    // Remove duplicates while preserving order
    const uniqueTags = filteredTags.filter((tag, index, array) => 
      array.findIndex(t => t.toLowerCase() === tag.toLowerCase()) === index
    );
    
    return uniqueTags;
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

      // Validate and filter tags before saving
      const validatedTags = validateAndFilterTags(formData.tags, formData.type);

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
        tags: validatedTags, // Use validated tags
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
    if (!tag) return;
    
    // Validate the new tag against the current item type
    const validatedTags = validateAndFilterTags([...formData.tags, tag], formData.type);
    
    // Check if the tag was filtered out (meaning it matched the type)
    if (validatedTags.length === formData.tags.length) {
      // Tag was filtered out, show a warning
      if (formData.type && tag === formData.type.toLowerCase()) {
        setErrors({ tag: `Tag "${tag}" matches the item type and will be automatically excluded.` });
        setTimeout(() => setErrors({}), 3000); // Clear error after 3 seconds
      }
      setNewTag('');
      return;
    }
    
    // Check for duplicates
    if (formData.tags.some(existingTag => existingTag.toLowerCase() === tag)) {
      setErrors({ tag: 'This tag already exists.' });
      setTimeout(() => setErrors({}), 3000);
      setNewTag('');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tags: validatedTags
    }));
    setNewTag('');
    setErrors({});
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

  // Check if we're in development mode with unlimited detections
  const isDevUnlimited = aiService.isUnlimitedDetectionsEnabled();
  const shouldShowFreeLimitWarning = !isUsingCustomKey && !isDevUnlimited && remainingDetections === 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={item ? 'Edit Item' : 'Add New Item'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-pixel-2">
          {/* AI Usage Status */}
          <Card variant="outlined" padding="md" className={
            isUsingCustomKey ? 'border-retro-success' : 
            isDevUnlimited ? 'border-retro-primary' :
            remainingDetections > 0 ? 'border-retro-accent' : 'border-retro-warning'
          }>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-pixel flex items-center justify-center ${
                  isUsingCustomKey ? 'bg-retro-success' : 
                  isDevUnlimited ? 'bg-retro-primary' :
                  remainingDetections > 0 ? 'bg-retro-accent' : 'bg-retro-warning'
                }`}>
                  {isUsingCustomKey ? (
                    <Key className="w-3 h-3 text-retro-bg-primary" />
                  ) : (
                    <Zap className="w-3 h-3 text-retro-bg-primary" />
                  )}
                </div>
                <div>
                  <h4 className="font-pixel text-retro-accent text-sm">
                    {isUsingCustomKey ? 'Custom API Key Active' : 
                     isDevUnlimited ? 'Development Mode' :
                     'Free AI Detections'}
                  </h4>
                  <p className="text-retro-accent-light font-pixel-sans text-xs">
                    {isUsingCustomKey 
                      ? 'Unlimited AI detections available'
                      : isDevUnlimited
                      ? 'Unlimited detections for development'
                      : `${remainingDetections} of 5 free detections remaining`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!isUsingCustomKey && !isDevUnlimited && (
                  <Badge 
                    variant={remainingDetections > 0 ? 'default' : 'warning'}
                    size="sm"
                  >
                    {remainingDetections}/5
                  </Badge>
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiSetup(true)}
                >
                  Setup
                </Button>
              </div>
            </div>
          </Card>

          {/* Enhanced Images Section */}
          <Card variant="outlined" padding="md">
            <div className="space-y-pixel-2">
              <div className="flex items-center justify-between">
                <h3 className="font-pixel text-retro-accent flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Images {images.length > 0 && `(${images.length})`}
                </h3>
                
                <div className="flex gap-2">               
                  {images.length > 0 && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={Sparkles}
                      onClick={async () => {
                        if (images[0] && images[0].file.size > 0) {
                          await handleAIDetectionForImage(images[0]);
                        } else {
                          alert('Please add an image first to use AI detection.');
                        }
                      }}
                      disabled={isLoading || isDetecting || shouldShowFreeLimitWarning}
                      isLoading={isDetecting}
                      glow={!shouldShowFreeLimitWarning}
                    >
                      AI Detect
                    </Button>
                  )}
                </div>
              </div>

              {/* AI Detection Status */}
              {isDetecting && (
                <Card variant="outlined" padding="md" className="bg-retro-accent bg-opacity-10 border-retro-accent">
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" variant="accent" />
                    <div>
                      <p className="font-pixel text-retro-accent text-sm">AI Detection in Progress</p>
                      <p className="text-retro-accent-light font-pixel-sans text-xs">
                        Analyzing {pendingImageForDetection ? 'uploaded image' : 'image'} and extracting item details...
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Free Limit Warning */}
              {shouldShowFreeLimitWarning && (
                <Card variant="outlined" className="border-retro-error">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-retro-error" />
                      <div>
                        <h4 className="font-pixel text-retro-error text-sm">Free Limit Reached</h4>
                        <p className="text-retro-error font-pixel-sans text-xs">
                          Add your own Gemini API key to continue using AI detection.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="accent"
                      size="sm"
                      onClick={() => setShowApiSetup(true)}
                    >
                      Add API Key
                    </Button>
                  </div>
                </Card>
              )}

              {/* Camera Capture or Image Uploader */}
              {showCameraCapture ? (
                <div className="space-y-pixel-2">
                  <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-retro-accent" />
                        <h4 className="font-pixel text-retro-accent">Camera Capture</h4>
                      </div>
                    </div>
                    <CameraCapture
                      onImageCapture={runAIDetection && !shouldShowFreeLimitWarning ? handleCameraCaptureWithAI : handleCameraCapture}
                      onCancel={() => setShowCameraCapture(false)}
                    />
                    {runAIDetection && !shouldShowFreeLimitWarning && (
                      <div className="mt-2 p-2 bg-retro-accent bg-opacity-20 border border-retro-accent rounded-pixel">
                        <p className="text-retro-accent font-pixel-sans text-xs">
                          ✨ <strong>AI Detection Enabled:</strong> After taking a photo, AI will automatically 
                          analyze it and suggest item details to fill in the form.
                        </p>
                      </div>
                    )}
                  </Card>
                </div>
              ) : (
                <div className="space-y-pixel-2">
                  <Button
                    type="button"
                    variant="accent"
                    icon={Camera}
                    onClick={() => setShowCameraCapture(true)}
                  >
                    Start capture
                  </Button>
                  <ImageUploader
                    existingImages={item ? [item.primaryImage, ...item.additionalImages].filter(Boolean) : []}
                    onImagesChange={handleImagesChange}
                    maxFiles={10}
                    maxFileSize={5}
                    hideTakePhotoButton={true}
                  />
                  
                  {/* AI Detection Checkbox - Moved here */}
                  <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="runAIDetection"
                          checked={runAIDetection}
                          onChange={(e) => setRunAIDetection(e.target.checked)}
                          className="w-4 h-4 text-retro-accent bg-retro-bg-tertiary border-retro-accent rounded focus:ring-retro-accent"
                          disabled={shouldShowFreeLimitWarning}
                        />
                        <label htmlFor="runAIDetection" className="font-pixel text-retro-accent text-sm">
                          Run AI detection
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {runAIDetection && (
                          <Badge variant="success" size="sm" glow>
                            <Sparkles className="w-3 h-3 mr-1" />
                            Auto-detect
                          </Badge>
                        )}
                        
                        {isDetecting && (
                          <Badge variant="warning" size="sm">
                            <LoadingSpinner size="sm" className="mr-1" />
                            Analyzing...
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-retro-accent-light font-pixel-sans text-xs mt-2">
                      {runAIDetection 
                        ? shouldShowFreeLimitWarning
                          ? 'AI detection disabled - free limit reached. Add your API key to enable.'
                          : 'AI will automatically analyze uploaded images and suggest item details'
                        : 'AI detection disabled - images will be uploaded without analysis'
                      }
                    </p>
                  </Card>
                </div>
              )}
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
                onChange={(e) => {
                  const newType = e.target.value;
                  setFormData(prev => ({ 
                    ...prev, 
                    type: newType,
                    // Re-validate tags when type changes
                    tags: validateAndFilterTags(prev.tags, newType)
                  }));
                }}
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
                  error={errors.tag}
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
              
              {/* Tag validation info */}
              {formData.type && (
                <div className="text-xs text-retro-accent-light font-pixel-sans">
                  💡 Tags that match the item type ("{formData.type}") will be automatically excluded to avoid duplicates.
                </div>
              )}
              
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
              disabled={isLoading || isDetecting}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="accent"
              icon={Save}
              isLoading={isLoading}
              disabled={isDetecting}
              glow
            >
              {item ? 'Update Item' : 'Save Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* API Key Setup Modal */}
      <ApiKeySetup
        isOpen={showApiSetup}
        onClose={() => setShowApiSetup(false)}
        onApiKeySet={handleApiKeySet}
        currentApiKey={apiKey}
      />

      {/* AI Detection Results Modal */}
      <DetectionResultsModal
        isOpen={showDetectionResults}
        onClose={() => {
          setShowDetectionResults(false);
          setDetectionResult(null);
          if (capturedImageForDetection) {
            URL.revokeObjectURL(capturedImageForDetection);
            setCapturedImageForDetection(null);
          }
        }}
        detectionResult={detectionResult}
        originalImage={capturedImageForDetection}
        onSaveItems={handleDetectionResultsSave}
        onRetryDetection={async () => {
          if (images[0] && images[0].file.size > 0) {
            await handleAIDetectionForImage(images[0]);
          }
        }}
        isLoading={isDetecting}
      />
    </>
  );
};