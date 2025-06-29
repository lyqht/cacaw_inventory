import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Upload, RotateCcw, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface CameraCaptureProps {
  onImageCapture: (imageBlob: Blob) => void;
  onCancel?: () => void;
  isModal?: boolean; // New prop to handle modal-specific behavior
  autoStart?: boolean; // New prop to control auto-start behavior
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onImageCapture,
  onCancel,
  isModal = false,
  autoStart = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // Track stream for cleanup
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Enhanced camera initialization with better error handling
  const startCamera = useCallback(async () => {
    console.log('🎥 Starting camera initialization...');
    
    try {
      setIsLoading(true);
      setError(null);
      setPermissionDenied(false);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraSupported(false);
        throw new Error('Camera not supported in this browser. Please use a modern browser or upload a file instead.');
      }

      // Stop any existing stream first
      if (streamRef.current) {
        console.log('🛑 Stopping existing camera stream');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      console.log('📱 Requesting camera access...');
      
      // Enhanced camera constraints for better compatibility
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera but don't require it
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Camera access granted');
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          
          const onLoadedMetadata = () => {
            console.log('📹 Video metadata loaded');
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = (e: Event) => {
            console.error('❌ Video error:', e);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Failed to load video stream'));
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Camera initialization timeout'));
          }, 10000);
        });
        
        await videoRef.current.play();
        setIsStreaming(true);
        console.log('🎬 Camera stream started successfully');
      }
    } catch (err) {
      console.error('❌ Camera initialization failed:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
          setError('Camera permission denied. Please allow camera access or upload a file instead.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera found. Please connect a camera or upload a file instead.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('Camera is being used by another application. Please close other camera apps and try again.');
        } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          setError('Camera does not meet requirements. Trying with basic settings...');
          // Retry with basic constraints
          try {
            const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = basicStream;
            if (videoRef.current) {
              videoRef.current.srcObject = basicStream;
              await videoRef.current.play();
              setIsStreaming(true);
              setError(null);
              console.log('✅ Camera started with basic settings');
            }
          } catch (retryErr) {
            setError('Camera initialization failed. Please upload a file instead.');
          }
        } else {
          setError(err.message || 'Unable to access camera. Please check permissions or try uploading a file.');
        }
      } else {
        setError('Unknown camera error. Please try uploading a file instead.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enhanced cleanup function
  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`🔌 Stopping track: ${track.kind}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    console.log('✅ Camera stopped');
  }, []);

  // Component lifecycle management
  useEffect(() => {
    let mounted = true;
    
    const initializeComponent = async () => {
      console.log('🚀 CameraCapture component initializing...', {
        isModal,
        autoStart,
        mounted
      });
      
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!mounted) {
        console.log('❌ Component unmounted during initialization');
        return;
      }
      
      setIsInitialized(true);
      
      // Auto-start camera for CapturePage (non-modal usage)
      if (autoStart && !isModal && mounted) {
        console.log('🎬 Auto-starting camera for CapturePage');
        await startCamera();
      } else {
        console.log('⏸️ Waiting for manual camera start (modal mode or autoStart disabled)');
      }
    };
    
    initializeComponent();
    
    // Cleanup on unmount
    return () => {
      mounted = false;
      console.log('🧹 CameraCapture component unmounting, cleaning up camera');
      stopCamera();
    };
  }, [autoStart, isModal, startCamera, stopCamera]);

  // Handle visibility changes to stop camera when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isStreaming) {
        console.log('📱 Tab hidden, stopping camera to save resources');
        stopCamera();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isStreaming, stopCamera]);

  const capturePhoto = useCallback(() => {
    console.log('📸 Capturing photo...');
    
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Video or canvas ref not available');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('❌ Could not get canvas context');
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    console.log(`📐 Canvas dimensions: ${canvas.width}x${canvas.height}`);
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Convert to blob with high quality
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        stopCamera();
        console.log('✅ Photo captured successfully');
      } else {
        console.error('❌ Failed to create blob from canvas');
        setError('Failed to capture photo. Please try again.');
      }
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const validateFile = (file: File): string | null => {
    console.log('🔍 Validating file:', file.name, file.type, file.size);
    
    if (!file.type.startsWith('image/')) {
      return 'Please select a valid image file.';
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return 'Image file is too large. Please select a file under 10MB.';
    }
    
    return null;
  };

  const processFile = useCallback(async (file: File) => {
    console.log('📁 Processing file:', file.name, file.type, file.size);
    
    const error = validateFile(file);
    if (error) {
      setError(error);
      return;
    }
    
    try {
      // Create blob from file for consistency
      const blob = new Blob([file], { type: file.type });
      const imageUrl = URL.createObjectURL(blob);
      
      console.log('✅ File processed successfully, setting captured image');
      setCapturedImage(imageUrl);
      setError(null);
      
      // Don't call onImageCapture here - wait for user confirmation
    } catch (err) {
      console.error('❌ Error processing file:', err);
      setError('Failed to process the selected file.');
    }
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log('📤 File upload triggered:', file.name);
    processFile(file);
  }, [processFile]);

  // Enhanced drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      // Only set dragActive to false if we're leaving the drop zone entirely
      const rect = dropZoneRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX;
        const y = e.clientY;
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          setDragActive(false);
        }
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    console.log('🎯 Drop event triggered');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      console.log('📦 Dropped file:', file.name, file.type, file.size);
      processFile(file);
    }
  }, [processFile]);

  const confirmImage = useCallback(async () => {
    if (!capturedImage) return;
    
    try {
      setIsLoading(true);
      
      console.log('✅ Confirming image, calling onImageCapture');
      
      // Convert image URL back to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      onImageCapture(blob);
      
      // Cleanup
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    } catch (err) {
      console.error('❌ Error processing image:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [capturedImage, onImageCapture]);

  const retakePhoto = useCallback(() => {
    console.log('🔄 Retaking photo');
    
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    setError(null);
    startCamera();
  }, [capturedImage, startCamera]);

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

  // Don't render until initialized
  if (!isInitialized) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="md" variant="accent" />
          <span className="ml-2 font-pixel-sans text-retro-accent">Initializing camera...</span>
        </div>
      </Card>
    );
  }

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

        {/* Enhanced Error Display */}
        {error && (
          <div className="bg-retro-error bg-opacity-10 border-2 border-retro-error rounded-pixel p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-retro-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-retro-error font-pixel-sans text-sm">{error}</p>
                {permissionDenied && (
                  <div className="mt-2 text-xs text-retro-error font-pixel-sans">
                    <p><strong>To enable camera:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Click the camera icon in your browser's address bar</li>
                      <li>Select "Allow" for camera permissions</li>
                      <li>Refresh the page and try again</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Camera/Image Display Area */}
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
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-retro-bg-tertiary z-10">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-2 text-retro-accent font-pixel-sans text-sm">
                  {isStreaming ? 'Capturing...' : 'Starting camera...'}
                </p>
              </div>
            </div>
          )}

          {/* Drag Overlay */}
          {dragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-retro-accent bg-opacity-20 z-20">
              <div className="text-center text-retro-accent">
                <Upload className="w-16 h-16 mx-auto mb-4 animate-pixel-pulse" />
                <p className="font-pixel text-lg">Drop image here</p>
                <p className="font-pixel-sans text-sm">Release to upload</p>
              </div>
            </div>
          )}

          {/* Content Display */}
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
            <div className="flex items-center justify-center h-full text-retro-accent-light">
              <div className="text-center">
                <Camera className="w-16 h-16 mx-auto mb-4" />
                <p className="font-pixel-sans">
                  {!cameraSupported 
                    ? 'Camera not supported' 
                    : permissionDenied 
                    ? 'Camera permission needed'
                    : 'Camera preview will appear here'
                  }
                </p>
                <p className="font-pixel-sans text-sm mt-2">
                  Or drag & drop an image file
                </p>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          {!capturedImage ? (
            <>
              {!isStreaming ? (
                <Button
                  variant="accent"
                  icon={Camera}
                  onClick={startCamera}
                  disabled={isLoading || !cameraSupported}
                >
                  {!cameraSupported ? 'Camera Not Available' : 'Start Camera'}
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

              {/* Mobile-specific photo button */}
              <Button
                variant="ghost"
                icon={Camera}
                onClick={handleTakePhotoClick}
                disabled={isLoading}
                className="md:hidden"
              >
                Take Photo (Mobile)
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

        {/* Enhanced Instructions */}
        {!capturedImage && !isStreaming && (
          <div className="text-center p-3 bg-retro-bg-tertiary border border-retro-accent rounded-pixel">
            <p className="text-retro-accent font-pixel-sans text-sm">
              💡 <strong>Multiple ways to add images:</strong>
            </p>
            <ul className="text-retro-accent-light font-pixel-sans text-xs mt-2 space-y-1">
              <li>📷 <strong>Camera:</strong> Click "Start Camera" to take a photo</li>
              <li>📁 <strong>Upload:</strong> Click "Upload File" to select from device</li>
              <li>🖱️ <strong>Drag & Drop:</strong> Drag image files directly onto the preview area</li>
              <li>📱 <strong>Mobile:</strong> Use "Take Photo (Mobile)" for device camera</li>
            </ul>
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