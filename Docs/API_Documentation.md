# API Documentation
# CacawInventory

## Overview

This document outlines the API architecture for CacawInventory. The application follows a **local-first** approach with optional cloud synchronization, meaning most operations in Phase 1-2 are client-side only. Cloud-based APIs are introduced in Phase 3.

## API Architecture by Phase

### Phase 1: Landing Page
- **No backend APIs required**
- Optional: Email capture service
- Optional: Basic analytics endpoints

### Phase 2: Core Application  
- **Client-side APIs only**
- IndexedDB operations
- Google Gemini AI integration (client-side)
- Local file system APIs

### Phase 3: Cloud Integration
- **Full REST API with Supabase**
- Authentication endpoints
- Data synchronization endpoints
- File upload/download APIs

## API Conventions

### Base URLs
```
Development:  http://localhost:5173/api
Production:   https://cacawinventory.com/api
```

### Authentication
```typescript
// JWT Bearer Token (Phase 3+)
Authorization: Bearer <jwt_token>

// API Key for AI services
X-API-Key: <gemini_api_key>
```

### Response Format
```typescript
interface APIResponse<T> {
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
```

### Error Codes
```typescript
enum ErrorCode {
  // Client Errors (4xx)
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
}
```

## Phase 1: Landing Page APIs

### Email Capture (Optional)

#### POST /api/waitlist
Subscribe user to beta waitlist

**Request:**
```typescript
interface WaitlistRequest {
  email: string;
  source?: string; // tracking parameter
}
```

**Response:**
```typescript
interface WaitlistResponse {
  success: boolean;
  message: string;
}
```

**Example:**
```bash
curl -X POST https://cacawinventory.com/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "source": "landing_page"}'
```

## Phase 2: Client-Side APIs

### Local Storage Service

#### IndexedDB Operations
```typescript
class LocalStorageService {
  // Initialize database
  async initialize(): Promise<void>;
  
  // Folder operations
  async createFolder(folder: Folder): Promise<string>;
  async getFolder(id: string): Promise<Folder | null>;
  async getFolders(userId: string): Promise<Folder[]>;
  async updateFolder(id: string, updates: Partial<Folder>): Promise<void>;
  async deleteFolder(id: string): Promise<void>;
  
  // Item operations
  async createItem(item: CollectibleData): Promise<string>;
  async getItem(id: string): Promise<CollectibleData | null>;
  async getItemsByFolder(folderId: string): Promise<CollectibleData[]>;
  async updateItem(id: string, updates: Partial<CollectibleData>): Promise<void>;
  async deleteItem(id: string): Promise<void>;
  async searchItems(query: string, userId: string): Promise<CollectibleData[]>;
  
  // Image operations
  async storeImage(image: ImageData): Promise<string>;
  async getImage(id: string): Promise<ImageData | null>;
  async deleteImage(id: string): Promise<void>;
  
  // Settings operations
  async getSetting(key: string): Promise<any>;
  async setSetting(key: string, value: any): Promise<void>;
}
```

### AI Detection Service

#### Gemini Integration
```typescript
class GeminiDetectionService {
  // Detect items from image
  async detectItems(
    imageBlob: Blob, 
    prompt?: string
  ): Promise<DetectionResult>;
  
  // Generate custom prompts
  async generatePrompt(
    itemType: FolderType
  ): Promise<string>;
  
  // Batch detection
  async detectBatch(
    images: Blob[]
  ): Promise<DetectionResult[]>;
}

interface DetectionResult {
  items: Partial<CollectibleData>[];
  confidence: number;
  processingTime: number;
  rawResponse: string;
  error?: string;
}
```

### Image Processing Service

```typescript
class ImageProcessorService {
  // Enhance image quality
  async enhanceImage(blob: Blob): Promise<Blob>;
  
  // Generate thumbnails
  async generateThumbnail(
    blob: Blob, 
    size: number
  ): Promise<Blob>;
  
  // Compress image
  async compressImage(
    blob: Blob, 
    quality: number
  ): Promise<Blob>;
  
  // Extract text with OCR
  async extractText(blob: Blob): Promise<string>;
  
  // Detect contours/edges
  async detectContours(blob: Blob): Promise<ContourData>;
}
```

## Phase 3: Cloud APIs

### Authentication Endpoints

#### POST /api/auth/register
Register new user account

**Request:**
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}
```

**Response:**
```typescript
interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
}
```

#### POST /api/auth/login
Authenticate existing user

**Request:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

#### POST /api/auth/refresh
Refresh authentication token

**Request:**
```typescript
interface RefreshRequest {
  refreshToken: string;
}
```

#### POST /api/auth/logout
End user session

#### POST /api/auth/forgot-password
Request password reset

**Request:**
```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

### User Management

#### GET /api/users/profile
Get current user profile

**Response:**
```typescript
interface ProfileResponse {
  profile: UserProfile;
  usage: {
    storageUsed: number;
    itemCount: number;
    folderCount: number;
  };
}
```

#### PUT /api/users/profile
Update user profile

**Request:**
```typescript
interface UpdateProfileRequest {
  username?: string;
  preferences?: Partial<UserPreferences>;
}
```

### Folder Management

#### GET /api/folders
Get user's folders

**Query Parameters:**
```typescript
interface FoldersQuery {
  type?: FolderType;
  archived?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'name' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface FoldersResponse {
  folders: Folder[];
  total: number;
  hasMore: boolean;
}
```

#### POST /api/folders
Create new folder

**Request:**
```typescript
interface CreateFolderRequest {
  name: string;
  description?: string;
  type: FolderType;
  tags?: string[];
  metadata?: FolderMetadata;
}
```

#### GET /api/folders/:id
Get specific folder

#### PUT /api/folders/:id
Update folder

#### DELETE /api/folders/:id
Delete folder (and all items)

### Item Management

#### GET /api/folders/:folderId/items
Get items in folder

**Query Parameters:**
```typescript
interface ItemsQuery {
  condition?: ItemCondition;
  tags?: string[];
  search?: string;
  minValue?: number;
  maxValue?: number;
  limit?: number;
  offset?: number;
  sort?: 'name' | 'created_at' | 'value' | 'condition';
  order?: 'asc' | 'desc';
}
```

#### POST /api/folders/:folderId/items
Create new item

**Request:**
```typescript
interface CreateItemRequest {
  name: string;
  type?: string;
  series?: string;
  condition: ItemCondition;
  description?: string;
  tags?: string[];
  notes?: string;
  estimatedValue?: number;
  purchasePrice?: number;
  currency?: string;
}
```

#### GET /api/items/:id
Get specific item

#### PUT /api/items/:id
Update item

#### DELETE /api/items/:id
Delete item

### Image Management

#### POST /api/items/:itemId/images
Upload image for item

**Request:** `multipart/form-data`
```typescript
interface UploadImageRequest {
  file: File;
  isPrimary?: boolean;
}
```

**Response:**
```typescript
interface UploadImageResponse {
  image: ImageData;
  urls: {
    original: string;
    thumbnail: string;
  };
}
```

#### GET /api/images/:id
Get image metadata

#### DELETE /api/images/:id
Delete image

### AI Detection Endpoints

#### POST /api/ai/detect
Detect items from image

**Request:**
```typescript
interface DetectRequest {
  imageId: string;
  prompt?: string;
  modelVersion?: string;
}
```

**Response:**
```typescript
interface DetectResponse {
  detectedItems: Partial<CollectibleData>[];
  confidence: number;
  processingTime: number;
  logId: string;
}
```

#### POST /api/ai/detect/batch
Batch detect multiple images

**Request:**
```typescript
interface BatchDetectRequest {
  imageIds: string[];
  prompt?: string;
}
```

#### GET /api/ai/prompts
Get available detection prompts

#### POST /api/ai/prompts
Create custom prompt

### Synchronization

#### GET /api/sync/status
Get sync status for user

**Response:**
```typescript
interface SyncStatusResponse {
  lastSync: string;
  pendingUploads: number;
  pendingDownloads: number;
  conflicts: number;
  errors: SyncError[];
}
```

#### POST /api/sync/folders
Sync folders to cloud

#### POST /api/sync/items
Sync items to cloud

#### POST /api/sync/resolve-conflict
Resolve sync conflict

**Request:**
```typescript
interface ResolveConflictRequest {
  conflictId: string;
  resolution: 'local' | 'remote' | 'merge';
  mergedData?: any;
}
```

### Import/Export

#### POST /api/export/json
Export data as JSON

**Request:**
```typescript
interface ExportRequest {
  folderIds?: string[];
  includeImages?: boolean;
  format: 'json' | 'csv' | 'pdf';
}
```

**Response:**
```typescript
interface ExportResponse {
  downloadUrl: string;
  expiresAt: string;
  fileSize: number;
}
```

#### POST /api/import/json
Import data from JSON

**Request:** `multipart/form-data`
```typescript
interface ImportRequest {
  file: File;
  targetFolderId?: string;
  mergeStrategy: 'replace' | 'merge' | 'skip';
}
```

## Error Handling

### Standard Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    requestId: string;
  };
}
```

### Common HTTP Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

## Rate Limiting

### Limits by Endpoint Type
```typescript
interface RateLimits {
  // Authentication
  'auth/*': '10 requests per 15 minutes per IP';
  
  // AI Detection
  'ai/detect': '100 requests per 15 minutes per user';
  'ai/detect/batch': '20 requests per 15 minutes per user';
  
  // File Operations
  'images/*': '200 requests per 15 minutes per user';
  'export/*': '5 requests per 15 minutes per user';
  
  // General API
  'default': '1000 requests per 15 minutes per user';
}
```

## Webhooks (Future)

### Event Types
```typescript
enum WebhookEvent {
  ITEM_CREATED = 'item.created',
  ITEM_UPDATED = 'item.updated',
  ITEM_DELETED = 'item.deleted',
  FOLDER_CREATED = 'folder.created',
  FOLDER_UPDATED = 'folder.updated',
  AI_DETECTION_COMPLETED = 'ai.detection.completed',
  SYNC_COMPLETED = 'sync.completed',
  EXPORT_READY = 'export.ready',
}
```

### Webhook Payload
```typescript
interface WebhookPayload {
  event: WebhookEvent;
  data: any;
  userId: string;
  timestamp: string;
  signature: string;
}
```

## SDK and Client Libraries

### JavaScript/TypeScript SDK
```typescript
class CacawInventoryClient {
  constructor(options: {
    apiKey?: string;
    baseUrl?: string;
    timeout?: number;
  });
  
  // Authentication
  auth: AuthAPI;
  
  // Core resources
  folders: FoldersAPI;
  items: ItemsAPI;
  images: ImagesAPI;
  
  // AI services
  ai: AIAPI;
  
  // Utilities
  sync: SyncAPI;
  export: ExportAPI;
  import: ImportAPI;
}
```

## Testing

### API Test Suite
```typescript
// Example test cases
describe('Folders API', () => {
  test('should create folder with valid data', async () => {
    const response = await client.folders.create({
      name: 'Pokemon Cards',
      type: 'trading-cards'
    });
    
    expect(response.success).toBe(true);
    expect(response.data.name).toBe('Pokemon Cards');
  });
  
  test('should reject invalid folder type', async () => {
    const response = await client.folders.create({
      name: 'Test',
      type: 'invalid-type' as any
    });
    
    expect(response.success).toBe(false);
    expect(response.error.code).toBe('INVALID_REQUEST');
  });
});
```

---

## OpenAPI Specification

The complete OpenAPI 3.0 specification will be available at:
- Development: `http://localhost:5173/api/docs`
- Production: `https://cacawinventory.com/api/docs`

---

*API Documentation version: 1.0*  
*Last updated: [Current Date]*  
*Next review: Before Phase 3 implementation*