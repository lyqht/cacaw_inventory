import React from 'react';
import { Edit, Trash2, Eye, FolderOpen, Calendar, Tag, MoreVertical } from 'lucide-react';
import { Folder } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface FolderCardProps {
  folder: Folder;
  onEdit: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  onView: (folder: Folder) => void;
  className?: string;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onEdit,
  onDelete,
  onView,
  className = ''
}) => {
  const getFolderIcon = (type: string) => {
    switch (type) {
      case 'trading-cards':
        return '🃏';
      case 'action-figures':
        return '🤖';
      case 'plushies':
        return '🧸';
      case 'comics':
        return '📚';
      case 'games':
        return '🎮';
      default:
        return '📦';
    }
  };

  const getFolderTypeLabel = (type: string) => {
    switch (type) {
      case 'trading-cards':
        return 'Trading Cards';
      case 'action-figures':
        return 'Action Figures';
      case 'plushies':
        return 'Plushies';
      case 'comics':
        return 'Comics';
      case 'games':
        return 'Games';
      default:
        return 'Other';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <Card
      hoverable
      glow
      onClick={() => onView(folder)}
      className={`group transition-all duration-200 hover:scale-105 ${className}`}
    >
      <div className="space-y-pixel">
        {/* Folder Header with Action Buttons */}
        <div className="flex items-start justify-between">
          <div className="text-3xl animate-pixel-float">
            {getFolderIcon(folder.type)}
          </div>
          
          {/* Always Visible Action Buttons */}
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="accent"
              size="sm"
              icon={FolderOpen}
              onClick={(e) => {
                e.stopPropagation();
                onView(folder);
              }}
              className="min-w-[32px] min-h-[32px] p-1"
              title="Open Folder"
            />
            <Button
              variant="primary"
              size="sm"
              icon={Edit}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(folder);
              }}
              className="min-w-[32px] min-h-[32px] p-1"
              title="Edit Folder"
            />
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(folder);
              }}
              className="min-w-[32px] min-h-[32px] p-1"
              title="Delete Folder"
            />
          </div>
        </div>
        
        {/* Folder Info */}
        <div>
          <h3 className="font-pixel text-retro-accent text-lg mb-1">
            {folder.name}
          </h3>
          <Badge variant="default" size="sm">
            {getFolderTypeLabel(folder.type)}
          </Badge>
          {folder.description && (
            <p className="text-sm text-retro-accent-light font-pixel-sans mt-1 line-clamp-2">
              {folder.description}
            </p>
          )}
        </div>

        {/* Folder Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="default" glow>
              {folder.itemCount} items
            </Badge>
            {folder.totalValue && (
              <span className="text-sm font-pixel-sans text-retro-accent font-medium">
                {formatCurrency(folder.totalValue)}
              </span>
            )}
          </div>
        </div>
        
        {/* Folder Tags */}
        {folder.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {folder.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="default"
                size="sm"
              >
                {tag}
              </Badge>
            ))}
            {folder.tags.length > 3 && (
              <Badge variant="default" size="sm">
                +{folder.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-retro-accent-light font-pixel-sans pt-1 border-t border-retro-accent border-opacity-30">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(folder.createdAt)}
          </div>
          
          <div className="flex items-center gap-1">
            <span>{folder.source}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};