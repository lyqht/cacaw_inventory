import { BaseImageProvider, ImageResult, ImageSearchParams, SearchResponse } from './baseProvider';

export class OpenverseProvider extends BaseImageProvider {
  private readonly baseUrl = 'https://api.openverse.engineering/v1';
  
  constructor() {
    super({
      baseUrl: 'https://api.openverse.engineering/v1',
      rateLimit: {
        requestsPerMinute: 60
      },
      maxResults: 100,
      supportedFeatures: {
        dimensions: true,
        imageType: true,
        colorFilter: false,
        usageRights: true,
        safeSearch: true
      }
    });
  }

  getName(): string {
    return 'openverse';
  }

  async search(params: ImageSearchParams): Promise<SearchResponse> {
    try {
      // Build search parameters
      const searchParams = new URLSearchParams({
        q: params.query,
        page_size: Math.min(params.count || 20, this.config.maxResults).toString(),
        mature: 'false', // Filter out mature content
      });

      // Add image type filter if specified
      if (params.imageType && params.imageType !== 'any') {
        if (params.imageType === 'photo') {
          searchParams.append('category', 'photograph');
        } else if (params.imageType === 'illustration') {
          searchParams.append('category', 'illustration');
        }
      }

      // Add license filter for commercial use
      if (params.usageRights === 'commercial') {
        searchParams.append('license_type', 'commercial');
      }

      // Add size filter if specified
      if (params.dimensions?.minWidth) {
        searchParams.append('size', 'large'); // Use large size as proxy for minimum width
      }

      const url = `${this.baseUrl}/images?${searchParams.toString()}`;
      console.log('Openverse API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CACAW-CollectionApp/1.0',
        }
      });

      if (!response.ok) {
        throw new Error(`Openverse API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Openverse API response:', data);

      if (!data.results || !Array.isArray(data.results)) {
        console.warn('Openverse API returned unexpected format:', data);
        return {
          results: [],
          totalResults: 0,
          provider: 'openverse'
        };
      }

      const results = data.results.map((item: any) => this.transformResult(item));

      return {
        results,
        totalResults: data.result_count || results.length,
        provider: 'openverse'
      };

    } catch (error) {
      console.error('Openverse search error:', error);
      
      // If it's a network error, provide more specific error message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to Openverse API. This may be due to network restrictions or CORS policy.');
      }
      
      throw error;
    }
  }

  private transformResult(item: any): ImageResult {
    return {
      id: item.id || `openverse-${Date.now()}`,
      url: item.url,
      thumbnailUrl: item.thumbnail || item.url,
      title: item.title || 'Untitled',
      description: item.description,
      width: item.width || 0,
      height: item.height || 0,
      format: 'jpeg',
      source: 'openverse',
      sourceUrl: item.foreign_landing_url || item.url,
      license: {
        type: item.license || 'Unknown',
        url: item.license_url,
        commercial: this.isCommercialLicense(item.license),
        attribution: item.license !== 'cc0' && item.license !== 'pdm'
      },
      downloadUrl: item.url,
      metadata: {
        photographer: item.creator,
        tags: item.tags ? item.tags.map((tag: any) => tag.name || tag).filter(Boolean) : []
      }
    };
  }

  private isCommercialLicense(license: string): boolean {
    if (!license) return false;
    
    const commercialLicenses = [
      'cc0',
      'pdm', // Public Domain Mark
      'cc-by',
      'cc-by-sa',
    ];
    
    const licenseKey = license.toLowerCase().replace(/[-_\s]/g, '');
    return commercialLicenses.some(cl => licenseKey.includes(cl.replace(/[-_\s]/g, '')));
  }

  async downloadImage(url: string): Promise<Blob> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'image/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Openverse image download error:', error);
      throw new Error('Failed to download image from Openverse');
    }
  }

  async validateApiKey(): Promise<boolean> {
    // Openverse doesn't require an API key, so just check if the API is accessible
    try {
      const response = await fetch(`${this.baseUrl}/images?q=test&page_size=1`);
      return response.ok;
    } catch {
      return false;
    }
  }
}