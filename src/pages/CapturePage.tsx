import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { CameraCapture } from '../components/capture/CameraCapture';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const CapturePage: React.FC = () => {
  const { setCurrentView, setLoading, isLoading } = useAppStore();
  const [captureStep, setCaptureStep] = useState<'capture' | 'processing' | 'review'>('capture');
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);

  const handleImageCapture = async (imageBlob: Blob) => {
    setCapturedImage(imageBlob);
    setCaptureStep('processing');
    setLoading(true);

    try {
      // TODO: Implement AI detection here
      // For now, simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCaptureStep('review');
    } catch (error) {
      console.error('Error processing image:', error);
      // Handle error - maybe show error state
    } finally {
      setLoading(false);
    }
  };

  const handleBackToFolders = () => {
    setCurrentView('folders');
    setCaptureStep('capture');
    setCapturedImage(null);
  };

  if (captureStep === 'processing') {
    return (
      <div className="min-h-screen bg-pixel-gray-100 flex items-center justify-center p-4">
        <Card className="text-center max-w-md w-full">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-pixel-accent rounded-pixel flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-white animate-pixel-pulse" />
            </div>
            
            <div>
              <h2 className="text-xl font-pixel text-pixel-gray-900 mb-2">
                AI Magic in Progress
              </h2>
              <p className="text-pixel-gray-600 font-pixel-sans">
                Analyzing your collectible with advanced AI detection...
              </p>
            </div>
            
            <LoadingSpinner size="lg" className="mx-auto" />
            
            <div className="text-sm text-pixel-gray-500 font-pixel-sans">
              This usually takes 2-5 seconds
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (captureStep === 'review') {
    return (
      <div className="min-h-screen bg-pixel-gray-100 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              icon={ArrowLeft}
              onClick={handleBackToFolders}
            >
              Back to Folders
            </Button>
            
            <h1 className="text-2xl font-pixel text-pixel-gray-900">
              Review Detection
            </h1>
            
            <div /> {/* Spacer */}
          </div>

          <Card>
            <div className="text-center">
              <h2 className="text-lg font-pixel text-pixel-gray-900 mb-4">
                Detection Results
              </h2>
              
              {capturedImage && (
                <img
                  src={URL.createObjectURL(capturedImage)}
                  alt="Captured item"
                  className="max-w-sm mx-auto rounded-pixel border-2 border-pixel-gray-200"
                />
              )}
              
              <div className="mt-4 text-pixel-gray-600 font-pixel-sans">
                AI detection results will appear here...
                <br />
                <small>(Feature coming in next development cycle)</small>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pixel-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={handleBackToFolders}
          >
            Back to Folders
          </Button>
          
          <h1 className="text-2xl font-pixel text-pixel-gray-900">
            Capture Item
          </h1>
          
          <div /> {/* Spacer */}
        </div>

        <CameraCapture
          onImageCapture={handleImageCapture}
          onCancel={handleBackToFolders}
        />
      </div>
    </div>
  );
};