import React, { useState, useEffect } from 'react';
import { Search, Download, X, ExternalLink, Image as ImageIcon, Check, Loader, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ImageSearchService, ImageSearchResult } from '../../services/imageSearch';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (imageBlob: Blob, imageUrl: string) => void;
  itemName: string;
  itemType?: string;
  series?: string;
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
  const [searchResults, setSearchResults] = useState<ImageSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageSearchResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageSearchService = ImageSearchService.getInstance();

  // Initialize search query when modal opens
  useEffect(() => {
    if (isOpen && itemName) {
      const initialQuery = [itemName, itemType, series].filter(Boolean).join(' ');
      setSearchQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [isOpen, itemName, itemType, series]);

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      console.log('Searching for images:', searchTerm);
      const results = await imageSearchService.searchProductImages(
        searchTerm,
        itemType,
        series
      );
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('No images found. Try adjusting your search terms or using more specific keywords.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search for images. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageSelect = async (image: ImageSearchResult) => {
    setSelectedImage(image);
    setIsDownloading(true);
    setError(null);

    try {
      console.log('Downloading image:', image.url);
      const imageBlob = await imageSearchService.downloadImage(image.url);
      
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
    onClose();
  };

  // Get search suggestions based on item type
  const getSearchSuggestions = () => {
    const suggestions = [];
    
    if (itemType?.toLowerCase().includes('card')) {
      suggestions.push(`${itemName} trading card`, `${itemName} TCG`, `${itemName} collectible card`);
    } else if (itemType?.toLowerCase().includes('figure')) {
      suggestions.push(`${itemName} figure`, `${itemName} collectible`, `${itemName} toy`);
    } else if (itemType?.toLowerCase().includes('plush')) {
      suggestions.push(`${itemName} plushie`, `${itemName} stuffed animal`, `${itemName} soft toy`);
    } else {
      suggestions.push(`${itemName} collectible`, `${itemName} merchandise`, `${itemName} product`);
    }
    
    return suggestions.slice(0, 3);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Find Similar Product Image"
      size="xl"
    >
      <div className="space-y-pixel-2">
        {/* Search Header */}
        <div className="flex items-center gap-2 p-3 bg-retro-bg-tertiary border border-retro-accent rounded-pixel">
          <ImageIcon className="w-5 h-5 text-retro-accent" />
          <div>
            <h3 className="font-pixel text-retro-accent text-sm">
              Search for Product Images
            </h3>
            <p className="text-retro-accent-light font-pixel-sans text-xs">
              Find high-quality images that match "{itemName}" instead of using your photo
            </p>
          </div>
        </div>

        {/* Search Input */}
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

        {/* Search Suggestions */}
        {!isSearching && searchResults.length === 0 && (
          <div>
            <p className="text-retro-accent-light font-pixel-sans text-xs mb-2">
              Try these search terms:
            </p>
            <div className="flex flex-wrap gap-1">
              {getSearchSuggestions().map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    handleSearch(suggestion);
                  }}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Search Status */}
        {isSearching && (
          <div className="text-center py-pixel-2">
            <LoadingSpinner size="md" variant="accent" className="mx-auto mb-2" />
            <p className="text-retro-accent-light font-pixel-sans text-sm">
              Searching for "{searchQuery}"...
            </p>
          </div>
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
                Found {searchResults.length} Image{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </h4>
              <Badge variant="default" size="sm">
                Click to use
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-pixel-2 max-h-96 overflow-y-auto">
              {searchResults.map((image, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  padding="none"
                  className={`cursor-pointer transition-all duration-200 hover:border-retro-accent-light hover:shadow-pixel-lg ${
                    selectedImage?.url === image.url ? 'border-retro-success bg-retro-success bg-opacity-10' : ''
                  } ${
                    isDownloading && selectedImage?.url === image.url ? 'opacity-50' : ''
                  }`}
                  onClick={() => handleImageSelect(image)}
                >
                  <div className="relative">
                    {/* Image */}
                    <div className="aspect-square bg-retro-bg-tertiary flex items-center justify-center overflow-hidden">
                      <img
                        src={image.thumbnail || image.url}
                        alt={image.title}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                        onError={(e) => {
                          // Fallback to a placeholder if image fails to load
                          const target = e.currentTarget;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzg4OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                          target.alt = 'Image not available';
                        }}
                      />
                    </div>

                    {/* Loading Overlay */}
                    {isDownloading && selectedImage?.url === image.url && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader className="w-6 h-6 animate-spin mx-auto mb-1" />
                          <p className="text-xs font-pixel-sans">Downloading...</p>
                        </div>
                      </div>
                    )}

                    {/* Selection Indicator */}
                    {selectedImage?.url === image.url && !isDownloading && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-retro-success rounded-pixel flex items-center justify-center">
                        <Check className="w-4 h-4 text-retro-bg-primary" />
                      </div>
                    )}

                    {/* Source Badge */}
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="default" size="sm">
                        {image.source}
                      </Badge>
                    </div>

                    {/* External Link */}
                    <div className="absolute bottom-2 right-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={ExternalLink}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(image.url, '_blank');
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
                    {image.width && image.height && (
                      <p className="text-xs text-retro-accent-light font-pixel-sans">
                        {image.width}×{image.height}
                      </p>
                    )}
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
              Try different search terms, be more specific, or use your own photo instead
            </p>
          </div>
        )}

        {/* Instructions */}
        <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary">
          <h4 className="font-pixel text-retro-accent text-sm mb-2">💡 Search Tips:</h4>
          <ul className="space-y-1 text-xs font-pixel-sans text-retro-accent-light">
            <li>• <strong>Be specific:</strong> "Charizard Pokemon card" vs just "card"</li>
            <li>• <strong>Include brand/series:</strong> "Funko Pop Batman" or "Magic The Gathering"</li>
            <li>• <strong>Add descriptors:</strong> "collectible", "figure", "trading card"</li>
            <li>• <strong>Try variations:</strong> "plushie" vs "stuffed animal" vs "soft toy"</li>
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