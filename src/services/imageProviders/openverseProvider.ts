import { BaseImageProvider, ImageSearchParams, SearchResponse, ImageResult, ProviderConfig } from './baseProvider';

interface OpenverseImage {
  id: string;
  title: string;
  creator: string;
  license: string;
  license_url: string;
  url: string;
  thumbnail: string;
  provider: string;
  source: string;
  categories: string[];
  tags: Array<{
    name: string;
  }>;
  width?: number;
  height?: number;
  filesize?: number;
  filetype?: string;
}

interface OpenverseSearchResponse {
  result_count: number;
  page_count: number;
  page_size: number;
  results: OpenverseImage[];
}

export class OpenverseProvider extends BaseImageProvider {
  constructor() {
    super({
      baseUrl: 'https://api.openverse.engineering/v1',
      rateLimit: {
        requestsPerMinute: 100, // Conservative estimate
        requestsPerDay: 10000
      },
      maxResults: 50,
      supportedFeatures: {
        dimensions: false,
        imageType: false,
        colorFilter: false,
        usageRights: true, // Openverse focuses on open content
        safeSearch: false
      }
    });
  }

  async search(params: ImageSearchParams): Promise<SearchResponse> {
    this.validateSearchParams(params);
    await this.checkRateLimit();

    const query = this.buildSearchQuery(params);
    const searchParams = new URLSearchParams({
      q: query,
      page_size: Math.min(params.count || 20, this.config.maxResults).toString(),
      mature: 'false' // Keep content safe by default
    });

    // Add license filter for commercial use if specified
    if (params.usageRights === 'commercial') {
      // Filter for licenses that allow commercial use
      searchParams.append('license', 'cc0,pdm,by,by-sa,by-nc,by-nc-sa');
    }

    // Add category filter if we can infer it from item type
    if (params.itemType) {
      const category = this.mapItemTypeToCategory(params.itemType);
      if (category) {
        searchParams.append('category', category);
      }
    }

    const url = `${this.config.baseUrl}/images?${searchParams}`;
    
    try {
      console.log('🔍 Searching Openverse with URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Openverse API rate limit exceeded');
        }
        throw new Error(`Openverse API error: ${response.status}`);
      }

      const data: OpenverseSearchResponse = await response.json();
      console.log('📊 Openverse response:', data.result_count, 'results found');
      
      return {
        results: data.results.map(image => this.transformImage(image)),
        totalResults: data.result_count,
        provider: 'openverse'
      };
    } catch (error) {
      console.error('Openverse search error:', error);
      throw error;
    }
  }

  private mapItemTypeToCategory(itemType: string): string | null {
    const lowerType = itemType.toLowerCase();
    
    // Map common collectible types to Openverse categories
    if (lowerType.includes('game') || lowerType.includes('video')) {
      return 'digitized_artwork';
    }
    if (lowerType.includes('comic') || lowerType.includes('book')) {
      return 'illustration';
    }
    if (lowerType.includes('figure') || lowerType.includes('toy') || lowerType.includes('plush')) {
      return 'photograph';
    }
    if (lowerType.includes('card') || lowerType.includes('trading')) {
      return 'photograph';
    }
    
    return null; // Let Openverse search all categories
  }

  private transformImage(image: OpenverseImage): ImageResult {
    // Determine if license allows commercial use
    const commercialLicenses = ['cc0', 'pdm', 'by', 'by-sa'];
    const isCommercial = commercialLicenses.some(license => 
      image.license.toLowerCase().includes(license)
    ) && !image.license.toLowerCase().includes('nc'); // Exclude non-commercial

    return {
      id: image.id,
      url: image.url,
      thumbnailUrl: image.thumbnail || image.url,
      title: image.title || `Image by ${image.creator}`,
      description: `From ${image.source} via Openverse`,
      width: image.width || 800,
      height: image.height || 600,
      fileSize: image.filesize,
      format: image.filetype || 'jpeg',
      source: 'openverse',
      sourceUrl: image.url,
      attribution: `"${image.title}" by ${image.creator} is licensed under ${image.license.toUpperCase()}`,
      license: {
        type: image.license.toUpperCase(),
        url: image.license_url,
        commercial: isCommercial,
        attribution: !['cc0', 'pdm'].includes(image.license.toLowerCase())
      },
      downloadUrl: image.url,
      metadata: {
        photographer: image.creator,
        tags: image.tags.map(tag => tag.name),
        provider: image.provider,
        categories: image.categories
      }
    };
  }

  async downloadImage(url: string): Promise<Blob> {
    try {
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error downloading from Openverse:', error);
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    // Openverse doesn't require an API key, so we test with a simple request
    try {
      const response = await fetch(`${this.config.baseUrl}/images?q=test&page_size=1`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}