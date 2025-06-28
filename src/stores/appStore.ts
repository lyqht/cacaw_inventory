import { create } from 'zustand';
import { CollectibleData, Folder, UserPreferences } from '../types';

interface AppState {
  // UI State
  currentView: 'capture' | 'folders' | 'items' | 'settings';
  selectedFolder: Folder | null;
  selectedItem: CollectibleData | null;
  isLoading: boolean;
  error: string | null;
  
  // Data State
  folders: Folder[];
  items: CollectibleData[];
  searchQuery: string;
  
  // User Preferences
  preferences: UserPreferences;
  
  // Actions
  setCurrentView: (view: AppState['currentView']) => void;
  setSelectedFolder: (folder: Folder | null) => void;
  setSelectedItem: (item: CollectibleData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFolders: (folders: Folder[]) => void;
  setItems: (items: CollectibleData[]) => void;
  setSearchQuery: (query: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  
  // Computed
  filteredItems: () => CollectibleData[];
}

const defaultPreferences: UserPreferences = {
  theme: 'auto',
  pixelAnimations: true,
  autoDetection: true,
  compressionLevel: 'medium',
  defaultFolderType: 'trading-cards',
  aiPromptTemplate: 'Identify this collectible item, including its name, series, condition, and estimated value.'
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  currentView: 'folders',
  selectedFolder: null,
  selectedItem: null,
  isLoading: false,
  error: null,
  folders: [],
  items: [],
  searchQuery: '',
  preferences: defaultPreferences,
  
  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  setSelectedItem: (item) => set({ selectedItem: item }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setFolders: (folders) => set({ folders }),
  setItems: (items) => set({ items }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  updatePreferences: (newPreferences) => 
    set((state) => ({ 
      preferences: { ...state.preferences, ...newPreferences } 
    })),
  
  // Computed
  filteredItems: () => {
    const { items, searchQuery, selectedFolder } = get();
    let filtered = items;
    
    // Filter by folder if selected
    if (selectedFolder) {
      filtered = filtered.filter(item => item.folderId === selectedFolder.id);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }
}));