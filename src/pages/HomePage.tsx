/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useModels } from '../hooks/useModels';
import { useBookings } from '../hooks/useBookings';
import { useApp } from '../context/AppContext';
import { useBooking } from '../context/BookingContext';

import Hero from '../components/home/Hero';
import ClientCastingCallsSection from '../components/home/ClientCastingCallsSection';
import CategoryGrid from '../components/home/CategoryGrid';
import TestimonialSlider from '../components/home/TestimonialSlider';
import ModelCard from '../components/common/ModelCard';
import ModelCardSkeleton from '../components/common/ModelCardSkeleton';
import JobRequirementModal from '../components/common/JobRequirementModal';
import { HOME_CATEGORY_DESCRIPTIONS } from '../constants';
import { dbService } from '../services/db';
import { JobRequirement } from '../types';
import { Briefcase, Send, MapPin, Calendar, DollarSign, Building } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, clientId, currentRole, setAuthTabHint } = useAuth();
  const {
    models,
    isLoadingModels,
    favorites,
    handleFavoriteToggle,
    activeHomeCategory,
    setActiveHomeCategory,
    setSearchLocation,
    setSearchCategory,
    setSearchGender,
    setSearchBudgetLimit,
    projectCoords
  } = useModels();

  const { handleOpenBookingWizard } = useBookings();
  const { triggerToast, setFocusedModelId, unlockedProfiles, setCurrentTab } = useApp();
  const { setTargetModelForPremium, setShowPremiumModal } = useBooking();

  const [showJobModal, setShowJobModal] = React.useState(false);
  const [jobRequirements, setJobRequirements] = React.useState<JobRequirement[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = React.useState(true);

  const fetchJobRequirements = React.useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const jobs = await dbService.getJobRequirements();
      setJobRequirements(jobs);
    } catch (err) {
      console.warn('Failed to load job requirements:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  React.useEffect(() => {
    fetchJobRequirements();
  }, [fetchJobRequirements]);

  const handleApplyToJob = async (job: JobRequirement) => {
    if (!isAuthenticated) {
      setAuthTabHint('login');
      triggerToast('Login Required', 'Please log in to apply for client casting requirements.', 'info');
      return;
    }

    const currentModel = models.find(m => m.userId === clientId || m.id === clientId || m.email?.toLowerCase() === clientId?.toLowerCase());
    if (!currentModel) {
      triggerToast('Model Profile Required', 'Only registered models can apply for casting requirements. Please complete your model profile.', 'info');
      return;
    }

    try {
      await dbService.applyForJobRequirement(job, currentModel);
      triggerToast(
        'Application Sent!',
        `Your application & portfolio link have been sent directly to ${job.companyName}.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to apply:', err);
      triggerToast('Error', 'Failed to send application.', 'error');
    }
  };

  const handleOpenEliteModal = () => {
    const elite = (models && models.length > 0) ? (models.find(m => m.approved && m.rating >= 4.8) || models.find(m => m.approved) || models[0]) : null;
    if (elite) {
      setTargetModelForPremium(elite);
      setShowPremiumModal(true);
    }
  };

  return (
    <div 
      className="animate-fadeIn"
      onClickCapture={(e) => {
        if (!isAuthenticated) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <Hero
        onSearch={(filters) => {
          if (filters.location) setSearchLocation(filters.location);
          if (filters.category) setSearchCategory(filters.category);
          if (filters.gender) setSearchGender(filters.gender);
          setSearchBudgetLimit(filters.maxBudget);
          setCurrentTab('models');
        }}
        onBrowseClick={() => setShowJobModal(true)}
        onBecomeModelClick={() => setCurrentTab('become-model')}
        onHireClick={() => setShowJobModal(true)}
      />

      {/* Client Casting Calls & Job Requirements Section */}
      <ClientCastingCallsSection
        jobRequirements={jobRequirements}
        onApply={handleApplyToJob}
        onPostRequirementClick={() => setShowJobModal(true)}
        isLoading={isLoadingJobs}
      />
      
      <CategoryGrid
        onSelectCategory={(cat) => {
          setSearchCategory(cat);
          setCurrentTab('models');
        }}
      />

      {/* Curated Hot Picks Showcase Section */}
      <section id="homepage-trending" className="py-24 bg-[#FCFBF9] dark:bg-neutral-950 px-4 sm:px-6 lg:px-8 border-b border-black/5 dark:border-white/5">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4 text-left">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] font-mono">Top Rated Talent</span>
              <h3 className="font-sans text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2 mt-1">
                <Flame className="h-6 w-6 text-pink-600 fill-pink-500 animate-pulse" />
                <span>Trending Models in India</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 font-sans">Discover top-rated fashion profiles, UGC creators, and campaign models with verified portfolios.</p>
            </div>
            <button
              onClick={() => {
                if (activeHomeCategory !== 'all') {
                  setSearchCategory(activeHomeCategory);
                } else {
                  setSearchCategory('');
                }
                setCurrentTab('models');
              }}
              className="text-xs font-black text-purple-650 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline uppercase tracking-wider font-mono cursor-pointer self-start md:self-end"
            >
              {activeHomeCategory === 'all' ? 'View All Models' : `View All ${activeHomeCategory}`} &rarr;
            </button>
          </div>

          {/* Category Navigation Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin select-none">
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'Fashion Models', label: 'Fashion Models' },
              { id: 'Commercial Models', label: 'Commercial Models' },
              { id: 'Fitness Models', label: 'Fitness Models' },
              { id: 'Influencers', label: 'Influencers' },
              { id: 'UGC Creators', label: 'UGC Creators' },
              { id: 'Actors', label: 'Actors' },
              { id: 'Event Hosts', label: 'Event Hosts' },
              { id: 'Promotional Models', label: 'Promotional Models' },
              { id: 'Brand Ambassadors', label: 'Brand Ambassadors' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveHomeCategory(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeHomeCategory === tab.id
                    ? 'bg-[#EA3838] text-white shadow-md shadow-[#EA3838]/20'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Description Banner */}
          <div className="mb-10 bg-neutral-100/60 dark:bg-zinc-900/40 rounded-xl p-4 border border-black/5 dark:border-white/10 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono">
                Category Context: {activeHomeCategory === 'all' ? 'Universal Registry' : activeHomeCategory}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                {HOME_CATEGORY_DESCRIPTIONS[activeHomeCategory]}
              </p>
            </div>
          </div>

          {/* Grid of filtered models */}
          {(() => {
            const filteredHomeModels = models.filter((m) => {
              if (m.approved === false || m.rejected === true || (m as any).status === 'suspended' || (m as any).status === 'rejected' || m.archived) return false;
              if (activeHomeCategory !== 'all' && m.category?.toLowerCase() !== activeHomeCategory.toLowerCase()) return false;
              return true;
            });

            if (isLoadingModels) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <ModelCardSkeleton key={i} />
                  ))}
                </div>
              );
            }

            if (filteredHomeModels.length > 0) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredHomeModels.slice(0, 4).map((model) => (
                    <ModelCard
                      key={model.id}
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
                      projectCoords={projectCoords}
                      currentRole={currentRole}
                      currentUserId={clientId}
                      onViewProfile={(id) => {
                        setFocusedModelId(id);
                        setCurrentTab('models');
                      }}
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
                  ))}
                </div>
              );
            }

            return (
              <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm max-w-md mx-auto">
                <Sparkles className="h-10 w-10 text-neutral-300 mx-auto mb-3 animate-pulse" />
                <h4 className="font-sans font-black text-sm text-neutral-800 dark:text-neutral-200">
                  No {activeHomeCategory} Listed Yet
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                  Be the first premium modeling talent to list under this category in India! Gain direct casting exposure.
                </p>
                {(!isAuthenticated || currentRole !== 'client') && (
                  <button
                    onClick={() => setCurrentTab('become-model')}
                    className="mt-5 rounded-full bg-[#EA3838] text-white px-6 py-2 text-xs font-bold transition hover:bg-[#c02424] shadow-md shadow-[#EA3838]/10 cursor-pointer"
                  >
                    Become a Model
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </section>

      {/* Verified Agency Testimonial Slider */}
      <TestimonialSlider />

      {/* Job Requirement Modal Form */}
      <JobRequirementModal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        triggerToast={triggerToast}
        onSuccess={() => fetchJobRequirements()}
      />
    </div>
  );
}
