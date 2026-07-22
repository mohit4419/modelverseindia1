import React from 'react';

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedCity: string;
  onCityChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  cities: string[];
  categories: string[];
}

export default function SearchFilters({
  searchTerm,
  onSearchChange,
  selectedCity,
  onCityChange,
  selectedCategory,
  onCategoryChange,
  cities,
  categories
}: SearchFiltersProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-left shadow-sm">
      <div className="flex flex-col space-y-1">
        <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Search Name/Skills</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Type model name, keyword, or skill..."
          className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-550"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Filter Location</label>
        <select
          value={selectedCity}
          onChange={(e) => onCityChange(e.target.value)}
          className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 focus:outline-none"
        >
          <option value="">All Indian Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Specialization</label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 focus:outline-none"
        >
          <option value="">All Specializations</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
