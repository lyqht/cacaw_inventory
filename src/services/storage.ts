import Dexie, { Table } from 'dexie';
import { CollectibleData, Folder, ImageData, DetectionLog, UserPreferences } from '../types';

// IndexedDB Database Schema
export class CacawInventoryDB extends Dexie {
  folders!: Table<Folder>;
  items!: Table<CollectibleData>;
  images!: Table<ImageData>;
  detectionLogs!: Table<DetectionLog>;
  settings!: Table<{ key: string; value: any }>;

  constructor() {
    super('CacawInventoryDB');
    
    this.version(1).stores({
      folders: 'id, userId, name, type, createdAt, updatedAt, isArchived',
      items: 'id, folderId, userId, name, createdAt, updatedAt, isArchived, *tags',
      images: 'id, itemId, userId, uploadedAt, isProcessed',
      detectionLogs: 'id, userId, imageId, createdAt, success',
      settings: 'key'
    });
  }
}

// Initialize database instance
export const db = new CacawInventoryDB();

// Storage Service Class
export class StorageService {
  private static instance: StorageService;
  private userId: string = 'default-user'; // Will be replaced with actual auth
  private isInitialized: boolean = false;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Initialize database - no default folders created
  async initialize(): Promise<void> {
    try {
      // Prevent multiple initializations
      if (this.isInitialized) {
        console.log('Storage already initialized, skipping...');
        return;
      }

      await db.open();
      console.log('Database opened successfully');
      
      this.isInitialized = true;
      console.log('Storage initialization complete - no default folders created');
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  // Folder operations
  async createFolder(folderData: Omit<Folder, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    const folder: Folder = {
      ...folderData,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.folders.add(folder);
    console.log('Created folder:', folder.name, folder.id);
    return id;
  }

  async getFolder(id: string): Promise<Folder | null> {
    const folder = await db.folders.get(id);
    return folder || null;
  }

  async getFolders(userId: string = this.userId): Promise<Folder[]> {
    const folders = await db.folders
      .where('userId')
      .equals(userId)
      .and(folder => !folder.isArchived)
      .toArray();
    
    console.log('Retrieved folders:', folders.length);
    return folders;
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<void> {
    await db.folders.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async deleteFolder(id: string): Promise<void> {
    try {
      // Start a transaction to ensure data consistency
      await db.transaction('rw', db.folders, db.items, db.images, async () => {
        // Get the folder to check if it exists
        const folder = await db.folders.get(id);
        if (!folder) {
          throw new Error('Folder not found');
        }

        // Get all items in the folder
        const items = await db.items
          .where('folderId')
          .equals(id)
          .toArray();

        // Delete all images associated with items in this folder
        for (const item of items) {
          await db.images
            .where('itemId')
            .equals(item.id)
            .delete();
        }

        // Delete all items in the folder
        await db.items
          .where('folderId')
          .equals(id)
          .delete();

        // Finally, delete the folder itself
        await db.folders.delete(id);
      });

      console.log(`Successfully deleted folder ${id} and all associated data`);
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw new Error('Failed to delete folder and its contents');
    }
  }

  // Soft delete folder (alternative method - keeps data but marks as archived)
  async archiveFolder(id: string): Promise<void> {
    await db.folders.update(id, {
      isArchived: true,
      updatedAt: new Date()
    });
    
    // Also archive all items in the folder
    await db.items
      .where('folderId')
      .equals(id)
      .modify({ isArchived: true, updatedAt: new Date() });
  }

  // Get folder statistics for deletion confirmation
  async getFolderStats(id: string): Promise<{
    itemCount: number;
    imageCount: number;
    totalValue: number;
  }> {
    const items = await db.items
      .where('folderId')
      .equals(id)
      .and(item => !item.isArchived)
      .toArray();

    let imageCount = 0;
    let totalValue = 0;

    for (const item of items) {
      // Count images for this item
      const itemImages = await db.images
        .where('itemId')
        .equals(item.id)
        .count();
      imageCount += itemImages;

      // Sum up estimated values
      if (item.estimatedValue) {
        totalValue += item.estimatedValue;
      }
    }

    return {
      itemCount: items.length,
      imageCount,
      totalValue
    };
  }

  // Item operations
  async createItem(itemData: Omit<CollectibleData, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    const item: CollectibleData = {
      ...itemData,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.items.add(item);
    
    // Update folder item count
    await this.updateFolderItemCount(itemData.folderId);
    
    return id;
  }

  async getItem(id: string): Promise<CollectibleData | null> {
    const item = await db.items.get(id);
    return item || null;
  }

  async getItemsByFolder(folderId: string): Promise<CollectibleData[]> {
    return await db.items
      .where('folderId')
      .equals(folderId)
      .and(item => !item.isArchived)
      .toArray();
  }

  async updateItem(id: string, updates: Partial<CollectibleData>): Promise<void> {
    const item = await this.getItem(id);
    if (!item) return;
    
    const oldFolderId = item.folderId;
    const newFolderId = updates.folderId || oldFolderId;
    
    await db.items.update(id, {
      ...updates,
      updatedAt: new Date()
    });
    
    // If folder changed, update both old and new folder item counts
    if (updates.folderId && updates.folderId !== oldFolderId) {
      await this.updateFolderItemCount(oldFolderId);
      await this.updateFolderItemCount(newFolderId);
    } else {
      // Otherwise just update the current folder's item count
      await this.updateFolderItemCount(oldFolderId);
    }
  }

  async deleteItem(id: string): Promise<void> {
    const item = await this.getItem(id);
    if (!item) return;

    // Delete associated images first
    await db.images
      .where('itemId')
      .equals(id)
      .delete();

    // Delete the item
    await db.items.delete(id);
    
    // Update folder item count
    await this.updateFolderItemCount(item.folderId);
  }

  async searchItems(query: string, userId: string = this.userId): Promise<CollectibleData[]> {
    const searchTerm = query.toLowerCase();
    
    return await db.items
      .where('userId')
      .equals(userId)
      .and(item => 
        !item.isArchived && (
          item.name.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm) ||
          item.notes?.toLowerCase().includes(searchTerm) ||
          item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        )
      )
      .toArray();
  }

  // Image operations
  async storeImage(imageData: Omit<ImageData, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    const image: ImageData = {
      ...imageData,
      id,
      uploadedAt: new Date()
    };
    
    await db.images.add(image);
    return id;
  }

  async getImage(id: string): Promise<ImageData | null> {
    const image = await db.images.get(id);
    return image || null;
  }

  async getImagesByItem(itemId: string): Promise<ImageData[]> {
    return await db.images
      .where('itemId')
      .equals(itemId)
      .toArray();
  }

  async deleteImage(id: string): Promise<void> {
    await db.images.delete(id);
  }

  // Settings operations
  async getSetting(key: string): Promise<any> {
    const setting = await db.settings.get(key);
    return setting?.value;
  }

  async setSetting(key: string, value: any): Promise<void> {
    await db.settings.put({ key, value });
  }

  // Utility methods
  private async updateFolderItemCount(folderId: string): Promise<void> {
    const itemCount = await db.items
      .where('folderId')
      .equals(folderId)
      .and(item => !item.isArchived)
      .count();
    
    // Calculate total value
    const items = await db.items
      .where('folderId')
      .equals(folderId)
      .and(item => !item.isArchived)
      .toArray();
    
    const totalValue = items.reduce((sum, item) => {
      return sum + (item.estimatedValue || 0);
    }, 0);
    
    await db.folders.update(folderId, { 
      itemCount,
      totalValue: totalValue > 0 ? totalValue : undefined,
      updatedAt: new Date()
    });
  }

  // Export data as JSON
  async exportData(): Promise<string> {
    const folders = await this.getFolders();
    const items = await db.items
      .where('userId')
      .equals(this.userId)
      .and(item => !item.isArchived)
      .toArray();
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userId: this.userId,
      folders,
      items
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // Import data from JSON
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate data structure
      if (!data.folders || !data.items) {
        throw new Error('Invalid import data format');
      }
      
      // Import folders
      for (const folder of data.folders) {
        const existingFolder = await db.folders.get(folder.id);
        if (!existingFolder) {
          await db.folders.add({
            ...folder,
            userId: this.userId,
            syncStatus: 'local-only' as SyncStatus
          });
        }
      }
      
      // Import items
      for (const item of data.items) {
        const existingItem = await db.items.get(item.id);
        if (!existingItem) {
          await db.items.add({
            ...item,
            userId: this.userId,
            syncStatus: 'local-only' as SyncStatus
          });
        }
      }
      
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  // Clear all data (for testing/reset)
  async clearAllData(): Promise<void> {
    await db.folders.clear();
    await db.items.clear();
    await db.images.clear();
    await db.detectionLogs.clear();
    await db.settings.clear();
    
    // Reset initialization flag
    this.isInitialized = false;
    
    console.log('All data cleared');
  }

  // Get database statistics
  async getDatabaseStats(): Promise<{
    folders: number;
    items: number;
    images: number;
    totalSize: number;
  }> {
    const [folders, items, images] = await Promise.all([
      db.folders.count(),
      db.items.count(),
      db.images.count()
    ]);

    // Estimate total size (rough calculation)
    const totalSize = (folders * 1000) + (items * 2000) + (images * 50000); // bytes

    return {
      folders,
      items,
      images,
      totalSize
    };
  }
}