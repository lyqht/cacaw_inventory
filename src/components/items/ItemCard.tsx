import React from 'react';
import { Edit, Trash2, Eye, DollarSign, Calendar, Tag } from 'lucide-react';
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
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'mint':
        return 'text-retro-success';
      case 'near-mint':
        return 'text-green-400';
      case 'excellent':
        return 'text-retro-accent';
      case 'good':
        return 'text-yellow-400';
      case 'fair':
        return 'text-orange-400';
      case 'poor':
        return 'text-red-400';
      case 'damaged':
        return 'text-retro-error';
      default:
        return 'text-retro-accent-light';
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

  // Determine if item has image content
  const hasImage = item.primaryImage || item.additionalImages.length > 0;

  return (
    <Card
      hoverable
      glow
      className={`group transition-all duration-200 hover:scale-105 ${className}`}
    >
      <div className="space-y-pixel">
        {/* Item Header with Always-Visible Action Buttons */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-pixel text-retro-accent text-sm truncate">
              {item.name}
            </h3>
            {item.type && (
              <p className="text-xs text-retro-accent-light font-pixel-sans truncate">
                {item.type}
              </p>
            )}
          </div>
          
          {/* Always Visible Action Buttons - Improved Size and Contrast */}
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="accent"
              size="sm"
              icon={Eye}
              onClick={(e) => {
                e.stopPropagation();
                onView(item);
              }}
              className="min-w-[32px] min-h-[32px] p-1 bg-retro-accent-medium hover:bg-retro-accent-light border-2 border-retro-accent-light shadow-pixel"
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
              className="min-w-[32px] min-h-[32px] p-1 bg-retro-primary hover:bg-retro-primary-light border-2 border-retro-primary-light shadow-pixel"
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
              className="min-w-[32px] min-h-[32px] p-1 bg-retro-error bg-opacity-80 hover:bg-retro-error text-white border-2 border-retro-error shadow-pixel"
              title="Delete Item"
            />
          </div>
        </div>

        {/* Responsive Image Container - Adjusts size based on content */}
        <div className={`
          bg-retro-bg-tertiary border-2 border-retro-accent rounded-pixel 
          flex items-center justify-center transition-all duration-300 ease-in-out
          ${hasImage 
            ? 'aspect-square' // Full square for images
            : 'aspect-[3/2] max-h-32' // Reduced height for text-only content
          }
        `}>
          {item.primaryImage ? (
            <img
              src={item.primaryImage}
              alt={item.name}
              className="w-full h-full object-cover rounded-pixel transition-all duration-300"
            />
          ) : item.additionalImages.length > 0 ? (
            <img
              src={item.additionalImages[0]}
              alt={item.name}
              className="w-full h-full object-cover rounded-pixel transition-all duration-300"
            />
          ) : (
            <div className="text-center text-retro-accent-light transition-all duration-300">
              <div className="text-xl mb-1 animate-pixel-pulse">📷</div>
              <p className="text-xs font-pixel-sans">No Image</p>
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="space-y-1">
          {/* Series */}
          {item.series && (
            <p className="text-xs text-retro-accent-light font-pixel-sans truncate">
              Series: {item.series}
            </p>
          )}

          {/* Condition */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-pixel-sans text-retro-accent-light">
              Condition:
            </span>
            <Badge
              variant="default"
              size="sm"
              className={getConditionColor(item.condition)}
            >
              {getConditionLabel(item.condition)}
            </Badge>
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

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="default"
                size="sm"
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="default" size="sm" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-retro-accent-light font-pixel-sans pt-1 border-t border-retro-accent border-opacity-30">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(item.createdAt)}
          </div>
          
          {item.additionalImages.length > 0 && (
            <div className="flex items-center gap-1">
              <span>{item.additionalImages.length + 1}</span>
              <span>📷</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};