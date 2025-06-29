import { BaseImageProvider, ImageSearchParams, SearchResponse, ImageResult, ProviderConfig } from './baseProvider';

interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  fullHDURL?: string;
  vectorURL?: string;
  views: number;
  downloads: number;
  collections: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatWidth: number;
  webformatHeight: number;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
}

interface PixabaySearchResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

export class PixabayProvider extends BaseImageProvider {
  constructor(apiKey: string) {
    super({
      apiKey,
      baseUrl: 'https://pixabay.com/api/',
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerDay: 5000
      },
      maxResults: 200,
      supportedFeatures: {
        dimensions: true,
        imageType: true,
        colorFilter: true,
        usageRights: true, // Pixabay is free to use
        safeSearch: true
      }
    });
  }

  async search(params: ImageSearchParams): Promise<SearchResponse> {
    this.validateSearchParams(params);
    await this.checkRateLimit();

    if (!this.config.apiKey) {
      throw new Error('Pixabay API key is required');
    }

    const query = this.buildSearchQuery(params);
    const searchParams = new URLSearchParams({
      key: this.config.apiKey,
      q: query,
      per_page: Math.min(params.count || 20, this.config.maxResults).toString(),
      safesearch: params.safeSearch === 'strict' ? 'true' : 'false',
      orientation: 'vertical'
    });

    // Add image type filter
    if (params.imageType && params.imageType !== 'any') {
      searchParams.append('image_type', params.imageType);
    }

    // Add color filter
    if (params.colorType && params.colorType !== 'any') {
      if (params.colorType === 'grayscale') {
        searchParams.append('color', 'grayscale');
      } else if (params.colorType === 'transparent') {
        searchParams.append('color', 'transparent');
      }
    }

    // Add dominant color
    if (params.dominantColor) {
      searchParams.append('color', params.dominantColor);
    }

    // Add minimum size
    if (params.dimensions?.minWidth) {
      if (params.dimensions.minWidth >= 1920) {
        searchParams.append('min_width', '1920');
      } else if (params.dimensions.minWidth >= 1280) {
        searchParams.append('min_width', '1280');
      }
    }

    const url = `${this.config.baseUrl}?${searchParams}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Invalid Pixabay API parameters');
        }
        throw new Error(`Pixabay API error: ${response.status}`);
      }

      const data: PixabaySearchResponse = await response.json();
      
      return {
        results: data.hits.map(image => this.transformImage(image)),
        totalResults: data.total,
        provider: 'pixabay'
      };
    } catch (error) {
      console.error('Pixabay search error:', error);
      throw error;
    }
  }

  private transformImage(image: PixabayImage): ImageResult {
    return {
      id: image.id.toString(),
      url: image.webformatURL,
      thumbnailUrl: image.previewURL,
      title: image.tags.split(', ').slice(0, 3).join(', '),
      width: image.imageWidth,
      height: image.imageHeight,
      fileSize: image.imageSize,
      format: 'jpeg',
      source: 'pixabay',
      sourceUrl: image.pageURL,
      attribution: `Image by ${image.user} from Pixabay`,
      license: {
        type: 'Pixabay License',
        url: 'https://pixabay.com/service/license/',
        commercial: true,
        attribution: false
      },
      downloadUrl: image.largeImageURL || image.fullHDURL || image.webformatURL,
      metadata: {
        photographer: image.user,
        tags: image.tags.split(', '),
        views: image.views,
        downloads: image.downloads
      }
    };
  }

  async downloadImage(url: string): Promise<Blob> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error downloading from Pixabay:', error);
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.config.apiKey) return false;
    
    try {
      const response = await fetch(`${this.config.baseUrl}?key=${this.config.apiKey}&q=test&per_page=3`);
      return response.ok;
    } catch {
      return false;
    }
  }
}