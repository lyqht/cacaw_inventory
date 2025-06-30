import { StorageService } from './storage';
import { Folder, CollectibleData } from '../types';

export interface ExportData {
  version: string;
  exportedAt: string;
  exportType: 'single' | 'multiple' | 'all';
  checksum: string;
  metadata: {
    appVersion: string;
    totalFolders: number;
    totalItems: number;
    exportedBy: string;
  };
  folders: Folder[];
  items: CollectibleData[];
}

export interface ImportOptions {
  mergeStrategy: 'replace' | 'merge' | 'skip';
  validateData: boolean;
  createBackup: boolean;
}

export interface ImportResult {
  success: boolean;
  foldersImported: number;
  itemsImported: number;
  foldersSkipped: number;
  itemsSkipped: number;
  errors: string[];
  warnings: string[];
}

export interface ImportPreview {
  totalFolders: number;
  totalItems: number;
  newFolders: number;
  newItems: number;
  duplicateFolders: string[];
  duplicateItems: string[];
  estimatedSize: string;
  exportDate: string;
  version: string;
}

export class ExportImportService {
  private static instance: ExportImportService;
  private storageService: StorageService;
  private readonly CURRENT_VERSION = '1.0.0';
  private readonly APP_VERSION = '0.1.0';

  static getInstance(): ExportImportService {
    if (!ExportImportService.instance) {
      ExportImportService.instance = new ExportImportService();
    }
    return ExportImportService.instance;
  }

  constructor() {
    this.storageService = StorageService.getInstance();
  }

  // Export single folder with all its items
  async exportFolder(folderId: string): Promise<string> {
    try {
      const folder = await this.storageService.getFolder(folderId);
      if (!folder) {
        throw new Error('Folder not found');
      }

      const items = await this.storageService.getItemsByFolder(folderId);
      
      const exportData: ExportData = {
        version: this.CURRENT_VERSION,
        exportedAt: new Date().toISOString(),
        exportType: 'single',
        checksum: '',
        metadata: {
          appVersion: this.APP_VERSION,
          totalFolders: 1,
          totalItems: items.length,
          exportedBy: 'CacawInventory'
        },
        folders: [folder],
        items: items
      };

      // Generate checksum
      exportData.checksum = await this.generateChecksum(exportData);

      const jsonData = JSON.stringify(exportData, null, 2);
      const filename = this.generateFilename([folder.name]);
      
      this.downloadFile(jsonData, filename);
      return filename;

    } catch (error) {
      console.error('Export folder error:', error);
      throw new Error(`Failed to export folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Export multiple selected folders
  async exportFolders(folderIds: string[]): Promise<string> {
    try {
      if (folderIds.length === 0) {
        throw new Error('No folders selected for export');
      }

      const folders: Folder[] = [];
      const allItems: CollectibleData[] = [];
      const folderNames: string[] = [];

      for (const folderId of folderIds) {
        const folder = await this.storageService.getFolder(folderId);
        if (folder) {
          folders.push(folder);
          folderNames.push(folder.name);
          
          const items = await this.storageService.getItemsByFolder(folderId);
          allItems.push(...items);
        }
      }

      if (folders.length === 0) {
        throw new Error('No valid folders found to export');
      }

      const exportData: ExportData = {
        version: this.CURRENT_VERSION,
        exportedAt: new Date().toISOString(),
        exportType: 'multiple',
        checksum: '',
        metadata: {
          appVersion: this.APP_VERSION,
          totalFolders: folders.length,
          totalItems: allItems.length,
          exportedBy: 'CacawInventory'
        },
        folders: folders,
        items: allItems
      };

      exportData.checksum = await this.generateChecksum(exportData);

      const jsonData = JSON.stringify(exportData, null, 2);
      const filename = this.generateFilename(folderNames);
      
      this.downloadFile(jsonData, filename);
      return filename;

    } catch (error) {
      console.error('Export folders error:', error);
      throw new Error(`Failed to export folders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Export all collections
  async exportAllCollections(): Promise<string> {
    try {
      const folders = await this.storageService.getFolders();
      const allItems: CollectibleData[] = [];

      for (const folder of folders) {
        const items = await this.storageService.getItemsByFolder(folder.id);
        allItems.push(...items);
      }

      const exportData: ExportData = {
        version: this.CURRENT_VERSION,
        exportedAt: new Date().toISOString(),
        exportType: 'all',
        checksum: '',
        metadata: {
          appVersion: this.APP_VERSION,
          totalFolders: folders.length,
          totalItems: allItems.length,
          exportedBy: 'CacawInventory'
        },
        folders: folders,
        items: allItems
      };

      exportData.checksum = await this.generateChecksum(exportData);

      const jsonData = JSON.stringify(exportData, null, 2);
      const filename = this.generateFilename(['All_Collections']);
      
      this.downloadFile(jsonData, filename);
      return filename;

    } catch (error) {
      console.error('Export all collections error:', error);
      throw new Error(`Failed to export all collections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Preview import data before actual import
  async previewImport(file: File): Promise<ImportPreview> {
    try {
      const fileContent = await this.readFileAsText(file);
      const importData = this.parseImportData(fileContent);
      
      // Validate data structure
      this.validateImportData(importData);

      // Get existing data for comparison
      const existingFolders = await this.storageService.getFolders();
      const existingFolderNames = new Set(existingFolders.map(f => f.name.toLowerCase()));
      
      // Find duplicates
      const duplicateFolders = importData.folders
        .filter(folder => existingFolderNames.has(folder.name.toLowerCase()))
        .map(folder => folder.name);

      // Count new items
      const newFolders = importData.folders.length - duplicateFolders.length;
      const newItems = importData.items.length; // Simplified for now

      return {
        totalFolders: importData.folders.length,
        totalItems: importData.items.length,
        newFolders: Math.max(0, newFolders),
        newItems: newItems,
        duplicateFolders: duplicateFolders,
        duplicateItems: [], // TODO: Implement item duplicate detection
        estimatedSize: this.formatFileSize(file.size),
        exportDate: importData.exportedAt,
        version: importData.version
      };

    } catch (error) {
      console.error('Preview import error:', error);
      throw new Error(`Failed to preview import: ${error instanceof Error ? error.message : 'Invalid file format'}`);
    }
  }

  // Import data with options
  async importData(
    file: File, 
    options: ImportOptions,
    onProgress?: (progress: number, message: string) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      foldersImported: 0,
      itemsImported: 0,
      foldersSkipped: 0,
      itemsSkipped: 0,
      errors: [],
      warnings: []
    };

    try {
      onProgress?.(10, 'Reading import file...');
      
      const fileContent = await this.readFileAsText(file);
      const importData = this.parseImportData(fileContent);

      onProgress?.(20, 'Validating data...');
      
      if (options.validateData) {
        this.validateImportData(importData);
        
        // Verify checksum if present
        if (importData.checksum) {
          const calculatedChecksum = await this.generateChecksum({
            ...importData,
            checksum: ''
          });
          
          if (calculatedChecksum !== importData.checksum) {
            result.warnings.push('Data integrity check failed - checksum mismatch');
          }
        }
      }

      onProgress?.(30, 'Creating backup...');
      
      // Only create backup if requested AND there are existing folders
      const existingFoldersForBackup = await this.storageService.getFolders();
      if (options.createBackup && existingFoldersForBackup.length > 0) {
        try {
          await this.exportAllCollections();
          result.warnings.push('Backup created before import');
        } catch (error) {
          result.warnings.push('Failed to create backup, continuing with import');
        }
      } else if (options.createBackup && existingFoldersForBackup.length === 0) {
        result.warnings.push('No existing folders, backup not needed');
      }

      onProgress?.(40, 'Processing folders...');
      
      // Import folders
      const existingFolders = await this.storageService.getFolders();
      const existingFolderNames = new Map(
        existingFolders.map(f => [f.name.toLowerCase(), f])
      );

      for (let i = 0; i < importData.folders.length; i++) {
        const folder = importData.folders[i];
        const progress = 40 + (i / importData.folders.length) * 30;
        onProgress?.(progress, `Importing folder: ${folder.name}`);

        try {
          const existingFolder = existingFolderNames.get(folder.name.toLowerCase());
          
          if (existingFolder) {
            if (options.mergeStrategy === 'skip') {
              result.foldersSkipped++;
              continue;
            } else if (options.mergeStrategy === 'replace') {
              await this.storageService.deleteFolder(existingFolder.id);
            }
          }

          // Create new folder with new ID
          const newFolderId = await this.storageService.createFolder({
            userId: 'default-user',
            name: folder.name,
            description: folder.description,
            type: folder.type,
            source: 'local',
            tags: folder.tags || [],
            itemCount: 0,
            isArchived: false,
            syncStatus: 'local-only',
            metadata: folder.metadata || {
              sortOrder: 'name',
              sortDirection: 'asc',
              viewMode: 'grid'
            }
          });

          // Update items to reference new folder ID
          const folderItems = importData.items.filter(item => item.folderId === folder.id);
          for (const item of folderItems) {
            item.folderId = newFolderId;
          }

          result.foldersImported++;

        } catch (error) {
          result.errors.push(`Failed to import folder "${folder.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      onProgress?.(70, 'Processing items...');
      
      // Import items
      for (let i = 0; i < importData.items.length; i++) {
        const item = importData.items[i];
        const progress = 70 + (i / importData.items.length) * 25;
        onProgress?.(progress, `Importing item: ${item.name}`);

        try {
          await this.storageService.createItem({
            folderId: item.folderId,
            userId: 'default-user',
            name: item.name,
            type: item.type,
            series: item.series,
            condition: item.condition,
            description: item.description,
            notes: item.notes,
            estimatedValue: item.estimatedValue,
            purchasePrice: item.purchasePrice,
            currency: item.currency,
            tags: item.tags || [],
            primaryImage: item.primaryImage,
            additionalImages: item.additionalImages || [],
            thumbnailImage: item.thumbnailImage,
            aiDetected: item.aiDetected || false,
            aiConfidence: item.aiConfidence,
            aiPromptUsed: item.aiPromptUsed,
            ocrText: item.ocrText,
            lastViewedAt: item.lastViewedAt,
            syncStatus: 'local-only',
            isArchived: false
          });

          result.itemsImported++;

        } catch (error) {
          result.errors.push(`Failed to import item "${item.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      onProgress?.(95, 'Finalizing import...');
      
      result.success = result.errors.length === 0 || (result.foldersImported > 0 || result.itemsImported > 0);
      
      onProgress?.(100, 'Import completed');
      
      return result;

    } catch (error) {
      console.error('Import data error:', error);
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  // Utility methods
  private async generateChecksum(data: Partial<ExportData>): Promise<string> {
    const dataString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private generateFilename(folderNames: string[]): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const sanitizedNames = folderNames
      .map(name => name.replace(/[^a-zA-Z0-9_-]/g, '_'))
      .join('_');
    
    const maxLength = 50;
    const truncatedNames = sanitizedNames.length > maxLength 
      ? sanitizedNames.substring(0, maxLength) + '...'
      : sanitizedNames;
    
    return `CacawInventory_${truncatedNames}_${timestamp}.json`;
  }

  private downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File reading error'));
      };
      
      reader.readAsText(file);
    });
  }

  private parseImportData(content: string): ExportData {
    try {
      const data = JSON.parse(content);
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON format');
      }
      
      return data as ExportData;
      
    } catch (error) {
      throw new Error('Invalid JSON file format');
    }
  }

  private validateImportData(data: ExportData): void {
    const errors: string[] = [];

    // Check required fields
    if (!data.version) errors.push('Missing version information');
    if (!data.exportedAt) errors.push('Missing export timestamp');
    if (!data.folders || !Array.isArray(data.folders)) errors.push('Invalid folders data');
    if (!data.items || !Array.isArray(data.items)) errors.push('Invalid items data');

    // Check version compatibility
    if (data.version && !this.isVersionCompatible(data.version)) {
      errors.push(`Incompatible version: ${data.version}. Current version: ${this.CURRENT_VERSION}`);
    }

    // Validate folder structure
    for (const folder of data.folders || []) {
      if (!folder.id || !folder.name || !folder.type) {
        errors.push(`Invalid folder structure: ${folder.name || 'Unknown'}`);
      }
    }

    // Validate item structure
    for (const item of data.items || []) {
      if (!item.id || !item.name || !item.folderId) {
        errors.push(`Invalid item structure: ${item.name || 'Unknown'}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Data validation failed:\n${errors.join('\n')}`);
    }
  }

  private isVersionCompatible(version: string): boolean {
    // Simple version compatibility check
    const [major] = version.split('.');
    const [currentMajor] = this.CURRENT_VERSION.split('.');
    return major === currentMajor;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}