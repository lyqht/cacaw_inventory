// Core data types for CacawInventory

export type FolderType = 
  | 'trading-cards' 
  | 'action-figures' 
  | 'plushies' 
  | 'comics' 
  | 'games' 
  | 'other';

export type ItemCondition = 
  | 'mint' 
  | 'near-mint' 
  | 'excellent' 
  | 'good' 
  | 'fair' 
  | 'poor' 
  | 'damaged';

export type SyncStatus = 
  | 'local-only'
  | 'synced'
  | 'pending-upload'
  | 'pending-download'
  | 'conflict'
  | 'error';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollectibleData {
  id: string;
  folderId: string;
  userId: string;
  
  // Core Properties
  name: string;
  type?: string;
  series?: string;
  condition: ItemCondition;
  
  // Metadata
  description?: string;
  tags: string[];
  notes?: string;
  
  // Valuation
  estimatedValue?: number;
  purchasePrice?: number;
  currency: string;
  
  // Images
  primaryImage?: string;
  additionalImages: string[];
  thumbnailImage?: string;
  
  // Detection Data
  aiDetected: boolean;
  aiConfidence?: number;
  aiPromptUsed?: string;
  ocrText?: string;
  boundingBox?: BoundingBox; // For AI-detected items with location data
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt?: Date;
  
  // Sync & Status
  syncStatus: SyncStatus;
  isArchived: boolean;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: FolderType;
  source: 'local' | 'demo' | 'cloud';
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  itemCount: number;
  totalValue?: number;
  isArchived: boolean;
  syncStatus: SyncStatus;
  metadata: FolderMetadata;
}

export interface FolderMetadata {
  color?: string;
  icon?: string;
  sortOrder: 'name' | 'date' | 'value' | 'condition';
  sortDirection: 'asc' | 'desc';
  viewMode: 'grid' | 'list' | 'table';
}

export interface ImageData {
  id: string;
  itemId: string;
  userId: string;
  
  // File Properties
  filename: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  
  // Storage
  originalBlob?: Blob;
  thumbnailBlob?: Blob;
  cloudUrl?: string;
  thumbnailUrl?: string;
  
  // Metadata
  capturedAt?: Date;
  uploadedAt: Date;
  processedAt?: Date;
  
  // Processing Flags
  isProcessed: boolean;
  hasOcrText: boolean;
  aiProcessed: boolean;
  
  syncStatus: SyncStatus;
}

export interface DetectionLog {
  id: string;
  userId: string;
  imageId: string;
  itemId?: string;
  
  // Detection Parameters
  promptUsed: string;
  modelVersion: string;
  processingTime: number;
  
  // Results
  success: boolean;
  confidence: number;
  rawResponse: string;
  extractedData: Partial<CollectibleData>;
  
  // Error Handling
  errorMessage?: string;
  retryCount: number;
  
  createdAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  pixelAnimations: boolean;
  autoDetection: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  defaultFolderType: FolderType;
  aiPromptTemplate: string;
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface DetectionResult {
  items: Partial<CollectibleData>[];
  confidence: number;
  processingTime: number;
  rawResponse: string;
  error?: string;
}