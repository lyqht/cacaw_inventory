import { BaseImageProvider, ImageSearchParams, SearchResponse, ImageResult, ProviderConfig } from './baseProvider';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

export class PexelsProvider extends BaseImageProvider {
  constructor(apiKey: string) {
    super({
      apiKey,
      baseUrl: 'https://api.pexels.com/v1',
      rateLimit: {
        requestsPerMinute: 200,
        requestsPerDay: 20000
      },
      maxResults: 80,
      supportedFeatures: {
        dimensions: true,
        imageType: false,
        colorFilter: true,
        usageRights: true, // Pexels is free to use
        safeSearch: false
      }
    });
  }

  async search(params: ImageSearchParams): Promise<SearchResponse> {
    this.validateSearchParams(params);
    await this.checkRateLimit();

    if (!this.config.apiKey) {
      throw new Error('Pexels API key is required');
    }

    const query = this.buildSearchQuery(params);
    const searchParams = new URLSearchParams({
      query,
      per_page: Math.min(params.count || 15, this.config.maxResults).toString(),
      orientation: 'portrait'
    });

    // Add color filter if specified
    if (params.dominantColor) {
      searchParams.append('color', params.dominantColor);
    }

    // Add size filter if specified
    if (params.dimensions) {
      if (params.dimensions.minWidth && params.dimensions.minWidth >= 1920) {
        searchParams.append('size', 'large');
      } else if (params.dimensions.minWidth && params.dimensions.minWidth >= 1280) {
        searchParams.append('size', 'medium');
      }
    }

    const url = `${this.config.baseUrl}/search?${searchParams}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.config.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Pexels API key is invalid');
        }
        if (response.status === 429) {
          throw new Error('Pexels API rate limit exceeded');
        }
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data: PexelsSearchResponse = await response.json();
      
      return {
        results: data.photos.map(photo => this.transformPhoto(photo)),
        totalResults: data.total_results,
        nextPageToken: data.next_page,
        provider: 'pexels'
      };
    } catch (error) {
      console.error('Pexels search error:', error);
      throw error;
    }
  }

  private transformPhoto(photo: PexelsPhoto): ImageResult {
    return {
      id: photo.id.toString(),
      url: photo.src.large,
      thumbnailUrl: photo.src.small,
      title: photo.alt || `Photo by ${photo.photographer}`,
      width: photo.width,
      height: photo.height,
      format: 'jpeg',
      source: 'pexels',
      sourceUrl: photo.url,
      attribution: `Photo by ${photo.photographer} from Pexels`,
      license: {
        type: 'Pexels License',
        url: 'https://www.pexels.com/license/',
        commercial: true,
        attribution: false
      },
      downloadUrl: photo.src.original,
      metadata: {
        photographer: photo.photographer,
        tags: []
      }
    };
  }

  async downloadImage(url: string): Promise<Blob> {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.config.apiKey!
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error downloading from Pexels:', error);
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.config.apiKey) return false;
    
    try {
      const response = await fetch(`${this.config.baseUrl}/curated?per_page=1`, {
        headers: {
          'Authorization': this.config.apiKey
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}