import React, { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ItemCondition } from '../../types';

interface SearchFilters {
  condition?: ItemCondition;
  minValue?: number;
  maxValue?: number;
  tags: string[];
  series?: string;
  type?: string;
}

interface SortOption {
  field: 'name' | 'createdAt' | 'updatedAt' | 'estimatedValue' | 'condition';
  direction: 'asc' | 'desc';
}

interface ItemSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  availableTags: string[];
  availableSeries: string[];
  availableTypes: string[];
  className?: string;
}

export const ItemSearch: React.FC<ItemSearchProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortOption,
  onSortChange,
  availableTags,
  availableSeries,
  availableTypes,
  className = ''
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const conditions: ItemCondition[] = [
    'mint', 'near-mint', 'excellent', 'good', 'fair', 'poor', 'damaged'
  ];

  const sortOptions = [
    { field: 'name' as const, label: 'Name' },
    { field: 'createdAt' as const, label: 'Date Added' },
    { field: 'updatedAt' as const, label: 'Last Updated' },
    { field: 'estimatedValue' as const, label: 'Value' },
    { field: 'condition' as const, label: 'Condition' }
  ];

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const emptyFilters: SearchFilters = { tags: [] };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = () => {
    return localFilters.condition ||
           localFilters.minValue ||
           localFilters.maxValue ||
           localFilters.tags.length > 0 ||
           localFilters.series ||
           localFilters.type;
  };

  const addTag = (tag: string) => {
    if (!localFilters.tags.includes(tag)) {
      setLocalFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <div className={`space-y-pixel-2 ${className}`}>
      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search items by name, description, or tags..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={Search}
          fullWidth
          showCursor
        />
        
        <Button
          variant={showFilters ? 'accent' : 'ghost'}
          icon={Filter}
          onClick={() => setShowFilters(!showFilters)}
          className="flex-shrink-0"
        >
          Filters
          {hasActiveFilters() && (
            <Badge variant="warning" size="sm" className="ml-1">
              {Object.values(localFilters).filter(v => 
                Array.isArray(v) ? v.length > 0 : v !== undefined
              ).length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-pixel-sans text-retro-accent-light">
          Sort by:
        </span>
        
        <select
          value={sortOption.field}
          onChange={(e) => onSortChange({
            ...sortOption,
            field: e.target.value as SortOption['field']
          })}
          className="pixel-input text-sm"
        >
          {sortOptions.map(option => (
            <option key={option.field} value={option.field}>
              {option.label}
            </option>
          ))}
        </select>
        
        <Button
          variant="ghost"
          size="sm"
          icon={sortOption.direction === 'asc' ? SortAsc : SortDesc}
          onClick={() => onSortChange({
            ...sortOption,
            direction: sortOption.direction === 'asc' ? 'desc' : 'asc'
          })}
        />
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card variant="outlined" padding="md">
          <div className="space-y-pixel-2">
            <div className="flex items-center justify-between">
              <h3 className="font-pixel text-retro-accent">Advanced Filters</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters()}
                >
                  Clear All
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={applyFilters}
                >
                  Apply
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-pixel-2">
              {/* Condition Filter */}
              <div>
                <label className="block text-sm font-pixel text-retro-accent mb-1">
                  Condition
                </label>
                <select
                  value={localFilters.condition || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    condition: e.target.value as ItemCondition || undefined
                  }))}
                  className="pixel-input w-full text-sm"
                >
                  <option value="">Any Condition</option>
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>
                      {condition.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-pixel text-retro-accent mb-1">
                  Type
                </label>
                <select
                  value={localFilters.type || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    type: e.target.value || undefined
                  }))}
                  className="pixel-input w-full text-sm"
                >
                  <option value="">Any Type</option>
                  {availableTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Series Filter */}
              <div>
                <label className="block text-sm font-pixel text-retro-accent mb-1">
                  Series
                </label>
                <select
                  value={localFilters.series || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    series: e.target.value || undefined
                  }))}
                  className="pixel-input w-full text-sm"
                >
                  <option value="">Any Series</option>
                  {availableSeries.map(series => (
                    <option key={series} value={series}>
                      {series}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value Range */}
              <div>
                <label className="block text-sm font-pixel text-retro-accent mb-1">
                  Min Value
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={localFilters.minValue?.toString() || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    minValue: e.target.value ? Number(e.target.value) : undefined
                  }))}
                  placeholder="0.00"
                  fullWidth
                />
              </div>

              <div>
                <label className="block text-sm font-pixel text-retro-accent mb-1">
                  Max Value
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={localFilters.maxValue?.toString() || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    maxValue: e.target.value ? Number(e.target.value) : undefined
                  }))}
                  placeholder="0.00"
                  fullWidth
                />
              </div>
            </div>

            {/* Tags Filter */}
            <div>
              <label className="block text-sm font-pixel text-retro-accent mb-1">
                Tags
              </label>
              
              {/* Selected Tags */}
              {localFilters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {localFilters.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="default"
                      className="cursor-pointer hover:bg-retro-error transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Available Tags */}
              <div className="flex flex-wrap gap-1">
                {availableTags
                  .filter(tag => !localFilters.tags.includes(tag))
                  .slice(0, 10)
                  .map(tag => (
                    <Badge
                      key={tag}
                      variant="default"
                      className="cursor-pointer hover:bg-retro-accent-medium transition-colors opacity-60 hover:opacity-100"
                      onClick={() => addTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters() && !showFilters && (
        <div className="flex flex-wrap gap-1">
          <span className="text-sm font-pixel-sans text-retro-accent-light">
            Active filters:
          </span>
          
          {localFilters.condition && (
            <Badge variant="warning" size="sm">
              {localFilters.condition}
            </Badge>
          )}
          
          {localFilters.type && (
            <Badge variant="warning" size="sm">
              {localFilters.type}
            </Badge>
          )}
          
          {localFilters.series && (
            <Badge variant="warning" size="sm">
              {localFilters.series}
            </Badge>
          )}
          
          {(localFilters.minValue || localFilters.maxValue) && (
            <Badge variant="warning" size="sm">
              ${localFilters.minValue || 0} - ${localFilters.maxValue || '∞'}
            </Badge>
          )}
          
          {localFilters.tags.map(tag => (
            <Badge key={tag} variant="warning" size="sm">
              {tag}
            </Badge>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            icon={X}
            onClick={clearFilters}
            className="h-6"
          />
        </div>
      )}
    </div>
  );
};