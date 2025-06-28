import React from 'react';
import { X, Edit, Trash2, Calendar, DollarSign, Tag, FileText, Zap } from 'lucide-react';
import { CollectibleData } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface ItemDetailModalProps {
  item: CollectibleData | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: CollectibleData) => void;
  onDelete: (item: CollectibleData) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!item) return null;

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showCloseButton={false}
    >
      <div className="space-y-pixel-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-pixel text-retro-accent mb-1">
              {item.name}
            </h1>
            {item.type && (
              <p className="text-retro-accent-light font-pixel-sans">
                {item.type}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="accent"
              size="sm"
              icon={Edit}
              onClick={() => {
                onEdit(item);
                onClose();
              }}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => {
                onDelete(item);
                onClose();
              }}
              className="hover:text-retro-error"
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={onClose}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-pixel-2">
          {/* Left Column - Image and Basic Info */}
          <div className="space-y-pixel-2">
            {/* Main Image */}
            <Card variant="outlined" padding="none">
              <div className="aspect-square bg-retro-bg-tertiary flex items-center justify-center">
                {item.primaryImage ? (
                  <img
                    src={item.primaryImage}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-retro-accent-light">
                    <div className="text-6xl mb-2">📷</div>
                    <p className="font-pixel-sans">No Image Available</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Additional Images */}
            {item.additionalImages.length > 0 && (
              <Card variant="outlined" padding="sm">
                <h3 className="font-pixel text-retro-accent text-sm mb-2">
                  Additional Images ({item.additionalImages.length})
                </h3>
                <div className="grid grid-cols-4 gap-1">
                  {item.additionalImages.slice(0, 8).map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square bg-retro-bg-tertiary border border-retro-accent rounded-pixel overflow-hidden"
                    >
                      <img
                        src={image}
                        alt={`${item.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Basic Information */}
            <Card variant="outlined" padding="md">
              <h3 className="font-pixel text-retro-accent mb-pixel flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Basic Information
              </h3>
              
              <div className="space-y-2">
                {item.series && (
                  <div className="flex justify-between">
                    <span className="text-retro-accent-light font-pixel-sans">Series:</span>
                    <span className="text-retro-accent font-pixel-sans">{item.series}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-retro-accent-light font-pixel-sans">Condition:</span>
                  <Badge
                    variant="default"
                    className={getConditionColor(item.condition)}
                  >
                    {getConditionLabel(item.condition)}
                  </Badge>
                </div>

                {item.aiDetected && (
                  <div className="flex justify-between items-center">
                    <span className="text-retro-accent-light font-pixel-sans flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      AI Detected:
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="success" size="sm">
                        Yes
                      </Badge>
                      {item.aiConfidence && (
                        <span className="text-xs text-retro-accent-light">
                          {Math.round(item.aiConfidence)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-pixel-2">
            {/* Valuation */}
            <Card variant="outlined" padding="md">
              <h3 className="font-pixel text-retro-accent mb-pixel flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valuation
              </h3>
              
              <div className="space-y-2">
                {item.estimatedValue && (
                  <div className="flex justify-between">
                    <span className="text-retro-accent-light font-pixel-sans">Estimated Value:</span>
                    <span className="text-retro-accent font-pixel">
                      {formatCurrency(item.estimatedValue, item.currency)}
                    </span>
                  </div>
                )}
                
                {item.purchasePrice && (
                  <div className="flex justify-between">
                    <span className="text-retro-accent-light font-pixel-sans">Purchase Price:</span>
                    <span className="text-retro-accent font-pixel-sans">
                      {formatCurrency(item.purchasePrice, item.currency)}
                    </span>
                  </div>
                )}

                {item.estimatedValue && item.purchasePrice && (
                  <div className="flex justify-between pt-2 border-t border-retro-accent border-opacity-30">
                    <span className="text-retro-accent-light font-pixel-sans">Gain/Loss:</span>
                    <span className={`font-pixel-sans ${
                      item.estimatedValue >= item.purchasePrice 
                        ? 'text-retro-success' 
                        : 'text-retro-error'
                    }`}>
                      {item.estimatedValue >= item.purchasePrice ? '+' : ''}
                      {formatCurrency(item.estimatedValue - item.purchasePrice, item.currency)}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Tags */}
            {item.tags.length > 0 && (
              <Card variant="outlined" padding="md">
                <h3 className="font-pixel text-retro-accent mb-pixel flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h3>
                
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="default">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Description */}
            {item.description && (
              <Card variant="outlined" padding="md">
                <h3 className="font-pixel text-retro-accent mb-pixel">
                  Description
                </h3>
                <p className="text-retro-accent-light font-pixel-sans text-sm leading-relaxed">
                  {item.description}
                </p>
              </Card>
            )}

            {/* Notes */}
            {item.notes && (
              <Card variant="outlined" padding="md">
                <h3 className="font-pixel text-retro-accent mb-pixel">
                  Notes
                </h3>
                <p className="text-retro-accent-light font-pixel-sans text-sm leading-relaxed">
                  {item.notes}
                </p>
              </Card>
            )}

            {/* OCR Text */}
            {item.ocrText && (
              <Card variant="outlined" padding="md">
                <h3 className="font-pixel text-retro-accent mb-pixel">
                  Extracted Text
                </h3>
                <p className="text-retro-accent-light font-pixel-sans text-xs leading-relaxed bg-retro-bg-tertiary p-2 rounded-pixel">
                  {item.ocrText}
                </p>
              </Card>
            )}

            {/* Timestamps */}
            <Card variant="outlined" padding="md">
              <h3 className="font-pixel text-retro-accent mb-pixel flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Timeline
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-retro-accent-light font-pixel-sans">Created:</span>
                  <span className="text-retro-accent-light font-pixel-sans">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-retro-accent-light font-pixel-sans">Updated:</span>
                  <span className="text-retro-accent-light font-pixel-sans">
                    {formatDate(item.updatedAt)}
                  </span>
                </div>

                {item.lastViewedAt && (
                  <div className="flex justify-between">
                    <span className="text-retro-accent-light font-pixel-sans">Last Viewed:</span>
                    <span className="text-retro-accent-light font-pixel-sans">
                      {formatDate(item.lastViewedAt)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Modal>
  );
};