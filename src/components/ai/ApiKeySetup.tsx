import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, ExternalLink, CheckCircle, AlertTriangle, Zap, CreditCard, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { AIDetectionService } from '../../services/aiDetection';

interface ApiKeySetupProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySet: (apiKey: string) => void;
  currentApiKey?: string;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({
  isOpen,
  onClose,
  onApiKeySet,
  currentApiKey = ''
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [remainingDetections, setRemainingDetections] = useState<number>(0);
  const [isUsingCustomKey, setIsUsingCustomKey] = useState(false);

  useEffect(() => {
    setApiKey(currentApiKey);
    setConnectionStatus('idle');
    setError(null);
    loadUsageInfo();
  }, [currentApiKey, isOpen]);

  const loadUsageInfo = async () => {
    try {
      const aiService = AIDetectionService.getInstance();
      const { remaining, isUsingCustomKey: usingCustom } = await aiService.canUseDetection();
      setRemainingDetections(remaining);
      setIsUsingCustomKey(usingCustom);
    } catch (error) {
      console.error('Error loading usage info:', error);
    }
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key first.');
      return;
    }

    setIsTestingConnection(true);
    setError(null);
    setConnectionStatus('idle');

    try {
      const aiService = AIDetectionService.getInstance();
      aiService.setApiKey(apiKey.trim());
      
      const isConnected = await aiService.testConnection();
      
      if (isConnected) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setError('Failed to connect to Gemini API. Please check your API key.');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('error');
      setError(error instanceof Error ? error.message : 'Connection test failed.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key.');
      return;
    }

    if (connectionStatus !== 'success') {
      setError('Please test the connection first to ensure the API key is valid.');
      return;
    }

    onApiKeySet(apiKey.trim());
    onClose();
  };

  const handleClose = () => {
    setApiKey(currentApiKey);
    setConnectionStatus('idle');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="AI Detection Setup"
      size="md"
    >
      <div className="space-y-pixel-2">
        {/* Current Usage Status */}
        <Card variant="outlined" padding="md" className={isUsingCustomKey ? 'border-retro-success' : remainingDetections > 0 ? 'border-retro-accent' : 'border-retro-warning'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-pixel flex items-center justify-center ${
                isUsingCustomKey ? 'bg-retro-success' : remainingDetections > 0 ? 'bg-retro-accent' : 'bg-retro-warning'
              }`}>
                {isUsingCustomKey ? (
                  <Key className="w-4 h-4 text-retro-bg-primary" />
                ) : (
                  <Zap className="w-4 h-4 text-retro-bg-primary" />
                )}
              </div>
              <div>
                <h3 className="font-pixel text-retro-accent">
                  {isUsingCustomKey ? 'Custom API Key Active' : 'Free Detections'}
                </h3>
                <p className="text-sm font-pixel-sans text-retro-accent-light">
                  {isUsingCustomKey 
                    ? 'Unlimited AI detections with your own API key'
                    : `${remainingDetections} of 5 free detections remaining`
                  }
                </p>
              </div>
            </div>
            
            {!isUsingCustomKey && (
              <Badge 
                variant={remainingDetections > 0 ? 'default' : 'warning'}
                glow={remainingDetections === 0}
              >
                {remainingDetections}/5
              </Badge>
            )}
          </div>
        </Card>

        {/* Environment Variable Info */}
        <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-retro-accent flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-pixel text-retro-accent mb-1">How Free Detections Work</h4>
              <p className="text-sm font-pixel-sans text-retro-accent-light">
                CacawInventory includes a shared API key that provides 5 free AI detections per user. 
                This helps you try the AI features before setting up your own key.
              </p>
            </div>
          </div>
        </Card>

        {/* Free Usage Limit Warning */}
        {!isUsingCustomKey && remainingDetections === 0 && (
          <Card variant="outlined" className="border-retro-error">
            <div className="flex items-center gap-2 text-retro-error">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <h3 className="font-pixel">Free Limit Reached</h3>
                <p className="font-pixel-sans text-sm mt-1">
                  You've used all 5 free AI detections. Add your own Gemini API key to continue using AI-powered item detection.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Introduction */}
        <Card variant="outlined" padding="md">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-retro-accent rounded-pixel flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4 text-retro-bg-primary" />
            </div>
            <div>
              <h3 className="font-pixel text-retro-accent mb-1">
                Add Your Own API Key
              </h3>
              <p className="text-sm font-pixel-sans text-retro-accent-light">
                Connect your Google Gemini API key for unlimited AI-powered item detection. 
                Your API key is stored locally and never shared.
              </p>
            </div>
          </div>
        </Card>

        {/* API Key Input */}
        <div className="space-y-pixel">
          <div className="relative">
            <Input
              label="Gemini API Key"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setConnectionStatus('idle');
                setError(null);
              }}
              placeholder="Enter your Gemini API key..."
              fullWidth
              showCursor
            />
            <Button
              variant="ghost"
              size="sm"
              icon={showApiKey ? EyeOff : Eye}
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-8"
            />
          </div>

          {/* Connection Test */}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={testConnection}
              disabled={!apiKey.trim() || isTestingConnection}
              isLoading={isTestingConnection}
            >
              Test Connection
            </Button>

            {connectionStatus === 'success' && (
              <div className="flex items-center gap-1 text-retro-success">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-pixel-sans">Connected successfully!</span>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="flex items-center gap-1 text-retro-error">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-pixel-sans">Connection failed</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card variant="outlined" className="border-retro-error">
            <div className="flex items-center gap-2 text-retro-error">
              <AlertTriangle className="w-4 h-4" />
              <p className="font-pixel-sans text-sm">{error}</p>
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card variant="outlined" padding="md">
          <h4 className="font-pixel text-retro-accent mb-2">How to get your API key:</h4>
          <ol className="space-y-1 text-sm font-pixel-sans text-retro-accent-light">
            <li>1. Visit Google AI Studio</li>
            <li>2. Sign in with your Google account</li>
            <li>3. Click "Get API key" in the left sidebar</li>
            <li>4. Create a new API key or use an existing one</li>
            <li>5. Copy the key and paste it above</li>
          </ol>
          
          <div className="mt-pixel">
            <Button
              variant="ghost"
              size="sm"
              icon={ExternalLink}
              onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
            >
              Open Google AI Studio
            </Button>
          </div>
        </Card>

        {/* Pricing Information */}
        <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
          <h4 className="font-pixel text-retro-accent mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pricing Information
          </h4>
          <div className="space-y-1 text-sm font-pixel-sans text-retro-accent-light">
            <p>• <strong>Free Tier:</strong> 15 requests per minute, generous daily quota</p>
            <p>• <strong>Paid Tier:</strong> ~$0.002 per image analysis (very affordable)</p>
            <p>• <strong>Your Usage:</strong> Billed directly by Google, not CacawInventory</p>
            <p>• <strong>No Extra Fees:</strong> We don't charge additional fees for AI usage</p>
          </div>
          
          <div className="mt-2 p-2 bg-retro-success bg-opacity-20 border border-retro-success rounded-pixel">
            <p className="text-retro-success font-pixel-sans text-xs">
              💡 Most users stay within the free tier limits for personal use!
            </p>
          </div>
        </Card>

        {/* Benefits of Custom API Key */}
        <Card variant="outlined" padding="md" className="border-retro-success">
          <h4 className="font-pixel text-retro-success mb-2">Benefits of Your Own API Key:</h4>
          <ul className="space-y-1 text-sm font-pixel-sans text-retro-accent-light">
            <li>• ✅ Unlimited AI detections</li>
            <li>• ✅ Faster processing (no shared limits)</li>
            <li>• ✅ Direct billing control</li>
            <li>• ✅ Future access to new AI features</li>
            <li>• ✅ Support CacawInventory development</li>
          </ul>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-pixel-2">
          <Button
            variant="ghost"
            onClick={handleClose}
          >
            Cancel
          </Button>
          
          <Button
            variant="accent"
            onClick={handleSave}
            disabled={!apiKey.trim() || connectionStatus !== 'success'}
            glow
          >
            Save API Key
          </Button>
        </div>
      </div>
    </Modal>
  );
};