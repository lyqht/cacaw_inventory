import React from 'react';
import { Camera, FolderOpen, Settings } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../ui/Button';
import { AnimatedLogo } from '../ui/AnimatedLogo';

export const Navigation: React.FC = () => {
  const { currentView, setCurrentView } = useAppStore();
  
  const navItems = [
    { id: 'capture' as const, label: 'Capture', icon: Camera },
    { id: 'folders' as const, label: 'Folders', icon: FolderOpen },
    { id: 'settings' as const, label: 'Settings', icon: Settings }
  ];
  
  return (
    <nav className="pixel-nav p-3 sm:p-pixel-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-pixel">
          {/* Logo */}
          <div className="flex items-center space-x-pixel">
            <AnimatedLogo size="md" />
            <div>
              <h1 className="text-lg sm:text-xl font-pixel text-retro-accent">
                CacawInventory
              </h1>
              <p className="text-xs text-retro-accent-light font-pixel-sans">
                Hoard it like a crow, store it like a pro!
              </p>
            </div>
          </div>
          
          {/* Navigation Items - Responsive Layout */}
          <div className="flex flex-wrap justify-center md:justify-end gap-2 mt-2 md:mt-0">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? 'accent' : 'ghost'}
                size="sm"
                icon={item.icon}
                onClick={() => setCurrentView(item.id)}
                glow={currentView === item.id}
                className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={item.label}
              >
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};