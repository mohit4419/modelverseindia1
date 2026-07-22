/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SlidersHorizontal, CheckCircle2, Star, Sparkles, Flame, DollarSign, Clock, ShieldAlert, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useModels } from '../hooks/useModels';
import { useBookings } from '../hooks/useBookings';
import { useApp } from '../context/AppContext';
import { useBooking } from '../context/BookingContext';

import Filters from '../components/booking/Filters';
import ModelCard from '../components/common/ModelCard';
import ModelCardSkeleton from '../components/common/ModelCardSkeleton';

const marketplaceGridVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const marketplaceItemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 14,
    },
  },
};

export default function BookingPage() {
  const { isAuthenticated, clientId, currentRole } = useAuth();
  const {
    models,
    isLoadingModels,
    favorites,
    handleFavoriteToggle,
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
    resetFilters,
    filteredModels,
    filterKey,
    isMobileFiltersOpen,
    setIsMobileFiltersOpen
  } = useModels();

  const { handleOpenBookingWizard } = useBookings();
  const { triggerToast, setFocusedModelId, unlockedProfiles, setCurrentTab } = useApp();
  const { setTargetModelForPremium, setShowPremiumModal } = useBooking();

  return (
    <div id="marketplace-page" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
      {/* If logged in as model and NOT yet registered, show the Apply as Model Form first on top of the center list! */}
      {isAuthenticated && currentRole === 'model' && !models.some(m => m.userId === clientId) && (
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-550/10 to-pink-550/10 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-500/25 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="text-sm font-black text-purple-750 dark:text-purple-300 font-sans">Complete Your Model Profile</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Submit your height, rates, and high-quality selfie verification to appear on the marketplace directory.</p>
          </div>
          <button
            onClick={() => setCurrentTab('become-model')}
            className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white px-5 py-2.5 text-xs font-bold shadow-md cursor-pointer whitespace-nowrap active:scale-95"
          >
            Apply Now
          </button>
        </div>
      )}

      {/* Main Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column desktop filters */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 rounded-2xl p-5 sticky top-24 shadow-xs">
            <h3 className="font-sans text-sm font-extrabold text-neutral-900 dark:text-white flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-white/5 uppercase tracking-wider font-mono">
              <span>Filter Registry</span>
              <span className="text-[10px] bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full font-mono">
                {filteredModels.length} listings
              </span>
            </h3>
            <Filters
              triggerToast={triggerToast}
              location={searchLocation}
              setLocation={setSearchLocation}
              category={searchCategory}
              setCategory={setSearchCategory}
              gender={searchGender}
              setGender={setSearchGender}
              ageRange={searchAgeRange}
              setAgeRange={setSearchAgeRange}
              heightClass={searchHeightClass}
              setHeightClass={setSearchHeightClass}
              experience={searchExperience}
              setExperience={setSearchExperience}
              budgetLimit={searchBudgetLimit}
              setBudgetLimit={setSearchBudgetLimit}
              onlyVerified={searchOnlyVerified}
              setOnlyVerified={setSearchOnlyVerified}
              availableOnly={searchAvailableOnly}
              setAvailableOnly={setSearchAvailableOnly}
              onReset={resetFilters}
              radius={searchRadius}
              setRadius={setSearchRadius}
              projectCoords={projectCoords}
              setProjectCoords={setProjectCoords}
              projectName={projectName}
              setProjectName={setProjectName}
            />
          </div>
        </div>

        {/* Right column listings and sort bars */}
        <div className="lg:col-span-3 space-y-6 text-left">
          <div className="bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h2 className="font-sans text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight">Cast Registry Directory</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Discover and hire premium vetted models, actors, and influencers across India.</p>
              </div>
            </div>

            {/* Quick Select Popular Preset Filters */}
            <div className="pt-3 border-t border-neutral-100 dark:border-white/5">
              <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-none select-none">
                <div className="shrink-0 flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-neutral-400 dark:text-neutral-500 font-mono pr-2.5 border-r border-neutral-200 dark:border-white/10 mr-1.5">
                  <SlidersHorizontal className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                  <span>Quick Presets:</span>
                </div>
                
                {/* Selfie Verified */}
                <button
                  type="button"
                  onClick={() => setSearchOnlyVerified(!searchOnlyVerified)}
                  className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition duration-200 cursor-pointer active:scale-95 select-none ${
                    searchOnlyVerified
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-emerald-600 border-neutral-200 dark:border-white/10 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Selfie Verified</span>
                </button>

                {/* Available Now */}
                <button
                  type="button"
                  onClick={() => setSearchAvailableOnly(!searchAvailableOnly)}
                  className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition duration-200 cursor-pointer active:scale-95 select-none ${
                    searchAvailableOnly
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-amber-600 border-neutral-200 dark:border-white/10 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Available Now</span>
                </button>

                {/* Most Expensive */}
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === 'price_desc') {
                      setSortBy('');
                    } else {
                      setSortBy('price_desc');
                      setSearchBudgetLimit(100000);
                    }
                  }}
                  className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition duration-200 cursor-pointer active:scale-95 select-none ${
                    sortBy === 'price_desc'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-purple-600 border-neutral-200 dark:border-white/10 hover:bg-purple-50/50 dark:hover:bg-purple-950/20'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Most Expensive</span>
                </button>

                {/* Top Rated */}
                <button
                  type="button"
                  onClick={() => setSortBy(sortBy === 'rating' ? '' : 'rating')}
                  className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition duration-200 cursor-pointer active:scale-95 select-none ${
                    sortBy === 'rating'
                      ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-sm font-black'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-amber-600 border-neutral-200 dark:border-white/10 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                  }`}
                >
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>Top Rated</span>
                </button>

                {/* Fashion Runway */}
                <button
                  type="button"
                  onClick={() => setSearchCategory(searchCategory === 'Fashion Models' ? '' : 'Fashion Models')}
                  className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition duration-200 cursor-pointer active:scale-95 select-none ${
                    searchCategory === 'Fashion Models'
                      ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-pink-600 border-neutral-200 dark:border-white/10 hover:bg-pink-50/50 dark:hover:bg-pink-950/20'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Fashion Runway</span>
                </button>

                {/* Fresh Faces */}
                <button
                  type="button"
                  onClick={() => setSearchExperience(searchExperience === 'Fresh Face' ? '' : 'Fresh Face')}
                  className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition duration-200 cursor-pointer active:scale-95 select-none ${
                    searchExperience === 'Fresh Face'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-orange-600 border-neutral-200 dark:border-white/10 hover:bg-orange-50/50 dark:hover:bg-orange-950/20'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span>Fresh Faces</span>
                </button>

                {/* Under 40K */}
                <button
                  type="button"
                  onClick={() => {
                    if (searchBudgetLimit === 40000 && sortBy === 'price_asc') {
                      setSearchBudgetLimit(100000);
                      setSortBy('');
                    } else {
                      setSearchBudgetLimit(40000);
                      setSortBy('price_asc');
                    }
                  }}
                  className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition duration-200 cursor-pointer active:scale-95 select-none ${
                    searchBudgetLimit === 40000 && sortBy === 'price_asc'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-blue-600 border-neutral-200 dark:border-white/10 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Under 40K</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-mono">
              Showing {filteredModels.length} Premium results found
            </span>
            
            {searchCategory && (
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40 px-3.5 py-1.5 rounded-full font-mono">
                Category: {searchCategory}
              </span>
            )}
          </div>

          {isLoadingModels ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ModelCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-neutral-200 dark:border-white/10 rounded-3xl bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 shadow-sm">
              <ShieldAlert className="h-10 w-10 text-neutral-400 dark:text-neutral-500 mx-auto" />
              <h4 className="text-sm font-black text-neutral-800 dark:text-neutral-200 mt-4 font-sans">No matching model profiles found</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Try resetting details layout or loosening budget rate metrics.</p>
              <button
                onClick={resetFilters}
                className="mt-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 px-6 text-xs font-black hover:brightness-110 shadow transition cursor-pointer"
              >
                Reset Casting Filters
              </button>
            </div>
          ) : (
            <motion.div
              key={filterKey}
              variants={marketplaceGridVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredModels.map((model) => (
                <motion.div key={model.id} variants={marketplaceItemVariants}>
                  <ModelCard
                    model={model}
                    isAuthenticated={isAuthenticated}
                    isLocked={!isAuthenticated || !unlockedProfiles.includes(model.id)}
                    onUnlockClick={(id, e) => {
                      e.stopPropagation();
                      setTargetModelForPremium(model);
                      setShowPremiumModal(true);
                    }}
                    isFavorited={favorites.includes(model.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onViewProfile={setFocusedModelId}
                    projectCoords={projectCoords}
                    currentRole={currentRole}
                    currentUserId={clientId}
                    onBookNow={(id, e) => {
                      e.stopPropagation();
                      if (currentRole === 'model') {
                        if (model.userId === clientId) {
                          setCurrentTab('become-model');
                        } else {
                          alert("You are registered as a Model. To book other models, please log in as a Client.");
                        }
                      } else {
                        handleOpenBookingWizard(model);
                      }
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Persistent mobile-optimized floating action trigger */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-45">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMobileFiltersOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white rounded-full px-5 py-3 shadow-xl border border-white/10 text-xs font-black uppercase tracking-widest cursor-pointer whitespace-nowrap"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {(() => {
            let count = 0;
            if (searchLocation) count++;
            if (searchCategory && searchCategory !== 'all') count++;
            if (searchGender && searchGender !== 'all') count++;
            if (searchHeightClass) count++;
            if (searchExperience) count++;
            if (searchBudgetLimit < 150000) count++;
            if (searchOnlyVerified) count++;
            if (searchAvailableOnly) count++;
            if (searchRadius && searchRadius !== Infinity) count++;
            return count > 0 ? (
              <span className="flex items-center justify-center bg-white text-purple-700 font-bold rounded-full w-4.5 h-4.5 text-[9px] scale-110 font-mono">
                {count}
              </span>
            ) : null;
          })()}
        </motion.button>
      </div>

      {/* Mobile Bottom Sheet Overlay & Drawer container */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white dark:bg-neutral-900 rounded-t-[32px] border-t border-neutral-200 dark:border-white/10 z-50 flex flex-col shadow-2xl lg:hidden overflow-hidden"
            >
              <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-750/80 rounded-full mx-auto mt-3.5 mb-1 cursor-grab" onClick={() => setIsMobileFiltersOpen(false)} />

              {/* Header */}
              <div className="px-6 py-3 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="text-left">
                  <h3 className="font-sans text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <span>Refine Cast</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 font-mono px-2 py-0.5 rounded-full font-black">
                      {filteredModels.length} active
                    </span>
                  </h3>
                  <p className="text-[9px] text-neutral-400">Apply location, budget, and category metrics.</p>
                </div>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1.5 bg-neutral-100 dark:bg-white/5 rounded-full text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Filters Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Mobile Sheet Quick Presets Section */}
                <div className="space-y-2 border-b border-neutral-200 dark:border-white/5 pb-4">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-400 dark:text-neutral-500 font-mono text-left">
                    ⚡ Quick Select Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSearchOnlyVerified(!searchOnlyVerified)}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-[11px] font-bold transition duration-155 cursor-pointer active:scale-95 select-none ${
                        searchOnlyVerified
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-emerald-600 border-neutral-200 dark:border-white/10 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="truncate">Selfie Verified</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSearchAvailableOnly(!searchAvailableOnly)}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-[11px] font-bold transition duration-155 cursor-pointer active:scale-95 select-none ${
                        searchAvailableOnly
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-amber-600 border-neutral-200 dark:border-white/10 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      <span className="truncate">Available Now</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (sortBy === 'price_desc') {
                          setSortBy('');
                        } else {
                          setSortBy('price_desc');
                          setSearchBudgetLimit(100000);
                        }
                      }}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-[11px] font-bold transition duration-155 cursor-pointer active:scale-95 select-none ${
                        sortBy === 'price_desc'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-purple-600 border-neutral-200 dark:border-white/10 hover:bg-purple-50/50 dark:hover:bg-purple-950/20'
                      }`}
                    >
                      <DollarSign className="h-4 w-4" />
                      <span className="truncate">Most Expensive</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSortBy(sortBy === 'rating' ? '' : 'rating')}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-[11px] font-bold transition duration-155 cursor-pointer active:scale-95 select-none ${
                        sortBy === 'rating'
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-sm font-black'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-amber-600 border-neutral-200 dark:border-white/10 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                      }`}
                    >
                      <Star className="h-4 w-4 fill-current" />
                      <span className="truncate">Top Rated</span>
                    </button>
                  </div>
                </div>

                <Filters
                  triggerToast={triggerToast}
                  location={searchLocation}
                  setLocation={setSearchLocation}
                  category={searchCategory}
                  setCategory={setSearchCategory}
                  gender={searchGender}
                  setGender={setSearchGender}
                  ageRange={searchAgeRange}
                  setAgeRange={setSearchAgeRange}
                  heightClass={searchHeightClass}
                  setHeightClass={setSearchHeightClass}
                  experience={searchExperience}
                  setExperience={setSearchExperience}
                  budgetLimit={searchBudgetLimit}
                  setBudgetLimit={setSearchBudgetLimit}
                  onlyVerified={searchOnlyVerified}
                  setOnlyVerified={setSearchOnlyVerified}
                  availableOnly={searchAvailableOnly}
                  setAvailableOnly={setSearchAvailableOnly}
                  onReset={resetFilters}
                  radius={searchRadius}
                  setRadius={setSearchRadius}
                  projectCoords={projectCoords}
                  setProjectCoords={setProjectCoords}
                  projectName={projectName}
                  setProjectName={setProjectName}
                />
              </div>

              {/* Sticky Footer */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-950/80 border-t border-neutral-200/50 dark:border-white/5 flex gap-3.5">
                <button
                  onClick={() => {
                    resetFilters();
                  }}
                  className="flex-1 rounded-2xl border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900/60 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 py-3 text-xs font-black uppercase tracking-wider cursor-pointer transition active:scale-98"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white py-3 text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-purple-500/20 transition active:scale-98"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
