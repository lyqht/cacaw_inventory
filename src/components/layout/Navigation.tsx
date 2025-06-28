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
    <nav className="pixel-nav p-pixel-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-pixel">
          {/* Logo */}
          <div className="flex items-center space-x-pixel">
            <AnimatedLogo size="md" />
            <div>
              <h1 className="text-retro-accent [data-theme='light']_&:text-retro-light-text font-pixel text-lg font-medium">
                CacawInventory
              </h1>
              <p className="text-retro-accent-light [data-theme='light']_&:text-retro-light-text-muted font-pixel-sans text-xs">
                Hoard it like a crow, store it like a pro!
              </p>
            </div>
          </div>
          
          {/* Navigation Items - Responsive Layout */}
          <div className="flex flex-wrap justify-center md:justify-end gap-2 mt-pixel md:mt-0">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? 'accent' : 'ghost'}
                size="sm"
                icon={item.icon}
                onClick={() => setCurrentView(item.id)}
                glow={currentView === item.id}
                className="flex-shrink-0 min-w-[44px] min-h-[44px]"
                aria-current={currentView === item.id ? 'page' : undefined}
              >
                <span className="hidden sm:inline font-medium">{item.label}</span>
                <span className="sr-only sm:hidden">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};