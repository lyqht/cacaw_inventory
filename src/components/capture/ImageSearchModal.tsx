import React, { useState, useEffect } from 'react';
import { Search, Download, X, ExternalLink, Image as ImageIcon, Check, Loader, AlertTriangle, Lightbulb } from 'lucide-react';
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
  const [showAdvancedTips, setShowAdvancedTips] = useState(false);

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
        setError('No matching product images found. This feature works best with specific item names like "Charizard Pokemon Card" or "Iron Man Figure".');
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
    setShowAdvancedTips(false);
    onClose();
  };

  const getSearchSuggestions = () => {
    const suggestions = [];
    
    if (itemType?.toLowerCase().includes('card')) {
      suggestions.push(
        `"${itemName}" trading card`,
        `${itemName} ${series || 'MTG'} card`,
        `${itemName} collectible card`
      );
    } else if (itemType?.toLowerCase().includes('figure')) {
      suggestions.push(
        `${itemName} action figure`,
        `${itemName} collectible figure`,
        `${itemName} ${series || 'figure'}`
      );
    } else {
      suggestions.push(
        `${itemName} collectible`,
        `${itemName} ${itemType || 'item'}`,
        `${itemName} product`
      );
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
        {/* Search Header with Better Context */}
        <div className="flex items-center gap-2 p-3 bg-retro-bg-tertiary border border-retro-accent rounded-pixel">
          <ImageIcon className="w-5 h-5 text-retro-accent" />
          <div className="flex-1">
            <h3 className="font-pixel text-retro-accent text-sm">
              Search for Product Images
            </h3>
            <p className="text-retro-accent-light font-pixel-sans text-xs">
              Find professional product photos instead of using your camera image
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={Lightbulb}
            onClick={() => setShowAdvancedTips(!showAdvancedTips)}
          >
            Tips
          </Button>
        </div>

        {/* Advanced Search Tips */}
        {showAdvancedTips && (
          <Card variant="outlined" padding="md" className="border-retro-success">
            <h4 className="font-pixel text-retro-success text-sm mb-2">🎯 Search Tips for Better Results:</h4>
            <div className="space-y-2 text-xs font-pixel-sans text-retro-accent-light">
              <div>
                <strong className="text-retro-accent">For Trading Cards:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Include card name + "trading card" (e.g., "Charizard trading card")</li>
                  <li>• Add set name if known (e.g., "Base Set Charizard")</li>
                  <li>• Try "MTG", "Pokemon", or "Yu-Gi-Oh" for specific games</li>
                </ul>
              </div>
              <div>
                <strong className="text-retro-accent">For Figures:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Include character + "action figure" or "collectible figure"</li>
                  <li>• Add brand if known (e.g., "Funko Pop", "Nendoroid")</li>
                  <li>• Include series name (e.g., "Marvel", "Dragon Ball")</li>
                </ul>
              </div>
              <div>
                <strong className="text-retro-accent">General Tips:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Be specific with names and avoid generic terms</li>
                  <li>• Include brand, series, or manufacturer when possible</li>
                  <li>• Try different variations if first search doesn't work</li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Search Input with Suggestions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="Enter specific product name..."
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
              <p className="text-xs font-pixel-sans text-retro-accent-light mb-1">
                💡 Try these search suggestions:
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
        </div>

        {/* Search Status */}
        {isSearching && (
          <div className="text-center py-pixel-2">
            <LoadingSpinner size="md" variant="accent" className="mx-auto mb-2" />
            <p className="text-retro-accent-light font-pixel-sans text-sm">
              Searching for product images...
            </p>
          </div>
        )}

        {/* Error Display with Better Messaging */}
        {error && (
          <Card variant="outlined" className="border-retro-warning">
            <div className="flex items-start gap-2 text-retro-warning">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-pixel-sans text-sm">{error}</p>
                <div className="mt-2 text-xs font-pixel-sans text-retro-accent-light">
                  <p><strong>Note:</strong> This is a demo feature. In production, this would connect to:</p>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• TCGPlayer API for trading cards</li>
                    <li>• eBay API for collectibles</li>
                    <li>• Google Shopping API for products</li>
                    <li>• Manufacturer databases</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-pixel text-retro-accent">
                Found {searchResults.length} Product Image{searchResults.length !== 1 ? 's' : ''}
              </h4>
              <Badge variant="success" size="sm">
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
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDY4MkI0Ii8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI0ZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcmQgSW1hZ2U8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iI0RERCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhpZ2ggUXVhbGl0eTwvdGV4dD48L3N2Zz4=';
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

                    {/* Relevance Score */}
                    {image.relevanceScore && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="success" size="sm">
                          {image.relevanceScore}% match
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
                          window.open(image.url, '_blank');
                        }}
                        className="w-6 h-6 p-0 bg-black bg-opacity-50 hover:bg-black hover:bg-opacity-70"
                        title="View original"
                      />
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-2">
                    <p className="text-xs font-pixel-sans text-retro-accent-light truncate">
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

        {/* No Results State with Better Guidance */}
        {!isSearching && searchResults.length === 0 && searchQuery && !error && (
          <div className="text-center py-pixel-4">
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="font-pixel text-retro-accent mb-1">No Product Images Found</h3>
            <p className="text-retro-accent-light font-pixel-sans text-sm mb-3">
              Try being more specific with your search terms
            </p>
            
            <div className="text-left max-w-md mx-auto">
              <p className="text-xs font-pixel-sans text-retro-accent-light mb-2">
                <strong>Examples of good searches:</strong>
              </p>
              <ul className="text-xs font-pixel-sans text-retro-accent-light space-y-1">
                <li>• "Charizard Base Set Pokemon card"</li>
                <li>• "Iron Man Marvel action figure"</li>
                <li>• "Pikachu Pokemon plushie"</li>
                <li>• "Black Lotus Magic card"</li>
              </ul>
            </div>
          </div>
        )}

        {/* Demo Notice */}
        <Card variant="outlined" padding="md" className="bg-retro-bg-tertiary border-retro-primary">
          <h4 className="font-pixel text-retro-primary text-sm mb-2">🚀 Demo Feature Notice</h4>
          <div className="space-y-1 text-xs font-pixel-sans text-retro-accent-light">
            <p>This is a demonstration of the image search feature. In a production version:</p>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• Real product databases would be searched (TCGPlayer, eBay, etc.)</li>
              <li>• Thousands of actual product images would be available</li>
              <li>• Advanced image recognition would match your items precisely</li>
              <li>• Multiple high-quality angles and variations would be shown</li>
            </ul>
          </div>
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