import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { StorageService } from '../services/storage';
import { AIDetectionService } from '../services/aiDetection';
import { CameraCapture } from '../components/capture/CameraCapture';
import { FolderSelector } from '../components/capture/FolderSelector';
import { CaptureResultsPage } from './CaptureResultsPage';
import { ApiKeySetup } from '../components/ai/ApiKeySetup';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Sparkles, Zap, AlertTriangle, CreditCard, Code, Key } from 'lucide-react';
import { DetectionResult, CollectibleData, Folder } from '../types';

const storageService = StorageService.getInstance();
const aiService = AIDetectionService.getInstance();

export const CapturePage: React.FC = () => {
  const { setCurrentView, setLoading, isLoading, folders, setFolders } = useAppStore();
  
  // Capture flow state
  const [captureStep, setCaptureStep] = useState<'capture' | 'processing' | 'results'>('capture');
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  
  // Folder selection state
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  
  // API setup state
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  // Usage tracking
  const [remainingDetections, setRemainingDetections] = useState<number>(5);
  const [isUsingCustomKey, setIsUsingCustomKey] = useState(false);

  // Load API key, usage info, and set default folder on component mount
  React.useEffect(() => {
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

        console.log('🔄 Loaded API info:', {
          hasCustomKey: !!savedApiKey,
          remaining,
          isUsingCustomKey: usingCustom
        });

        // Log development mode info
        if (aiService.isDevelopmentMode()) {
          const limits = aiService.getDetectionLimits();
          console.log('🔧 Development Mode Detection Limits:', limits);
          
          if (limits.unlimited) {
            console.log('✨ Unlimited AI detections enabled for development!');
          }
        }
      } catch (error) {
        console.error('Error loading API info:', error);
      }
    };
    loadApiInfo();
  }, []);

  // Refresh usage info when API key changes
  React.useEffect(() => {
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

  // Set default folder when folders are loaded
  React.useEffect(() => {
    if (folders.length > 0 && !selectedFolder) {
      // Set the first folder as default, or find Trading Cards folder if it exists
      const tradingCardsFolder = folders.find(f => f.type === 'trading-cards');
      setSelectedFolder(tradingCardsFolder || folders[0]);
    }
  }, [folders, selectedFolder]);

  const handleImageCapture = async (imageBlob: Blob) => {
    console.log('📸 CapturePage: Image captured, blob size:', imageBlob.size);
    
    if (!selectedFolder) {
      alert('Please select a folder first before capturing an image.');
      return;
    }

    setCapturedImage(imageBlob);
    const imageUrl = URL.createObjectURL(imageBlob);
    setCapturedImageUrl(imageUrl);

    console.log('🖼️ CapturePage: Image URL created:', imageUrl);

    // Check if AI detection is available
    const { canUse, remaining, isUsingCustomKey: usingCustom } = await aiService.canUseDetection();
    
    if (!canUse) {
      // Show API setup modal if no detections remaining
      setShowApiSetup(true);
      return;
    }

    // Start AI detection
    await processImageWithAI(imageBlob);
  };

  const processImageWithAI = async (imageBlob: Blob) => {
    if (!selectedFolder) {
      console.error('No folder selected for AI processing');
      return;
    }

    console.log('🤖 CapturePage: Starting AI processing for folder type:', selectedFolder.type);

    setCaptureStep('processing');
    setLoading(true);
    setProcessingStatus('Preparing image for AI analysis...');

    try {
      // Small delay to show the processing UI
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStatus('Sending to Gemini AI...');
      
      // Perform AI detection with selected folder type
      const result = await aiService.detectItems(
        imageBlob,
        selectedFolder.type,
        undefined // Use default prompt for now
      );

      console.log('AI Detection Result:', result);
      setDetectionResult(result);
      setCaptureStep('results');

      // Update usage info after successful detection
      const { remaining, isUsingCustomKey: usingCustom } = await aiService.canUseDetection();
      setRemainingDetections(remaining);
      setIsUsingCustomKey(usingCustom);

      // Log the detection for future reference
      if (result.items.length > 0) {
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
      // Save each detected item
      for (const itemData of items) {
        await storageService.createItem(itemData);
      }

      console.log('Successfully saved', items.length, 'items to folder:', selectedFolder.name);
      
      // Navigate to the selected folder to see the new items
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
      console.log('🔑 API key saved successfully');
      
      // Force refresh usage info immediately
      const { remaining, isUsingCustomKey: usingCustom } = await aiService.canUseDetection();
      setRemainingDetections(remaining);
      setIsUsingCustomKey(usingCustom);
      
      console.log('🔄 Updated usage after API key save:', {
        remaining,
        isUsingCustomKey: usingCustom
      });
      
      // If we have a captured image, process it now
      if (capturedImage) {
        await processImageWithAI(capturedImage);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handleFolderSelect = (folder: Folder) => {
    setSelectedFolder(folder);
    console.log('Selected folder for capture:', folder.name, folder.type);
  };

  const handleFolderCreated = async (newFolder: Folder) => {
    // Refresh the folders list to include the new folder
    try {
      const updatedFolders = await storageService.getFolders();
      setFolders(updatedFolders);
      console.log('Folders list updated with new folder:', newFolder.name);
    } catch (error) {
      console.error('Error refreshing folders list:', error);
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

  const handleCancelResults = () => {
    setCaptureStep('capture');
    setDetectionResult(null);
    if (capturedImageUrl) {
      URL.revokeObjectURL(capturedImageUrl);
      setCapturedImageUrl(null);
    }
    setCapturedImage(null);
  };

  // Check if we're in development mode with unlimited detections
  const isDevUnlimited = aiService.isUnlimitedDetectionsEnabled();

  // Determine if we should show the free limit warning
  const shouldShowFreeLimitWarning = !isUsingCustomKey && !isDevUnlimited && remainingDetections === 0;

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
              {selectedFolder && (
                <p className="text-retro-accent-light font-pixel-sans text-sm mt-1">
                  Optimizing for {selectedFolder.type.replace('-', ' ')} detection
                </p>
              )}
            </div>
            
            <LoadingSpinner size="lg" variant="accent" className="mx-auto" />
            
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-retro-accent animate-pixel-pulse pixel-perfect" />
              <div className="w-2 h-2 bg-retro-accent animate-pixel-pulse pixel-perfect" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-retro-accent animate-pixel-pulse pixel-perfect" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Results step - show the new integrated results page
  if (captureStep === 'results' && detectionResult && capturedImageUrl && selectedFolder) {
    return (
      <CaptureResultsPage
        detectionResult={detectionResult}
        originalImage={capturedImageUrl}
        selectedFolder={selectedFolder}
        onSave={handleSaveItems}
        onCancel={handleCancelResults}
        onRetryDetection={handleRetryDetection}
        isLoading={isLoading}
      />
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
          
          {/* Empty div for spacing */}
          <div />
        </div>

        {/* AI Usage Status with Development Mode Indicator */}
        <Card variant="outlined" padding="md" className={
          isUsingCustomKey ? 'border-retro-success' : 
          isDevUnlimited ? 'border-retro-primary' :
          remainingDetections > 0 ? 'border-retro-accent' : 'border-retro-warning'
        }>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-pixel flex items-center justify-center ${
                isUsingCustomKey ? 'bg-retro-success' : 
                isDevUnlimited ? 'bg-retro-primary' :
                remainingDetections > 0 ? 'bg-retro-accent' : 'bg-retro-warning'
              }`}>
                {isUsingCustomKey ? (
                  <Key className="w-4 h-4 text-retro-bg-primary" />
                ) : isDevUnlimited ? (
                  <Code className="w-4 h-4 text-retro-white" />
                ) : (
                  <Zap className="w-4 h-4 text-retro-bg-primary" />
                )}
              </div>
              <div>
                <h3 className="font-pixel text-retro-accent">
                  {isUsingCustomKey ? 'Custom API Key Active' : 
                   isDevUnlimited ? 'Development Mode - Unlimited' :
                   'Free AI Detections'}
                </h3>
                <p className="text-retro-accent-light font-pixel-sans text-sm">
                  {isUsingCustomKey 
                    ? 'Unlimited AI detections with your own API key'
                    : isDevUnlimited
                    ? 'Unlimited AI detections enabled for development'
                    : `${remainingDetections} of 5 free detections remaining`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isUsingCustomKey && !isDevUnlimited && (
                <Badge 
                  variant={remainingDetections > 0 ? 'default' : 'warning'}
                  glow={remainingDetections === 0}
                >
                  {remainingDetections}/5
                </Badge>
              )}
              
              {isUsingCustomKey && (
                <Badge variant="success" glow>
                  UNLIMITED
                </Badge>
              )}
              
              {isDevUnlimited && (
                <Badge variant="default" glow>
                  DEV
                </Badge>
              )}
              
              <Button
                variant={shouldShowFreeLimitWarning ? 'accent' : 'ghost'}
                size="sm"
                onClick={() => setShowApiSetup(true)}
                glow={shouldShowFreeLimitWarning}
              >
                Setup
              </Button>
            </div>
          </div>
        </Card>

        {/* Free Limit Warning - Only show when actually needed */}
        {shouldShowFreeLimitWarning && (
          <Card variant="outlined" className="border-retro-error">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-retro-error" />
                <div>
                  <h3 className="font-pixel text-retro-error">Free Limit Reached</h3>
                  <p className="text-retro-error font-pixel-sans text-sm">
                    You've used all 5 free AI detections. Add your own Gemini API key to continue.
                  </p>
                </div>
              </div>
              <Button
                variant="accent"
                size="sm"
                onClick={() => setShowApiSetup(true)}
                glow
              >
                Add API Key
              </Button>
            </div>
          </Card>
        )}

        {/* Development Mode Info */}
        {isDevUnlimited && (
          <Card variant="outlined" padding="md" className="border-retro-primary bg-retro-primary bg-opacity-10">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-retro-primary" />
              <div>
                <h3 className="font-pixel text-retro-primary">Development Mode Active</h3>
                <p className="text-retro-accent-light font-pixel-sans text-sm">
                  Unlimited AI detections enabled for development. Usage tracking is disabled.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Custom API Key Success Info */}
        {isUsingCustomKey && (
          <Card variant="outlined" padding="md" className="border-retro-success bg-retro-success bg-opacity-10">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-retro-success" />
              <div>
                <h3 className="font-pixel text-retro-success">Custom API Key Active</h3>
                <p className="text-retro-accent-light font-pixel-sans text-sm">
                  You now have unlimited AI detections! Your usage is billed directly by Google.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Folder Selection */}
        <FolderSelector
          selectedFolder={selectedFolder}
          folders={folders}
          onFolderSelect={handleFolderSelect}
          onFolderCreated={handleFolderCreated}
        />

        {/* Camera Capture Component with proper props */}
        <CameraCapture
          onImageCapture={handleImageCapture}
          onCancel={handleBackToFolders}
          isModal={false}
          autoStart={true}
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
    </div>
  );
};