import React, { useState } from 'react';
import { Sparkles, X, RefreshCw, Save, AlertTriangle, Eye, Zap, Brain } from 'lucide-react';
import { CollectibleData, DetectionResult, Folder } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DetectionResultsModal } from '../ai/DetectionResultsModal';
import { AIDetectionService } from '../../services/aiDetection';

interface ItemAIDetectionModalProps {
  item: CollectibleData | null;
  folder: Folder;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: (updatedItem: CollectibleData) => void;
}

export const ItemAIDetectionModal: React.FC<ItemAIDetectionModalProps> = ({
  item,
  folder,
  isOpen,
  onClose,
  onItemUpdated
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<DetectionResult[]>([]);

  const aiService = AIDetectionService.getInstance();

  if (!item) return null;

  const hasImage = item.primaryImage || item.additionalImages.length > 0;
  const displayImage = item.primaryImage || item.additionalImages[0];

  const handleRunDetection = async () => {
    if (!hasImage) {
      setError('No image available for AI detection');
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Check if detection is available
      const { canUse, remaining, isUsingCustomKey } = await aiService.canUseDetection();
      
      if (!canUse) {
        throw new Error(`You have used all free AI detections. Please add your own Gemini API key to continue.`);
      }

      // Convert image URL to blob for detection
      const imageBlob = await urlToBlob(displayImage);
      
      // Run AI detection with folder type optimization
      const result = await aiService.detectItems(
        imageBlob,
        folder.type,
        undefined // Use default prompt
      );

      setDetectionResult(result);
      setDetectionHistory(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
      
      if (result.items.length > 0) {
        setShowResults(true);
      } else if (result.error) {
        setError(result.error);
      } else {
        setError('No items detected in the image. The AI may not have recognized any collectibles.');
      }

    } catch (error) {
      console.error('AI detection error:', error);
      setError(error instanceof Error ? error.message : 'AI detection failed');
    } finally {
      setIsDetecting(false);
    }
  };

  const urlToBlob = async (url: string): Promise<Blob> => {
    if (url.startsWith('data:')) {
      // Convert data URL to blob
      const response = await fetch(url);
      return response.blob();
    } else {
      // For regular URLs, fetch the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load image for AI detection');
      }
      return response.blob();
    }
  };

  const handleSaveDetectionResults = async (detectedItems: Omit<CollectibleData, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    if (detectedItems.length === 0) return;

    try {
      // For now, we'll update the current item with the first detected result
      const detectedItem = detectedItems[0];
      
      const updatedItem: CollectibleData = {
        ...item,
        name: detectedItem.name || item.name,
        type: detectedItem.type || item.type,
        series: detectedItem.series || item.series,
        condition: detectedItem.condition || item.condition,
        description: detectedItem.description || item.description,
        estimatedValue: detectedItem.estimatedValue || item.estimatedValue,
        currency: detectedItem.currency || item.currency,
        tags: [...new Set([...item.tags, ...(detectedItem.tags || [])])], // Merge tags
        aiDetected: true,
        aiConfidence: detectedItem.aiConfidence,
        aiPromptUsed: detectedItem.aiPromptUsed,
        ocrText: detectedItem.ocrText,
        updatedAt: new Date()
      };

      onItemUpdated(updatedItem);
      setShowResults(false);
      onClose();
    } catch (error) {
      console.error('Error saving detection results:', error);
      setError('Failed to save detection results');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-retro-success';
    if (confidence >= 60) return 'text-retro-accent';
    if (confidence >= 40) return 'text-yellow-400';
    return 'text-retro-error';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    if (confidence >= 40) return 'Low';
    return 'Very Low';
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showResults}
        onClose={onClose}
        title="AI Detection Analysis"
        size="lg"
      >
        <div className="space-y-pixel-2">
          {/* Header with Item Info */}
          <Card variant="outlined" padding="md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-retro-accent rounded-pixel flex items-center justify-center">
                <Brain className="w-6 h-6 text-retro-bg-primary animate-pixel-pulse" />
              </div>
              <div>
                <h3 className="font-pixel text-retro-accent">
                  Analyze "{item.name}"
                </h3>
                <p className="text-retro-accent-light font-pixel-sans text-sm">
                  Run AI detection to extract detailed information from the item's image
                </p>
              </div>
            </div>
          </Card>

          {/* Current Item Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-pixel-2">
            {/* Image Preview */}
            <Card variant="outlined" padding="md">
              <h4 className="font-pixel text-retro-accent mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Current Image
              </h4>
              
              {hasImage ? (
                <div className="aspect-square bg-retro-bg-tertiary border border-retro-accent rounded-pixel overflow-hidden">
                  <img
                    src={displayImage}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-retro-bg-tertiary border border-retro-accent rounded-pixel flex items-center justify-center">
                  <div className="text-center text-retro-accent-light">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="font-pixel-sans text-sm">No Image Available</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Current Item Info */}
            <Card variant="outlined" padding="md">
              <h4 className="font-pixel text-retro-accent mb-2">Current Item Data</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-retro-accent-light font-pixel-sans">Name:</span>
                  <span className="text-retro-accent font-pixel-sans">{item.name}</span>
                </div>
                
                {item.type && (
                  <div className="flex justify-between">
                    <span className="text-retro-accent-light font-pixel-sans">Type:</span>
                    <span className="text-retro-accent font-pixel-sans">{item.type}</span>
                  </div>
                )}
                
                {item.series && (
                  <div className="flex justify-between">
                    <span className="text-retro-accent-light font-pixel-sans">Series:</span>
                    <span className="text-retro-accent font-pixel-sans">{item.series}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-retro-accent-light font-pixel-sans">Condition:</span>
                  <span className="text-retro-accent font-pixel-sans capitalize">
                    {item.condition.replace('-', ' ')}
                  </span>
                </div>
                
                {item.estimatedValue && (
                  <div className="flex justify-between">
                    <span className="text-retro-accent-light font-pixel-sans">Value:</span>
                    <span className="text-retro-accent font-pixel-sans">
                      ${item.estimatedValue.toFixed(2)}
                    </span>
                  </div>
                )}
                
                {item.aiDetected && (
                  <div className="flex justify-between items-center">
                    <span className="text-retro-accent-light font-pixel-sans">AI Detected:</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="success" size="sm">
                        <Zap className="w-3 h-3 mr-1" />
                        Yes
                      </Badge>
                      {item.aiConfidence && (
                        <span className="text-xs text-retro-accent-light">
                          ({Math.round(item.aiConfidence)}%)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* AI Detection Options */}
          <Card variant="outlined" padding="md" className="border-retro-primary">
            <h4 className="font-pixel text-retro-primary mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Detection Analysis
            </h4>
            
            <div className="space-y-3">
              <p className="text-retro-accent-light font-pixel-sans text-sm">
                Run advanced AI analysis to extract detailed information from the item's image. 
                This will analyze the image for:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-pixel-sans text-retro-accent-light">
                <div>
                  <h5 className="font-pixel text-retro-accent text-xs mb-1">Detection Features:</h5>
                  <ul className="space-y-0.5">
                    <li>• Enhanced item identification</li>
                    <li>• Condition assessment</li>
                    <li>• Series and set information</li>
                    <li>• Market value estimation</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-pixel text-retro-accent text-xs mb-1">Optimization:</h5>
                  <ul className="space-y-0.5">
                    <li>• Optimized for {folder.type.replace('-', ' ')}</li>
                    <li>• Text extraction (OCR)</li>
                    <li>• Confidence scoring</li>
                    <li>• Detailed analysis report</li>
                  </ul>
                </div>
              </div>

              {!hasImage && (
                <Card variant="outlined" className="border-retro-warning bg-retro-warning bg-opacity-10">
                  <div className="flex items-center gap-2 text-retro-warning">
                    <AlertTriangle className="w-4 h-4" />
                    <p className="font-pixel-sans text-sm">
                      No image available for AI detection. Please add an image to this item first.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </Card>

          {/* Detection History */}
          {detectionHistory.length > 0 && (
            <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
              <h4 className="font-pixel text-retro-accent mb-2">Recent Detection History</h4>
              
              <div className="space-y-2">
                {detectionHistory.slice(0, 3).map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-retro-bg-secondary rounded-pixel">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={result.items.length > 0 ? 'success' : 'warning'} 
                        size="sm"
                      >
                        {result.items.length} items
                      </Badge>
                      <span className={`text-xs font-pixel-sans ${getConfidenceColor(result.confidence)}`}>
                        {getConfidenceLabel(result.confidence)} confidence
                      </span>
                    </div>
                    <span className="text-xs text-retro-accent-light font-pixel-sans">
                      {result.processingTime}ms
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card variant="outlined" className="border-retro-error">
              <div className="flex items-center gap-2 text-retro-error">
                <AlertTriangle className="w-4 h-4" />
                <div>
                  <p className="font-pixel-sans text-sm">{error}</p>
                  <p className="font-pixel-sans text-xs mt-1 text-retro-accent-light">
                    You can try running the detection again or check your API key settings.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-pixel-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isDetecting}
            >
              Cancel
            </Button>
            
            <Button
              variant="accent"
              icon={isDetecting ? undefined : Sparkles}
              onClick={handleRunDetection}
              disabled={!hasImage || isDetecting}
              isLoading={isDetecting}
              glow={hasImage && !isDetecting}
            >
              {isDetecting ? 'Analyzing...' : 'Run AI Detection'}
            </Button>
          </div>

          {/* Processing Status */}
          {isDetecting && (
            <div className="text-center py-pixel-2">
              <LoadingSpinner size="md" variant="accent" className="mx-auto mb-2" />
              <p className="text-retro-accent font-pixel-sans text-sm">
                AI is analyzing the image...
              </p>
              <p className="text-retro-accent-light font-pixel-sans text-xs">
                This may take a few seconds
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Detection Results Modal */}
      {detectionResult && (
        <DetectionResultsModal
          isOpen={showResults}
          onClose={() => {
            setShowResults(false);
            setDetectionResult(null);
          }}
          detectionResult={detectionResult}
          originalImage={displayImage}
          onSaveItems={handleSaveDetectionResults}
          onRetryDetection={handleRunDetection}
          isLoading={isDetecting}
        />
      )}
    </>
  );
};