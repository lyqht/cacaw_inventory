import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, RotateCw, Crop, Sliders, Save, Trash2, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

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
        for (let i = 0; i <= 100; i += 20) {
          setUploadProgress(prev => ({ ...prev, [imageId]: i }));
          await new Promise(resolve => setTimeout(resolve, 100));
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
        
        // Remove progress indicator
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[imageId];
          return updated;
        });

      } catch (error) {
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
    onImagesChange(updatedImages);
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

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeImage = (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      // Show confirmation for existing images
      if (existingImages.includes(imageToRemove.url)) {
        if (!window.confirm('Are you sure you want to remove this image? This action cannot be undone.')) {
          return;
        }
      }
      
      URL.revokeObjectURL(imageToRemove.url);
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
    
    // Revoke old URL
    URL.revokeObjectURL(editingImage.url);

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

  return (
    <div className={`space-y-pixel-2 ${className}`}>
      {/* Upload Area */}
      <Card
        variant="outlined"
        padding="md"
        className={`transition-all duration-200 ${
          dragActive 
            ? 'border-retro-accent-light bg-retro-accent bg-opacity-10' 
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
              {dragActive ? '📤' : '📷'}
            </div>
            
            <div>
              <h3 className="font-pixel text-retro-accent mb-1">
                {dragActive ? 'Drop images here' : 'Upload Images'}
              </h3>
              <p className="text-retro-accent-light font-pixel-sans text-sm">
                Drag & drop images or click to browse
              </p>
              <p className="text-retro-accent-light font-pixel-sans text-xs mt-1">
                Supports JPG, PNG, GIF, WebP • Max {maxFileSize}MB per file • Up to {maxFiles} images
              </p>
            </div>
            
            <div className="flex justify-center gap-2">
              <Button
                variant="accent"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= maxFiles}
              >
                Browse Files
              </Button>
              
              <Button
                variant="ghost"
                icon={Camera}
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment');
                    fileInputRef.current.click();
                  }
                }}
                disabled={images.length >= maxFiles}
              >
                Take Photo
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFormats.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card variant="outlined" padding="md">
          <h4 className="font-pixel text-retro-accent mb-2">Uploading...</h4>
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

      {/* Image Grid */}
      {images.length > 0 && (
        <Card variant="outlined" padding="md">
          <div className="flex justify-between items-center mb-pixel-2">
            <h4 className="font-pixel text-retro-accent">
              Uploaded Images ({images.length}/{maxFiles})
            </h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-pixel-2">
            {images.map((image, index) => (
              <div key={image.id} className="relative group">
                <Card variant="outlined" padding="none" className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={image.url}
                      alt={image.altText || `Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Image Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="flex gap-1">
                        <Button
                          variant="accent"
                          size="sm"
                          icon={Eye}
                          onClick={() => setPreviewImage(image)}
                          className="min-w-[32px] min-h-[32px] p-1"
                          title="Preview"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Crop}
                          onClick={() => handleEditImage(image)}
                          className="min-w-[32px] min-h-[32px] p-1"
                          title="Edit"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => removeImage(image.id)}
                          className="min-w-[32px] min-h-[32px] p-1 bg-retro-error bg-opacity-80 hover:bg-retro-error text-white"
                          title="Remove"
                        />
                      </div>
                    </div>
                    
                    {/* Edit Indicator */}
                    {image.isEdited && (
                      <div className="absolute top-1 right-1 bg-retro-accent text-retro-bg-primary px-1 py-0.5 text-xs font-pixel rounded-pixel">
                        EDITED
                      </div>
                    )}
                  </div>
                  
                  {/* Alt Text Input */}
                  <div className="p-2">
                    <Input
                      placeholder="Alt text for accessibility..."
                      value={image.altText}
                      onChange={(e) => updateAltText(image.id, e.target.value)}
                      className="text-xs"
                      fullWidth
                    />
                  </div>
                </Card>
              </div>
            ))}
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