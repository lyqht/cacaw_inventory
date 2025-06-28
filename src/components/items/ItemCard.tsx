import React from 'react';
import { Edit, Trash2, Eye, DollarSign, Calendar, Tag, MoreVertical } from 'lucide-react';
import { CollectibleData } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ItemCardProps {
  item: CollectibleData;
  onEdit: (item: CollectibleData) => void;
  onDelete: (item: CollectibleData) => void;
  onView: (item: CollectibleData) => void;
  className?: string;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  onView,
  className = ''
}) => {
  const [showActions, setShowActions] = React.useState(false);
  const [imageLoadError, setImageLoadError] = React.useState(false);

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'mint':
        return 'text-retro-success font-bold';
      case 'near-mint':
        return 'text-green-300 font-bold';
      case 'excellent':
        return 'text-retro-accent font-bold';
      case 'good':
        return 'text-yellow-300 font-bold';
      case 'fair':
        return 'text-orange-300 font-bold';
      case 'poor':
        return 'text-red-300 font-bold';
      case 'damaged':
        return 'text-retro-error font-bold';
      default:
        return 'text-retro-accent-light font-bold';
    }
  };

  const getConditionLabel = (condition: string) => {
    return condition.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: '$',
      JPY: '¥'
    };
    
    return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Reset image error state when item changes
  React.useEffect(() => {
    setImageLoadError(false);
  }, [item.id, item.primaryImage, item.additionalImages]);

  // Determine if item has image content
  const hasImage = item.primaryImage || item.additionalImages.length > 0;
  const displayImage = item.primaryImage || item.additionalImages[0];

  console.log('ItemCard rendering:', {
    itemName: item.name,
    hasImage,
    primaryImage: item.primaryImage,
    additionalImages: item.additionalImages,
    displayImage,
    imageLoadError
  });

  return (
    <Card
      hoverable
      glow
      className={`group transition-all duration-200 hover:scale-105 ${className}`}
    >
      <div className="space-y-pixel">
        {/* Optimized Header with Better Space Allocation */}
        <div className="flex items-start gap-2">
          {/* Item Name - More Space Allocated */}
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-pixel text-retro-accent text-sm leading-tight break-words">
              {item.name}
            </h3>
            {item.type && (
              <p className="text-xs text-retro-accent-light font-pixel-sans truncate mt-0.5">
                {item.type}
              </p>
            )}
          </div>
          
          {/* Compact Action Buttons - Vertical Stack on Mobile, Horizontal on Desktop */}
          <div className="flex-shrink-0 relative">
            {/* Desktop: Horizontal Layout */}
            <div className="hidden sm:flex gap-1">
              <Button
                variant="accent"
                size="sm"
                icon={Eye}
                onClick={(e) => {
                  e.stopPropagation();
                  onView(item);
                }}
                className="w-7 h-7 p-0 min-w-[28px] min-h-[28px]"
                title="View Details"
              />
              <Button
                variant="primary"
                size="sm"
                icon={Edit}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="w-7 h-7 p-0 min-w-[28px] min-h-[28px]"
                title="Edit Item"
              />
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                className="w-7 h-7 p-0 min-w-[28px] min-h-[28px] hover:bg-retro-error hover:text-white"
                title="Delete Item"
              />
            </div>

            {/* Mobile: Dropdown Menu */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                icon={MoreVertical}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="w-7 h-7 p-0 min-w-[28px] min-h-[28px]"
                title="Actions"
              />
              
              {/* Dropdown Actions */}
              {showActions && (
                <div className="absolute right-0 top-8 z-10 bg-retro-bg-secondary border-2 border-retro-accent rounded-pixel shadow-pixel-lg min-w-[120px]">
                  <div className="p-1 space-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(item);
                        setShowActions(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs font-pixel-sans text-retro-accent hover:bg-retro-accent hover:text-retro-bg-primary rounded-pixel transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                        setShowActions(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs font-pixel-sans text-retro-accent hover:bg-retro-accent hover:text-retro-bg-primary rounded-pixel transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item);
                        setShowActions(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs font-pixel-sans text-retro-error hover:bg-retro-error hover:text-white rounded-pixel transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Responsive Image Container */}
        <div className={`
          bg-retro-bg-tertiary border-2 border-retro-accent rounded-pixel 
          flex items-center justify-center transition-all duration-300 ease-in-out
          ${hasImage 
            ? 'aspect-square' // Full square for images
            : 'aspect-[3/2] max-h-32' // Reduced height for text-only content
          }
        `}>
          {displayImage && !imageLoadError ? (
            <img
              src={displayImage}
              alt={item.name}
              className="w-full h-full object-cover rounded-pixel transition-all duration-300"
              onError={(e) => {
                console.error('Image failed to load:', displayImage);
                setImageLoadError(true);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', displayImage);
              }}
            />
          ) : displayImage && imageLoadError ? (
            <div className="text-center text-retro-error transition-all duration-300">
              <div className="text-xl mb-1 animate-pixel-pulse">⚠️</div>
              <p className="text-xs font-pixel-sans">Corrupted Image</p>
            </div>
          ) : (
            <div className="text-center text-retro-accent-light transition-all duration-300">
              <div className="text-xl mb-1 animate-pixel-pulse">📷</div>
              <p className="text-xs font-pixel-sans">No Image</p>
            </div>
          )}
        </div>

        {/* Item Details - Improved Layout */}
        <div className="space-y-1.5">
          {/* Series */}
          {item.series && (
            <p className="text-xs text-retro-accent-light font-pixel-sans truncate">
              <span className="text-retro-accent">Series:</span> {item.series}
            </p>
          )}

          {/* Condition - Fixed Contrast */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-pixel-sans text-retro-accent-light">
              Condition:
            </span>
            <span className={`text-xs font-pixel-sans ${getConditionColor(item.condition)}`}>
              {getConditionLabel(item.condition)}
            </span>
          </div>

          {/* Value */}
          {item.estimatedValue && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-pixel-sans text-retro-accent-light">
                Value:
              </span>
              <span className="text-xs font-pixel text-retro-accent">
                {formatCurrency(item.estimatedValue, item.currency)}
              </span>
            </div>
          )}

          {/* AI Detection Badge */}
          {item.aiDetected && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-retro-accent rounded-full animate-pixel-pulse" />
              <span className="text-xs font-pixel-sans text-retro-accent">
                AI Detected
              </span>
              {item.aiConfidence && (
                <span className="text-xs text-retro-accent-light">
                  ({Math.round(item.aiConfidence)}%)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tags - Smaller and More Compact */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-1.5 py-0.5 text-xs font-pixel bg-retro-accent text-retro-bg-primary border border-retro-accent-teal shadow-pixel-glow rounded-pixel-sm"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-pixel bg-retro-accent text-retro-bg-primary border border-retro-accent-teal shadow-pixel-glow rounded-pixel-sm">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-retro-accent-light font-pixel-sans pt-1 border-t border-retro-accent border-opacity-30">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="truncate">{formatDate(item.createdAt)}</span>
          </div>
          
          {(item.primaryImage || item.additionalImages.length > 0) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span>{(item.primaryImage ? 1 : 0) + item.additionalImages.length}</span>
              <span>📷</span>
            </div>
          )}
        </div>
      </div>

      {/* Click Outside Handler for Mobile Dropdown */}
      {showActions && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(false)}
        />
      )}
    </Card>
  );
};