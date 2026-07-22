import React from 'react';
import { useSearch } from '../../hooks/useSearch';
import SearchFilters from '../../components/filters/SearchFilters';
import ModelCard from '../../components/cards/ModelCard';
import { INDIAN_CITIES, MODEL_CATEGORIES } from '../../utils/constants';
import { Sparkles, Loader2, Search } from 'lucide-react';

export default function SearchModelsIndex() {
  const {
    searchTerm,
    setSearchTerm,
    selectedCity,
    setSelectedCity,
    selectedCategory,
    setSelectedCategory,
    filteredModels,
    isLoading
  } = useSearch();

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 animate-fadeIn">
      {/* Decorative Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 rounded-full">
          <Sparkles className="h-3.5 w-3.5 text-purple-650 dark:text-purple-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-750 dark:text-purple-300">
            India's Elite Castings
          </span>
        </div>
        <h1 className="text-3xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">
          Discover Professional Models
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed font-medium">
          Filter through curated list of verified talent across leading metropolitan centers.
        </p>
      </div>

      {/* Dynamic Search Filters (hitting modelsApi.searchModels internally) */}
      <div className="max-w-4xl mx-auto">
        <SearchFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          cities={INDIAN_CITIES}
          categories={MODEL_CATEGORIES}
        />
      </div>

      {/* Search Results Display */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">
            Marketplace Matches ({filteredModels.length})
          </h2>
          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-purple-650 font-bold uppercase tracking-wider">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Querying Database...</span>
            </div>
          )}
        </div>

        {filteredModels.length === 0 ? (
          <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-950/20 border border-neutral-150 dark:border-neutral-800 rounded-3xl max-w-xl mx-auto p-8 space-y-4">
            <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-full inline-flex text-neutral-400">
              <Search className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                No verified matches found
              </p>
              <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                We couldn't find any profiles matching your search parameters. Try clearing the filters or searching for keywords.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onClick={() => {
                  window.location.href = `/booking?modelId=${model.id}`;
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
