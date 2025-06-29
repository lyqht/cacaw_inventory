import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportImportService } from '../exportImport';
import { StorageService } from '../storage';
import { Folder, CollectibleData } from '../../types';

// Mock StorageService
vi.mock('../storage', () => ({
  StorageService: {
    getInstance: vi.fn(() => ({
      getFolder: vi.fn(),
      getFolders: vi.fn(),
      getItemsByFolder: vi.fn(),
      createFolder: vi.fn(),
      createItem: vi.fn(),
      deleteFolder: vi.fn(),
    }))
  }
}));

// Mock crypto.subtle for checksum generation
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
});

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  }
});

// Mock document for file download
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn()
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  }
});

describe('ExportImportService', () => {
  let exportImportService: ExportImportService;
  let mockStorageService: any;

  const mockFolder: Folder = {
    id: 'folder-1',
    userId: 'user-1',
    name: 'Test Folder',
    description: 'Test Description',
    type: 'trading-cards',
    source: 'local',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    tags: ['test'],
    itemCount: 1,
    isArchived: false,
    syncStatus: 'local-only',
    metadata: {
      sortOrder: 'name',
      sortDirection: 'asc',
      viewMode: 'grid'
    }
  };

  const mockItem: CollectibleData = {
    id: 'item-1',
    folderId: 'folder-1',
    userId: 'user-1',
    name: 'Test Item',
    
    condition: 'excellent',
    tags: ['test'],
    currency: 'USD',
    additionalImages: [],
    aiDetected: false,
    syncStatus: 'local-only',
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  beforeEach(() => {
    exportImportService = ExportImportService.getInstance();
    mockStorageService = StorageService.getInstance();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock returns
    mockStorageService.getFolder.mockResolvedValue(mockFolder);
    mockStorageService.getFolders.mockResolvedValue([mockFolder]);
    mockStorageService.getItemsByFolder.mockResolvedValue([mockItem]);
  });

  describe('exportFolder', () => {
    it('should export a single folder with its items', async () => {
      const result = await exportImportService.exportFolder('folder-1');
      
      expect(mockStorageService.getFolder).toHaveBeenCalledWith('folder-1');
      expect(mockStorageService.getItemsByFolder).toHaveBeenCalledWith('folder-1');
      expect(result).toContain('CacawInventory_Test_Folder');
      expect(result).toContain('.json');
    });

    it('should throw an error if folder not found', async () => {
      mockStorageService.getFolder.mockResolvedValue(null);
      
      await expect(exportImportService.exportFolder('invalid-id')).rejects.toThrow('Folder not found');
    });
  });

  describe('exportFolders', () => {
    it('should export multiple folders with their items', async () => {
      const result = await exportImportService.exportFolders(['folder-1']);
      
      expect(mockStorageService.getFolder).toHaveBeenCalledWith('folder-1');
      expect(mockStorageService.getItemsByFolder).toHaveBeenCalledWith('folder-1');
      expect(result).toContain('CacawInventory_Test_Folder');
    });

    it('should throw an error if no folders are selected', async () => {
      await expect(exportImportService.exportFolders([])).rejects.toThrow('No folders selected for export');
    });
  });

  describe('exportAllCollections', () => {
    it('should export all folders and items', async () => {
      const result = await exportImportService.exportAllCollections();
      
      expect(mockStorageService.getFolders).toHaveBeenCalled();
      expect(mockStorageService.getItemsByFolder).toHaveBeenCalledWith('folder-1');
      expect(result).toContain('CacawInventory_All_Collections');
    });
  });

  describe('importData', () => {
    it('should validate and import data correctly', async () => {
      // Mock file content
      const mockExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        exportType: 'all',
        checksum: 'mock-checksum',
        metadata: {
          appVersion: '0.1.0',
          totalFolders: 1,
          totalItems: 1,
          exportedBy: 'CacawInventory'
        },
        folders: [mockFolder],
        items: [mockItem]
      };
      
      // Mock file reader
      const mockFile = new File(
        [JSON.stringify(mockExportData)],
        'test-export.json',
        { type: 'application/json' }
      );
      
      // Mock FileReader
      global.FileReader = vi.fn().mockImplementation(() => ({
        readAsText: function() {
          this.onload({ target: { result: JSON.stringify(mockExportData) } });
        }
      }));
      
      const result = await exportImportService.importData(
        mockFile,
        { mergeStrategy: 'merge', validateData: true, createBackup: false },
        vi.fn()
      );
      
      expect(result.success).toBe(true);
      expect(mockStorageService.createFolder).toHaveBeenCalled();
      expect(mockStorageService.createItem).toHaveBeenCalled();
    });
  });

  describe('previewImport', () => {
    it('should generate a preview of import data', async () => {
      // Mock file content
      const mockExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        exportType: 'all',
        checksum: 'mock-checksum',
        metadata: {
          appVersion: '0.1.0',
          totalFolders: 1,
          totalItems: 1,
          exportedBy: 'CacawInventory'
        },
        folders: [mockFolder],
        items: [mockItem]
      };
      
      // Mock file
      const mockFile = new File(
        [JSON.stringify(mockExportData)],
        'test-export.json',
        { type: 'application/json' }
      );
      
      // Mock FileReader
      global.FileReader = vi.fn().mockImplementation(() => ({
        readAsText: function() {
          this.onload({ target: { result: JSON.stringify(mockExportData) } });
        }
      }));
      
      const preview = await exportImportService.previewImport(mockFile);
      
      expect(preview.totalFolders).toBe(1);
      expect(preview.totalItems).toBe(1);
      expect(preview.version).toBe('1.0.0');
    });
  });
});