import React, { useState } from 'react';

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
    <div className={`w-full ${className}`}>
      <div className="flex border-b-2 border-retro-accent">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`
              flex items-center gap-2 px-4 py-3 min-h-[44px] min-w-[44px] font-pixel text-sm transition-all duration-200
              ${activeTab === tab.id 
                ? 'bg-retro-accent text-retro-bg-primary border-2 border-b-0 border-retro-accent relative top-[2px]' 
                : 'bg-retro-bg-tertiary text-retro-accent hover:bg-retro-accent hover:bg-opacity-20'}
            `}
            onClick={() => onTabChange(tab.id)}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};