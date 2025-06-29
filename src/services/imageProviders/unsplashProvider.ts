import { BaseImageProvider, ImageSearchParams, SearchResponse, ImageResult, ProviderConfig } from './baseProvider';

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  width: number;
  height: number;
  alt_description: string;
  description: string;
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
    download: string;
    download_location: string;
  };
  tags?: Array<{
    title: string;
  }>;
  created_at: string;
  views?: number;
  downloads?: number;
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export class UnsplashProvider extends BaseImageProvider {
  constructor(apiKey?: string) {
    super({
      apiKey,
      baseUrl: 'https://api.unsplash.com',
      rateLimit: {
        requestsPerMinute: 50,
        requestsPerDay: 5000
      },
      maxResults: 30,
      supportedFeatures: {
        dimensions: false,
        imageType: false,
        colorFilter: true,
        usageRights: true, // Unsplash is free to use
        safeSearch: false
      }
    });
  }

  async search(params: ImageSearchParams): Promise<SearchResponse> {
    this.validateSearchParams(params);
    await this.checkRateLimit();

    const query = this.buildSearchQuery(params);
    const searchParams = new URLSearchParams({
      query,
      per_page: Math.min(params.count || 12, this.config.maxResults).toString(),
      orientation: 'portrait' // Good for product images
    });

    // Add color filter if specified
    if (params.dominantColor) {
      searchParams.append('color', params.dominantColor);
    }

    const url = `${this.config.baseUrl}/search/photos?${searchParams}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Client-ID ${this.config.apiKey}`;
    }

    try {
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Unsplash API key is invalid or rate limit exceeded');
        }
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data: UnsplashSearchResponse = await response.json();
      
      return {
        results: data.results.map(photo => this.transformPhoto(photo)),
        totalResults: data.total,
        provider: 'unsplash'
      };
    } catch (error) {
      console.error('Unsplash search error:', error);
      throw error;
    }
  }

  private transformPhoto(photo: UnsplashPhoto): ImageResult {
    return {
      id: photo.id,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.thumb,
      title: photo.alt_description || photo.description || `Photo by ${photo.user.name}`,
      description: photo.description,
      width: photo.width,
      height: photo.height,
      format: 'jpeg',
      source: 'unsplash',
      sourceUrl: photo.links.html,
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      license: {
        type: 'Unsplash License',
        url: 'https://unsplash.com/license',
        commercial: true,
        attribution: true
      },
      downloadUrl: photo.urls.full,
      metadata: {
        photographer: photo.user.name,
        tags: photo.tags?.map(tag => tag.title),
        uploadDate: photo.created_at,
        views: photo.views,
        downloads: photo.downloads
      }
    };
  }

  async downloadImage(url: string): Promise<Blob> {
    try {
      const response = await fetch(url, {
        headers: this.config.apiKey ? {
          'Authorization': `Client-ID ${this.config.apiKey}`
        } : {}
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error downloading from Unsplash:', error);
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.config.apiKey) return false;
    
    try {
      const response = await fetch(`${this.config.baseUrl}/me`, {
        headers: {
          'Authorization': `Client-ID ${this.config.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}