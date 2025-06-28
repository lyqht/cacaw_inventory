import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { StorageService } from '../services/storage';
import { AIDetectionService } from '../services/aiDetection';
import { CameraCapture } from '../components/capture/CameraCapture';
import { DetectionResultsModal } from '../components/ai/DetectionResultsModal';
import { ApiKeySetup } from '../components/ai/ApiKeySetup';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Sparkles, Settings, Key } from 'lucide-react';
import { DetectionResult, CollectibleData } from '../types';

const storageService = StorageService.getInstance();
const aiService = AIDetectionService.getInstance();

export const CapturePage: React.FC = () => {
  const { setCurrentView, setLoading, isLoading, selectedFolder } = useAppStore();
  
  // Capture flow state
  const [captureStep, setCaptureStep] = useState<'capture' | 'processing' | 'results'>('capture');
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  
  // API setup state
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // Load API key on component mount
  React.useEffect(() => {
    const loadApiKey = async () => {
      try {
        const savedApiKey = await storageService.getSetting('gemini_api_key');
        if (savedApiKey) {
          setApiKey(savedApiKey);
          aiService.setApiKey(savedApiKey);
        }
      } catch (error) {
        console.error('Error loading API key:', error);
      }
    };
    loadApiKey();
  }, []);

  const handleImageCapture = async (imageBlob: Blob) => {
    setCapturedImage(imageBlob);
    const imageUrl = URL.createObjectURL(imageBlob);
    setCapturedImageUrl(imageUrl);

    // Check if API key is configured
    if (!apiKey) {
      setShowApiSetup(true);
      return;
    }

    // Start AI detection
    await processImageWithAI(imageBlob);
  };

  const processImageWithAI = async (imageBlob: Blob) => {
    setCaptureStep('processing');
    setLoading(true);
    setProcessingStatus('Preparing image for AI analysis...');

    try {
      // Small delay to show the processing UI
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStatus('Sending to Gemini AI...');
      
      // Perform AI detection
      const result = await aiService.detectItems(
        imageBlob,
        selectedFolder?.type,
        undefined // Use default prompt for now
      );

      console.log('AI Detection Result:', result);
      setDetectionResult(result);
      setCaptureStep('results');

      // Log the detection for future reference
      if (result.items.length > 0) {
        // TODO: Save detection log to storage
        console.log('Detection successful:', result.items.length, 'items found');
      }

    } catch (error) {
      console.error('Error processing image with AI:', error);
      
      // Create error result
      const errorResult: DetectionResult = {
        items: [],
        confidence: 0,
        processingTime: 0,
        rawResponse: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      setDetectionResult(errorResult);
      setCaptureStep('results');
    } finally {
      setLoading(false);
      setProcessingStatus('');
    }
  };

  const handleRetryDetection = async () => {
    if (capturedImage) {
      await processImageWithAI(capturedImage);
    }
  };

  const handleSaveItems = async (items: Omit<CollectibleData, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    if (!selectedFolder) {
      console.error('No folder selected for saving items');
      return;
    }

    setLoading(true);
    
    try {
      // Convert captured image to data URL for storage
      let imageDataUrl: string | undefined;
      if (capturedImage) {
        imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(capturedImage);
        });
      }

      // Save each detected item
      for (const itemData of items) {
        const completeItemData = {
          ...itemData,
          folderId: selectedFolder.id,
          primaryImage: imageDataUrl,
          thumbnailImage: imageDataUrl,
          aiDetected: true,
          aiPromptUsed: detectionResult?.rawResponse ? 'Gemini 2.0 Flash detection' : undefined,
        };

        await storageService.createItem(completeItemData);
      }

      console.log('Successfully saved', items.length, 'items');
      
      // Navigate back to the folder to see the new items
      setCurrentView('items');
      
    } catch (error) {
      console.error('Error saving detected items:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySet = async (newApiKey: string) => {
    setApiKey(newApiKey);
    aiService.setApiKey(newApiKey);
    
    // Save API key to local storage
    try {
      await storageService.setSetting('gemini_api_key', newApiKey);
      console.log('API key saved successfully');
      
      // If we have a captured image, process it now
      if (capturedImage) {
        await processImageWithAI(capturedImage);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handleBackToFolders = () => {
    // Cleanup blob URLs
    if (capturedImageUrl) {
      URL.revokeObjectURL(capturedImageUrl);
    }
    
    setCurrentView('folders');
    setCaptureStep('capture');
    setCapturedImage(null);
    setCapturedImageUrl(null);
    setDetectionResult(null);
  };

  // Processing step UI
  if (captureStep === 'processing') {
    return (
      <div className="min-h-screen bg-retro-bg-primary bg-pixel-grid flex items-center justify-center p-pixel-2">
        <Card className="text-center max-w-md w-full" glow>
          <div className="space-y-pixel-2">
            <div className="w-16 h-16 bg-retro-accent rounded-pixel flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-retro-bg-primary animate-pixel-pulse" />
            </div>
            
            <div>
              <h2 className="text-xl font-pixel text-retro-accent mb-2">
                AI Magic in Progress
              </h2>
              <p className="text-retro-accent-light font-pixel-sans">
                {processingStatus || 'Analyzing your collectible with advanced AI detection...'}
              </p>
            </div>
            
            <LoadingSpinner size="lg" variant="accent" className="mx-auto" />
            
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-retro-accent animate-pixel-pulse pixel-perfect" />
              <div className="w-2 h-2 bg-retro-accent animate-pixel-pulse pixel-perfect" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-retro-accent animate-pixel-pulse pixel-perfect" style={{ animationDelay: '0.4s' }} />
            </div>
            
            <div className="text-sm text-retro-accent-light font-pixel-sans">
              This usually takes 2-5 seconds
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Main capture interface
  return (
    <div className="min-h-screen bg-retro-bg-primary bg-pixel-grid p-pixel-2">
      <div className="max-w-4xl mx-auto space-y-pixel-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={handleBackToFolders}
          >
            Back to Folders
          </Button>
          
          <h1 className="text-2xl font-pixel text-retro-accent">
            Capture Item
          </h1>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              icon={Key}
              size="sm"
              onClick={() => setShowApiSetup(true)}
              title="Setup AI API"
            >
              API Setup
            </Button>
          </div>
        </div>

        {/* API Key Warning */}
        {!apiKey && (
          <Card variant="outlined" className="border-retro-warning">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-retro-warning" />
                <div>
                  <h3 className="font-pixel text-retro-warning">AI Detection Not Configured</h3>
                  <p className="text-retro-warning font-pixel-sans text-sm">
                    Set up your Gemini API key to enable automatic item detection.
                  </p>
                </div>
              </div>
              <Button
                variant="accent"
                size="sm"
                icon={Settings}
                onClick={() => setShowApiSetup(true)}
              >
                Setup Now
              </Button>
            </div>
          </Card>
        )}

        {/* Selected Folder Info */}
        {selectedFolder && (
          <Card variant="outlined" padding="md">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {selectedFolder.type === 'trading-cards' ? '🃏' : 
                 selectedFolder.type === 'action-figures' ? '🤖' : 
                 selectedFolder.type === 'plushies' ? '🧸' : 
                 selectedFolder.type === 'comics' ? '📚' : 
                 selectedFolder.type === 'games' ? '🎮' : '📦'}
              </span>
              <div>
                <h3 className="font-pixel text-retro-accent">
                  Adding to: {selectedFolder.name}
                </h3>
                <p className="text-retro-accent-light font-pixel-sans text-sm">
                  AI will be optimized for {selectedFolder.type.replace('-', ' ')} detection
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Camera Capture Component */}
        <CameraCapture
          onImageCapture={handleImageCapture}
          onCancel={handleBackToFolders}
        />

        {/* AI Features Info */}
        <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
          <h3 className="font-pixel text-retro-accent mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI-Powered Detection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-pixel text-sm font-pixel-sans text-retro-accent-light">
            <div>
              <h4 className="font-pixel text-retro-accent text-xs mb-1">What AI Can Detect:</h4>
              <ul className="space-y-0.5">
                <li>• Item names and details</li>
                <li>• Condition assessment</li>
                <li>• Series and set information</li>
                <li>• Estimated market values</li>
              </ul>
            </div>
            <div>
              <h4 className="font-pixel text-retro-accent text-xs mb-1">Tips for Best Results:</h4>
              <ul className="space-y-0.5">
                <li>• Use good lighting</li>
                <li>• Keep items clearly visible</li>
                <li>• Avoid reflections and glare</li>
                <li>• Include any text or labels</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <ApiKeySetup
        isOpen={showApiSetup}
        onClose={() => setShowApiSetup(false)}
        onApiKeySet={handleApiKeySet}
        currentApiKey={apiKey}
      />

      <DetectionResultsModal
        isOpen={captureStep === 'results'}
        onClose={() => {
          setCaptureStep('capture');
          setDetectionResult(null);
          if (capturedImageUrl) {
            URL.revokeObjectURL(capturedImageUrl);
            setCapturedImageUrl(null);
          }
          setCapturedImage(null);
        }}
        detectionResult={detectionResult}
        originalImage={capturedImageUrl}
        onSaveItems={handleSaveItems}
        onRetryDetection={handleRetryDetection}
        isLoading={isLoading}
      />
    </div>
  );
};