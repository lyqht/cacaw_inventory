export interface ImageSearchResult {
  url: string;
  title: string;
  source: string;
  width?: number;
  height?: number;
  thumbnail?: string;
}

export class ImageSearchService {
  private static instance: ImageSearchService;
  
  // Using Unsplash API as a reliable source for high-quality images
  private unsplashAccessKey = 'your-unsplash-access-key'; // Would be in env vars
  private unsplashBaseUrl = 'https://api.unsplash.com/search/photos';
  
  // Fallback to a more open search API
  private serpApiKey = import.meta.env.VITE_SERP_API_KEY;
  
  static getInstance(): ImageSearchService {
    if (!ImageSearchService.instance) {
      ImageSearchService.instance = new ImageSearchService();
    }
    return ImageSearchService.instance;
  }

  /**
   * Search for product images based on item name and type
   */
  async searchProductImages(
    itemName: string, 
    itemType?: string, 
    series?: string
  ): Promise<ImageSearchResult[]> {
    try {
      // Build search query with context
      const searchTerms = [itemName];
      if (itemType) searchTerms.push(itemType);
      if (series) searchTerms.push(series);
      
      const query = searchTerms.join(' ').trim();
      console.log('Searching for images with query:', query);

      // Try multiple search methods
      const results = await Promise.allSettled([
        this.searchUnsplash(query),
        this.searchPixabay(query),
        this.searchPexels(query)
      ]);

      // Combine results from all sources
      const allResults: ImageSearchResult[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allResults.push(...result.value);
        } else {
          console.warn(`Search method ${index} failed:`, result.reason);
        }
      });

      // Remove duplicates and sort by relevance
      const uniqueResults = this.deduplicateResults(allResults);
      return this.sortByRelevance(uniqueResults, query);

    } catch (error) {
      console.error('Error searching for product images:', error);
      return [];
    }
  }

  /**
   * Search Unsplash for high-quality images
   */
  private async searchUnsplash(query: string): Promise<ImageSearchResult[]> {
    try {
      // For demo purposes, we'll use a mock response since we don't have API keys
      // In production, this would make actual API calls
      return this.getMockSearchResults(query, 'unsplash');
    } catch (error) {
      console.error('Unsplash search failed:', error);
      return [];
    }
  }

  /**
   * Search Pixabay for product images
   */
  private async searchPixabay(query: string): Promise<ImageSearchResult[]> {
    try {
      // Mock implementation - in production would use actual Pixabay API
      return this.getMockSearchResults(query, 'pixabay');
    } catch (error) {
      console.error('Pixabay search failed:', error);
      return [];
    }
  }

  /**
   * Search Pexels for product images
   */
  private async searchPexels(query: string): Promise<ImageSearchResult[]> {
    try {
      // Mock implementation - in production would use actual Pexels API
      return this.getMockSearchResults(query, 'pexels');
    } catch (error) {
      console.error('Pexels search failed:', error);
      return [];
    }
  }

  /**
   * Mock search results for demonstration
   * In production, this would be replaced with actual API calls
   */
  private getMockSearchResults(query: string, source: string): ImageSearchResult[] {
    const mockImages = [
      {
        url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
        title: `${query} - High Quality Product Image`,
        source: source,
        width: 800,
        height: 600,
        thumbnail: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200'
      },
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        title: `${query} - Professional Product Photo`,
        source: source,
        width: 800,
        height: 800,
        thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200'
      },
      {
        url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
        title: `${query} - Collectible Item`,
        source: source,
        width: 600,
        height: 800,
        thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200'
      }
    ];

    // Return 1-2 results per source to simulate realistic API responses
    return mockImages.slice(0, Math.floor(Math.random() * 2) + 1);
  }

  /**
   * Remove duplicate images based on URL similarity
   */
  private deduplicateResults(results: ImageSearchResult[]): ImageSearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.url.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort results by relevance to the search query
   */
  private sortByRelevance(results: ImageSearchResult[], query: string): ImageSearchResult[] {
    const queryWords = query.toLowerCase().split(' ');
    
    return results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, queryWords);
      const scoreB = this.calculateRelevanceScore(b, queryWords);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate relevance score based on title match
   */
  private calculateRelevanceScore(result: ImageSearchResult, queryWords: string[]): number {
    const title = result.title.toLowerCase();
    let score = 0;
    
    queryWords.forEach(word => {
      if (title.includes(word)) {
        score += word.length; // Longer words get higher scores
      }
    });
    
    return score;
  }

  /**
   * Download image and convert to blob for local use
   */
  async downloadImage(imageUrl: string): Promise<Blob> {
    try {
      const response = await fetch(imageUrl, {
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
      console.error('Error downloading image:', error);
      throw new Error('Failed to download image. Please try a different image or use your own photo.');
    }
  }

  /**
   * Validate if an image URL is accessible
   */
  async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}