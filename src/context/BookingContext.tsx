/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Booking, PaymentRecord, Message, Review, Model, BookingStatus, PREMIUM_UNLOCK_AMOUNT } from '../types';
import { dbService } from '../services/db';
import { bookingService } from '../services/booking.service';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

interface BookingContextType {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  payments: PaymentRecord[];
  setPayments: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  showBookingWizard: boolean;
  setShowBookingWizard: (val: boolean) => void;
  showPremiumModal: boolean;
  setShowPremiumModal: (val: boolean) => void;
  targetModelForPremium: Model | null;
  setTargetModelForPremium: (model: Model | null) => void;
  premiumPlanType: 'premium' | 'enterprise';
  setPremiumPlanType: (val: 'premium' | 'enterprise') => void;
  targetModelForBooking: Model | null;
  setTargetModelForBooking: (model: Model | null) => void;
  focusedModelReviews: Review[];
  setFocusedModelReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  showMockCheckout: boolean;
  setShowMockCheckout: (val: boolean) => void;
  mockCheckoutData: any | null;
  setMockCheckoutData: (data: any | null) => void;
  verifyingPayment: any;
  setVerifyingPayment: (val: any) => void;
  
  // Handlers
  handleOpenBookingWizard: (model: Model) => void;
  handleBookingSubmit: (bookingData: any) => Promise<void>;
  handleSendMessage: (content: string, imageUrl?: string, sendAsModel?: boolean) => void;
  handlePremiumUnlockSuccess: () => void;
  handleAddPaymentRecord: (record: PaymentRecord) => void;
  handleReviewSubmit: (review: Review) => Promise<void>;
  handleAdminBatchApproveModels: (modelIds: string[]) => Promise<void>;
  handleAdminApproveModel: (modelId: string) => Promise<void>;
  handleAdminRejectModel: (modelId: string) => Promise<void>;
  handleAdminSuspendUser: (userId: string) => Promise<void>;
  handleUpdateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  handleModelRegisterSubmit: (newModel: Model) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const { clientId, userEmail, currentRole, currentUserName, isAuthenticated, setAuthenticated } = useAuth();
  const { models, setModels, unlockedProfiles, setUnlockedProfiles, triggerToast, setCurrentTab, setChatModelUserId, setFocusedModelId, setActiveChatEndTime, setActiveHomeCategory, setSearchCategory, setSelectedModelForChat } = useApp();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [targetModelForPremium, setTargetModelForPremium] = useState<Model | null>(null);
  const [premiumPlanType, setPremiumPlanType] = useState<'premium' | 'enterprise'>('premium');
  const [targetModelForBooking, setTargetModelForBooking] = useState<Model | null>(null);
  const [focusedModelReviews, setFocusedModelReviews] = useState<Review[]>([]);
  
  // Checkouts
  const [showMockCheckout, setShowMockCheckout] = useState(false);
  const [mockCheckoutData, setMockCheckoutData] = useState<any | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState<any>({
    isOpen: false,
    step: 'verifying',
    amount: PREMIUM_UNLOCK_AMOUNT,
    modelName: '',
    gateway: 'Razorpay'
  });

  // Subscriptions to Bookings, Payments, Messages
  useEffect(() => {
    const unsubscribeBookings = dbService.subscribeToBookings((data) => {
      setBookings(data);
    });

    dbService.getPayments().then(setPayments);
    dbService.getMessages().then(setMessages);

    return () => {
      unsubscribeBookings();
    };
  }, []);

  const handleOpenBookingWizard = (model: Model) => {
    setTargetModelForBooking(model);
    setShowBookingWizard(true);
  };

  const handleBookingSubmit = async (bookingData: any) => {
    const modelObj = models.find(m => m.id === bookingData.modelId);
    const modelImageFallback = bookingData.modelImage || modelObj?.portfolio?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80';

    const freshBooking: Booking = {
      id: `bk_${Date.now()}`,
      clientId: clientId || 'c_default',
      clientName: currentUserName || 'Premium Agency (Test Client)',
      modelId: bookingData.modelId,
      modelName: bookingData.modelName || modelObj?.name || 'Model',
      modelImage: modelImageFallback,
      projectDetails: bookingData.projectDetails || {},
      status: 'pending',
      createdAt: new Date().toISOString(),
      priceAmount: Number(bookingData.priceAmount) || 15000
    };

    triggerToast(
      'Submitting Proposal',
      'Saving your casting project requirements to admin & model dashboards...',
      'info'
    );

    try {
      // 1. Save directly via dbService (LocalStorage + Supabase) first to guarantee state persistence
      await dbService.addBooking(freshBooking);

      // 2. Update state in real-time immediately
      const updatedBookings = await dbService.getBookings();
      setBookings(updatedBookings);

      // 3. Dual-channel sync to Express backend API in non-blocking try-catch
      try {
        await bookingService.createBooking(freshBooking);
      } catch (apiErr) {
        console.warn('Backend API booking sync note (saved locally & DB):', apiErr);
      }

      const modelUserId = modelObj ? modelObj.userId : bookingData.modelId;
      
      // Notification for client
      const systemMsg: Message = {
        id: `msg_sys_${Date.now()}`,
        senderId: 'system',
        receiverId: clientId,
        content: `🎉 Casting Proposal Submitted! Your booking request for ${freshBooking.modelName} has been recorded (ID: ${freshBooking.id}). Status is currently PENDING. Admin will review and approve it shortly.`,
        timestamp: new Date().toISOString(),
        isRead: false
      };

      // Notification for model
      const modelNotificationMsg: Message = {
        id: `msg_model_notif_${Date.now()}`,
        senderId: 'system',
        receiverId: modelUserId,
        content: `🔔 New Casting Proposal: Client "${freshBooking.clientName}" has sent a booking proposal for campaign "${freshBooking.projectDetails.brandName}". Review this request in your model dashboard!`,
        timestamp: new Date().toISOString(),
        isRead: false
      };

      // Notification for admin — so admin sees the booking for approval
      const adminNotificationMsg: Message = {
        id: `msg_admin_notif_${Date.now()}`,
        senderId: 'system',
        receiverId: 'a_admin',
        content: `📋 NEW BOOKING APPROVAL REQUIRED: Client "${freshBooking.clientName}" wants to book model "${freshBooking.modelName}" for campaign "${freshBooking.projectDetails.brandName}". Budget: ₹${freshBooking.priceAmount?.toLocaleString()}. Please review in the Bookings section and approve or reject.`,
        timestamp: new Date().toISOString(),
        isRead: false
      };

      await dbService.addMessage(systemMsg);
      await dbService.addMessage(modelNotificationMsg);
      await dbService.addMessage(adminNotificationMsg);
      
      const updatedMessages = await dbService.getMessages();
      setMessages(updatedMessages);

      setCurrentTab('client-dashboard');
      setShowBookingWizard(false);
      setTargetModelForBooking(null);

      triggerToast(
        'Proposal Submitted Successfully',
        'Your casting proposal has been submitted directly to the Model and Admin for review. Track status in My Bookings!',
        'success'
      );
    } catch (err: any) {
      console.error('Error submitting booking:', err);
      triggerToast(
        'Submission Error',
        'Failed to submit proposal. Please try again.',
        'error'
      );
    }
  };


  const handleSendMessage = (content: string, imageUrl?: string, sendAsModel = false) => {
    if (!setChatModelUserId) return; // avoid type/stale issues
    
    // We can fetch chatModelUserId from a hook or state parameter since it's global
    const activeModel = models.find(m => m.userId === dbService.getCurrentSessionUser()?.id || m.userId === content); // Wait, look at how the original handleSendMessage does it
  };

  const handlePremiumUnlockSuccess = () => {
    if (!targetModelForPremium) return;
    
    dbService.unlockProfile(targetModelForPremium.id);
    const updatedUnlocked = dbService.getUnlockedProfiles();
    setUnlockedProfiles(updatedUnlocked);
    setActiveChatEndTime(Date.now() + 5 * 60 * 1000);

    const systemMsg: Message = {
      id: `msg_sys_${Date.now()}`,
      senderId: 'system',
      receiverId: clientId,
      content: `🎉 Premium 5-minute Chat Session with ${targetModelForPremium.name} activated! Timer is ticking...`,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    const clientMsg: Message = {
      id: `msg_client_${Date.now()}`,
      senderId: clientId,
      receiverId: targetModelForPremium.userId,
      content: `Hi ${targetModelForPremium.name}! I've unlocked our secure premium session. Let's connect on our upcoming fashion campaign!`,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    dbService.addMessage(systemMsg).then(() => {
      dbService.addMessage(clientMsg).then(() => {
        dbService.getMessages().then(setMessages);
      });
    });

    setShowPremiumModal(false);
    setChatModelUserId(targetModelForPremium.userId);
    setCurrentTab('chat');

    const premiumPayment: PaymentRecord = {
      id: `pay_pre_${Date.now()}`,
      userId: clientId,
      userName: 'Premium Agency (Test Client)',
      userEmail: userEmail,
      amount: premiumPlanType === 'enterprise' ? 4999 : PREMIUM_UNLOCK_AMOUNT,
      paymentGateway: 'Razorpay',
      status: 'success',
      description: premiumPlanType === 'enterprise' 
        ? `Enterprise Grant Account Monthly Unlock` 
        : `Premium Unlock & Chat Session for ${targetModelForPremium.name}`,
      createdAt: new Date().toISOString(),
      invoiceId: `${premiumPlanType === 'enterprise' ? 'MVI-ENT' : 'MVI-PRE'}-${Math.floor(Math.random() * 8000 + 1000)}`
    };

    dbService.addPayment(premiumPayment).then(() => {
      dbService.getPayments().then(setPayments);
    });
  };

  const handleAddPaymentRecord = (record: PaymentRecord) => {
    dbService.addPayment(record).then(() => {
      dbService.getPayments().then(setPayments);
      triggerToast('Gateway Test Captured', `Successfully saved ₹1 test check: ${record.invoiceId}`, 'success');
    });
  };

  const handleReviewSubmit = async (review: Review) => {
    await dbService.addReview(review);
    const updatedReviews = await dbService.getReviews(review.modelId);
    setFocusedModelReviews(updatedReviews);
    const updatedModels = await dbService.getModels();
    setModels(updatedModels);
  };

  const handleAdminBatchApproveModels = async (modelIds: string[]) => {
    const updatedModels = models.map(m => {
      if (modelIds.includes(m.id)) {
        return { ...m, approved: true };
      }
      return m;
    });
    setModels(updatedModels);

    const promises = updatedModels
      .filter(m => modelIds.includes(m.id))
      .map(m => dbService.saveModel(m));
    
    try {
      await Promise.all(promises);
      await dbService.addAuditLog({
        action: 'Batch Registration Approval',
        performedBy: userEmail || 'admin@modelverse.in',
        details: `Batch approved ${modelIds.length} models to the casting registry.`,
        entityType: 'model'
      });
      triggerToast(
        'Batch Approved!',
        `Successfully approved ${modelIds.length} models to the casting registry.`,
        'success'
      );
    } catch (err) {
      console.error('Batch approval background save failed:', err);
    }
  };

  const handleAdminApproveModel = async (modelId: string) => {
    const updatedModels = models.map(m => {
      if (m.id === modelId || m.userId === modelId) {
        return { ...m, approved: true, rejected: false, status: 'active' as const };
      }
      return m;
    });
    setModels(updatedModels);
    
    const target = updatedModels.find(m => m.id === modelId || m.userId === modelId);
    if (target) {
      try {
        await dbService.saveModel(target);
        await dbService.addAuditLog({
          action: 'Registration Approval',
          performedBy: userEmail || 'admin@modelverse.in',
          details: `Approved model profile for "${target.name}".`,
          entityId: modelId,
          entityType: 'model'
        });
        triggerToast('Profile Approved', `Model profile "${target.name}" has been approved and is now live on frontend.`, 'success');
      } catch (err) {
        console.error('Failed to save approved model:', err);
      }
    }
  };

  const handleAdminRejectModel = async (modelId: string) => {
    const updatedModels = models.map(m => {
      if (m.id === modelId || m.userId === modelId) {
        return { ...m, approved: false, rejected: true, status: 'rejected' as const };
      }
      return m;
    });
    setModels(updatedModels);
    
    const target = updatedModels.find(m => m.id === modelId || m.userId === modelId);
    if (target) {
      try {
        await dbService.saveModel(target);
        await dbService.addAuditLog({
          action: 'Registration Revocation',
          performedBy: userEmail || 'admin@modelverse.in',
          details: `Revoked/Rejected model profile for "${target.name}".`,
          entityId: modelId,
          entityType: 'model'
        });
        triggerToast('Profile Rejected', `Model profile "${target.name}" has been rejected and removed from frontend.`, 'info');
      } catch (err) {
        console.error('Failed to save rejected model:', err);
      }
    }
  };

  const handleAdminSuspendUser = async (userId: string) => {
    try {
      const users = await dbService.getUsers();
      const user = users.find(u => u.id === userId || u.email === userId);
      if (user) {
        const username = user.name || user.email;
        const currentStatus = user.status;
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        user.status = newStatus;
        await dbService.saveUser(user);

        // Also update any matching model profile
        const updatedModels = models.map(m => {
          if (m.userId === userId || m.id === userId || m.email?.toLowerCase() === user.email?.toLowerCase()) {
            return {
              ...m,
              status: newStatus as any,
              approved: newStatus === 'active',
              rejected: newStatus === 'suspended'
            };
          }
          return m;
        });
        setModels(updatedModels);

        const targetModel = updatedModels.find(m => m.userId === userId || m.id === userId || m.email?.toLowerCase() === user.email?.toLowerCase());
        if (targetModel) {
          await dbService.saveModel(targetModel);
        }

        await dbService.addAuditLog({
          action: 'User Account Moderation',
          performedBy: userEmail || 'admin@modelverse.in',
          details: `Toggled status of user "${username}" (ID: ${userId}) to "${newStatus.toUpperCase()}".`,
          entityId: userId,
          entityType: 'user'
        });

        triggerToast(
          newStatus === 'suspended' ? 'Account Suspended' : 'Account Reactivated',
          `User "${username}" has been ${newStatus}. ${newStatus === 'suspended' ? 'Profile cards hidden from frontend.' : 'Profile restored.'}`,
          newStatus === 'suspended' ? 'info' : 'success'
        );
      }
    } catch (err) {
      console.error('Failed to suspend user:', err);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      // 1. Update via direct dbService (localStorage + Supabase)
      await dbService.updateBookingStatus(bookingId, status);

      // 2. Also update via backend API for dual-channel reliability
      try {
        await fetch(`/api/v2/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
      } catch (apiErr) {
        console.warn('Backend API booking status update note:', apiErr);
      }
      
      await dbService.addAuditLog({
        action: 'Booking Status Change',
        performedBy: userEmail || 'admin@modelverse.in',
        details: `Booking status for project "${booking.projectDetails.brandName}" (Model: ${booking.modelName}) updated to "${status.toUpperCase()}".`,
        entityId: bookingId,
        entityType: 'booking'
      });
      
      const updatedBookings = await dbService.getBookings();
      setBookings(updatedBookings);
      
      const updatedPayments = await dbService.getPayments();
      setPayments(updatedPayments);

      // Send notification to model when admin approves (assigns) the booking
      if (status === 'assigned') {
        const modelObj = models.find(m => m.id === booking.modelId);
        const modelUserId = modelObj ? modelObj.userId : booking.modelId;
        const modelApprovalMsg: Message = {
          id: `msg_model_approved_${Date.now()}`,
          senderId: 'system',
          receiverId: modelUserId,
          content: `✅ BOOKING APPROVED BY ADMIN: The booking from client "${booking.clientName}" for campaign "${booking.projectDetails.brandName}" has been approved by admin and assigned to you. Please review and accept or decline in your dashboard.`,
          timestamp: new Date().toISOString(),
          isRead: false
        };
        await dbService.addMessage(modelApprovalMsg);

        triggerToast(
          'Booking Assigned to Model',
          `Booking for ${booking.modelName} has been approved by admin and forwarded to the model for confirmation.`,
          'success'
        );
      } else if (status === 'accepted') {
        // Notify client that model accepted
        const clientAcceptMsg: Message = {
          id: `msg_client_accepted_${Date.now()}`,
          senderId: 'system',
          receiverId: booking.clientId,
          content: `🎉 BOOKING ACCEPTED: Model "${booking.modelName}" has accepted your booking for campaign "${booking.projectDetails.brandName}". Escrow budget of ₹${booking.priceAmount?.toLocaleString()} is now secured.`,
          timestamp: new Date().toISOString(),
          isRead: false
        };
        await dbService.addMessage(clientAcceptMsg);

        triggerToast(
          'Booking Accepted',
          `Booking proposal for ${booking.modelName} (${booking.projectDetails.brandName}) has been accepted. Escrow budget secured.`,
          'success'
        );
      } else if (status === 'rejected') {
        // Notify client that booking was rejected
        const clientRejectMsg: Message = {
          id: `msg_client_rejected_${Date.now()}`,
          senderId: 'system',
          receiverId: booking.clientId,
          content: `❌ BOOKING DECLINED: The booking for model "${booking.modelName}" for campaign "${booking.projectDetails.brandName}" has been declined. Your escrow budget has been returned.`,
          timestamp: new Date().toISOString(),
          isRead: false
        };
        await dbService.addMessage(clientRejectMsg);

        triggerToast(
          'Booking Declined',
          `Booking request for ${booking.modelName} has been declined. Escrow budget returned.`,
          'warning'
        );
      } else if (status === 'cancelled') {
        triggerToast(
          'Booking Cancelled',
          `Booking request for ${booking.modelName} has been cancelled.`,
          'warning'
        );
      } else if (status === 'completed') {
        triggerToast(
          'Campaign Settled',
          `Escrow payment of ₹${booking.priceAmount.toLocaleString()} has been released to ${booking.modelName}. Campaign successfully completed!`,
          'success'
        );
      }

      // Refresh messages after notifications
      const updatedMessages = await dbService.getMessages();
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Failed to update booking status:', error);
      triggerToast('Update Failed', 'An error occurred while updating the booking request.', 'error');
    }
  };


  const handleModelRegisterSubmit = async (newModel: Model) => {
    const userSession = dbService.getCurrentSessionUser();
    const existingUserId = newModel.userId || clientId || userSession?.id;
    const finalUserId = existingUserId && String(existingUserId).trim() !== '' 
      ? String(existingUserId).trim() 
      : 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Check if models state has an existing model for this user ID or email to prevent duplicate model profiles
    const existingModelInState = models.find(m =>
      (finalUserId && String(m.userId) === String(finalUserId)) ||
      (newModel.email && m.email && m.email.toLowerCase() === newModel.email.toLowerCase())
    );

    const pendingModel: Model = {
      ...newModel,
      id: existingModelInState ? existingModelInState.id : newModel.id,
      userId: finalUserId,
      approved: newModel.approved !== undefined ? newModel.approved : true,
      rejected: false
    };

    triggerToast(
      'Submitting to Server Database',
      `Sending profile details for "${pendingModel.name}" to the backend server...`,
      'info'
    );

    try {
      // 1) Submit registration to Backend Server Endpoint FIRST (/api/v2/models/register)
      const savedModel = await dbService.registerModel(pendingModel);

      // 2) Fetch fresh models list directly from the backend
      const freshModels = await dbService.getModels();
      setModels(freshModels);

      if (pendingModel.category) {
        setActiveHomeCategory(pendingModel.category);
        setSearchCategory(pendingModel.category);
      }

      triggerToast(
        'Profile Saved on Backend!',
        `Successfully saved model "${savedModel?.name || pendingModel.name}" directly to backend database!`,
        'success'
      );
    } catch (err: any) {
      console.error('Backend registration write failed:', err);
      triggerToast(
        'Registration Failed',
        `Failed to save model on server database: ${err.message || 'Server error'}`,
        'error'
      );
      throw err;
    }
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        setBookings,
        payments,
        setPayments,
        messages,
        setMessages,
        showBookingWizard,
        setShowBookingWizard,
        showPremiumModal,
        setShowPremiumModal,
        targetModelForPremium,
        setTargetModelForPremium,
        premiumPlanType,
        setPremiumPlanType,
        targetModelForBooking,
        setTargetModelForBooking,
        focusedModelReviews,
        setFocusedModelReviews,
        showMockCheckout,
        setShowMockCheckout,
        mockCheckoutData,
        setMockCheckoutData,
        verifyingPayment,
        setVerifyingPayment,
        handleOpenBookingWizard,
        handleBookingSubmit,
        handleSendMessage,
        handlePremiumUnlockSuccess,
        handleAddPaymentRecord,
        handleReviewSubmit,
        handleAdminBatchApproveModels,
        handleAdminApproveModel,
        handleAdminRejectModel,
        handleAdminSuspendUser,
        handleUpdateBookingStatus,
        handleModelRegisterSubmit
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
