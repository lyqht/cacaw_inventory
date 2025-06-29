import React, { useState, useEffect } from 'react';
import { Search, Download, X, ExternalLink, Image as ImageIcon, Check, Loader, AlertTriangle, Settings, Key, Zap, Globe } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EnhancedImageSearchService } from '../../services/enhancedImageSearch';
import { ImageResult } from '../../services/imageProviders/baseProvider';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (imageBlob: Blob, imageUrl: string) => void;
  itemName: string;
  itemType?: string;
  series?: string;
}

interface SearchFilters {
  imageType: 'photo' | 'illustration' | 'vector' | 'any';
  colorType: 'color' | 'grayscale' | 'transparent' | 'any';
  usageRights: 'commercial' | 'noncommercial' | 'any';
  minWidth?: number;
  providers: string[];
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  isOpen,
  onClose,
  onImageSelected,
  itemName,
  itemType,
  series
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ImageResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const [searchStats, setSearchStats] = useState<{
    providers: string[];
    errors: Record<string, string>;
    searchTime: number;
    fromCache: boolean;
  } | null>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    imageType: 'photo',
    colorType: 'any',
    usageRights: 'any',
    providers: []
  });

  const imageSearchService = EnhancedImageSearchService.getInstance();

  // Initialize search query and available providers when modal opens
  useEffect(() => {
    if (isOpen && itemName) {
      const initialQuery = [itemName, itemType, series].filter(Boolean).join(' ');
      setSearchQuery(initialQuery);
      
      // Load available providers
      const availableProviders = imageSearchService.getAvailableProviders();
      setFilters(prev => ({ ...prev, providers: availableProviders }));
      
      // Auto-search on open
      handleSearch(initialQuery);
    }
  }, [isOpen, itemName, itemType, series]);

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSearchStats(null);

    try {
      console.log('Searching for images:', searchTerm, 'with filters:', filters);
      
      const response = await imageSearchService.searchProductImages(
        searchTerm,
        itemType,
        series,
        {
          imageType: filters.imageType,
          colorType: filters.colorType,
          usageRights: filters.usageRights,
          dimensions: filters.minWidth ? { minWidth: filters.minWidth } : undefined,
          providers: filters.providers.length > 0 ? filters.providers : undefined,
          maxResultsPerProvider: 8,
          timeout: 15000,
          fallbackToMockData: false
        }
      );
      
      setSearchResults(response.results);
      setSearchStats({
        providers: response.providers,
        errors: response.errors,
        searchTime: response.searchTime,
        fromCache: response.fromCache
      });
      
      if (response.results.length === 0) {
        setError('No images found. Try adjusting your search terms or filters.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'Failed to search for images. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageSelect = async (image: ImageResult) => {
    setSelectedImage(image);
    setIsDownloading(true);
    setError(null);

    try {
      console.log('Downloading image:', image.url, 'from provider:', image.source);
      const imageBlob = await imageSearchService.downloadImage(image.url, image.source);
      
      // Pass both the blob and the original URL to the parent
      onImageSelected(imageBlob, image.url);
      onClose();
    } catch (error) {
      console.error('Download error:', error);
      setError(error instanceof Error ? error.message : 'Failed to download image');
    } finally {
      setIsDownloading(false);
      setSelectedImage(null);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedImage(null);
    setError(null);
    setSearchStats(null);
    onClose();
  };

  const toggleProvider = (provider: string) => {
    setFilters(prev => ({
      ...prev,
      providers: prev.providers.includes(provider)
        ? prev.providers.filter(p => p !== provider)
        : [...prev.providers, provider]
    }));
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openverse': return '🌐';
      case 'pexels': return '🎨';
      case 'pixabay': return '🖼️';
      case 'google': return '🔍';
      case 'mock': return '🎭';
      default: return '📷';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openverse': return 'border-green-500 text-green-500';
      case 'pexels': return 'border-green-500 text-green-500';
      case 'pixabay': return 'border-yellow-500 text-yellow-500';
      case 'google': return 'border-red-500 text-red-500';
      case 'mock': return 'border-gray-500 text-gray-500';
      default: return 'border-retro-accent text-retro-accent';
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'openverse': return 'Open content from Wikimedia, Flickr, and more';
      case 'pexels': return 'High-quality stock photos';
      case 'pixabay': return 'Free images and vectors';
      case 'google': return 'Google Custom Search';
      case 'mock': return 'Demo images for testing';
      default: return 'Image provider';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      title="Find Product Images"
      showCloseButton={false}
    >
      <div className="space-y-pixel-2">
        {/* Search Header */}
        <div className="flex items-center gap-2 p-3 bg-retro-bg-tertiary border border-retro-accent rounded-pixel">
          <Globe className="w-5 h-5 text-retro-accent" />
          <div>
            <h3 className="font-pixel text-retro-accent text-sm">
              Enhanced Product Image Search
            </h3>
            <p className="text-retro-accent-light font-pixel-sans text-xs">
              Search across multiple providers for high-quality product images
            </p>
          </div>
        </div>

        {/* Openverse Info Banner */}
        <Card variant="outlined" padding="md" className="bg-green-50 border-green-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-pixel flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-pixel text-green-700 text-sm">Now Powered by Openverse!</h4>
              <p className="text-green-600 font-pixel-sans text-xs">
                Access millions of openly licensed images from Wikimedia, Flickr, and other sources
              </p>
            </div>
          </div>
        </Card>

        {/* Search Controls */}
        <div className="space-y-pixel">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="Search for product images..."
              icon={Search}
              fullWidth
              showCursor
            />
            <Button
              variant="accent"
              icon={Search}
              onClick={() => handleSearch()}
              disabled={!searchQuery.trim() || isSearching}
              isLoading={isSearching}
            >
              Search
            </Button>
          </div>

          {/* Filter Controls */}
          <div className="flex gap-2">
            <Button
              variant={showFilters ? 'accent' : 'ghost'}
              size="sm"
              icon={Settings}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Key}
              onClick={() => setShowProviderSettings(!showProviderSettings)}
            >
              Providers
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card variant="outlined" padding="md">
            <h4 className="font-pixel text-retro-accent text-sm mb-2">Search Filters</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-pixel-2">
              {/* Image Type */}
              <div>
                <label className="block text-xs font-pixel text-retro-accent mb-1">Image Type</label>
                <select
                  value={filters.imageType}
                  onChange={(e) => setFilters(prev => ({ ...prev, imageType: e.target.value as any }))}
                  className="pixel-input w-full text-xs"
                >
                  <option value="any">Any Type</option>
                  <option value="photo">Photo</option>
                  <option value="illustration">Illustration</option>
                  <option value="vector">Vector</option>
                </select>
              </div>

              {/* Color Type */}
              <div>
                <label className="block text-xs font-pixel text-retro-accent mb-1">Color</label>
                <select
                  value={filters.colorType}
                  onChange={(e) => setFilters(prev => ({ ...prev, colorType: e.target.value as any }))}
                  className="pixel-input w-full text-xs"
                >
                  <option value="any">Any Color</option>
                  <option value="color">Color</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="transparent">Transparent</option>
                </select>
              </div>

              {/* Usage Rights */}
              <div>
                <label className="block text-xs font-pixel text-retro-accent mb-1">Usage Rights</label>
                <select
                  value={filters.usageRights}
                  onChange={(e) => setFilters(prev => ({ ...prev, usageRights: e.target.value as any }))}
                  className="pixel-input w-full text-xs"
                >
                  <option value="any">Any License</option>
                  <option value="commercial">Commercial Use OK</option>
                  <option value="noncommercial">Non-Commercial Only</option>
                </select>
              </div>

              {/* Minimum Width */}
              <div>
                <label className="block text-xs font-pixel text-retro-accent mb-1">Min Width (px)</label>
                <Input
                  type="number"
                  value={filters.minWidth?.toString() || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    minWidth: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="e.g., 800"
                  fullWidth
                />
              </div>
            </div>
          </Card>
        )}

        {/* Provider Settings */}
        {showProviderSettings && (
          <Card variant="outlined" padding="md">
            <h4 className="font-pixel text-retro-accent text-sm mb-2">Image Providers</h4>
            <p className="text-retro-accent-light font-pixel-sans text-xs mb-2">
              Select which providers to search. Openverse provides openly licensed content.
            </p>
            
            <div className="space-y-2">
              {imageSearchService.getAvailableProviders().map(provider => (
                <div key={provider} className="flex items-center justify-between p-2 border border-retro-accent rounded-pixel">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getProviderIcon(provider)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-retro-accent text-sm capitalize">{provider}</span>
                        {provider === 'openverse' && (
                          <Badge variant="success" size="sm">NEW</Badge>
                        )}
                      </div>
                      <p className="text-xs text-retro-accent-light font-pixel-sans">
                        {getProviderDescription(provider)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={filters.providers.includes(provider) ? 'accent' : 'ghost'}
                    size="sm"
                    onClick={() => toggleProvider(provider)}
                    className={`text-xs ${getProviderColor(provider)}`}
                  >
                    {filters.providers.includes(provider) ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Search Status */}
        {isSearching && (
          <div className="text-center py-pixel-2">
            <LoadingSpinner size="md" variant="accent" className="mx-auto mb-2" />
            <p className="text-retro-accent-light font-pixel-sans text-sm">
              Searching across multiple providers...
            </p>
          </div>
        )}

        {/* Search Stats */}
        {searchStats && !isSearching && (
          <Card variant="outlined" padding="sm" className="bg-retro-bg-tertiary">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-retro-accent" />
                <span className="font-pixel-sans text-retro-accent-light">
                  Found {searchResults.length} results in {searchStats.searchTime}ms
                </span>
                {searchStats.fromCache && (
                  <Badge variant="success" size="sm">Cached</Badge>
                )}
              </div>
              <div className="flex gap-1">
                {searchStats.providers.map(provider => (
                  <span key={provider} className="text-lg" title={provider}>
                    {getProviderIcon(provider)}
                  </span>
                ))}
              </div>
            </div>
            
            {Object.keys(searchStats.errors).length > 0 && (
              <div className="mt-1 text-xs text-retro-warning">
                Errors: {Object.entries(searchStats.errors).map(([provider, error]) => 
                  `${provider}: ${error}`
                ).join(', ')}
              </div>
            )}
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card variant="outlined" className="border-retro-error">
            <div className="flex items-start gap-2 text-retro-error">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-pixel-sans text-sm">{error}</p>
                {error.includes('CORS') && (
                  <p className="font-pixel-sans text-xs mt-1 text-retro-accent-light">
                    💡 Tip: Try using your own photo or search for different terms
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-pixel text-retro-accent">
                Found {searchResults.length} Image{searchResults.length !== 1 ? 's' : ''}
              </h4>
              <Badge variant="default" size="sm">
                Click to use
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-pixel-2 max-h-96 overflow-y-auto">
              {searchResults.map((image, index) => (
                <Card
                  key={`${image.source}-${image.id}-${index}`}
                  variant="outlined"
                  padding="none"
                  className={`cursor-pointer transition-all duration-200 hover:border-retro-accent-light hover:shadow-pixel-lg ${
                    selectedImage?.id === image.id ? 'border-retro-success bg-retro-success bg-opacity-10' : ''
                  } ${
                    isDownloading && selectedImage?.id === image.id ? 'opacity-50' : ''
                  }`}
                  onClick={() => handleImageSelect(image)}
                >
                  <div className="relative">
                    {/* Image */}
                    <div className="aspect-square bg-retro-bg-tertiary flex items-center justify-center overflow-hidden">
                      <img
                        src={image.thumbnailUrl || image.url}
                        alt={image.title}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzg4OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                          target.alt = 'Image not available';
                        }}
                      />
                    </div>

                    {/* Loading Overlay */}
                    {isDownloading && selectedImage?.id === image.id && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader className="w-6 h-6 animate-spin mx-auto mb-1" />
                          <p className="text-xs font-pixel-sans">Downloading...</p>
                        </div>
                      </div>
                    )}

                    {/* Selection Indicator */}
                    {selectedImage?.id === image.id && !isDownloading && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-retro-success rounded-pixel flex items-center justify-center">
                        <Check className="w-4 h-4 text-retro-bg-primary" />
                      </div>
                    )}

                    {/* Provider Badge */}
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="default" size="sm" className={getProviderColor(image.source)}>
                        {getProviderIcon(image.source)} {image.source}
                      </Badge>
                    </div>

                    {/* License Badge */}
                    {image.license?.commercial && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="success" size="sm">
                          Commercial OK
                        </Badge>
                      </div>
                    )}

                    {/* CC0/Public Domain Badge */}
                    {!image.license?.attribution && image.license?.commercial && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="success" size="sm">
                          CC0/Public Domain
                        </Badge>
                      </div>
                    )}

                    {/* External Link */}
                    <div className="absolute bottom-2 right-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={ExternalLink}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (image.sourceUrl) {
                            window.open(image.sourceUrl, '_blank');
                          }
                        }}
                        className="w-6 h-6 p-0 bg-black bg-opacity-50 hover:bg-black hover:bg-opacity-70"
                        title="View original"
                      />
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-2">
                    <p className="text-xs font-pixel-sans text-retro-accent-light truncate" title={image.title}>
                      {image.title}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-retro-accent-light font-pixel-sans">
                        {image.width}×{image.height}
                      </span>
                      {image.license && (
                        <span className="text-xs text-retro-accent-light font-pixel-sans">
                          {image.license.type}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results State */}
        {!isSearching && searchResults.length === 0 && searchQuery && !error && (
          <div className="text-center py-pixel-4">
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="font-pixel text-retro-accent mb-1">No Images Found</h3>
            <p className="text-retro-accent-light font-pixel-sans text-sm mb-2">
              No results for "{searchQuery}"
            </p>
            <p className="text-retro-accent-light font-pixel-sans text-xs">
              Try different search terms, adjust filters, or check provider settings
            </p>
          </div>
        )}

        {/* Instructions */}
        <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
          <h4 className="font-pixel text-retro-accent text-sm mb-2">💡 Search Tips:</h4>
          <ul className="space-y-1 text-xs font-pixel-sans text-retro-accent-light">
            <li>• <strong>Be specific:</strong> "Charizard Pokemon card" vs just "card"</li>
            <li>• <strong>Include brand/series:</strong> "Funko Pop Batman" or "Magic The Gathering"</li>
            <li>• <strong>Use filters:</strong> Specify image type, size, and usage rights</li>
            <li>• <strong>Openverse advantage:</strong> All content is openly licensed for reuse</li>
            <li>• <strong>Check licenses:</strong> Look for CC0 or Public Domain for maximum freedom</li>
          </ul>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-pixel-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isDownloading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};