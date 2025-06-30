import { AlertTriangle, CheckCircle, Download, FileText, FolderOpen, Upload, X } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { ExportImportService, ImportOptions, ImportPreview, ImportResult } from '../../services/exportImport';
import { Folder } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  selectedFolders?: string[];
  onImportComplete?: () => void;
  mode: 'export' | 'import';
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  folders,
  selectedFolders = [],
  onImportComplete,
  mode: initialMode
}) => {
  const [mode, setMode] = useState<'export' | 'import'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [exportType, setExportType] = useState<'selected' | 'all'>('all');
  const [selectedForExport, setSelectedForExport] = useState<string[]>(selectedFolders);
  
  // Import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    mergeStrategy: 'merge',
    validateData: true,
    createBackup: true
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState<{ progress: number; message: string } | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportImportService = ExportImportService.getInstance();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      let filename: string;

      if (exportType === 'all') {
        filename = await exportImportService.exportAllCollections();
        setSuccess(`Successfully exported all collections to ${filename}`);
      } else if (selectedForExport.length > 0) {
        filename = await exportImportService.exportFolders(selectedForExport);
        setSuccess(`Successfully exported ${selectedForExport.length} folder(s) to ${filename}`);
      } else {
        throw new Error('No folders selected for export');
      }

    } catch (error) {
      console.error('Export error:', error);
      setError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please select a valid JSON file');
      return;
    }

    setImportFile(file);
    setError(null);
    setImportPreview(null);
    setImportResult(null);

    try {
      setIsLoading(true);
      const preview = await exportImportService.previewImport(file);
      setImportPreview(preview);
    } catch (error) {
      console.error('Preview error:', error);
      setError(error instanceof Error ? error.message : 'Failed to preview file');
      setImportFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile || !importPreview) return;

    try {
      setIsLoading(true);
      setError(null);
      setImportResult(null);
      setImportProgress({ progress: 0, message: 'Starting import...' });

      const result = await exportImportService.importData(
        importFile,
        importOptions,
        (progress, message) => {
          setImportProgress({ progress, message });
        }
      );

      setImportResult(result);
      setImportProgress(null);

      if (result.success) {
        setSuccess(`Import completed! ${result.foldersImported} folders and ${result.itemsImported} items imported.`);
        onImportComplete?.();
      } else {
        setError('Import completed with errors. Check the results below.');
      }

    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : 'Import failed');
      setImportProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolderSelection = (folderId: string) => {
    setSelectedForExport(prev => 
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const selectAllFolders = () => {
    setSelectedForExport(folders.map(f => f.id));
  };

  const deselectAllFolders = () => {
    setSelectedForExport([]);
  };

  const resetModal = () => {
    setImportFile(null);
    setImportPreview(null);
    setImportResult(null);
    setImportProgress(null);
    setError(null);
    setSuccess(null);
    setSelectedForExport(selectedFolders);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleModeSwitch = (newMode: 'export' | 'import') => {
    resetModal();
    setMode(newMode);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Export & Import Collections"
      size="xl"
    >
      <div className="space-y-pixel-2">
        {/* Mode Selector */}
        <div className="flex gap-2 p-2 bg-retro-bg-tertiary border border-retro-accent rounded-pixel">
          <Button
            variant={mode === 'export' ? 'accent' : 'ghost'}
            size="sm"
            icon={Upload}
            onClick={() => handleModeSwitch('export')}
            disabled={isLoading}
          >
            Export
          </Button>
          <Button
            variant={mode === 'import' ? 'accent' : 'ghost'}
            size="sm"
            icon={Download}
            onClick={() => handleModeSwitch('import')}
            disabled={isLoading}
          >
            Import
          </Button>
        </div>

        {/* Export Mode */}
        {mode === 'export' && (
          <div className="space-y-pixel-2">
            <Card variant="outlined" padding="md">
              <h3 className="font-pixel text-retro-accent mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Export Collections
              </h3>
              <p className="text-retro-accent-light font-pixel-sans text-sm mb-pixel-2">
                Export your collections to a JSON file for backup or transfer to another device.
              </p>

              {/* Export Type Selection */}
              <div className="space-y-pixel-2">
                <div className="flex gap-2">
                  <Button
                    variant={exportType === 'all' ? 'accent' : 'ghost'}
                    size="sm"
                    onClick={() => setExportType('all')}
                    disabled={isLoading}
                  >
                    Export All ({folders.length} folders)
                  </Button>
                  <Button
                    variant={exportType === 'selected' ? 'accent' : 'ghost'}
                    size="sm"
                    onClick={() => setExportType('selected')}
                    disabled={isLoading}
                  >
                    Export Selected
                  </Button>
                </div>

                {/* Folder Selection */}
                {exportType === 'selected' && (
                  <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-pixel text-retro-accent text-sm">
                        Select Folders ({selectedForExport.length}/{folders.length})
                      </h4>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllFolders}
                          disabled={isLoading || selectedForExport.length === folders.length}
                        >
                          All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={deselectAllFolders}
                          disabled={isLoading || selectedForExport.length === 0}
                        >
                          None
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {folders.map(folder => (
                        <div
                          key={folder.id}
                          className="flex items-center gap-2 p-2 hover:bg-retro-accent hover:bg-opacity-10 rounded-pixel cursor-pointer"
                          onClick={() => toggleFolderSelection(folder.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedForExport.includes(folder.id)}
                            onChange={() => toggleFolderSelection(folder.id)}
                            className="w-4 h-4 text-retro-accent bg-retro-bg-tertiary border-retro-accent rounded focus:ring-retro-accent"
                          />
                          <FolderOpen className="w-4 h-4 text-retro-accent" />
                          <span className="font-pixel-sans text-sm text-retro-accent">
                            {folder.name}
                          </span>
                          <Badge variant="default" size="sm">
                            {folder.itemCount} items
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Export Button */}
                <div className="flex justify-end">
                  <Button
                    variant="accent"
                    icon={Upload}
                    onClick={handleExport}
                    disabled={isLoading || (exportType === 'selected' && selectedForExport.length === 0)}
                    isLoading={isLoading}
                    glow
                  >
                    {exportType === 'all' 
                      ? 'Export All Collections' 
                      : `Export ${selectedForExport.length} Folder${selectedForExport.length !== 1 ? 's' : ''}`
                    }
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Import Mode */}
        {mode === 'import' && (
          <div className="space-y-pixel-2">
            <Card variant="outlined" padding="md">
              <h3 className="font-pixel text-retro-accent mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Import Collections
              </h3>
              <p className="text-retro-accent-light font-pixel-sans text-sm mb-pixel-2">
                Import collections from a previously exported JSON file.
              </p>

              {/* File Selection */}
              <div className="space-y-pixel-2">
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    icon={FileText}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    Select Import File
                  </Button>
                  {importFile && (
                    <div className="flex items-center gap-2">
                      <span className="font-pixel-sans text-sm text-retro-accent">
                        {importFile.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={X}
                        onClick={() => {
                          setImportFile(null);
                          setImportPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Import Preview */}
                {importPreview && (
                  <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
                    <h4 className="font-pixel text-retro-accent text-sm mb-2">Import Preview</h4>
                    
                    <div className="grid grid-cols-2 gap-pixel-2 text-sm font-pixel-sans">
                      <div>
                        <span className="text-retro-accent-light">Export Date:</span>
                        <span className="text-retro-accent ml-2">
                          {new Date(importPreview.exportDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-retro-accent-light">Version:</span>
                        <span className="text-retro-accent ml-2">{importPreview.version}</span>
                      </div>
                      <div>
                        <span className="text-retro-accent-light">Total Folders:</span>
                        <span className="text-retro-accent ml-2">{importPreview.totalFolders}</span>
                      </div>
                      <div>
                        <span className="text-retro-accent-light">Total Items:</span>
                        <span className="text-retro-accent ml-2">{importPreview.totalItems}</span>
                      </div>
                      <div>
                        <span className="text-retro-accent-light">New Folders:</span>
                        <span className="text-retro-success ml-2">{importPreview.newFolders}</span>
                      </div>
                      <div>
                        <span className="text-retro-accent-light">File Size:</span>
                        <span className="text-retro-accent ml-2">{importPreview.estimatedSize}</span>
                      </div>
                    </div>

                    {/* Duplicate Warnings */}
                    {importPreview.duplicateFolders.length > 0 && (
                      <div className="mt-pixel-2 p-2 rounded-pixel">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-retro-warning" />
                          <span className="font-pixel text-retro-warning text-xs">
                            Duplicate Folders Found
                          </span>
                        </div>
                        <div className="text-xs font-pixel-sans text-retro-warning">
                          {importPreview.duplicateFolders.slice(0, 3).join(', ')}
                          {importPreview.duplicateFolders.length > 3 && 
                            ` and ${importPreview.duplicateFolders.length - 3} more`
                          }
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Import Options */}
                {importPreview && (
                  <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
                    <h4 className="font-pixel text-retro-accent text-sm mb-2">Import Options</h4>
                    
                    <div className="space-y-pixel">
                      {/* Merge Strategy */}
                      <div>
                        <label className="block text-xs font-pixel text-retro-accent mb-1">
                          Duplicate Handling
                        </label>
                        <div className="flex gap-2">
                          {(['merge', 'replace', 'skip'] as const).map(strategy => (
                            <Button
                              key={strategy}
                              variant={importOptions.mergeStrategy === strategy ? 'accent' : 'ghost'}
                              size="sm"
                              onClick={() => setImportOptions(prev => ({ ...prev, mergeStrategy: strategy }))}
                              disabled={isLoading}
                            >
                              {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-retro-accent-light font-pixel-sans mt-1">
                          {importOptions.mergeStrategy === 'merge' && 'Keep existing data and add new items'}
                          {importOptions.mergeStrategy === 'replace' && 'Replace existing folders with imported ones'}
                          {importOptions.mergeStrategy === 'skip' && 'Skip folders that already exist'}
                        </p>
                      </div>

                      {/* Additional Options */}
                      <div className="flex flex-wrap gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={importOptions.validateData}
                            onChange={(e) => setImportOptions(prev => ({ ...prev, validateData: e.target.checked }))}
                            className="w-4 h-4 text-retro-accent bg-retro-bg-tertiary border-retro-accent rounded focus:ring-retro-accent"
                          />
                          <span className="text-xs font-pixel-sans text-retro-accent">Validate data</span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={importOptions.createBackup}
                            onChange={(e) => setImportOptions(prev => ({ ...prev, createBackup: e.target.checked }))}
                            className="w-4 h-4 text-retro-accent bg-retro-bg-tertiary border-retro-accent rounded focus:ring-retro-accent"
                          />
                          <span className="text-xs font-pixel-sans text-retro-accent">Create backup</span>
                        </label>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Import Progress */}
                {importProgress && (
                  <Card variant="outlined" padding="md" className="bg-retro-accent bg-opacity-10 border-retro-accent">
                    <div className="flex items-center gap-2 mb-2">
                      <LoadingSpinner size="sm" variant="accent" />
                      <span className="font-pixel text-retro-accent text-sm">Importing...</span>
                    </div>
                    <div className="w-full bg-retro-bg-tertiary border border-retro-accent rounded-pixel overflow-hidden mb-2">
                      <div
                        className="h-2 bg-retro-accent transition-all duration-200"
                        style={{ width: `${importProgress.progress}%` }}
                      />
                    </div>
                    <p className="text-xs font-pixel-sans text-retro-accent-light">
                      {importProgress.message}
                    </p>
                  </Card>
                )}

                {/* Import Results */}
                {importResult && (
                  <Card variant="outlined" padding="md" className={
                    importResult.success ? 'border-retro-success' : 'border-retro-warning'
                  }>
                    <div className="flex items-center gap-2 mb-2">
                      {importResult.success ? (
                        <CheckCircle className="w-4 h-4 text-retro-success" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-retro-warning" />
                      )}
                      <span className="font-pixel text-retro-success text-sm">
                        Import {importResult.success ? 'Completed' : 'Completed with Issues'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-pixel-sans mb-2 text-retro-accent">
                      <div>Folders Imported: <span className="text-retro-success">{importResult.foldersImported}</span></div>
                      <div>Items Imported: <span className="text-retro-success">{importResult.itemsImported}</span></div>
                      <div>Folders Skipped: <span className="text-retro-warning">{importResult.foldersSkipped}</span></div>
                      <div>Items Skipped: <span className="text-retro-warning">{importResult.itemsSkipped}</span></div>
                    </div>

                    {importResult.errors.length > 0 && (
                      <div className="mt-2">
                        <h5 className="font-pixel text-retro-error text-xs mb-1">Errors:</h5>
                        <div className="max-h-24 overflow-y-auto">
                          {importResult.errors.map((error, index) => (
                            <p key={index} className="text-xs font-pixel-sans text-retro-error">
                              • {error}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {importResult.warnings.length > 0 && (
                      <div className="mt-2">
                        <h5 className="font-pixel text-retro-warning text-xs mb-1">Warnings:</h5>
                        <div className="max-h-24 overflow-y-auto">
                          {importResult.warnings.map((warning, index) => (
                            <p key={index} className="text-xs font-pixel-sans text-retro-warning">
                              • {warning}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Import Button */}
                {importPreview && !importResult && (
                  <div className="flex justify-end">
                    <Button
                      variant="accent"
                      icon={Download}
                      onClick={handleImport}
                      disabled={isLoading}
                      isLoading={isLoading}
                      glow
                    >
                      Import Collections
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <Card variant="outlined" className="border-retro-error">
            <div className="flex items-center gap-2 text-retro-error">
              <AlertTriangle className="w-4 h-4" />
              <p className="font-pixel-sans text-sm">{error}</p>
            </div>
          </Card>
        )}

        {success && (
          <Card variant="outlined" className="border-retro-success">
            <div className="flex items-center gap-2 text-retro-success">
              <CheckCircle className="w-4 h-4" />
              <p className="font-pixel-sans text-sm">{success}</p>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-pixel-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};