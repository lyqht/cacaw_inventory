import { BaseImageProvider, ImageSearchParams, SearchResponse, ImageResult, SearchOptions } from './imageProviders/baseProvider';
import { OpenverseProvider } from './imageProviders/openverseProvider';
import { ImageSearchCache } from './imageProviders/cache';
import { StorageService } from './storage';

interface SearchOptions extends ImageSearchParams {
  providers?: string[];
  maxResultsPerProvider?: number;
  timeout?: number;
  fallbackToMockData?: boolean;
}

interface AggregatedSearchResponse {
  results: ImageResult[];
  totalResults: number;
  providers: string[];
  errors: Record<string, string>;
  fromCache: boolean;
  searchTime: number;
}

export class EnhancedImageSearchService {
  private static instance: EnhancedImageSearchService;
  private providers: Map<string, BaseImageProvider> = new Map();
  private cache: ImageSearchCache;
  private storageService: StorageService;

  static getInstance(): EnhancedImageSearchService {
    if (!EnhancedImageSearchService.instance) {
      EnhancedImageSearchService.instance = new EnhancedImageSearchService();
    }
    return EnhancedImageSearchService.instance;
  }

  constructor() {
    this.cache = new ImageSearchCache({
      maxSize: 500,
      defaultTTL: 60 * 60 * 1000, // 1 hour
      cleanupInterval: 10 * 60 * 1000 // 10 minutes
    });
    this.storageService = StorageService.getInstance();
    this.initializeProviders();
  }

  private async initializeProviders(): Promise<void> {
    try {
      // Initialize Openverse provider (no API key required)
      this.providers.set('openverse', new OpenverseProvider());
      
      console.log('Initialized image providers:', Array.from(this.providers.keys()));
    } catch (error) {
      console.error('Error initializing image providers:', error);
    }
  }

  async searchProductImages(
    itemName: string,
    itemType?: string,
    series?: string,
    options: Partial<SearchOptions> = {}
  ): Promise<AggregatedSearchResponse> {
    const startTime = Date.now();
    
    const searchParams: ImageSearchParams = {
      query: itemName,
      itemType,
      series,
      count: options.maxResultsPerProvider || 10,
      imageType: options.imageType || 'photo',
      colorType: options.colorType || 'any',
      usageRights: options.usageRights || 'any',
      safeSearch: options.safeSearch || 'moderate',
      dimensions: options.dimensions
    };

    // Check cache first
    const cacheKey = { searchParams, providers: options.providers };
    const cachedResult = this.cache.get<AggregatedSearchResponse>('aggregated', cacheKey);
    
    if (cachedResult) {
      return {
        ...cachedResult,
        fromCache: true,
        searchTime: Date.now() - startTime
      };
    }

    // Prioritize Openverse as the primary provider
    const providersToUse = options.providers || ['openverse', ...Array.from(this.providers.keys()).filter(p => p !== 'openverse')];
    const results: ImageResult[] = [];
    const errors: Record<string, string> = {};
    const successfulProviders: string[] = [];

    // Search across multiple providers in parallel
    const searchPromises = providersToUse.map(async (providerName) => {
      const provider = this.providers.get(providerName);
      if (!provider) {
        errors[providerName] = 'Provider not available';
        return;
      }

      try {
        const searchOptions: SearchOptions = {
          maxResults: options.maxResultsPerProvider || 10,
          timeout: options.timeout || 10000,
          imageType: options.imageType,
          colorType: options.colorType,
          usageRights: options.usageRights,
          dimensions: options.dimensions
        };

        const response = await Promise.race([
          provider.search(searchParams, searchOptions),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), options.timeout || 10000)
          )
        ]);

        results.push(...response.results);
        successfulProviders.push(providerName);
        console.log(`✅ ${providerName} returned ${response.results.length} results`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors[providerName] = errorMessage;
        console.warn(`❌ Provider ${providerName} failed:`, errorMessage);
      }
    });

    await Promise.allSettled(searchPromises);

    // If no results and fallback is enabled, use mock data
    if (results.length === 0 && options.fallbackToMockData !== false) {
      const mockResults = this.generateMockResults(itemName, itemType, series);
      results.push(...mockResults);
      successfulProviders.push('mock');
    }

    // Remove duplicates and sort by relevance
    const uniqueResults = this.deduplicateResults(results);
    const sortedResults = this.sortByRelevance(uniqueResults, itemName);

    const response: AggregatedSearchResponse = {
      results: sortedResults,
      totalResults: sortedResults.length,
      providers: successfulProviders,
      errors,
      fromCache: false,
      searchTime: Date.now() - startTime
    };

    // Cache the result if successful
    if (sortedResults.length > 0) {
      this.cache.set('aggregated', cacheKey, response, 60 * 60 * 1000); // 1 hour
    }

    return response;
  }

  private deduplicateResults(results: ImageResult[]): ImageResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.url}-${result.width}x${result.height}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private sortByRelevance(results: ImageResult[], query: string): ImageResult[] {
    const queryWords = query.toLowerCase().split(' ');
    
    return results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, queryWords);
      const scoreB = this.calculateRelevanceScore(b, queryWords);
      
      // Secondary sort by image quality (size and source)
      if (scoreA === scoreB) {
        const qualityA = this.calculateQualityScore(a);
        const qualityB = this.calculateQualityScore(b);
        return qualityB - qualityA;
      }
      
      return scoreB - scoreA;
    });
  }

  private calculateRelevanceScore(result: ImageResult, queryWords: string[]): number {
    const title = result.title.toLowerCase();
    const description = (result.description || '').toLowerCase();
    const tags = (result.metadata?.tags || []).join(' ').toLowerCase();
    
    let score = 0;
    
    queryWords.forEach(word => {
      if (title.includes(word)) score += 3;
      if (description.includes(word)) score += 2;
      if (tags.includes(word)) score += 1;
    });
    
    return score;
  }

  private calculateQualityScore(result: ImageResult): number {
    let score = 0;
    
    // Size score (prefer larger images)
    const pixels = result.width * result.height;
    if (pixels > 1000000) score += 3; // > 1MP
    else if (pixels > 500000) score += 2; // > 0.5MP
    else if (pixels > 100000) score += 1; // > 0.1MP
    
    // Source preference - Openverse gets highest priority for open content
    const sourceScores: Record<string, number> = {
      'openverse': 4, // Highest priority for open content
      'pexels': 3,
      'pixabay': 2,
      'google': 1,
      'mock': 0
    };
    score += sourceScores[result.source] || 0;
    
    // License preference (commercial use and attribution requirements)
    if (result.license?.commercial) score += 2;
    if (!result.license?.attribution) score += 1; // CC0/Public Domain gets bonus
    
    return score;
  }

  private generateMockResults(itemName: string, itemType?: string, series?: string): ImageResult[] {
    // Enhanced mock data based on search terms
    const mockImages = this.getMockImagesByCategory(itemName, itemType, series);
    
    return mockImages.map((mock, index) => ({
      id: `mock-${Date.now()}-${index}`,
      url: mock.url,
      thumbnailUrl: mock.thumbnail,
      title: `${itemName} - ${mock.title}`,
      width: mock.width,
      height: mock.height,
      format: 'jpeg',
      source: 'mock',
      attribution: 'Stock photo for demonstration',
      license: {
        type: 'Demo License',
        commercial: false,
        attribution: false
      },
      downloadUrl: mock.url,
      metadata: {
        tags: [itemName, itemType, series].filter(Boolean)
      }
    }));
  }

  private getMockImagesByCategory(itemName: string, itemType?: string, series?: string) {
    const lowerQuery = `${itemName} ${itemType || ''} ${series || ''}`.toLowerCase();
    
    // Trading Cards
    if (lowerQuery.includes('pokemon') || lowerQuery.includes('card') || lowerQuery.includes('trading')) {
      return [
        {
          url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200',
          title: 'Trading Card Collection',
          width: 800,
          height: 600
        },
        {
          url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200',
          title: 'Collectible Card Game',
          width: 800,
          height: 800
        }
      ];
    }
    
    // Action Figures
    if (lowerQuery.includes('figure') || lowerQuery.includes('toy') || lowerQuery.includes('funko')) {
      return [
        {
          url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200',
          title: 'Collectible Figure',
          width: 600,
          height: 800
        },
        {
          url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
          title: 'Action Figure Collection',
          width: 800,
          height: 600
        }
      ];
    }
    
    // Default collectible images
    return [
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200',
        title: 'Collectible Item',
        width: 800,
        height: 800
      }
    ];
  }

  async downloadImage(imageUrl: string, provider?: string): Promise<Blob> {
    try {
      // Try provider-specific download first
      if (provider && this.providers.has(provider)) {
        const providerInstance = this.providers.get(provider)!;
        return await providerInstance.downloadImage(imageUrl);
      }

      // Fallback to direct download
      const response = await fetch(imageUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'CacawInventory/1.0 (https://cacaw.site)'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new Error('Failed to download image. This may be due to CORS restrictions or network issues.');
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  clearCache(): void {
    this.cache.clear();
  }

  destroy(): void {
    this.cache.destroy();
  }
}