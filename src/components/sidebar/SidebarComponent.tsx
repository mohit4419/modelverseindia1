import React from 'react';

interface SidebarComponentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  items: Array<{ id: string; label: string; icon?: React.ReactNode }>;
}

export default function SidebarComponent({ activeTab, onTabChange, items }: SidebarComponentProps) {
  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 p-4 shrink-0 flex flex-col hidden md:flex">
      <div className="space-y-1.5 flex-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition duration-150 cursor-pointer ${
              activeTab === item.id
                ? 'bg-purple-650 text-white'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
