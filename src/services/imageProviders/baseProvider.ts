export interface ImageSearchParams {
  query: string;
  itemType?: string;
  series?: string;
  dimensions?: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  imageType?: 'photo' | 'illustration' | 'vector' | 'any';
  colorType?: 'color' | 'grayscale' | 'transparent' | 'any';
  dominantColor?: string;
  usageRights?: 'commercial' | 'noncommercial' | 'any';
  safeSearch?: 'strict' | 'moderate' | 'off';
  count?: number;
}

export interface SearchOptions {
  maxResults?: number;
  timeout?: number;
  imageType?: 'photo' | 'illustration' | 'vector' | 'any';
  colorType?: 'color' | 'grayscale' | 'transparent' | 'any';
  usageRights?: 'commercial' | 'noncommercial' | 'any';
  dimensions?: {
    minWidth?: number;
    minHeight?: number;
  };
}

export interface ImageResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  width: number;
  height: number;
  fileSize?: number;
  format: string;
  source: string;
  sourceUrl?: string;
  attribution?: string;
  license?: {
    type: string;
    url?: string;
    commercial: boolean;
    attribution: boolean;
  };
  downloadUrl?: string;
  metadata?: {
    photographer?: string;
    tags?: string[];
    uploadDate?: string;
    views?: number;
    downloads?: number;
  };
}

export interface SearchResponse {
  results: ImageResult[];
  totalResults: number;
  hasMore?: boolean;
}

export abstract class BaseImageProvider {
  abstract getName(): string;
  abstract search(params: ImageSearchParams, options?: SearchOptions): Promise<SearchResponse>;
  abstract downloadImage(url: string): Promise<Blob>;
}