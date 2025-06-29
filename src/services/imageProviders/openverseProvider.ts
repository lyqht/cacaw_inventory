import { BaseImageProvider, ImageResult, SearchOptions, ImageSearchParams, SearchResponse } from './baseProvider';

export class OpenverseProvider extends BaseImageProvider {
  private readonly baseUrl = 'https://api.openverse.engineering/v1';
  private readonly name = 'openverse';

  getName(): string {
    return this.name;
  }

  async search(params: ImageSearchParams, options: SearchOptions = {}): Promise<SearchResponse> {
    try {
      // Extract query from params object
      const query = params.query;
      
      // Build search parameters
      const searchParams = new URLSearchParams({
        q: query,
        page_size: (options.maxResults || 20).toString(),
        mature: 'false', // Filter out mature content
      });

      // Add image type filter if specified
      if (options.imageType && options.imageType !== 'any') {
        if (options.imageType === 'photo') {
          searchParams.append('category', 'photograph');
        } else if (options.imageType === 'illustration') {
          searchParams.append('category', 'illustration');
        }
      }

      // Add license filter for commercial use
      if (options.usageRights === 'commercial') {
        searchParams.append('license_type', 'commercial');
      }

      // Add size filter if specified
      if (options.dimensions?.minWidth) {
        searchParams.append('size', 'large'); // Use large size as proxy for minimum width
      }

      const url = `${this.baseUrl}/images/?${searchParams.toString()}`;
      console.log('Openverse API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CACAW-CollectionApp/1.0',
        },
        // Add timeout
        signal: AbortSignal.timeout(options.timeout || 10000),
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
          hasMore: false,
        };
      }

      const results = data.results.map((item: any, index: number) => ({
        id: item.id || `openverse-${index}`,
        title: item.title || 'Untitled',
        url: item.url,
        thumbnailUrl: item.thumbnail || item.url,
        width: item.width || 0,
        height: item.height || 0,
        source: this.name,
        sourceUrl: item.foreign_landing_url || item.url,
        license: {
          type: item.license || 'Unknown',
          attribution: item.attribution || item.creator || 'Unknown',
          commercial: this.isCommercialLicense(item.license),
          url: item.license_url,
        },
        tags: item.tags ? item.tags.map((tag: any) => tag.name || tag).filter(Boolean) : [],
      }));

      return {
        results,
        totalResults: data.result_count || results.length,
        hasMore: data.result_count > results.length,
      };

    } catch (error) {
      console.error('Openverse search error:', error);
      
      // If it's a network error, provide more specific error message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to Openverse API. This may be due to network restrictions or CORS policy.');
      }
      
      // If it's a timeout error
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new Error('Openverse API request timed out. Please try again.');
      }
      
      throw error;
    }
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

  async downloadImage(imageUrl: string): Promise<Blob> {
    try {
      const response = await fetch(imageUrl, {
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
}