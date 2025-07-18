import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Grid, List, Trash2 } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { StorageService } from '../services/storage';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Card } from '../components/ui/Card';
import { ItemCard } from '../components/items/ItemCard';
import { ItemForm } from '../components/items/ItemForm';
import { ItemDetailModal } from '../components/items/ItemDetailModal';
import { ItemSearch } from '../components/items/ItemSearch';
import { ListView } from '../components/items/ListView';
import { CollectibleData, Folder } from '../types';

const storageService = StorageService.getInstance();

interface SearchFilters {
  condition?: string;
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

interface ItemsPageProps {
  folder: Folder;
  onBack: () => void;
}

export const ItemsPage: React.FC<ItemsPageProps> = ({ folder, onBack }) => {
  const {
    isLoading,
    setLoading,
    error,
    setError,
    setFolders
  } = useAppStore();
  
  const [items, setItems] = useState<CollectibleData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({ tags: [] });
  const [sortOption, setSortOption] = useState<SortOption>({ 
    field: 'createdAt', 
    direction: 'desc' 
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal states
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CollectibleData | null>(null);
  const [viewingItem, setViewingItem] = useState<CollectibleData | null>(null);
  const [deletingItem, setDeletingItem] = useState<CollectibleData | null>(null);

  useEffect(() => {
    loadItems();
  }, [folder.id]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const folderItems = await storageService.getItemsByFolder(folder.id);
      setItems(folderItems);
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh all folders after operations that change item counts
  const refreshAllFolders = async () => {
    try {
      const updatedFolders = await storageService.getFolders();
      console.log('Refreshing folders with updated data:', updatedFolders);
      setFolders(updatedFolders);
    } catch (error) {
      console.error('Error refreshing folders:', error);
    }
  };

  // Compute available filter options
  const filterOptions = useMemo(() => {
    const allTags = new Set<string>();
    const allSeries = new Set<string>();
    const allTypes = new Set<string>();

    items.forEach(item => {
      item.tags.forEach(tag => allTags.add(tag));
      if (item.series) allSeries.add(item.series);
      if (item.type) allTypes.add(item.type);
    });

    return {
      tags: Array.from(allTags).sort(),
      series: Array.from(allSeries).sort(),
      types: Array.from(allTypes).sort()
    };
  }, [items]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          item.name,
          item.description || '',
          item.notes || '',
          item.type || '',
          item.series || '',
          ...item.tags
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Condition filter
      if (filters.condition && item.condition !== filters.condition) {
        return false;
      }

      // Type filter
      if (filters.type && item.type !== filters.type) {
        return false;
      }

      // Series filter
      if (filters.series && item.series !== filters.series) {
        return false;
      }

      // Value range filter
      if (filters.minValue && (!item.estimatedValue || item.estimatedValue < filters.minValue)) {
        return false;
      }
      if (filters.maxValue && (!item.estimatedValue || item.estimatedValue > filters.maxValue)) {
        return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasAllTags = filters.tags.every(tag => item.tags.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortOption.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'estimatedValue':
          aValue = a.estimatedValue || 0;
          bValue = b.estimatedValue || 0;
          break;
        case 'condition':
          const conditionOrder = ['damaged', 'poor', 'fair', 'good', 'excellent', 'near-mint', 'mint'];
          aValue = conditionOrder.indexOf(a.condition);
          bValue = conditionOrder.indexOf(b.condition);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOption.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOption.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [items, searchQuery, filters, sortOption]);

  const handleSaveItem = async (itemData: Omit<CollectibleData, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingItem) {
        await storageService.updateItem(editingItem.id, itemData);
      } else {
        await storageService.createItem(itemData);
      }
      
      await loadItems();
      await refreshAllFolders(); // Refresh folders to update item counts
      setShowItemForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    }
  };

  const handleEditItem = (item: CollectibleData) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleDeleteItem = async (item: CollectibleData) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        setLoading(true);
        await storageService.deleteItem(item.id);
        await loadItems();
        await refreshAllFolders(); // Refresh folders to update item counts
      } catch (error) {
        console.error('Error deleting item:', error);
        setError('Failed to delete item. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewItem = (item: CollectibleData) => {
    // Update last viewed timestamp
    storageService.updateItem(item.id, { lastViewedAt: new Date() });
    setViewingItem(item);
  };

  // New function to handle duplicating items to another folder
  const handleDuplicateItems = async (itemIds: string[], targetFolderId: string) => {
    try {
      setLoading(true);
      
      // Get the items to duplicate
      const itemsToDuplicate = items.filter(item => itemIds.includes(item.id));
      
      // Create duplicates in the target folder
      for (const item of itemsToDuplicate) {
        const newItemData: Omit<CollectibleData, 'id' | 'createdAt' | 'updatedAt'> = {
          folderId: targetFolderId,
          userId: item.userId,
          name: `${item.name} (Copy)`,
          type: item.type,
          series: item.series,
          condition: item.condition,
          description: item.description,
          tags: [...item.tags],
          notes: item.notes,
          estimatedValue: item.estimatedValue,
          purchasePrice: item.purchasePrice,
          currency: item.currency,
          primaryImage: item.primaryImage,
          additionalImages: [...item.additionalImages],
          thumbnailImage: item.thumbnailImage,
          aiDetected: item.aiDetected,
          aiConfidence: item.aiConfidence,
          aiPromptUsed: item.aiPromptUsed,
          ocrText: item.ocrText,
          lastViewedAt: undefined,
          syncStatus: 'local-only',
          isArchived: false
        };
        
        await storageService.createItem(newItemData);
      }
      
      // Reload items if duplicating to the current folder
      if (targetFolderId === folder.id) {
        await loadItems();
      }
      
      // Refresh all folders to update item counts
      await refreshAllFolders();
      
      alert(`Successfully duplicated ${itemsToDuplicate.length} item(s) to the selected folder.`);
    } catch (error) {
      console.error('Error duplicating items:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // New function to handle moving items to another folder
  const handleMoveItems = async (itemIds: string[], targetFolderId: string) => {
    try {
      setLoading(true);
      
      // Get the items to move
      const itemsToMove = items.filter(item => itemIds.includes(item.id));
      
      // Move items to the target folder
      for (const item of itemsToMove) {
        await storageService.updateItem(item.id, {
          folderId: targetFolderId
        });
      }
      
      // Reload items to update the UI
      await loadItems();
      
      // Refresh all folders to update item counts
      await refreshAllFolders();
      
      alert(`Successfully moved ${itemsToMove.length} item(s) to the selected folder.`);
    } catch (error) {
      console.error('Error moving items:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-retro-bg-primary bg-pixel-grid flex items-center justify-center">
        <LoadingSpinner size="lg" variant="accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-bg-primary bg-pixel-grid p-pixel-2">
      <div className="max-w-7xl mx-auto space-y-pixel-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-pixel-2">
          <div className="flex items-center gap-pixel">
            <Button
              variant="ghost"
              icon={ArrowLeft}
              onClick={onBack}
            >
              Back
            </Button>
            
            <div>
              <h2 className="text-xl font-pixel text-retro-accent">
                {folder.name}
              </h2>
              <p className="text-retro-accent-light font-pixel-sans">
                {filteredAndSortedItems.length} of {items.length} items
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'accent' : 'ghost'}
              icon={Grid}
              size="sm"
              onClick={() => setViewMode('grid')}
            />
            <Button
              variant={viewMode === 'list' ? 'accent' : 'ghost'}
              icon={List}
              size="sm"
              onClick={() => setViewMode('list')}
            />
            
            <Button
              variant="accent"
              icon={Plus}
              onClick={() => {
                setEditingItem(null);
                setShowItemForm(true);
              }}
              glow
            >
              Add Item
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <ItemSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          sortOption={sortOption}
          onSortChange={setSortOption}
          availableTags={filterOptions.tags}
          availableSeries={filterOptions.series}
          availableTypes={filterOptions.types}
        />

        {/* Error State */}
        {error && (
          <Card variant="outlined" className="border-retro-error">
            <div className="text-center py-pixel-2">
              <p className="text-retro-error font-pixel-sans animate-pixel-pulse">{error}</p>
              <Button
                variant="ghost"
                onClick={loadItems}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Items Grid/List */}
        {filteredAndSortedItems.length === 0 ? (
          <Card className="text-center py-pixel-6" glow>
            <div className="space-y-pixel-2">
              <div className="text-6xl animate-pixel-float">📦</div>
              <div>
                <h3 className="text-lg font-pixel text-retro-accent mb-2">
                  {searchQuery || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v)
                    ? 'No items match your search'
                    : 'No items yet'
                  }
                </h3>
                <p className="text-retro-accent-light font-pixel-sans">
                  {searchQuery || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v)
                    ? 'Try adjusting your search or filters'
                    : 'Add your first item to start building your collection'
                  }
                </p>
              </div>
              
              {!searchQuery && !Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v) && (
                <Button
                  variant="accent"
                  icon={Plus}
                  glow
                  onClick={() => {
                    setEditingItem(null);
                    setShowItemForm(true);
                  }}
                >
                  Add Your First Item
                </Button>
              )}
            </div>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-pixel-2">
            {filteredAndSortedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onView={handleViewItem}
              />
            ))}
          </div>
        ) : (
          <ListView
            items={filteredAndSortedItems}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onView={handleViewItem}
            isLoading={isLoading}
            onDuplicateItems={handleDuplicateItems}
            onMoveItems={handleMoveItems}
            onBulkEditTags={async (itemIds, tags, action) => {
              try {
                setLoading(true);
                // For each item, update tags
                const itemsToUpdate = items.filter(item => itemIds.includes(item.id));
                for (const item of itemsToUpdate) {
                  let newTags: string[];
                  if (action === 'add') {
                    // Add tags, avoiding duplicates
                    newTags = Array.from(new Set([...item.tags, ...tags.map(t => t.trim()).filter(Boolean)]));
                  } else {
                    // Remove tags
                    newTags = item.tags.filter(tag => !tags.includes(tag));
                  }
                  await storageService.updateItem(item.id, { tags: newTags });
                }
                await loadItems();
                await refreshAllFolders();
                alert(`Successfully ${action === 'add' ? 'added' : 'removed'} tags for ${itemsToUpdate.length} item(s).`);
              } catch (error) {
                console.error('Error bulk editing tags:', error);
                setError('Failed to bulk edit tags. Please try again.');
                throw error;
              } finally {
                setLoading(false);
              }
            }}
          />
        )}

        {/* Modals */}
        <ItemForm
          item={editingItem}
          folderId={folder.id}
          folderType={folder.type}
          isOpen={showItemForm}
          onClose={() => {
            setShowItemForm(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
          isLoading={isLoading}
        />

        <ItemDetailModal
          item={viewingItem}
          isOpen={!!viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
        />
      </div>
    </div>
  );
};