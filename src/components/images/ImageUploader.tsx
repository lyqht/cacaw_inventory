import { Camera, Eye, GripVertical, Plus, RotateCcw, Star, Trash2, Upload, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { ImageEditor } from './ImageEditor';

interface ImageFile {
  id: string;
  file: File;
  url: string;
  altText: string;
  isEdited: boolean;
  originalFile?: File;
}

interface ImageUploaderProps {
  existingImages?: string[];
  onImagesChange: (images: ImageFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  existingImages = [],
  onImagesChange,
  maxFiles = 10,
  maxFileSize = 5,
  className = ''
}) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [editingImage, setEditingImage] = useState<ImageFile | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  // Initialize images when component mounts or existingImages changes
  useEffect(() => {
    console.log('ImageUploader: Initializing with existingImages:', existingImages);
    
    if (existingImages.length > 0) {
      const loadedImages: ImageFile[] = existingImages
        .filter(url => url && url.trim() !== '') // Filter out empty URLs
        .map((url, index) => ({
          id: `existing-${index}-${Date.now()}`, // Add timestamp to ensure uniqueness
          file: new File([], `existing-image-${index}.jpg`, { type: 'image/jpeg' }),
          url: url,
          altText: `Image ${index + 1}`,
          isEdited: false
        }));
      
      console.log('ImageUploader: Setting loaded images:', loadedImages);
      setImages(loadedImages);
      
      // Notify parent immediately
      setTimeout(() => {
        onImagesChange(loadedImages);
      }, 0);
    } else {
      // No existing images, start fresh
      console.log('ImageUploader: No existing images, starting fresh');
      setImages([]);
    }
  }, [existingImages.join(',')]); // Use join to create a stable dependency

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `${file.name}: Invalid file type. Please use JPG, PNG, GIF, or WebP.`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `${file.name}: File too large. Maximum size is ${maxFileSize}MB.`;
    }
    
    return null;
  };

  const compressImage = async (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1920px width)
        const maxWidth = 1920;
        const maxHeight = 1920;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newErrors: string[] = [];
    const newImages: ImageFile[] = [];

    // Check total file limit
    if (images.length + fileArray.length > maxFiles) {
      newErrors.push(`Cannot upload more than ${maxFiles} images total.`);
      setErrors(newErrors);
      return;
    }

    setIsProcessing(true);
    console.log('Processing files:', fileArray.map(f => f.name));

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
        continue;
      }

      const imageId = crypto.randomUUID();
      
      // Show upload progress
      setUploadProgress(prev => ({ ...prev, [imageId]: 0 }));

      try {
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 25) {
          setUploadProgress(prev => ({ ...prev, [imageId]: i }));
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Compress image
        const compressedFile = await compressImage(file);
        const url = URL.createObjectURL(compressedFile);

        const imageFile: ImageFile = {
          id: imageId,
          file: compressedFile,
          url,
          altText: '',
          isEdited: false,
          originalFile: file
        };

        newImages.push(imageFile);
        console.log('Processed image:', imageFile.id, imageFile.url);
        
        // Remove progress indicator
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[imageId];
          return updated;
        });

      } catch (error) {
        console.error('Error processing file:', file.name, error);
        newErrors.push(`Failed to process ${file.name}`);
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[imageId];
          return updated;
        });
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
    } else {
      setErrors([]);
    }

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    
    // Notify parent component immediately
    console.log('Notifying parent of image changes:', updatedImages);
    onImagesChange(updatedImages);
    
    setIsProcessing(false);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [images, maxFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.target.files && e.target.files.length > 0) {
      console.log('File input changed:', e.target.files.length, 'files');
      processFiles(e.target.files);
    }
    
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [images, maxFiles]);

  const removeImage = (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      // Show confirmation for existing images
      if (existingImages.includes(imageToRemove.url)) {
        if (!window.confirm('Are you sure you want to remove this image? This action cannot be undone.')) {
          return;
        }
      }
      
      // Only revoke blob URLs, not data URLs or existing image URLs
      if (imageToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      
      const updatedImages = images.filter(img => img.id !== imageId);
      setImages(updatedImages);
      onImagesChange(updatedImages);
    }
  };

  const updateAltText = (imageId: string, altText: string) => {
    const updatedImages = images.map(img =>
      img.id === imageId ? { ...img, altText } : img
    );
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleEditImage = (image: ImageFile) => {
    setEditingImage(image);
    setShowEditor(true);
  };

  const handleSaveEditedImage = async (editedImageBlob: Blob) => {
    if (!editingImage) return;

    const editedFile = new File([editedImageBlob], editingImage.file.name, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    const newUrl = URL.createObjectURL(editedFile);
    
    // Revoke old URL only if it's a blob URL
    if (editingImage.url.startsWith('blob:')) {
      URL.revokeObjectURL(editingImage.url);
    }

    const updatedImages = images.map(img =>
      img.id === editingImage.id
        ? {
            ...img,
            file: editedFile,
            url: newUrl,
            isEdited: true
          }
        : img
    );

    setImages(updatedImages);
    onImagesChange(updatedImages);
    setShowEditor(false);
    setEditingImage(null);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const handleBrowseClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleTakePhotoClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  }, []);

  // Drag and drop reordering functions
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleImageDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    // Remove the dragged image from its original position
    newImages.splice(draggedIndex, 1);
    
    // Insert it at the new position
    newImages.splice(dropIndex, 0, draggedImage);
    
    setImages(newImages);
    onImagesChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveImageToFirst = (index: number) => {
    if (index === 0) return;
    
    const newImages = [...images];
    const imageToMove = newImages[index];
    
    // Remove from current position
    newImages.splice(index, 1);
    // Add to beginning
    newImages.unshift(imageToMove);
    
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className={`space-y-pixel-2 ${className}`}>
      {/* Conditional Upload Interface */}
      {images.length === 0 ? (
        /* Full Upload Area for No Images */
        <Card
          variant="outlined"
          padding="md"
          className={`transition-all duration-200 ${
            dragActive 
              ? 'border-retro-accent-light bg-retro-accent bg-opacity-10 scale-105' 
              : 'border-retro-accent hover:border-retro-accent-light'
          }`}
        >
          <div
            ref={dropZoneRef}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className="text-center py-pixel-3"
          >
            <div className="space-y-pixel-2">
              <div className="text-4xl animate-pixel-float">
                {dragActive ? '📤' : isProcessing ? '⚡' : '📷'}
              </div>
              
              <div>
                <h3 className="font-pixel text-retro-accent mb-1">
                  {dragActive ? 'Drop images here' : isProcessing ? 'Processing...' : 'Upload Images'}
                </h3>
                <p className="text-retro-accent-light font-pixel-sans text-sm">
                  {isProcessing ? 'Please wait while we process your images' : 'Drag & drop images, click to browse, or take a photo'}
                </p>
                <p className="text-retro-accent-light font-pixel-sans text-xs mt-1">
                  Supports JPG, PNG, GIF, WebP • Max {maxFileSize}MB per file • Up to {maxFiles} images
                </p>
              </div>
              
              {!dragActive && !isProcessing && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="accent"
                    icon={Upload}
                    onClick={handleBrowseClick}
                    disabled={images.length >= maxFiles || isProcessing}
                  >
                    Browse Files
                  </Button>
                  
                  <Button
                    variant="ghost"
                    icon={Camera}
                    onClick={handleTakePhotoClick}
                    disabled={images.length >= maxFiles || isProcessing}
                  >
                    Take Photo
                  </Button>
                </div>
              )}

              {dragActive && (
                <div className="text-retro-accent animate-pixel-pulse">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-pixel text-sm">Release to upload</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        /* Compact Add More Button for Existing Images */
        <div 
          className={`transition-all duration-200 ${
            dragActive 
              ? 'bg-retro-accent bg-opacity-10 border-2 border-retro-accent-light rounded-pixel p-2' 
              : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="accent"
                icon={Plus}
                size="sm"
                onClick={handleBrowseClick}
                disabled={images.length >= maxFiles || isProcessing}
              >
                Add More Images
              </Button>
              
              <Button
                variant="ghost"
                icon={Camera}
                size="sm"
                onClick={handleTakePhotoClick}
                disabled={images.length >= maxFiles || isProcessing}
              >
                Take Photo
              </Button>
            </div>
            
            <div className="text-xs text-retro-accent-light font-pixel-sans">
              {dragActive ? (
                <span className="text-retro-accent font-pixel animate-pixel-pulse">
                  Drop to add more images
                </span>
              ) : (
                <span>
                  {images.length}/{maxFiles} images • Max {maxFileSize}MB each
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFormats.join(',')}
        onChange={handleFileInput}
        className="hidden"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card variant="outlined" padding="md">
          <h4 className="font-pixel text-retro-accent mb-2">Processing Images...</h4>
          {Object.entries(uploadProgress).map(([id, progress]) => (
            <div key={id} className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-pixel-sans text-retro-accent-light">Processing image...</span>
                <span className="font-pixel-sans text-retro-accent">{progress}%</span>
              </div>
              <div className="w-full bg-retro-bg-tertiary border border-retro-accent rounded-pixel overflow-hidden">
                <div
                  className="h-2 bg-retro-accent transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card variant="outlined" className="border-retro-error">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-pixel text-retro-error mb-2">Upload Errors</h4>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-retro-error font-pixel-sans text-sm">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={clearErrors}
            />
          </div>
        </Card>
      )}

      {/* Image Grid with Drag & Drop */}
      {images.length > 0 && (
        <Card variant="outlined" padding="md">
          <div className="flex justify-between items-center mb-pixel-2">
            <h4 className="font-pixel text-retro-accent">
              Uploaded Images ({images.length}/{maxFiles})
            </h4>
            <div className="text-xs text-retro-accent-light font-pixel-sans">
              Drag to reorder • First image is primary
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-pixel-2">
            {images.map((image, index) => (
              <div 
                key={image.id} 
                className={`relative group cursor-move transition-all duration-200 ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverIndex === index ? 'scale-105 ring-2 ring-retro-accent' : ''
                }`}
                draggable
                onDragStart={(e) => handleImageDragStart(e, index)}
                onDragOver={(e) => handleImageDragOver(e, index)}
                onDragLeave={handleImageDragLeave}
                onDrop={(e) => handleImageDrop(e, index)}
                onDragEnd={handleImageDragEnd}
              >
                <Card variant="outlined" padding="none" className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={image.url}
                      alt={image.altText || `Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', image.url);
                        // Don't hide the image, just log the error
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', image.url);
                      }}
                    />
                    
                    {/* Drag Handle */}
                    <div className="absolute top-1 left-1 bg-black bg-opacity-50 rounded-pixel p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-3 h-3 text-white" />
                    </div>
                    
                    {/* Primary Image Indicator */}
                    {index === 0 && (
                      <div className="absolute top-1 right-1 bg-retro-success text-retro-bg-primary px-1 py-0.5 text-xs font-pixel rounded-pixel flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        PRIMARY
                      </div>
                    )}
                    
                    {/* Image Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="flex gap-1">
                        <Button
                          variant="accent"
                          size="sm"
                          icon={Eye}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(image);
                          }}
                          className="min-w-[32px] min-h-[32px] p-1"
                          title="Preview"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          icon={RotateCcw}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditImage(image);
                          }}
                          className="min-w-[32px] min-h-[32px] p-1"
                          title="Edit"
                        />
                        {index !== 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Star}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveImageToFirst(index);
                            }}
                            className="min-w-[32px] min-h-[32px] p-1 bg-retro-warning bg-opacity-80 hover:bg-retro-warning text-white"
                            title="Make Primary"
                          />
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image.id);
                          }}
                          className="min-w-[32px] min-h-[32px] p-1"
                          title="Remove"
                        />
                      </div>
                    </div>
                    
                    {/* Edit Indicator */}
                    {image.isEdited && (
                      <div className="absolute bottom-1 right-1 bg-retro-accent text-retro-bg-primary px-1 py-0.5 text-xs font-pixel rounded-pixel">
                        EDITED
                      </div>
                    )}
                    
                    {/* Image Position Indicator */}
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1 py-0.5 text-xs font-pixel rounded-pixel">
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Alt Text Input */}
                  <div className="p-2">
                    <Input
                      placeholder="Alt text for accessibility..."
                      value={image.altText}
                      onChange={(e) => updateAltText(image.id, e.target.value)}
                      className="text-xs"
                      fullWidth
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </Card>
              </div>
            ))}
          </div>
          
          {/* Reordering Instructions */}
          <div className="mt-pixel-2 p-2 bg-retro-bg-tertiary border border-retro-accent rounded-pixel">
            <p className="text-retro-accent-light font-pixel-sans text-xs">
              💡 <strong>Tips:</strong> Drag images to reorder them. The first image will be used as the primary image. 
              Click the star button to quickly make any image primary. You can also drag & drop new images anywhere to add them.
            </p>
          </div>
        </Card>
      )}

      {/* Image Editor Modal */}
      {editingImage && (
        <ImageEditor
          isOpen={showEditor}
          image={editingImage}
          onClose={() => {
            setShowEditor(false);
            setEditingImage(null);
          }}
          onSave={handleSaveEditedImage}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          size="xl"
          title={`Preview: ${previewImage.file.name}`}
        >
          <div className="text-center">
            <img
              src={previewImage.url}
              alt={previewImage.altText || 'Preview'}
              className="max-w-full max-h-96 mx-auto rounded-pixel border-2 border-retro-accent"
            />
            
            <div className="mt-pixel-2 text-sm text-retro-accent-light font-pixel-sans">
              <p>Size: {(previewImage.file.size / 1024 / 1024).toFixed(2)} MB</p>
              <p>Type: {previewImage.file.type}</p>
              {previewImage.isEdited && <p>Status: Edited</p>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};