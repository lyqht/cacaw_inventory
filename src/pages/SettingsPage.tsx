import React, { useState } from 'react';
import { ArrowLeft, Palette, Zap, Shield, Upload, Download, Package } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ExportImportModal } from '../components/folders/ExportImportModal';

export const SettingsPage: React.FC = () => {
  const { setCurrentView, preferences, updatePreferences, folders } = useAppStore();
  const [showExportImport, setShowExportImport] = useState(false);
  const [exportImportMode, setExportImportMode] = useState<'export' | 'import'>('export');

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    updatePreferences({ theme });
  };

  const handleToggleAnimations = () => {
    updatePreferences({ pixelAnimations: !preferences.pixelAnimations });
  };

  const handleToggleAutoDetection = () => {
    updatePreferences({ autoDetection: !preferences.autoDetection });
  };

  const openExportModal = () => {
    setExportImportMode('export');
    setShowExportImport(true);
  };

  const openImportModal = () => {
    setExportImportMode('import');
    setShowExportImport(true);
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
          
          <h2 className="text-xl font-pixel text-retro-accent">
            Settings
          </h2>
          
          <div /> {/* Spacer */}
        </div>

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

        {/* Data Management Settings */}
        <Card variant="outlined" padding="md">
          <div className="space-y-pixel-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-retro-accent-medium rounded-pixel flex items-center justify-center">
                <Package className="w-5 h-5 text-retro-bg-primary" />
              </div>
              <div>
                <h2 className="text-lg font-pixel text-retro-accent">
                  Data Management
                </h2>
                <p className="text-sm text-retro-accent-light font-pixel-sans">
                  Export, import, and manage your collection data
                </p>
              </div>
            </div>

            <div className="space-y-pixel-2 pl-13">
              {/* Export Data */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-pixel text-retro-accent">
                    Export Collections
                  </label>
                  <p className="text-xs text-retro-accent-light font-pixel-sans">
                    Download your collections as a JSON file for backup
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Upload}
                  onClick={openExportModal}
                >
                  Export
                </Button>
              </div>

              {/* Import Data */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-pixel text-retro-accent">
                    Import Collections
                  </label>
                  <p className="text-xs text-retro-accent-light font-pixel-sans">
                    Import collections from a previously exported file
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Download}
                  onClick={openImportModal}
                >
                  Import
                </Button>
              </div>

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
                  Privacy & Security
                </h2>
                <p className="text-sm text-retro-accent-light font-pixel-sans">
                  Manage your privacy and security settings
                </p>
              </div>
            </div>

            <div className="space-y-pixel-2 pl-13">
              <div className="p-3 bg-retro-bg-tertiary border border-retro-accent rounded-pixel">
                <h4 className="font-pixel text-retro-accent text-sm mb-2">Local-First Privacy</h4>
                <div className="space-y-1 text-xs font-pixel-sans text-retro-accent-light">
                  <p>• <strong>Your data stays on your device:</strong> All collections are stored locally in your browser</p>
                  <p>• <strong>No cloud storage required:</strong> Works completely offline</p>
                  <p>• <strong>AI processing:</strong> Only image data is sent to Google Gemini for detection</p>
                  <p>• <strong>Export control:</strong> You decide when and what to export</p>
                </div>
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

      {/* Export/Import Modal */}
      <ExportImportModal
        isOpen={showExportImport}
        onClose={() => setShowExportImport(false)}
        folders={folders}
        mode={exportImportMode}
        onImportComplete={() => {
          // Refresh the page or reload data as needed
          window.location.reload();
        }}
      />
    </div>
  );
};