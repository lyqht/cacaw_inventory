# Database Schemas & Data Models
# CacawInventory

## Overview

This document defines all data structures, database schemas, and TypeScript interfaces used throughout the CacawInventory application. The schemas are designed to support both local-first storage (IndexedDB) and future cloud synchronization (Supabase PostgreSQL).

## Core Data Models

### 1. User Profile Schema

```typescript
interface UserProfile {
  id: string;                    // UUID, primary key
  email: string;                 // Unique email address
  username?: string;             // Optional display name
  createdAt: Date;              // Account creation timestamp
  updatedAt: Date;              // Last profile update
  preferences: UserPreferences;  // User settings
  subscriptionTier: 'free' | 'premium' | 'pro';
  storageUsed: number;          // Bytes used
  storageLimit: number;         // Bytes allowed
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  pixelAnimations: boolean;
  autoDetection: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  defaultFolderType: 'cards' | 'figures' | 'plushies' | 'comics' | 'other';
  aiPromptTemplate: string;
}
```

### 2. Folder Schema

```typescript
interface Folder {
  id: string;                   // UUID, primary key
  userId: string;               // Foreign key to user
  name: string;                 // Folder display name
  description?: string;         // Optional folder description
  type: FolderType;            // Folder category
  source: 'local' | 'demo' | 'cloud';
  parentId?: string;           // For nested folders (future)
  createdAt: Date;             // Creation timestamp
  updatedAt: Date;             // Last modification
  tags: string[];              // Searchable tags
  itemCount: number;           // Cached count for performance
  totalValue?: number;         // Estimated total value
  isArchived: boolean;         // Soft delete flag
  syncStatus: SyncStatus;      // Cloud sync state
  metadata: FolderMetadata;    // Additional folder properties
}

type FolderType = 
  | 'trading-cards' 
  | 'action-figures' 
  | 'plushies' 
  | 'comics' 
  | 'games' 
  | 'other';

interface FolderMetadata {
  color?: string;              // Hex color for folder display
  icon?: string;               // Lucide icon name
  sortOrder: 'name' | 'date' | 'value' | 'condition';
  sortDirection: 'asc' | 'desc';
  viewMode: 'grid' | 'list' | 'table';
}
```

### 3. Collectible Item Schema

```typescript
interface CollectibleData {
  id: string;                  // UUID, primary key
  folderId: string;           // Foreign key to folder
  userId: string;             // Foreign key to user (denormalized)
  
  // Core Properties
  name: string;               // Item name/title
  type?: string;              // Item category/type
  series?: string;            // Series or set name
  condition: ItemCondition;   // Physical condition
  
  // Metadata
  description?: string;       // User notes/description
  tags: string[];            // Searchable tags
  notes?: string;            // Additional notes
  
  // Valuation
  estimatedValue?: number;    // Current estimated value
  purchasePrice?: number;     // Original purchase price
  currency: string;          // Currency code (USD, EUR, etc.)
  
  // Images
  primaryImage?: string;      // Main image URL/blob
  additionalImages: string[]; // Array of image URLs/blobs
  thumbnailImage?: string;    // Optimized thumbnail
  
  // Detection Data
  aiDetected: boolean;        // Was this auto-detected?
  aiConfidence?: number;      // Detection confidence score
  aiPromptUsed?: string;      // Prompt used for detection
  ocrText?: string;           // Extracted text from OCR
  
  // Timestamps
  createdAt: Date;           // Creation timestamp
  updatedAt: Date;           // Last modification
  lastViewedAt?: Date;       // Last time user viewed item
  
  // Sync & Status
  syncStatus: SyncStatus;     // Cloud sync state
  isArchived: boolean;        // Soft delete flag
}

type ItemCondition = 
  | 'mint' 
  | 'near-mint' 
  | 'excellent' 
  | 'good' 
  | 'fair' 
  | 'poor' 
  | 'damaged';

type SyncStatus = 
  | 'local-only'      // Not synced to cloud
  | 'synced'          // Up to date with cloud
  | 'pending-upload'  // Changes waiting to sync
  | 'pending-download'// Remote changes to download
  | 'conflict'        // Sync conflict needs resolution
  | 'error';          // Sync failed
```

### 4. Image Storage Schema

```typescript
interface ImageData {
  id: string;                 // UUID, primary key
  itemId: string;            // Foreign key to collectible
  userId: string;            // Foreign key to user
  
  // File Properties
  filename: string;          // Original filename
  mimeType: string;         // MIME type (image/jpeg, etc.)
  size: number;             // File size in bytes
  width: number;            // Image width in pixels
  height: number;           // Image height in pixels
  
  // Storage
  originalBlob?: Blob;      // Full resolution image (local)
  thumbnailBlob?: Blob;     // Compressed thumbnail (local)
  cloudUrl?: string;        // Cloud storage URL
  thumbnailUrl?: string;    // Cloud thumbnail URL
  
  // Metadata
  capturedAt?: Date;        // When photo was taken
  uploadedAt: Date;         // When uploaded to app
  processedAt?: Date;       // When image processing completed
  
  // Processing Flags
  isProcessed: boolean;     // Has been through image pipeline
  hasOcrText: boolean;      // Contains extractable text
  aiProcessed: boolean;     // Has been through AI detection
  
  syncStatus: SyncStatus;   // Cloud sync state
}
```

### 5. Detection Log Schema

```typescript
interface DetectionLog {
  id: string;               // UUID, primary key
  userId: string;           // Foreign key to user
  imageId: string;          // Foreign key to image
  itemId?: string;          // Foreign key to resulting item (if successful)
  
  // Detection Parameters
  promptUsed: string;       // AI prompt template used
  modelVersion: string;     // AI model version
  processingTime: number;   // Time taken in milliseconds
  
  // Results
  success: boolean;         // Detection successful
  confidence: number;       // Overall confidence score
  rawResponse: string;      // Full AI response (JSON)
  extractedData: Partial<CollectibleData>; // Parsed data
  
  // Error Handling
  errorMessage?: string;    // Error details if failed
  retryCount: number;       // Number of retry attempts
  
  // Timestamps
  createdAt: Date;          // When detection was attempted
}
```

### 6. Settings & Configuration Schema

```typescript
interface AppSettings {
  id: string;               // 'user-settings' (singleton)
  userId: string;           // Foreign key to user
  
  // AI Configuration
  geminiApiKey?: string;    // Encrypted API key
  defaultPrompt: string;    // Default detection prompt
  customPrompts: CustomPrompt[]; // User-defined prompts
  
  // Image Processing
  imageQuality: number;     // Compression quality (0-100)
  maxImageSize: number;     // Max dimension in pixels
  autoEnhancement: boolean; // Auto-enhance images
  
  // Storage
  compressionEnabled: boolean;
  maxLocalStorage: number;  // MB limit for local storage
  autoCleanup: boolean;     // Auto-delete old items
  
  // UI Preferences
  theme: 'light' | 'dark' | 'auto';
  pixelAnimations: boolean;
  gridSize: number;         // Items per row in grid view
  defaultSort: string;      // Default sort field
  
  // Privacy
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
  
  updatedAt: Date;
}

interface CustomPrompt {
  id: string;
  name: string;
  description: string;
  template: string;
  category: FolderType;
  isDefault: boolean;
  createdAt: Date;
}
```

## Database Schema (PostgreSQL - Cloud)

### Users and Authentication

```sql
-- Extends Supabase auth.users table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 1073741824, -- 1GB
  preferences JSONB DEFAULT '{}'
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Folders

```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('trading-cards', 'action-figures', 'plushies', 'comics', 'games', 'other')),
  source TEXT DEFAULT 'cloud' CHECK (source IN ('local', 'demo', 'cloud')),
  parent_id UUID REFERENCES folders(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  item_count INTEGER DEFAULT 0,
  total_value DECIMAL(10,2),
  is_archived BOOLEAN DEFAULT FALSE,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('local-only', 'synced', 'pending-upload', 'pending-download', 'conflict', 'error')),
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_created_at ON folders(created_at DESC);
CREATE INDEX idx_folders_type ON folders(type);
CREATE INDEX idx_folders_tags ON folders USING GIN(tags);

-- Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own folders" ON folders
  FOR ALL USING (auth.uid() = user_id);
```

### Collectible Items

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Core Properties
  name TEXT NOT NULL,
  type TEXT,
  series TEXT,
  condition TEXT CHECK (condition IN ('mint', 'near-mint', 'excellent', 'good', 'fair', 'poor', 'damaged')),
  
  -- Metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  
  -- Valuation
  estimated_value DECIMAL(10,2),
  purchase_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Images
  primary_image TEXT,
  additional_images TEXT[] DEFAULT '{}',
  thumbnail_image TEXT,
  
  -- Detection Data
  ai_detected BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(5,2),
  ai_prompt_used TEXT,
  ocr_text TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ,
  
  -- Sync & Status
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('local-only', 'synced', 'pending-upload', 'pending-download', 'conflict', 'error')),
  is_archived BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_items_folder_id ON items(folder_id);
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_items_condition ON items(condition);
CREATE INDEX idx_items_tags ON items USING GIN(tags);
CREATE INDEX idx_items_search ON items USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(notes, '')));

-- Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own items" ON items
  FOR ALL USING (auth.uid() = user_id);
```

### Image Storage

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- File Properties
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  
  -- Storage URLs
  cloud_url TEXT,
  thumbnail_url TEXT,
  
  -- Metadata
  captured_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Processing Flags
  is_processed BOOLEAN DEFAULT FALSE,
  has_ocr_text BOOLEAN DEFAULT FALSE,
  ai_processed BOOLEAN DEFAULT FALSE,
  
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('local-only', 'synced', 'pending-upload', 'pending-download', 'conflict', 'error'))
);

-- Indexes
CREATE INDEX idx_images_item_id ON images(item_id);
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_uploaded_at ON images(uploaded_at DESC);

-- Row Level Security
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own images" ON images
  FOR ALL USING (auth.uid() = user_id);
```

### Detection Logs

```sql
CREATE TABLE detection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  
  -- Detection Parameters
  prompt_used TEXT NOT NULL,
  model_version TEXT NOT NULL,
  processing_time INTEGER NOT NULL,
  
  -- Results
  success BOOLEAN NOT NULL,
  confidence DECIMAL(5,2),
  raw_response TEXT,
  extracted_data JSONB,
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_detection_logs_user_id ON detection_logs(user_id);
CREATE INDEX idx_detection_logs_created_at ON detection_logs(created_at DESC);
CREATE INDEX idx_detection_logs_success ON detection_logs(success);

-- Row Level Security
ALTER TABLE detection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own detection logs" ON detection_logs
  FOR SELECT USING (auth.uid() = user_id);
```

### App Settings

```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT 'user-settings'::uuid,
  user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
  
  -- AI Configuration (encrypted)
  gemini_api_key TEXT,
  default_prompt TEXT NOT NULL DEFAULT 'Identify this collectible item...',
  custom_prompts JSONB DEFAULT '[]',
  
  -- Image Processing
  image_quality INTEGER DEFAULT 80 CHECK (image_quality BETWEEN 10 AND 100),
  max_image_size INTEGER DEFAULT 1920,
  auto_enhancement BOOLEAN DEFAULT TRUE,
  
  -- Storage
  compression_enabled BOOLEAN DEFAULT TRUE,
  max_local_storage INTEGER DEFAULT 1024, -- MB
  auto_cleanup BOOLEAN DEFAULT FALSE,
  
  -- UI Preferences
  theme TEXT DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  pixel_animations BOOLEAN DEFAULT TRUE,
  grid_size INTEGER DEFAULT 4 CHECK (grid_size BETWEEN 2 AND 8),
  default_sort TEXT DEFAULT 'created_at',
  
  -- Privacy
  analytics_enabled BOOLEAN DEFAULT TRUE,
  crash_reporting_enabled BOOLEAN DEFAULT TRUE,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings" ON app_settings
  FOR ALL USING (auth.uid() = user_id);
```

## Local Storage Schema (IndexedDB)

### Database Configuration

```typescript
interface IndexedDBSchema {
  name: 'CacawInventory';
  version: 1;
  stores: {
    profiles: {
      key: string; // user ID
      value: UserProfile;
      indexes: {
        email: string;
      };
    };
    folders: {
      key: string; // folder ID
      value: Folder;
      indexes: {
        userId: string;
        type: FolderType;
        createdAt: Date;
      };
    };
    items: {
      key: string; // item ID
      value: CollectibleData;
      indexes: {
        folderId: string;
        userId: string;
        name: string;
        createdAt: Date;
        tags: string[];
      };
    };
    images: {
      key: string; // image ID
      value: ImageData;
      indexes: {
        itemId: string;
        userId: string;
        uploadedAt: Date;
      };
    };
    settings: {
      key: string; // setting key
      value: any;
    };
    detectionLogs: {
      key: string; // log ID
      value: DetectionLog;
      indexes: {
        userId: string;
        createdAt: Date;
        success: boolean;
      };
    };
  };
}
```

## Data Validation Schemas

### Zod Validation Schemas

```typescript
import { z } from 'zod';

export const FolderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['trading-cards', 'action-figures', 'plushies', 'comics', 'games', 'other']),
  source: z.enum(['local', 'demo', 'cloud']),
  parentId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(z.string().max(50)).max(20),
  itemCount: z.number().int().min(0),
  totalValue: z.number().positive().optional(),
  isArchived: z.boolean(),
  syncStatus: z.enum(['local-only', 'synced', 'pending-upload', 'pending-download', 'conflict', 'error']),
  metadata: z.object({
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    icon: z.string().max(50).optional(),
    sortOrder: z.enum(['name', 'date', 'value', 'condition']),
    sortDirection: z.enum(['asc', 'desc']),
    viewMode: z.enum(['grid', 'list', 'table']),
  }),
});

export const CollectibleSchema = z.object({
  id: z.string().uuid(),
  folderId: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.string().max(50).optional(),
  series: z.string().max(100).optional(),
  condition: z.enum(['mint', 'near-mint', 'excellent', 'good', 'fair', 'poor', 'damaged']),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20),
  notes: z.string().max(2000).optional(),
  estimatedValue: z.number().positive().optional(),
  purchasePrice: z.number().positive().optional(),
  currency: z.string().length(3),
  primaryImage: z.string().optional(),
  additionalImages: z.array(z.string()).max(10),
  thumbnailImage: z.string().optional(),
  aiDetected: z.boolean(),
  aiConfidence: z.number().min(0).max(100).optional(),
  aiPromptUsed: z.string().optional(),
  ocrText: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastViewedAt: z.date().optional(),
  syncStatus: z.enum(['local-only', 'synced', 'pending-upload', 'pending-download', 'conflict', 'error']),
  isArchived: z.boolean(),
});
```

---

## Migration Scripts

### Initial Database Setup

```sql
-- Run this script to set up the initial database schema
-- This should be executed after Supabase project creation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
-- ... (include all CREATE TABLE statements from above)

-- Set up Row Level Security policies
-- ... (include all RLS policies from above)

-- Create initial indexes
-- ... (include all CREATE INDEX statements from above)

-- Insert default data
INSERT INTO app_settings (user_id, default_prompt) 
VALUES (auth.uid(), 'Identify this collectible item, including its name, series, condition, and estimated value.');
```

---

*Schemas documentation version: 1.0*  
*Last updated: [Current Date]*  
*Next review: Before Phase 2 implementation*