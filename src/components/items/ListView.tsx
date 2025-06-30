import React, { useState, useEffect } from 'react';
import { Edit, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, X, Copy, FolderOpen } from 'lucide-react';
import { CollectibleData, ItemCondition } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { FolderSelector } from '../capture/FolderSelector';
import { useAppStore } from '../../stores/appStore';

interface ListViewProps {
  items: CollectibleData[];
  isLoading?: boolean;
  onEdit?: (item: CollectibleData) => void;
  onDelete?: (item: CollectibleData) => void;
  onView?: (item: CollectibleData) => void;
  onSelectionChange?: (selectedItems: string[]) => void;
  onDuplicateItems?: (itemIds: string[], targetFolderId: string) => Promise<void>;
  onMoveItems?: (itemIds: string[], targetFolderId: string) => Promise<void>;
  onBulkEditTags?: (itemIds: string[], tags: string[], action: 'add' | 'remove') => Promise<void>;
}

interface SortConfig {
  key: keyof CollectibleData | 'tags';
  direction: 'asc' | 'desc';
}

export const ListView: React.FC<ListViewProps> = ({
  items,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
  onSelectionChange,
  onDuplicateItems,
  onMoveItems,
  onBulkEditTags
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [actionType, setActionType] = useState<'duplicate' | 'move' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkEditTags, setShowBulkEditTags] = useState(false);
  const [bulkTagsInput, setBulkTagsInput] = useState('');
  const [bulkTagsAction, setBulkTagsAction] = useState<'add' | 'remove'>('add');
  
  const { folders } = useAppStore();
  
  // Pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, items.length);
  const currentItems = items.slice(startIndex, endIndex);
  
  // Sorting
  const sortedItems = React.useMemo(() => {
    const sortableItems = [...currentItems];
    
    sortableItems.sort((a, b) => {
      if (sortConfig.key === 'tags') {
        const tagsA = a.tags.join(', ').toLowerCase();
        const tagsB = b.tags.join(', ').toLowerCase();
        
        if (tagsA < tagsB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (tagsA > tagsB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
      
      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];
      
      if (valueA === undefined && valueB === undefined) return 0;
      if (valueA === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
      if (valueB === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
      
      if (valueA instanceof Date && valueB instanceof Date) {
        return sortConfig.direction === 'asc' 
          ? valueA.getTime() - valueB.getTime() 
          : valueB.getTime() - valueA.getTime();
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortConfig.direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortConfig.direction === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      return 0;
    });
    
    return sortableItems;
  }, [currentItems, sortConfig]);
  
  // Selection handling
  const handleSelectAll = () => {
    if (selectedItems.size === currentItems.length) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all
      const newSelected = new Set(currentItems.map(item => item.id));
      setSelectedItems(newSelected);
    }
    
    if (onSelectionChange) {
      onSelectionChange(
        selectedItems.size === currentItems.length
          ? []
          : currentItems.map(item => item.id)
      );
    }
  };
  
  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    
    setSelectedItems(newSelected);
    
    if (onSelectionChange) {
      onSelectionChange(Array.from(newSelected));
    }
  };
  
  // Sorting
  const handleSort = (key: keyof CollectibleData | 'tags') => {
    const direction = 
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };
  
  // Pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  // Condition formatting with enhanced contrast
  const getConditionColor = (condition: ItemCondition) => {
    switch (condition) {
      case 'mint': return 'text-green-700 dark:text-green-300 font-semibold';
      case 'near-mint': return 'text-green-600 dark:text-green-400 font-semibold';
      case 'excellent': return 'text-blue-700 dark:text-blue-300 font-semibold';
      case 'good': return 'text-yellow-700 dark:text-yellow-300 font-semibold';
      case 'fair': return 'text-orange-700 dark:text-orange-300 font-semibold';
      case 'poor': return 'text-red-700 dark:text-red-400 font-semibold';
      case 'damaged': return 'text-red-800 dark:text-red-300 font-semibold';
      default: return 'text-retro-accent font-semibold';
    }
  };
  
  const getConditionLabel = (condition: ItemCondition) => {
    return condition.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Format currency
  const formatCurrency = (amount?: number, currency: string = 'USD') => {
    if (amount === undefined) return '-';
    
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: '$',
      JPY: '¥'
    };
    
    return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
  };
  
  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle folder selection for move/duplicate
  const handleFolderSelected = async (folder: any) => {
    if (!actionType || selectedItems.size === 0) return;
    
    try {
      setIsProcessing(true);
      const selectedItemIds = Array.from(selectedItems);
      
      if (actionType === 'duplicate' && onDuplicateItems) {
        await onDuplicateItems(selectedItemIds, folder.id);
      } else if (actionType === 'move' && onMoveItems) {
        await onMoveItems(selectedItemIds, folder.id);
      }
      
      // Reset selection after successful operation
      setSelectedItems(new Set());
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    } catch (error) {
      console.error(`Error ${actionType === 'duplicate' ? 'duplicating' : 'moving'} items:`, error);
      alert(`Failed to ${actionType} items. Please try again.`);
    } finally {
      setIsProcessing(false);
      setShowFolderSelector(false);
      setActionType(null);
    }
  };
  
  // Bulk edit tags handler
  const handleBulkEditTags = async () => {
    if (!onBulkEditTags || selectedItems.size === 0) return;
    setIsProcessing(true);
    const tags = bulkTagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    try {
      await onBulkEditTags(Array.from(selectedItems), tags, bulkTagsAction);
      setShowBulkEditTags(false);
      setBulkTagsInput('');
      setBulkTagsAction('add');
      setSelectedItems(new Set());
      if (onSelectionChange) onSelectionChange([]);
    } catch (e) {
      alert('Failed to bulk edit tags.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card variant="outlined" padding="md">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" variant="accent" />
          <span className="ml-4 font-pixel-sans text-retro-accent">Loading items...</span>
        </div>
      </Card>
    );
  }
  
  if (items.length === 0) {
    return (
      <Card variant="outlined" padding="md">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="font-pixel text-retro-accent mb-2">No Items Found</h3>
          <p className="text-retro-accent-light font-pixel-sans">
            There are no items to display in this view.
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-pixel-2">
      {/* Selection Controls */}
      {selectedItems.size > 0 && (
        <div className="bg-retro-bg-tertiary border border-retro-accent rounded-pixel p-pixel-2 flex justify-between items-center">
          <div className="font-pixel-sans text-retro-accent">
            <span className="font-pixel text-sm">{selectedItems.size} items selected</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItems(new Set())}
            >
              Clear Selection
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Copy}
              onClick={() => {
                setActionType('duplicate');
                setShowFolderSelector(true);
              }}
              disabled={selectedItems.size === 0}
            >
              Duplicate
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={FolderOpen}
              onClick={() => {
                setActionType('move');
                setShowFolderSelector(true);
              }}
              disabled={selectedItems.size === 0}
            >
              Move To
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowBulkEditTags(true)}
              disabled={selectedItems.size === 0 || isProcessing}
            >
              Bulk Edit Tags
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={X}
              onClick={() => {
                if (onDelete && window.confirm(`Delete ${selectedItems.size} selected items?`)) {
                  // Find all selected items and delete them
                  items
                    .filter(item => selectedItems.has(item.id))
                    .forEach(item => onDelete(item));
                  // Clear selection
                  setSelectedItems(new Set());
                }
              }}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}
      
      {/* Folder Selector Modal */}
      {showFolderSelector && (
        <Card variant="outlined" padding="md">
          <div className="space-y-pixel-2">
            <h3 className="font-pixel text-retro-accent">
              {actionType === 'duplicate' ? 'Duplicate To Folder' : 'Move To Folder'}
            </h3>
            <p className="text-retro-accent-light font-pixel-sans text-sm">
              {actionType === 'duplicate' 
                ? `Select a destination folder to duplicate ${selectedItems.size} item(s)`
                : `Select a destination folder to move ${selectedItems.size} item(s)`
              }
            </p>
            
            <FolderSelector
              selectedFolder={null}
              folders={folders}
              onFolderSelect={handleFolderSelected}
              className="mt-pixel-2"
            />
            
            <div className="flex justify-end gap-2 mt-pixel-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowFolderSelector(false);
                  setActionType(null);
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
          
          {isProcessing && (
            <div className="absolute inset-0 bg-retro-bg-primary bg-opacity-70 flex items-center justify-center">
              <div className="text-center">
                <LoadingSpinner size="lg" variant="accent" className="mb-2" />
                <p className="font-pixel text-retro-accent">
                  {actionType === 'duplicate' ? 'Duplicating items...' : 'Moving items...'}
                </p>
              </div>
            </div>
          )}
        </Card>
      )}
      
      {/* Bulk Edit Tags Modal */}
      {showBulkEditTags && (
        <Card variant="outlined" padding="md">
          <div className="space-y-pixel-2">
            <h3 className="font-pixel text-retro-accent">Bulk Edit Tags</h3>
            <p className="text-retro-accent-light font-pixel-sans text-sm">
              Add or remove tags for {selectedItems.size} selected item(s). Separate tags with commas.
            </p>
            <div className="flex gap-2 items-center">
              <select
                value={bulkTagsAction}
                onChange={e => setBulkTagsAction(e.target.value as 'add' | 'remove')}
                className="pixel-input text-sm"
                disabled={isProcessing}
              >
                <option value="add">Add</option>
                <option value="remove">Remove</option>
              </select>
              <input
                type="text"
                value={bulkTagsInput}
                onChange={e => setBulkTagsInput(e.target.value)}
                placeholder="tag1, tag2, ..."
                className="pixel-input text-sm flex-1"
                disabled={isProcessing}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkEditTags}
                disabled={isProcessing || !bulkTagsInput.trim()}
              >
                Apply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBulkEditTags(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-2 mt-2">
                <LoadingSpinner size="sm" variant="accent" />
                <span className="font-pixel-sans text-retro-accent">Processing...</span>
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* List Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-retro-bg-tertiary sticky top-0 z-10">
            <tr className="border-b-2 border-retro-accent">
              <th className="p-2 w-12">
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === currentItems.length && currentItems.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-retro-accent bg-retro-bg-tertiary border-retro-accent rounded focus:ring-retro-accent"
                  />
                </div>
              </th>
              <th className="p-2 w-12"></th>
              <th 
                className="p-2 text-left font-pixel text-sm text-retro-accent cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Name
                  {sortConfig.key === 'name' && (
                    sortConfig.direction === 'asc' 
                      ? <ChevronUp className="w-4 h-4 ml-1" /> 
                      : <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="p-2 text-left font-pixel text-sm text-retro-accent cursor-pointer"
                onClick={() => handleSort('condition')}
              >
                <div className="flex items-center">
                  Condition
                  {sortConfig.key === 'condition' && (
                    sortConfig.direction === 'asc' 
                      ? <ChevronUp className="w-4 h-4 ml-1" /> 
                      : <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="p-2 text-left font-pixel text-sm text-retro-accent cursor-pointer"
                onClick={() => handleSort('tags')}
              >
                <div className="flex items-center">
                  Tags
                  {sortConfig.key === 'tags' && (
                    sortConfig.direction === 'asc' 
                      ? <ChevronUp className="w-4 h-4 ml-1" /> 
                      : <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="p-2 text-left font-pixel text-sm text-retro-accent cursor-pointer"
                onClick={() => handleSort('estimatedValue')}
              >
                <div className="flex items-center">
                  Value
                  {sortConfig.key === 'estimatedValue' && (
                    sortConfig.direction === 'asc' 
                      ? <ChevronUp className="w-4 h-4 ml-1" /> 
                      : <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="p-2 text-left font-pixel text-sm text-retro-accent cursor-pointer"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center">
                  Added
                  {sortConfig.key === 'createdAt' && (
                    sortConfig.direction === 'asc' 
                      ? <ChevronUp className="w-4 h-4 ml-1" /> 
                      : <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th className="p-2 w-24 text-center font-pixel text-sm text-retro-accent">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => (
              <tr 
                key={item.id} 
                className="table-row-hover border-b border-retro-accent border-opacity-30 h-12"
                onClick={() => onView && onView(item)}
              >
                <td className="p-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="w-4 h-4 text-retro-accent bg-retro-bg-tertiary border-retro-accent rounded focus:ring-retro-accent"
                    />
                  </div>
                </td>
                <td className="p-2">
                  <div className="w-8 h-8 rounded-pixel overflow-hidden bg-retro-bg-tertiary flex items-center justify-center">
                    {item.primaryImage ? (
                      <img 
                        src={item.primaryImage} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="%23ADD8E6"/><text x="50%" y="50%" font-family="Arial" font-size="12" fill="%23000080" text-anchor="middle" dominant-baseline="middle">${getInitials(item.name)}</text></svg>`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-retro-primary text-retro-accent font-pixel-sans text-sm">
                        {getInitials(item.name)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-2">
                  <div className="font-pixel-sans font-semibold text-retro-accent">
                    {item.name}
                  </div>
                  {item.type && (
                    <div className="text-xs text-retro-accent-light">
                      {item.type}
                    </div>
                  )}
                </td>
                <td className="p-2">
                  <span className={`font-pixel-sans text-sm ${getConditionColor(item.condition)}`}>
                    {getConditionLabel(item.condition)}
                  </span>
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="default"
                        size="sm"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="default" size="sm">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-2">
                  <span className="font-pixel-sans text-sm text-retro-accent">
                    {item.estimatedValue 
                      ? formatCurrency(item.estimatedValue, item.currency)
                      : '-'
                    }
                  </span>
                </td>
                <td className="p-2">
                  <span className="font-pixel-sans text-sm text-retro-accent-light">
                    {formatDate(item.createdAt)}
                  </span>
                </td>
                <td className="p-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center gap-3">
                    <button
                      className="text-retro-accent hover:text-retro-accent-light transition-colors"
                      onClick={() => onEdit && onEdit(item)}
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      className="text-retro-error hover:text-red-400 transition-colors"
                      onClick={() => onDelete && onDelete(item)}
                      title="Delete"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex justify-between items-center pt-pixel-2 border-t border-retro-accent border-opacity-30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-pixel-sans text-retro-accent-light">
            Items per page:
          </span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="pixel-input text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        
        <div className="text-sm font-pixel-sans text-retro-accent-light">
          Showing {startIndex + 1}-{endIndex} of {items.length} items
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={ChevronLeft}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'accent' : 'ghost'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="min-w-[32px] px-2"
                >
                  {pageNum}
                </Button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-retro-accent-light">...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  className="min-w-[32px] px-2"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            icon={ChevronRight}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
        </div>
      </div>
    </div>
  );
};