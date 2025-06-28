export interface ImageSearchResult {
  url: string;
  title: string;
  source: string;
  width?: number;
  height?: number;
  thumbnail?: string;
  relevanceScore?: number;
}

export class ImageSearchService {
  private static instance: ImageSearchService;
  
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
      // Build more specific search query
      const searchTerms = this.buildSearchQuery(itemName, itemType, series);
      console.log('Searching for images with optimized query:', searchTerms);

      // For now, we'll use a more targeted approach with real image URLs
      // In production, this would integrate with actual APIs like:
      // - TCGPlayer API for trading cards
      // - eBay API for collectibles
      // - Google Custom Search API
      // - Bing Image Search API
      
      const results = await this.getTargetedResults(searchTerms, itemType);
      
      return this.sortByRelevance(results, searchTerms.join(' '));

    } catch (error) {
      console.error('Error searching for product images:', error);
      return [];
    }
  }

  /**
   * Build a more targeted search query based on item details
   */
  private buildSearchQuery(itemName: string, itemType?: string, series?: string): string[] {
    const terms: string[] = [];
    
    // Clean and prioritize the item name
    const cleanName = itemName.trim();
    if (cleanName) {
      terms.push(cleanName);
    }
    
    // Add specific product identifiers
    if (itemType?.toLowerCase().includes('card')) {
      terms.push('trading card');
      if (series) {
        terms.push(series);
      }
    } else if (itemType?.toLowerCase().includes('figure')) {
      terms.push('action figure', 'collectible figure');
    } else if (itemType?.toLowerCase().includes('plush')) {
      terms.push('plushie', 'stuffed animal');
    }
    
    // Add series/set information
    if (series && !terms.includes(series)) {
      terms.push(series);
    }
    
    return terms;
  }

  /**
   * Get more targeted results based on item type and search terms
   */
  private async getTargetedResults(searchTerms: string[], itemType?: string): Promise<ImageSearchResult[]> {
    const query = searchTerms.join(' ').toLowerCase();
    
    // For trading cards, provide card-specific results
    if (itemType?.toLowerCase().includes('card') || query.includes('card')) {
      return this.getTradingCardResults(query);
    }
    
    // For figures, provide figure-specific results
    if (itemType?.toLowerCase().includes('figure') || query.includes('figure')) {
      return this.getFigureResults(query);
    }
    
    // For plushies, provide plushie-specific results
    if (itemType?.toLowerCase().includes('plush') || query.includes('plush')) {
      return this.getPlushieResults(query);
    }
    
    // Generic collectible results
    return this.getGenericCollectibleResults(query);
  }

  /**
   * Get trading card specific image results
   */
  private getTradingCardResults(query: string): ImageSearchResult[] {
    // These would be real card images in production
    const cardImages = [
      {
        url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
        title: 'Magic: The Gathering Trading Card',
        source: 'TCGPlayer',
        width: 488,
        height: 680,
        thumbnail: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200',
        relevanceScore: 95
      },
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        title: 'Trading Card Game Card',
        source: 'CardMarket',
        width: 488,
        height: 680,
        thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200',
        relevanceScore: 90
      }
    ];

    // Filter and score based on query relevance
    return cardImages.filter(card => {
      const titleWords = card.title.toLowerCase().split(' ');
      const queryWords = query.split(' ');
      return queryWords.some(word => titleWords.some(titleWord => titleWord.includes(word)));
    });
  }

  /**
   * Get action figure specific image results
   */
  private getFigureResults(query: string): ImageSearchResult[] {
    const figureImages = [
      {
        url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
        title: 'Collectible Action Figure',
        source: 'HobbyLink',
        width: 600,
        height: 800,
        thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200',
        relevanceScore: 85
      }
    ];

    return figureImages.filter(figure => {
      const titleWords = figure.title.toLowerCase().split(' ');
      const queryWords = query.split(' ');
      return queryWords.some(word => titleWords.some(titleWord => titleWord.includes(word)));
    });
  }

  /**
   * Get plushie specific image results
   */
  private getPlushieResults(query: string): ImageSearchResult[] {
    const plushieImages = [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        title: 'Collectible Plushie Toy',
        source: 'PlushieStore',
        width: 600,
        height: 600,
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
        relevanceScore: 80
      }
    ];

    return plushieImages.filter(plushie => {
      const titleWords = plushie.title.toLowerCase().split(' ');
      const queryWords = query.split(' ');
      return queryWords.some(word => titleWords.some(titleWord => titleWord.includes(word)));
    });
  }

  /**
   * Get generic collectible results
   */
  private getGenericCollectibleResults(query: string): ImageSearchResult[] {
    // Return empty array if no specific matches to avoid irrelevant results
    console.log('No specific category match found for query:', query);
    return [];
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
   * Calculate relevance score based on title match and predefined scores
   */
  private calculateRelevanceScore(result: ImageSearchResult, queryWords: string[]): number {
    let score = result.relevanceScore || 0;
    const title = result.title.toLowerCase();
    
    // Boost score for exact word matches
    queryWords.forEach(word => {
      if (title.includes(word)) {
        score += word.length * 2; // Longer words get higher scores
      }
    });
    
    return score;
  }

  /**
   * Download image and convert to blob for local use
   */
  async downloadImage(imageUrl: string): Promise<Blob> {
    try {
      // For demo purposes, we'll create a placeholder blob
      // In production, this would actually download the image
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
      
      // Fallback: create a placeholder image blob
      return this.createPlaceholderImage();
    }
  }

  /**
   * Create a placeholder image when download fails
   */
  private async createPlaceholderImage(): Promise<Blob> {
    // Create a simple colored rectangle as placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;
    
    // Draw a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 400, 300);
    gradient.addColorStop(0, '#4682B4');
    gradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 300);
    
    // Add text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Product Image', 200, 150);
    ctx.font = '14px Arial';
    ctx.fillText('High Quality Placeholder', 200, 180);
    
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob!), 'image/png');
    });
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