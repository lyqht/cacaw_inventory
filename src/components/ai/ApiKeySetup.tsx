import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
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

  useEffect(() => {
    setApiKey(currentApiKey);
    setConnectionStatus('idle');
    setError(null);
  }, [currentApiKey, isOpen]);

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
      title="Setup Gemini AI API"
      size="md"
    >
      <div className="space-y-pixel-2">
        {/* Introduction */}
        <Card variant="outlined" padding="md">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-retro-accent rounded-pixel flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4 text-retro-bg-primary" />
            </div>
            <div>
              <h3 className="font-pixel text-retro-accent mb-1">
                AI-Powered Item Detection
              </h3>
              <p className="text-sm font-pixel-sans text-retro-accent-light">
                Connect your Google Gemini API key to enable automatic item detection from photos. 
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
          <h4 className="font-pixel text-retro-accent mb-2">Pricing Information</h4>
          <div className="space-y-1 text-sm font-pixel-sans text-retro-accent-light">
            <p>• Gemini 2.0 Flash: Free tier includes 15 requests per minute</p>
            <p>• Paid tier: ~$0.002 per image analysis</p>
            <p>• Your usage is billed directly by Google</p>
            <p>• CacawInventory does not charge additional fees</p>
          </div>
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