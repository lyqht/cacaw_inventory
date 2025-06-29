import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, RotateCcw, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface CameraCaptureProps {
  onImageCapture: (imageBlob: Blob) => void;
  onCancel?: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onImageCapture,
  onCancel
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions or try uploading a file.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select a valid image file.';
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return 'Image file is too large. Please select a file under 10MB.';
    }
    
    return null;
  };

  const processFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setError(error);
      return;
    }
    
    try {
      // Convert file to blob and create URL for preview
      const blob = new Blob([file], { type: file.type });
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImage(imageUrl);
      setError(null);
      
      // Immediately call onImageCapture with the blob
      onImageCapture(blob);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to process the selected file.');
    }
  }, [onImageCapture]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    processFile(file);
  }, [processFile]);

  // Drag and drop handlers
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
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  }, [processFile]);

  const confirmImage = useCallback(async () => {
    if (!capturedImage) return;
    
    try {
      setIsLoading(true);
      
      // Convert image URL back to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      onImageCapture(blob);
      
      // Cleanup
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [capturedImage, onImageCapture]);

  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    setError(null);
    startCamera();
  }, [capturedImage, startCamera]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [stopCamera, capturedImage]);

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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-pixel text-retro-accent mb-2">
            Capture Item Photo
          </h2>
          <p className="text-retro-accent-light font-pixel-sans">
            Take a photo, upload an image, or drag & drop from your computer
          </p>
        </div>

        {error && (
          <div className="bg-retro-error bg-opacity-10 border-2 border-retro-error rounded-pixel p-3">
            <p className="text-retro-error font-pixel-sans text-sm">{error}</p>
          </div>
        )}

        <div 
          ref={dropZoneRef}
          className={`relative bg-retro-bg-tertiary rounded-pixel overflow-hidden aspect-video transition-all duration-200 ${
            dragActive 
              ? 'border-4 border-retro-accent-light bg-retro-accent bg-opacity-10 scale-105' 
              : 'border-2 border-retro-accent'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-retro-bg-tertiary z-10">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Drag overlay */}
          {dragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-retro-accent bg-opacity-20 z-20">
              <div className="text-center text-retro-accent">
                <Upload className="w-16 h-16 mx-auto mb-4 animate-pixel-pulse" />
                <p className="font-pixel text-lg">Drop image here</p>
                <p className="font-pixel-sans text-sm">Release to upload</p>
              </div>
            </div>
          )}

          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured item"
              className="w-full h-full object-cover"
            />
          ) : isStreaming ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <div 
              className="flex items-center justify-center h-full text-retro-accent-light"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Camera className="w-16 h-16 mx-auto mb-4" />
                <p className="font-pixel-sans">Camera preview will appear here</p>
                <p className="font-pixel-sans text-sm mt-2">
                  Or drag & drop an image file
                </p>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {!capturedImage ? (
            <>
              {!isStreaming ? (
                <Button
                  variant="accent"
                  icon={Camera}
                  onClick={startCamera}
                  disabled={isLoading}
                >
                  Start Camera
                </Button>
              ) : (
                <Button
                  variant="accent"
                  icon={Camera}
                  onClick={capturePhoto}
                  disabled={isLoading}
                >
                  Take Photo
                </Button>
              )}

              <Button
                variant="primary"
                icon={Upload}
                onClick={handleBrowseClick}
                disabled={isLoading}
              >
                Upload File
              </Button>

              {onCancel && (
                <Button
                  variant="ghost"
                  icon={X}
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="accent"
                icon={Check}
                onClick={confirmImage}
                disabled={isLoading}
                glow
              >
                Use This Photo
              </Button>

              <Button
                variant="ghost"
                icon={RotateCcw}
                onClick={retakePhoto}
                disabled={isLoading}
              >
                Retake
              </Button>
            </>
          )}
        </div>

        {/* Drag and drop instructions */}
        {!capturedImage && !isStreaming && (
          <div className="text-center p-3 bg-retro-bg-tertiary border border-retro-accent rounded-pixel">
            <p className="text-retro-accent font-pixel-sans text-sm">
              💡 <strong>Pro tip:</strong> You can drag image files directly from your computer onto the preview area above
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </Card>
  );
};