import React from 'react';

interface RouterProps {
  currentTab: string;
  renderPage: (tab: string) => React.ReactNode;
}

export default function Router({ currentTab, renderPage }: RouterProps) {
  return (
    <div className="w-full h-full animate-fadeIn">
      {renderPage(currentTab)}
    </div>
  );
}
