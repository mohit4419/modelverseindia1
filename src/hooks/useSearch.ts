import { useState, useEffect } from 'react';
import { Model } from '../types';
import { modelsApi } from '../api/models.api';

export function useSearch(initialModels?: Model[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [results, setResults] = useState<Model[]>(initialModels || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchResults() {
      setIsLoading(true);
      try {
        let fetched: Model[] = [];
        if (searchTerm.trim()) {
          fetched = await modelsApi.searchModels(searchTerm);
        } else {
          fetched = await modelsApi.getModels(true);
        }
        if (active) {
          setResults(fetched);
        }
      } catch (err) {
        console.error('Error during search:', err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchResults();
    return () => {
      active = false;
    };
  }, [searchTerm]);

  const filteredModels = results.filter((model) => {
    const matchesCity = selectedCity ? model.city === selectedCity : true;
    const matchesCategory = selectedCategory ? model.category === selectedCategory : true;
    return matchesCity && matchesCategory;
  });

  return {
    searchTerm,
    setSearchTerm,
    selectedCity,
    setSelectedCity,
    selectedCategory,
    setSelectedCategory,
    filteredModels,
    isLoading
  };
}
