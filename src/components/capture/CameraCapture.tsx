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
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Please select a file under 10MB.');
      return;
    }
    
    const imageUrl = URL.createObjectURL(file);
    setCapturedImage(imageUrl);
    setError(null);
  }, []);

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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-pixel text-pixel-gray-900 mb-2">
            Capture Item Photo
          </h2>
          <p className="text-pixel-gray-600 font-pixel-sans">
            Take a photo or upload an image of your collectible item
          </p>
        </div>

        {error && (
          <div className="bg-pixel-error bg-opacity-10 border-2 border-pixel-error rounded-pixel p-3">
            <p className="text-pixel-error font-pixel-sans text-sm">{error}</p>
          </div>
        )}

        <div className="relative bg-pixel-gray-900 rounded-pixel overflow-hidden aspect-video">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-pixel-gray-800">
              <LoadingSpinner size="lg" />
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
            <div className="flex items-center justify-center h-full text-pixel-gray-400">
              <div className="text-center">
                <Camera className="w-16 h-16 mx-auto mb-4" />
                <p className="font-pixel-sans">Camera preview will appear here</p>
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
                  variant="secondary"
                  icon={Camera}
                  onClick={startCamera}
                  disabled={isLoading}
                >
                  Start Camera
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  icon={Camera}
                  onClick={capturePhoto}
                  disabled={isLoading}
                >
                  Take Photo
                </Button>
              )}

              <Button
                variant="secondary"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                Upload File
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                icon={Check}
                onClick={confirmImage}
                disabled={isLoading}
              >
                Use This Photo
              </Button>

              <Button
                variant="secondary"
                icon={RotateCcw}
                onClick={retakePhoto}
                disabled={isLoading}
              >
                Retake
              </Button>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </Card>
  );
};