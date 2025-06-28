import React from 'react';
import { ArrowLeft, Palette, Zap, Shield, Download } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export const SettingsPage: React.FC = () => {
  const { setCurrentView, preferences, updatePreferences } = useAppStore();

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    updatePreferences({ theme });
  };

  const handleToggleAnimations = () => {
    updatePreferences({ pixelAnimations: !preferences.pixelAnimations });
  };

  const handleToggleAutoDetection = () => {
    updatePreferences({ autoDetection: !preferences.autoDetection });
  };

  return (
    <div className="min-h-screen bg-pixel-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => setCurrentView('folders')}
          >
            Back to Folders
          </Button>
          
          <h1 className="text-2xl font-pixel text-pixel-gray-900">
            Settings
          </h1>
          
          <div /> {/* Spacer */}
        </div>

        {/* Appearance Settings */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-pixel-accent rounded-pixel flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-pixel text-pixel-gray-900">
                  Appearance
                </h2>
                <p className="text-sm text-pixel-gray-600 font-pixel-sans">
                  Customize the look and feel of the app
                </p>
              </div>
            </div>

            <div className="space-y-4 pl-13">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-pixel-sans font-medium text-pixel-gray-700 mb-2">
                  Theme
                </label>
                <div className="flex space-x-2">
                  {(['light', 'dark', 'auto'] as const).map((theme) => (
                    <Button
                      key={theme}
                      variant={preferences.theme === theme ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handleThemeChange(theme)}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Pixel Animations */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-pixel-sans font-medium text-pixel-gray-700">
                    Pixel Animations
                  </label>
                  <p className="text-xs text-pixel-gray-500 font-pixel-sans">
                    Enable retro-style animations and transitions
                  </p>
                </div>
                <Button
                  variant={preferences.pixelAnimations ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={handleToggleAnimations}
                >
                  {preferences.pixelAnimations ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* AI & Detection Settings */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-pixel-primary rounded-pixel flex items-center justify-center">
                <Zap className="w-5 h-5 text-pixel-dark" />
              </div>
              <div>
                <h2 className="text-lg font-pixel text-pixel-gray-900">
                  AI & Detection
                </h2>
                <p className="text-sm text-pixel-gray-600 font-pixel-sans">
                  Configure AI-powered item detection
                </p>
              </div>
            </div>

            <div className="space-y-4 pl-13">
              {/* Auto Detection */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-pixel-sans font-medium text-pixel-gray-700">
                    Auto Detection
                  </label>
                  <p className="text-xs text-pixel-gray-500 font-pixel-sans">
                    Automatically detect items when photos are taken
                  </p>
                </div>
                <Button
                  variant={preferences.autoDetection ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={handleToggleAutoDetection}
                >
                  {preferences.autoDetection ? 'On' : 'Off'}
                </Button>
              </div>

              {/* Default Folder Type */}
              <div>
                <label className="block text-sm font-pixel-sans font-medium text-pixel-gray-700 mb-2">
                  Default Folder Type
                </label>
                <select
                  value={preferences.defaultFolderType}
                  onChange={(e) => updatePreferences({ 
                    defaultFolderType: e.target.value as any 
                  })}
                  className="font-pixel-sans border-2 border-pixel-gray-300 rounded-pixel px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pixel-primary focus:border-pixel-primary"
                >
                  <option value="trading-cards">Trading Cards</option>
                  <option value="action-figures">Action Figures</option>
                  <option value="plushies">Plushies</option>
                  <option value="comics">Comics</option>
                  <option value="games">Games</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* AI Prompt Template */}
              <div>
                <label className="block text-sm font-pixel-sans font-medium text-pixel-gray-700 mb-2">
                  AI Prompt Template
                </label>
                <textarea
                  value={preferences.aiPromptTemplate}
                  onChange={(e) => updatePreferences({ 
                    aiPromptTemplate: e.target.value 
                  })}
                  rows={3}
                  className="w-full font-pixel-sans border-2 border-pixel-gray-300 rounded-pixel px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pixel-primary focus:border-pixel-primary resize-none"
                  placeholder="Enter custom AI prompt template..."
                />
                <p className="text-xs text-pixel-gray-500 font-pixel-sans mt-1">
                  This prompt will be used for AI item detection
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Privacy & Data Settings */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-pixel-secondary rounded-pixel flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-pixel text-pixel-gray-900">
                  Privacy & Data
                </h2>
                <p className="text-sm text-pixel-gray-600 font-pixel-sans">
                  Manage your data and privacy settings
                </p>
              </div>
            </div>

            <div className="space-y-4 pl-13">
              {/* Compression Level */}
              <div>
                <label className="block text-sm font-pixel-sans font-medium text-pixel-gray-700 mb-2">
                  Image Compression
                </label>
                <div className="flex space-x-2">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={preferences.compressionLevel === level ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => updatePreferences({ compressionLevel: level })}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-pixel-gray-500 font-pixel-sans mt-1">
                  Higher compression saves storage space but reduces image quality
                </p>
              </div>

              {/* Export Data */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-pixel-sans font-medium text-pixel-gray-700">
                    Export Data
                  </label>
                  <p className="text-xs text-pixel-gray-500 font-pixel-sans">
                    Download all your data as a JSON file
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Download}
                  onClick={() => {
                    // TODO: Implement data export
                    console.log('Export data clicked');
                  }}
                >
                  Export
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* App Info */}
        <Card variant="outlined">
          <div className="text-center space-y-2">
            <h3 className="font-pixel text-pixel-gray-900">
              CacawInventory
            </h3>
            <p className="text-sm text-pixel-gray-600 font-pixel-sans">
              Version 0.1.0 - Phase 1 Development
            </p>
            <p className="text-xs text-pixel-gray-500 font-pixel-sans">
              AI-Powered Collectible Inventory Manager
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};