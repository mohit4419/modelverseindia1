import React from 'react';

interface PortfolioGalleryProps {
  urls: string[];
  name: string;
}

export default function PortfolioGallery({ urls, name }: PortfolioGalleryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {urls.map((url, idx) => (
        <div
          key={url + idx}
          className="aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 group relative"
        >
          <img
            src={url}
            alt={`${name} Portfolio item ${idx + 1}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
          />
        </div>
      ))}
    </div>
  );
}
