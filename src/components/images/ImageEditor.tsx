import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Save, X, RotateCw, Crop, Sliders, Undo, Redo, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface ImageFile {
  id: string;
  file: File;
  url: string;
  altText: string;
  isEdited: boolean;
  originalFile?: File;
}

interface ImageEditorProps {
  isOpen: boolean;
  image: ImageFile;
  onClose: () => void;
  onSave: (editedBlob: Blob) => void;
}

interface EditState {
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  scale: number;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  isOpen,
  image,
  onClose,
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editHistory, setEditHistory] = useState<EditState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [editState, setEditState] = useState<EditState>({
    rotation: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    crop: null,
    scale: 1
  });

  const [cropMode, setCropMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      const initialState: EditState = {
        rotation: 0,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        crop: null,
        scale: 1
      };
      setEditState(initialState);
      setEditHistory([initialState]);
      setHistoryIndex(0);
      setCropMode(false);
      setPreviewMode(false);
    }
  }, [isOpen]);

  const saveToHistory = useCallback((newState: EditState) => {
    const newHistory = editHistory.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [editHistory, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setEditState(editHistory[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setEditState(editHistory[historyIndex + 1]);
    }
  };

  const updateEditState = (updates: Partial<EditState>) => {
    const newState = { ...editState, ...updates };
    setEditState(newState);
    saveToHistory(newState);
  };

  const rotate = () => {
    updateEditState({ rotation: (editState.rotation + 90) % 360 });
  };

  const handleBrightnessChange = (value: number) => {
    updateEditState({ brightness: value });
  };

  const handleContrastChange = (value: number) => {
    updateEditState({ contrast: value });
  };

  const handleSaturationChange = (value: number) => {
    updateEditState({ saturation: value });
  };

  const startCrop = () => {
    setCropMode(true);
    setPreviewMode(false);
  };

  const applyCrop = (cropArea: { x: number; y: number; width: number; height: number }) => {
    updateEditState({ crop: cropArea });
    setCropMode(false);
  };

  const resetEdits = () => {
    const resetState: EditState = {
      rotation: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      crop: null,
      scale: 1
    };
    setEditState(resetState);
    saveToHistory(resetState);
  };

  const applyFilters = (ctx: CanvasRenderingContext2D) => {
    const { brightness, contrast, saturation } = editState;
    
    if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
      const brightnessValue = brightness / 100;
      const contrastValue = contrast / 100;
      const saturationValue = saturation / 100;
      
      ctx.filter = `brightness(${brightnessValue}) contrast(${contrastValue}) saturate(${saturationValue})`;
    }
  };

  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context
    ctx.save();
    
    // Apply rotation
    if (editState.rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((editState.rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    
    // Apply filters
    applyFilters(ctx);
    
    // Draw image
    if (editState.crop) {
      const { x, y, width, height } = editState.crop;
      ctx.drawImage(
        img,
        x, y, width, height,
        0, 0, canvas.width, canvas.height
      );
    } else {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    
    // Restore context
    ctx.restore();
  }, [editState]);

  useEffect(() => {
    if (isOpen && imageRef.current) {
      renderPreview();
    }
  }, [editState, isOpen, renderPreview]);

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    
    try {
      // Create a new canvas for final output
      const outputCanvas = document.createElement('canvas');
      const outputCtx = outputCanvas.getContext('2d')!;
      
      // Set output dimensions
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      
      // Render final image
      outputCtx.save();
      
      if (editState.rotation !== 0) {
        outputCtx.translate(outputCanvas.width / 2, outputCanvas.height / 2);
        outputCtx.rotate((editState.rotation * Math.PI) / 180);
        outputCtx.translate(-outputCanvas.width / 2, -outputCanvas.height / 2);
      }
      
      applyFilters(outputCtx);
      
      if (editState.crop && imageRef.current) {
        const { x, y, width, height } = editState.crop;
        outputCtx.drawImage(
          imageRef.current,
          x, y, width, height,
          0, 0, outputCanvas.width, outputCanvas.height
        );
      } else if (imageRef.current) {
        outputCtx.drawImage(imageRef.current, 0, 0, outputCanvas.width, outputCanvas.height);
      }
      
      outputCtx.restore();
      
      // Convert to blob
      outputCanvas.toBlob((blob) => {
        if (blob) {
          onSave(blob);
        }
        setIsLoading(false);
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Error saving edited image:', error);
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `edited_${image.file.name}`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Image Editor"
      showCloseButton={false}
    >
      <div className="space-y-pixel-2">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-retro-bg-tertiary border border-retro-accent rounded-pixel">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon={Undo}
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo"
            />
            <Button
              variant="ghost"
              size="sm"
              icon={Redo}
              onClick={redo}
              disabled={historyIndex >= editHistory.length - 1}
              title="Redo"
            />
            <div className="w-px h-6 bg-retro-accent mx-1" />
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCw}
              onClick={rotate}
              title="Rotate 90°"
            />
            <Button
              variant={cropMode ? 'accent' : 'ghost'}
              size="sm"
              icon={Crop}
              onClick={startCrop}
              title="Crop"
            />
            <Button
              variant={previewMode ? 'accent' : 'ghost'}
              size="sm"
              icon={Sliders}
              onClick={() => setPreviewMode(!previewMode)}
              title="Adjustments"
            />
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon={Download}
              onClick={downloadImage}
              title="Download"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={resetEdits}
              title="Reset All"
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-pixel-2">
          {/* Canvas Area */}
          <div className="lg:col-span-2">
            <Card variant="outlined" padding="sm">
              <div className="relative bg-retro-bg-tertiary rounded-pixel overflow-hidden">
                <img
                  ref={imageRef}
                  src={image.url}
                  alt="Original"
                  className="hidden"
                  onLoad={() => {
                    const canvas = canvasRef.current;
                    const img = imageRef.current;
                    if (canvas && img) {
                      canvas.width = Math.min(img.naturalWidth, 800);
                      canvas.height = Math.min(img.naturalHeight, 600);
                      renderPreview();
                    }
                  }}
                />
                
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-96 mx-auto block border border-retro-accent rounded-pixel"
                />
                
                {cropMode && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <p className="font-pixel-sans mb-2">Click and drag to select crop area</p>
                      <div className="flex gap-2">
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => {
                            // Apply crop with current selection
                            applyCrop({ x: 0, y: 0, width: 100, height: 100 });
                          }}
                        >
                          Apply Crop
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCropMode(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Controls Panel */}
          <div className="space-y-pixel-2">
            {/* Adjustments */}
            <Card variant="outlined" padding="md">
              <h4 className="font-pixel text-retro-accent mb-pixel flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Adjustments
              </h4>
              
              <div className="space-y-pixel">
                {/* Brightness */}
                <div>
                  <label className="block text-sm font-pixel-sans text-retro-accent-light mb-1">
                    Brightness: {editState.brightness}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={editState.brightness}
                    onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                    className="w-full h-2 bg-retro-bg-tertiary rounded-pixel appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #000033 0%, #ADD8E6 ${editState.brightness / 2}%, #000033 100%)`
                    }}
                  />
                </div>

                {/* Contrast */}
                <div>
                  <label className="block text-sm font-pixel-sans text-retro-accent-light mb-1">
                    Contrast: {editState.contrast}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={editState.contrast}
                    onChange={(e) => handleContrastChange(Number(e.target.value))}
                    className="w-full h-2 bg-retro-bg-tertiary rounded-pixel appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #000033 0%, #ADD8E6 ${editState.contrast / 2}%, #000033 100%)`
                    }}
                  />
                </div>

                {/* Saturation */}
                <div>
                  <label className="block text-sm font-pixel-sans text-retro-accent-light mb-1">
                    Saturation: {editState.saturation}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={editState.saturation}
                    onChange={(e) => handleSaturationChange(Number(e.target.value))}
                    className="w-full h-2 bg-retro-bg-tertiary rounded-pixel appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #000033 0%, #ADD8E6 ${editState.saturation / 2}%, #000033 100%)`
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* Image Info */}
            <Card variant="outlined" padding="md">
              <h4 className="font-pixel text-retro-accent mb-pixel">Image Info</h4>
              <div className="space-y-1 text-sm font-pixel-sans text-retro-accent-light">
                <p>Name: {image.file.name}</p>
                <p>Size: {(image.file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p>Type: {image.file.type}</p>
                <p>Rotation: {editState.rotation}°</p>
                {editState.crop && (
                  <p>Cropped: Yes</p>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card variant="outlined" padding="md">
              <h4 className="font-pixel text-retro-accent mb-pixel">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateEditState({ brightness: 120, contrast: 110 })}
                >
                  Brighten
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateEditState({ brightness: 80, contrast: 120 })}
                >
                  Darken
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateEditState({ saturation: 150 })}
                >
                  Vibrant
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateEditState({ saturation: 0 })}
                >
                  B&W
                </Button>
              </div>
            </Card>
          </div>
        </div>

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
          
          <Button
            variant="accent"
            icon={Save}
            onClick={handleSave}
            isLoading={isLoading}
            glow
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};