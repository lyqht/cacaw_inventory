import React from 'react';

interface TabsProps {
  tabs: {
    id: string;
    label: string;
    icon?: React.ReactNode;
  }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`} role="tablist">
      <div className="flex border-b-2 border-retro-accent">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`
              flex items-center gap-2 px-4 py-3 min-h-[44px] min-w-[44px] font-pixel text-sm 
              transition-all duration-200 relative
              focus:outline-none focus-visible:ring-2 focus-visible:ring-retro-accent focus-visible:ring-offset-2
              ${activeTab === tab.id 
                ? 'bg-retro-accent text-retro-bg-primary border-2 border-b-0 border-retro-accent relative top-[2px]' 
                : 'bg-retro-bg-tertiary text-retro-accent hover:bg-retro-accent-medium hover:text-retro-bg-primary hover:border-t-2 hover:border-x-2 hover:border-retro-accent-light'}
              ${activeTab !== tab.id ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent hover:after:bg-retro-accent-light' : ''}
            `}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTabChange(tab.id);
              }
            }}
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            role="tab"
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {tab.icon && <span className="flex-shrink-0" aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};