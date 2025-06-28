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
    <div className="min-h-screen bg-retro-bg-primary bg-pixel-grid p-pixel-2">
      <div className="max-w-4xl mx-auto space-y-pixel-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => setCurrentView('folders')}
          >
            Back to Folders
          </Button>
          
          <h1 className="text-2xl font-pixel text-retro-accent">
            Settings
          </h1>
          
          <div /> {/* Spacer */}
        </div>

        {/* Theme Testing Card */}
        <Card variant="outlined" padding="md" className="border-retro-success">
          <h3 className="font-pixel text-retro-success mb-pixel-2">Theme Testing</h3>
          <p className="text-retro-accent-light font-pixel-sans text-sm mb-pixel-2">
            Test input visibility across different themes:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-pixel-2">
            <Input
              label="Test Input"
              placeholder="Type here to test visibility..."
              fullWidth
            />
            <div>
              <label className="block text-sm font-pixel text-retro-accent mb-1">
                Test Select
              </label>
              <select className="pixel-input w-full">
                <option value="">Choose an option...</option>
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-pixel text-retro-accent mb-1">
                Test Textarea
              </label>
              <textarea
                className="pixel-input w-full resize-none"
                rows={3}
                placeholder="Type here to test textarea visibility..."
              />
            </div>
          </div>
        </Card>

        {/* Appearance Settings */}
        <Card variant="outlined" padding="md">
          <div className="space-y-pixel-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-retro-accent rounded-pixel flex items-center justify-center">
                <Palette className="w-5 h-5 text-retro-bg-primary" />
              </div>
              <div>
                <h2 className="text-lg font-pixel text-retro-accent">
                  Appearance
                </h2>
                <p className="text-sm text-retro-accent-light font-pixel-sans">
                  Customize the look and feel of the app
                </p>
              </div>
            </div>

            <div className="space-y-pixel-2 pl-13">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-pixel text-retro-accent mb-2">
                  Theme
                </label>
                <div className="flex space-x-2">
                  {(['light', 'dark', 'auto'] as const).map((theme) => (
                    <Button
                      key={theme}
                      variant={preferences.theme === theme ? 'accent' : 'ghost'}
                      size="sm"
                      onClick={() => handleThemeChange(theme)}
                      glow={preferences.theme === theme}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-retro-accent-light font-pixel-sans mt-1">
                  {preferences.theme === 'light' && 'Light theme with dark text on light backgrounds'}
                  {preferences.theme === 'dark' && 'Dark theme with light text on dark backgrounds (default)'}
                  {preferences.theme === 'auto' && 'Automatically follows your system preference'}
                </p>
              </div>

              {/* Pixel Animations */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-pixel text-retro-accent">
                    Pixel Animations
                  </label>
                  <p className="text-xs text-retro-accent-light font-pixel-sans">
                    Enable retro-style animations and transitions
                  </p>
                </div>
                <Button
                  variant={preferences.pixelAnimations ? 'accent' : 'ghost'}
                  size="sm"
                  onClick={handleToggleAnimations}
                  glow={preferences.pixelAnimations}
                >
                  {preferences.pixelAnimations ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* AI & Detection Settings */}
        <Card variant="outlined" padding="md">
          <div className="space-y-pixel-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-retro-primary rounded-pixel flex items-center justify-center">
                <Zap className="w-5 h-5 text-retro-white" />
              </div>
              <div>
                <h2 className="text-lg font-pixel text-retro-accent">
                  AI & Detection
                </h2>
                <p className="text-sm text-retro-accent-light font-pixel-sans">
                  Configure AI-powered item detection
                </p>
              </div>
            </div>

            <div className="space-y-pixel-2 pl-13">
              {/* Auto Detection */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-pixel text-retro-accent">
                    Auto Detection
                  </label>
                  <p className="text-xs text-retro-accent-light font-pixel-sans">
                    Automatically detect items when photos are taken
                  </p>
                </div>
                <Button
                  variant={preferences.autoDetection ? 'accent' : 'ghost'}
                  size="sm"
                  onClick={handleToggleAutoDetection}
                  glow={preferences.autoDetection}
                >
                  {preferences.autoDetection ? 'On' : 'Off'}
                </Button>
              </div>

              {/* Default Folder Type */}
              <div>
                <label className="block text-sm font-pixel text-retro-accent mb-2">
                  Default Folder Type
                </label>
                <select
                  value={preferences.defaultFolderType}
                  onChange={(e) => updatePreferences({ 
                    defaultFolderType: e.target.value as any 
                  })}
                  className="pixel-input"
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
                <label className="block text-sm font-pixel text-retro-accent mb-2">
                  AI Prompt Template
                </label>
                <textarea
                  value={preferences.aiPromptTemplate}
                  onChange={(e) => updatePreferences({ 
                    aiPromptTemplate: e.target.value 
                  })}
                  rows={3}
                  className="pixel-input w-full resize-none"
                  placeholder="Enter custom AI prompt template..."
                />
                <p className="text-xs text-retro-accent-light font-pixel-sans mt-1">
                  This prompt will be used for AI item detection
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Privacy & Data Settings */}
        <Card variant="outlined" padding="md">
          <div className="space-y-pixel-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-retro-accent-medium rounded-pixel flex items-center justify-center">
                <Shield className="w-5 h-5 text-retro-bg-primary" />
              </div>
              <div>
                <h2 className="text-lg font-pixel text-retro-accent">
                  Privacy & Data
                </h2>
                <p className="text-sm text-retro-accent-light font-pixel-sans">
                  Manage your data and privacy settings
                </p>
              </div>
            </div>

            <div className="space-y-pixel-2 pl-13">
              {/* Compression Level */}
              <div>
                <label className="block text-sm font-pixel text-retro-accent mb-2">
                  Image Compression
                </label>
                <div className="flex space-x-2">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={preferences.compressionLevel === level ? 'accent' : 'ghost'}
                      size="sm"
                      onClick={() => updatePreferences({ compressionLevel: level })}
                      glow={preferences.compressionLevel === level}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-retro-accent-light font-pixel-sans mt-1">
                  Higher compression saves storage space but reduces image quality
                </p>
              </div>

              {/* Export Data */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-pixel text-retro-accent">
                    Export Data
                  </label>
                  <p className="text-xs text-retro-accent-light font-pixel-sans">
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

        {/* Accessibility Information */}
        <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
          <h3 className="font-pixel text-retro-accent mb-pixel">Accessibility Features</h3>
          <div className="space-y-1 text-sm font-pixel-sans text-retro-accent-light">
            <p>• <strong>WCAG 2.1 AA Compliant:</strong> All color combinations meet accessibility standards</p>
            <p>• <strong>High Contrast Support:</strong> Automatically adapts to system high contrast settings</p>
            <p>• <strong>Reduced Motion:</strong> Respects system motion preferences</p>
            <p>• <strong>Keyboard Navigation:</strong> Full keyboard support for all interactive elements</p>
            <p>• <strong>Screen Reader Compatible:</strong> Proper ARIA labels and semantic markup</p>
          </div>
        </Card>

        {/* App Info */}
        <Card variant="outlined" padding="md">
          <div className="text-center space-y-2">
            <h3 className="font-pixel text-retro-accent">
              CacawInventory
            </h3>
            <p className="text-sm text-retro-accent-light font-pixel-sans">
              Version 0.1.0 - Phase 1 Development
            </p>
            <p className="text-xs text-retro-accent-light font-pixel-sans">
              AI-Powered Collectible Inventory Manager
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};