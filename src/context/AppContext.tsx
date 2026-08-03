/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Model, UserRole } from '../types';
import { dbService } from '../services/db';
import { accessControlService } from '../services/accessControl.service';
import { Toast, ToastType } from '../components/common/ToastNotification';
import { getCityCoordinates, calculateHaversineDistance } from '../utils/location';
import { useAuth } from './AuthContext';

interface AppContextType {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  focusedModelId: string | null;
  setFocusedModelId: (id: string | null) => void;
  chatModelUserId: string | null;
  setChatModelUserId: (id: string | null) => void;
  models: Model[];
  setModels: React.Dispatch<React.SetStateAction<Model[]>>;
  isLoadingModels: boolean;
  favorites: string[];
  setFavorites: React.Dispatch<React.SetStateAction<string[]>>;
  handleFavoriteToggle: (modelId: string, e?: React.MouseEvent) => void;
  unlockedProfiles: string[];
  setUnlockedProfiles: React.Dispatch<React.SetStateAction<string[]>>;
  toasts: Toast[];
  triggerToast: (title: string, message: string, type?: ToastType) => void;
  handleDismissToast: (id: string) => void;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  activeHomeCategory: string;
  setActiveHomeCategory: (cat: string) => void;
  
  // Filters
  searchLocation: string;
  setSearchLocation: (val: string) => void;
  searchCategory: string;
  setSearchCategory: (val: string) => void;
  searchGender: string;
  setSearchGender: (val: string) => void;
  searchAgeRange: [number, number];
  setSearchAgeRange: (val: [number, number]) => void;
  searchHeightClass: string;
  setSearchHeightClass: (val: string) => void;
  searchExperience: string;
  setSearchExperience: (val: string) => void;
  searchBudgetLimit: number;
  setSearchBudgetLimit: (val: number) => void;
  searchOnlyVerified: boolean;
  setSearchOnlyVerified: (val: boolean) => void;
  searchAvailableOnly: boolean;
  setSearchAvailableOnly: (val: boolean) => void;
  searchRadius: number;
  setSearchRadius: (val: number) => void;
  projectCoords: { lat: number; lng: number } | null;
  setProjectCoords: (val: { lat: number; lng: number } | null) => void;
  projectName: string;
  setProjectName: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  resetFilters: () => void;
  filteredModels: Model[];
  filterKey: string;
  
  // Recent Searches
  recentSearches: string[];
  saveSearchQuery: (query: string) => void;
  deleteRecentSearch: (queryToDelete: string, e: React.MouseEvent) => void;
  isMobileFiltersOpen: boolean;
  setIsMobileFiltersOpen: (val: boolean) => void;
  
  // Elite Modal
  showEliteModal: boolean;
  setShowEliteModal: (val: boolean) => void;
  eliteModelForModal: Model | null;
  setEliteModelForModal: (val: Model | null) => void;
  handleOpenEliteModal: () => void;
  
  // Chat Timers
  selectedModelForChat: Model | null;
  setSelectedModelForChat: (model: Model | null) => void;
  activeChatEndTime: number | null;
  setActiveChatEndTime: (time: number | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, clientId, currentRole } = useAuth();
  
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [focusedModelId, setFocusedModelId] = useState<string | null>(null);
  const [chatModelUserId, setChatModelUserId] = useState<string | null>(null);
  
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [unlockedProfiles, setUnlockedProfiles] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mvi_dark_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [activeHomeCategory, setActiveHomeCategory] = useState<string>('all');
  
  // Search & Filter State
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchGender, setSearchGender] = useState('');
  const [searchAgeRange, setSearchAgeRange] = useState<[number, number]>([18, 40]);
  const [searchHeightClass, setSearchHeightClass] = useState('');
  const [searchExperience, setSearchExperience] = useState('');
  const [searchBudgetLimit, setSearchBudgetLimit] = useState(100000);
  const [searchOnlyVerified, setSearchOnlyVerified] = useState(false);
  const [searchAvailableOnly, setSearchAvailableOnly] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(Infinity);
  const [projectCoords, setProjectCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>(''); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);
  
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mvi_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Elite modal & chat
  const [showEliteModal, setShowEliteModal] = useState(false);
  const [eliteModelForModal, setEliteModelForModal] = useState<Model | null>(null);
  const [selectedModelForChat, setSelectedModelForChat] = useState<Model | null>(null);
  const [activeChatEndTime, setActiveChatEndTime] = useState<number | null>(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mvi_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mvi_dark_mode', 'false');
    }
  }, [darkMode]);

  // Subscribe to Models
  useEffect(() => {
    const unsubscribeModels = dbService.subscribeToModels((data) => {
      setModels(data);
      setIsLoadingModels(false);
      setSelectedModelForChat(prev => {
        if (prev) {
          const updatedPrev = data.find(m => m.id === prev.id);
          return updatedPrev || prev;
        }
        return (data && data.length > 0) ? (data.find(m => m.approved) || data[0]) : null;
      });
    });

    const updateUnlocked = () => {
      setUnlockedProfiles(accessControlService.getUnlockedModels(clientId));
    };

    updateUnlocked();
    window.addEventListener('storage', updateUnlocked);
    
    const storedFavs = localStorage.getItem('mvi_favs');
    if (storedFavs) {
      setFavorites(JSON.parse(storedFavs));
    }

    return () => {
      unsubscribeModels();
    };
  }, []);

  // Sync favorites from DB if logged in
  useEffect(() => {
    if (isAuthenticated && clientId && clientId !== 'c_test') {
      dbService.getUserFavorites(clientId).then((fetchedFavs) => {
        if (fetchedFavs) {
          setFavorites(fetchedFavs);
          localStorage.setItem('mvi_favs', JSON.stringify(fetchedFavs));
        }
      });
    } else {
      const storedFavs = localStorage.getItem('mvi_favs');
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs));
      } else {
        setFavorites([]);
      }
    }
  }, [isAuthenticated, clientId]);

  const triggerToast = (title: string, message: string, type: ToastType = 'success') => {
    const newToast: Toast = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      message,
      type
    };
    setToasts(prev => [...prev, newToast]);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleFavoriteToggle = (modelId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let newFavs = [...favorites];
    if (newFavs.includes(modelId)) {
      newFavs = newFavs.filter(id => id !== modelId);
    } else {
      newFavs.push(modelId);
    }
    setFavorites(newFavs);
    localStorage.setItem('mvi_favs', JSON.stringify(newFavs));

    if (isAuthenticated && clientId && clientId !== 'c_test') {
      dbService.saveUserFavorites(clientId, newFavs);
    }
  };

  const resetFilters = () => {
    setSearchLocation('');
    setSearchCategory('');
    setSearchGender('');
    setSearchAgeRange([18, 40]);
    setSearchHeightClass('');
    setSearchExperience('');
    setSearchBudgetLimit(100000);
    setSearchOnlyVerified(false);
    setSearchAvailableOnly(false);
    setSearchRadius(Infinity);
    setProjectCoords(null);
    setProjectName('');
    setSearchQuery('');
    setSortBy('');
  };

  const saveSearchQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const filtered = recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 3);
    setRecentSearches(updated);
    localStorage.setItem('mvi_recent_searches', JSON.stringify(updated));
  };

  const deleteRecentSearch = (queryToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== queryToDelete);
    setRecentSearches(updated);
    localStorage.setItem('mvi_recent_searches', JSON.stringify(updated));
  };

  const handleOpenEliteModal = () => {
    const elite = (models && models.length > 0) ? (models.find(m => m.approved && m.rating >= 4.8) || models.find(m => m.approved) || models[0]) : null;
    if (elite) {
      setEliteModelForModal(elite);
      setShowEliteModal(true);
    }
  };

  // Filtered Models Calculation
  const filteredModels = (() => {
    const filtered = models.filter((m) => {
      if (currentRole !== 'admin' && m.approved === false) return false;
      if (currentRole !== 'admin' && currentRole !== 'model' && m.archived) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = m.name?.toLowerCase().includes(q);
        const bioMatch = m.biography?.toLowerCase().includes(q);
        const cityMatch = m.city?.toLowerCase().includes(q);
        const stateMatch = m.state?.toLowerCase().includes(q);
        const categoryMatch = m.category?.toLowerCase().includes(q);
        
        if (!nameMatch && !bioMatch && !cityMatch && !stateMatch && !categoryMatch) {
          return false;
        }
      }

      if (projectCoords && searchRadius !== Infinity) {
        const modelCoords = getCityCoordinates(m.city);
        if (modelCoords) {
          const distance = calculateHaversineDistance(
            projectCoords.lat,
            projectCoords.lng,
            modelCoords.lat,
            modelCoords.lng
          );
          if (distance > searchRadius) return false;
        }
      } else {
        if (searchLocation && m.city?.toLowerCase() !== searchLocation.toLowerCase()) return false;
      }
      
      if (searchCategory && m.category?.toLowerCase() !== searchCategory.toLowerCase()) return false;
      if (searchGender && m.gender !== searchGender) return false;
      if (m.age && searchAgeRange && searchAgeRange.length >= 2 && (m.age < searchAgeRange[0] || m.age > searchAgeRange[1])) return false;
      
      if (searchHeightClass) {
        let heightCm = 170;
        if (typeof m.height === 'number') {
          heightCm = m.height;
        } else if (typeof m.height === 'string' && m.height) {
          if (m.height.includes('cm')) {
            heightCm = parseInt(m.height) || 170;
          } else {
            const parts = m.height.replace(/['"]/g, ' ').trim().split(/\s+/);
            const feet = (parts && parts[0]) ? (parseInt(parts[0]) || 5) : 5;
            const inches = (parts && parts[1]) ? (parseInt(parts[1]) || 0) : 0;
            heightCm = Math.round((feet * 12 + inches) * 2.54);
          }
        }
        if (searchHeightClass === 'petite' && heightCm >= 168) return false;
        if (searchHeightClass === 'medium' && (heightCm < 168 || heightCm > 175)) return false;
        if (searchHeightClass === 'tall' && heightCm <= 175) return false;
      }
      if (searchExperience && m.experience !== searchExperience) return false;
      if (m.startingPrice > searchBudgetLimit) return false;
      if (searchOnlyVerified && !m.selfieVerified) return false;
      if (searchAvailableOnly && !m.available) return false;

      return true;
    });

    if (sortBy === 'price_desc') {
      return [...filtered].sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortBy === 'price_asc') {
      return [...filtered].sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'rating') {
      return [...filtered].sort((a, b) => b.rating - a.rating);
    }
    return filtered;
  })();

  const filterKey = `${searchLocation}-${searchCategory}-${searchGender}-${searchAgeRange.join(',')}-${searchHeightClass}-${searchExperience}-${searchBudgetLimit}-${searchOnlyVerified}-${searchAvailableOnly}-${searchRadius}-${searchQuery}-${sortBy}`;

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        focusedModelId,
        setFocusedModelId,
        chatModelUserId,
        setChatModelUserId,
        models,
        setModels,
        isLoadingModels,
        favorites,
        setFavorites,
        handleFavoriteToggle,
        unlockedProfiles,
        setUnlockedProfiles,
        toasts,
        triggerToast,
        handleDismissToast,
        darkMode,
        setDarkMode,
        activeHomeCategory,
        setActiveHomeCategory,
        searchLocation,
        setSearchLocation,
        searchCategory,
        setSearchCategory,
        searchGender,
        setSearchGender,
        searchAgeRange,
        setSearchAgeRange,
        searchHeightClass,
        setSearchHeightClass,
        searchExperience,
        setSearchExperience,
        searchBudgetLimit,
        setSearchBudgetLimit,
        searchOnlyVerified,
        setSearchOnlyVerified,
        searchAvailableOnly,
        setSearchAvailableOnly,
        searchRadius,
        setSearchRadius,
        projectCoords,
        setProjectCoords,
        projectName,
        setProjectName,
        sortBy,
        setSortBy,
        searchQuery,
        setSearchQuery,
        resetFilters,
        filteredModels,
        filterKey,
        recentSearches,
        saveSearchQuery,
        deleteRecentSearch,
        isMobileFiltersOpen,
        setIsMobileFiltersOpen,
        showEliteModal,
        setShowEliteModal,
        eliteModelForModal,
        setEliteModelForModal,
        handleOpenEliteModal,
        selectedModelForChat,
        setSelectedModelForChat,
        activeChatEndTime,
        setActiveChatEndTime
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
