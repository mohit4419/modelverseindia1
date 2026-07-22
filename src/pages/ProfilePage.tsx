/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useModels } from '../hooks/useModels';
import { useBookings } from '../hooks/useBookings';
import { useApp } from '../context/AppContext';
import { useBooking } from '../context/BookingContext';
import { dbService } from '../services/db';
import { Review } from '../types';

import ProfileView from '../components/profile/ProfileView';

export default function ProfilePage() {
  const { isAuthenticated, clientId, currentRole, currentUserName } = useAuth();
  const { models, favorites, handleFavoriteToggle } = useModels();
  const { handleOpenBookingWizard } = useBookings();
  const {
    focusedModelId,
    setFocusedModelId,
    unlockedProfiles,
    triggerToast,
    setCurrentTab,
    setChatModelUserId
  } = useApp();

  const { 
    setTargetModelForPremium, 
    setShowPremiumModal, 
    handleReviewSubmit 
  } = useBooking();

  const [localReviews, setLocalReviews] = useState<Review[]>([]);

  // Find the selected model
  const focusedModel = models.find((m) => m.id === focusedModelId);

  // Fetch reviews for this model from db
  useEffect(() => {
    if (focusedModel) {
      dbService.getReviews(focusedModel.id).then(setLocalReviews);
    }
  }, [focusedModel]);

  // If no model is focused, return null or redirect
  if (!focusedModel) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <h3 className="font-sans text-lg font-black text-neutral-800 dark:text-neutral-200">No Profile Selected</h3>
        <p className="text-xs text-neutral-500 mt-1">Please select a model from the directory to view details.</p>
        <button
          onClick={() => setCurrentTab('models')}
          className="mt-6 rounded-full bg-purple-600 text-white font-bold px-6 py-2.5 text-xs hover:bg-purple-700 transition cursor-pointer"
        >
          Browse Directory
        </button>
      </div>
    );
  }

  const handleReviewSubmitWithReload = async (review: Review) => {
    await handleReviewSubmit(review);
    const updated = await dbService.getReviews(focusedModel.id);
    setLocalReviews(updated);
  };

  return (
    <div className="animate-fadeIn">
      <ProfileView
        model={focusedModel}
        reviews={localReviews}
        isLocked={!isAuthenticated || !unlockedProfiles.includes(focusedModel.id)}
        isFavorited={favorites.includes(focusedModel.id)}
        onFavoriteToggle={handleFavoriteToggle}
        onBookNow={() => {
          handleOpenBookingWizard(focusedModel);
        }}
        onUnlockClick={() => {
          setTargetModelForPremium(focusedModel);
          setShowPremiumModal(true);
        }}
        onBack={() => setFocusedModelId(null)}
        onGoHome={() => {
          setFocusedModelId(null);
          setCurrentTab('home');
        }}
        onStartChat={(modelUserId) => {
          setChatModelUserId(modelUserId);
          setCurrentTab('chat');
        }}
        onReviewSubmit={handleReviewSubmitWithReload}
        isAuthenticated={isAuthenticated}
        currentRole={currentRole}
        currentUserId={clientId}
        currentUserName={currentUserName}
      />
    </div>
  );
}
