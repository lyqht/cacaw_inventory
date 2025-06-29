import { BaseImageProvider, ImageSearchParams, SearchResponse, ImageResult, ProviderConfig } from './baseProvider';

interface GoogleImageResult {
  kind: string;
  title: string;
  htmlTitle: string;
  link: string;
  displayLink: string;
  snippet: string;
  htmlSnippet: string;
  mime: string;
  fileFormat: string;
  image: {
    contextLink: string;
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string;
    thumbnailHeight: number;
    thumbnailWidth: number;
  };
}

interface GoogleSearchResponse {
  kind: string;
  url: {
    type: string;
    template: string;
  };
  queries: {
    request: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
    }>;
    nextPage?: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
    }>;
  };
  context: {
    title: string;
  };
  searchInformation: {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
  };
  items?: GoogleImageResult[];
}

export class GoogleImagesProvider extends BaseImageProvider {
  private searchEngineId: string;

  constructor(apiKey: string, searchEngineId: string) {
    super({
      apiKey,
      baseUrl: 'https://www.googleapis.com/customsearch/v1',
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerDay: 10000
      },
      maxResults: 10, // Google Custom Search API limit
      supportedFeatures: {
        dimensions: true,
        imageType: true,
        colorFilter: true,
        usageRights: true,
        safeSearch: true
      }
    });
    this.searchEngineId = searchEngineId;
  }

  async search(params: ImageSearchParams): Promise<SearchResponse> {
    this.validateSearchParams(params);
    await this.checkRateLimit();

    if (!this.config.apiKey || !this.searchEngineId) {
      throw new Error('Google Custom Search API key and Search Engine ID are required');
    }

    const query = this.buildSearchQuery(params);
    const searchParams = new URLSearchParams({
      key: this.config.apiKey,
      cx: this.searchEngineId,
      q: query,
      searchType: 'image',
      num: Math.min(params.count || 10, this.config.maxResults).toString(),
      safe: params.safeSearch || 'moderate'
    });

    // Add image type filter
    if (params.imageType && params.imageType !== 'any') {
      searchParams.append('imgType', params.imageType);
    }

    // Add color filter
    if (params.colorType && params.colorType !== 'any') {
      searchParams.append('imgColorType', params.colorType);
    }

    // Add dominant color
    if (params.dominantColor) {
      searchParams.append('imgDominantColor', params.dominantColor);
    }

    // Add size filter
    if (params.dimensions) {
      if (params.dimensions.minWidth && params.dimensions.minWidth >= 2048) {
        searchParams.append('imgSize', 'xxlarge');
      } else if (params.dimensions.minWidth && params.dimensions.minWidth >= 1024) {
        searchParams.append('imgSize', 'xlarge');
      } else if (params.dimensions.minWidth && params.dimensions.minWidth >= 640) {
        searchParams.append('imgSize', 'large');
      }
    }

    // Add usage rights filter
    if (params.usageRights === 'commercial') {
      searchParams.append('rights', 'cc_publicdomain,cc_attribute,cc_sharealike,cc_noncommercial,cc_nonderived');
    }

    const url = `${this.config.baseUrl}?${searchParams}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Google API quota exceeded or invalid API key');
        }
        throw new Error(`Google Custom Search API error: ${response.status}`);
      }

      const data: GoogleSearchResponse = await response.json();
      
      return {
        results: (data.items || []).map(item => this.transformImage(item)),
        totalResults: parseInt(data.searchInformation.totalResults),
        nextPageToken: data.queries.nextPage?.[0]?.startIndex?.toString(),
        provider: 'google'
      };
    } catch (error) {
      console.error('Google Images search error:', error);
      throw error;
    }
  }

  private transformImage(item: GoogleImageResult): ImageResult {
    return {
      id: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: item.link,
      thumbnailUrl: item.image.thumbnailLink,
      title: item.title,
      description: item.snippet,
      width: item.image.width,
      height: item.image.height,
      fileSize: item.image.byteSize,
      format: item.fileFormat?.toLowerCase() || 'jpeg',
      source: 'google',
      sourceUrl: item.image.contextLink,
      attribution: `Image from ${item.displayLink}`,
      license: {
        type: 'Various',
        commercial: false, // Conservative default
        attribution: true
      },
      downloadUrl: item.link,
      metadata: {
        tags: item.title.split(' ').slice(0, 5)
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
      console.error('Error downloading from Google Images:', error);
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.config.apiKey || !this.searchEngineId) return false;
    
    try {
      const response = await fetch(
        `${this.config.baseUrl}?key=${this.config.apiKey}&cx=${this.searchEngineId}&q=test&searchType=image&num=1`
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}