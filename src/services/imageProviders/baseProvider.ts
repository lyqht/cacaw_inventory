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
  nextPageToken?: string;
  searchId?: string;
  provider: string;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay?: number;
  };
  maxResults: number;
  supportedFeatures: {
    dimensions: boolean;
    imageType: boolean;
    colorFilter: boolean;
    usageRights: boolean;
    safeSearch: boolean;
  };
}

export abstract class BaseImageProvider {
  protected config: ProviderConfig;
  protected requestCount: Map<string, number> = new Map();
  protected lastRequestTime: Map<string, number> = new Map();

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract search(params: ImageSearchParams): Promise<SearchResponse>;
  abstract downloadImage(url: string): Promise<Blob>;
  abstract validateApiKey(): Promise<boolean>;

  protected async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const currentCount = this.requestCount.get(minute.toString()) || 0;

    if (currentCount >= this.config.rateLimit.requestsPerMinute) {
      const waitTime = 60000 - (now % 60000);
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    this.requestCount.set(minute.toString(), currentCount + 1);
    
    // Clean up old entries
    const oldMinute = minute - 1;
    this.requestCount.delete(oldMinute.toString());
  }

  protected buildSearchQuery(params: ImageSearchParams): string {
    const terms = [params.query];
    if (params.itemType) terms.push(params.itemType);
    if (params.series) terms.push(params.series);
    return terms.join(' ').trim();
  }

  protected validateSearchParams(params: ImageSearchParams): void {
    if (!params.query || params.query.trim().length === 0) {
      throw new Error('Search query is required');
    }
    if (params.count && (params.count < 1 || params.count > this.config.maxResults)) {
      throw new Error(`Count must be between 1 and ${this.config.maxResults}`);
    }
  }
}