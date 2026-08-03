/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Star, MapPin, Heart, ShieldAlert, CheckCircle2, MessageCircle, DollarSign, Calendar, Flame, Instagram, X, MessageSquare, Clock, User as UserIcon, LogIn, UserPlus, Search, Sun, Moon, LifeBuoy, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Context & Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { BookingProvider, useBooking } from './context/BookingContext';
import { PaymentProvider } from './context/PaymentContext';

// Custom Hooks
import { useModels } from './hooks/useModels';
import { useBookings } from './hooks/useBookings';
import { usePayments } from './hooks/usePayments';

// Layout & Common Components
import Navbar from './components/common/Navbar';
import Logo from './components/common/Logo';
import BannerAd from './components/common/BannerAd';
import CustomCursor from './components/common/CustomCursor';
import DynamicMetadata from './components/common/DynamicMetadata';
import ToastNotification from './components/common/ToastNotification';
import SandboxPaymentWidget from './components/common/SandboxPaymentWidget';
import AboutContact from './components/common/AboutContact';
import BlogSection from './components/common/BlogSection';
import AuthView from './components/common/AuthView';

// Profile, Booking & Dashboard Components
import BecomeModelForm from './components/profile/BecomeModelForm';
import ChatWindow from './components/dashboard/ChatWindow';
import AICreativeStudio from './components/dashboard/AICreativeStudio';
import PremiumUnlockModal from './components/booking/PremiumUnlockModal';
import MockCheckout from './components/booking/MockCheckout';
import BookingWizard from './components/booking/BookingWizard';
import BookingWizardSkeleton from './components/booking/BookingWizardSkeleton';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import CastingRatesPage from './components/booking/CastingRatesPage';

function AppContent() {
  const {
    isAuthenticated,
    clientId,
    currentRole,
    currentUserName,
    userEmail,
    isGuestMode,
    handleSetGuestMode,
    authRoleHint,
    setAuthRoleHint,
    authTabHint,
    setAuthTabHint,
    authEmailHint,
    setAuthEmailHint,
    handleAuthSuccess,
    setAuthenticated,
    isEmailUnverified,
    handleResendVerificationEmail,
    handleChangePasswordClick
  } = useAuth();

  const {
    currentTab,
    setCurrentTab,
    darkMode,
    setDarkMode,
    toasts,
    handleDismissToast,
    triggerToast,
    focusedModelId,
    setFocusedModelId,
    showEliteModal,
    setShowEliteModal,
    eliteModelForModal,
    setEliteModelForModal,
    setSelectedModelForChat,
    chatModelUserId,
    setChatModelUserId,
    activeChatEndTime
  } = useApp();

  const {
    messages,
    handleSendMessage,
    showBookingWizard,
    setShowBookingWizard,
    targetModelForBooking,
    setTargetModelForBooking,
    handleBookingSubmit,
    targetModelForPremium,
    setTargetModelForPremium,
    premiumPlanType,
    showPremiumModal,
    setShowPremiumModal,
    handlePremiumUnlockSuccess,
    showMockCheckout,
    setShowMockCheckout,
    mockCheckoutData,
    setMockCheckoutData,
    verifyingPayment,
    setVerifyingPayment,
    handleAddPaymentRecord,
    handleOpenBookingWizard,
    handleModelRegisterSubmit
  } = useBooking();

  const { models } = useModels();
  const { bookings } = useBookings();
  const { payments } = usePayments();

  const handleLogout = () => setAuthenticated(false);
  const isBookingWizardLoading = false;

  const [showAdBanner, setShowAdBanner] = React.useState(() => {
    return localStorage.getItem('ad_banner_dismissed') !== 'true';
  });

  // Route switcher based on currentTab state
  const renderCurrentPage = () => {
    // Public tabs allowed for unauthenticated visitors
    const publicTabs = [
      'home', 'models', 'pricing', 'casting-rates', 'unlock-premium', 
      'premium-unlock', 'subscription', 'payments', 'rates', 
      'ai-studio', 'creative-studio', 'ai-creative-studio', 'ai-lab', 'studio', 
      'blog', 'about', 'contact', 'disclaimer', 'google-terms', 'google-privacy', 
      'affiliate-disclosure', 'become-model'
    ];

    if (!isAuthenticated && !publicTabs.includes(currentTab) && currentTab !== 'auth') {
      return <AuthView onAuthSuccess={handleAuthSuccess} onCancel={() => setCurrentTab('home')} initialRole="client" initialTab="login" initialEmail="" onGuestMode={() => handleSetGuestMode(true)} />;
    }

    switch (currentTab) {
      case 'home':
        return <HomePage />;
      case 'models':
        return focusedModelId ? <ProfilePage /> : <BookingPage />;
      case 'agent-dashboard':
      case 'client-dashboard':
        return <DashboardPage />;
      case 'admin':
        return <AdminPage />;
      case 'creative-studio':
      case 'ai-studio':
      case 'ai-creative-studio':
      case 'ai-lab':
      case 'studio':
        return <AICreativeStudio userEmail={userEmail || ''} triggerToast={triggerToast} />;
      case 'blog':
        return <BlogSection currentRole={currentRole} userEmail={userEmail} />;
      case 'about':
      case 'contact':
      case 'disclaimer':
      case 'google-terms':
      case 'google-privacy':
      case 'affiliate-disclosure':
        return <AboutContact type={currentTab} />;
      
      case 'pricing':
      case 'casting-rates':
      case 'unlock-premium':
      case 'premium-unlock':
      case 'subscription':
      case 'payments':
        return <CastingRatesPage />;
      
      case 'become-model':
        if (!isAuthenticated) {
          return (
            <div className="py-24 max-w-xl mx-auto px-6 text-center space-y-6 animate-fadeIn text-left">
              <div className="inline-flex p-4 rounded-full bg-pink-50 dark:bg-pink-950/20 text-pink-500 border border-pink-100 dark:border-pink-900/30 shadow-sm mx-auto">
                <Sparkles className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 font-sans tracking-tight text-center">Become a Model in India</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed text-center font-medium">
                Join ModelVerse India to showcase your portfolio, set daily casting rates, and receive verified coordinator contracts.
              </p>
              <div className="pt-4 text-center">
                <button
                  onClick={() => {
                    setAuthTabHint('signup');
                    setAuthRoleHint('model');
                    setCurrentTab('auth');
                  }}
                  className="rounded-full bg-[#EA3838] hover:bg-[#c02424] text-white px-8 py-3 text-xs font-black uppercase tracking-wider shadow-lg shadow-[#EA3838]/20 transition active:scale-95 cursor-pointer"
                >
                  Create Model Account
                </button>
              </div>
            </div>
          );
        }
        if (currentRole === 'client') {
          return (
            <div className="py-24 max-w-xl mx-auto px-6 text-center space-y-6 animate-fadeIn">
              <div className="inline-flex p-4 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-100 dark:border-red-900/30 shadow-sm mx-auto">
                <ShieldAlert className="h-8 w-8 text-red-550" />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 font-sans tracking-tight text-center">Access Restricted</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed text-center font-medium">
                Clients are not permitted to register as models. If you wish to list yourself as a model, please register/log in with a dedicated Model account.
              </p>
              <div className="pt-4 text-center">
                <button
                  onClick={() => setCurrentTab('home')}
                  className="rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-white px-8 py-3 text-xs font-black uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            </div>
          );
        }
        return (
          <BecomeModelForm
            userId={clientId}
            onRegisterSubmit={(newModel) => {
              handleModelRegisterSubmit(newModel);
              triggerToast('Profile Submitted', 'Your profile details have been registered successfully and are pending admin verification.', 'success');
              setCurrentTab('home');
            }}
            onGoHome={() => setCurrentTab('home')}
          />
        );

      case 'chat':
        if (!chatModelUserId) {
          setCurrentTab('home');
          return null;
        }
        const activeModel = models.find((m) => m.userId === chatModelUserId);
        if (!activeModel) {
          setCurrentTab('home');
          return null;
        }
        const activeBooking = bookings.find((b) => b.modelId === activeModel.id && b.status === 'pending');
        const conversationMsgs = messages.filter(
          (m) =>
            (m.senderId === clientId && m.receiverId === chatModelUserId) ||
            (m.senderId === chatModelUserId && m.receiverId === clientId) ||
            (m.senderId === 'system' && m.receiverId === clientId && m.bookingId === activeBooking?.id)
        );
        return (
          <div className="py-10 px-4">
            <ChatWindow
              model={activeModel}
              messages={conversationMsgs}
              clientId={clientId}
              onSendMessage={handleSendMessage}
              bookingRef={activeBooking}
              activeChatEndTime={activeChatEndTime}
            />
          </div>
        );

      case 'auth':
        return (
          <AuthView
            onAuthSuccess={(user, role) => {
              handleAuthSuccess(user, role);
              setAuthRoleHint('client'); // reset default
            }}
            onCancel={() => {
              setCurrentTab('home');
              setAuthRoleHint('client');
            }}
            initialRole={authRoleHint}
            initialTab={authTabHint}
            initialEmail={authEmailHint}
            onGuestMode={() => {
              handleSetGuestMode(true);
              setCurrentTab('home');
            }}
          />
        );

      default:
        return <NotFoundPage />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased selection:bg-purple-600/30 dark:selection:bg-pink-600/40 bg-white text-neutral-850 dark:bg-[#090909] dark:text-neutral-200 transition-colors duration-350`}>
      {/* HEADER NAVBAR */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentRole={currentRole}
        setCurrentRole={(role) => handleAuthSuccess({ id: clientId, email: userEmail, role, name: currentUserName } as any, role)}
        isAuthenticated={isAuthenticated}
        setAuthenticated={(val) => {
          if (!val) {
            handleLogout();
          } else {
            setCurrentTab('auth');
          }
        }}
        userEmail={userEmail || ''}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        isEmailUnverified={isEmailUnverified}
        onResendVerification={() => handleResendVerificationEmail(triggerToast)}
        onChangePassword={handleChangePasswordClick}
      />

      {/* CORE VIEW PORT */}
      <main className="flex-1 min-h-[calc(100vh-80px)]">
        {renderCurrentPage()}
      </main>

      {/* FOOTER BAR */}
      <footer 
        className="border-t border-white/5 bg-[#090909] py-16 px-4 sm:px-6 lg:px-8 mt-auto text-left"
        onClickCapture={(e) => {
          if (!isAuthenticated) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-zinc-400 space-y-4 md:space-y-0 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start space-y-1">
              <span className="font-extrabold text-white font-mono tracking-wider text-sm flex items-center gap-1.5">
                <span className="text-[#D4AF37]">MODEL</span>VERSE INDIA
              </span>
              <p className="text-zinc-500 text-[11px] max-w-xs leading-normal">Premium model discovery & secure contract escrow operations.</p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-5 sm:gap-6 font-semibold text-zinc-400 text-xs">
              <button onClick={() => setCurrentTab('about')} className={`transition cursor-pointer ${currentTab === 'about' ? 'text-[#D4AF37] font-bold' : 'hover:text-[#D4AF37]'}`}>About Us</button>
              <button onClick={() => setCurrentTab('disclaimer')} className={`transition cursor-pointer ${currentTab === 'disclaimer' ? 'text-[#D4AF37] font-bold' : 'hover:text-[#D4AF37]'}`}>Disclaimer</button>
              <button onClick={() => setCurrentTab('blog')} className={`transition cursor-pointer ${currentTab === 'blog' ? 'text-[#D4AF37] font-bold' : 'hover:text-[#D4AF37]'}`}>Posting Blog</button>
              <button onClick={() => setCurrentTab('google-terms')} className={`transition cursor-pointer ${currentTab === 'google-terms' ? 'text-[#D4AF37] font-bold' : 'hover:text-[#D4AF37]'}`}>Google Terms of Service</button>
              <button onClick={() => setCurrentTab('google-privacy')} className={`transition cursor-pointer ${currentTab === 'google-privacy' ? 'text-[#D4AF37] font-bold' : 'hover:text-[#D4AF37]'}`}>Google Privacy Policy</button>
              <button onClick={() => setCurrentTab('affiliate-disclosure')} className={`transition cursor-pointer ${currentTab === 'affiliate-disclosure' ? 'text-[#D4AF37] font-bold' : 'hover:text-[#D4AF37]'}`}>Affiliate Earning Disclosure</button>
              
              <button
                onClick={() => setCurrentTab('contact')}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border transition cursor-pointer text-xs font-bold ${
                  currentTab === 'contact'
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                    : 'bg-white/5 border-white/10 text-[#D4AF37] hover:bg-white/10 hover:text-white'
                }`}
              >
                <LifeBuoy className="h-3.5 w-3.5" />
                <span>Contact & Support</span>
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              {!showAdBanner && (
                <button
                  onClick={() => {
                    setShowAdBanner(true);
                    localStorage.removeItem('ad_banner_dismissed');
                  }}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20 transition cursor-pointer"
                  title="Show sponsor campaign banner"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  <span>View Sponsor Deals</span>
                </button>
              )}
            </div>

            <div className="flex flex-col items-center md:items-end font-medium text-zinc-500 space-y-1">
              <p className="text-[10px]">© 2026 ModelVerse India Inc. All Rights Reserved.</p>
              <p className="text-[8px] font-mono tracking-widest text-[#D4AF37] mt-1 uppercase">PROUDLY CASTED IN MUMBAI & DELHI</p>
            </div>
          </div>

          <div id="legal-and-affiliate-disclaimers" className="border-t border-white/5 pt-8 grid grid-cols-1 md:grid-cols-12 gap-8 text-[11px] text-zinc-500">
            <div className="md:col-span-5 flex flex-col space-y-4 items-center md:items-start text-left">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#D4AF37]" />
                <span className="font-bold text-zinc-300 font-sans tracking-wide text-xs uppercase">Legal & SEO Compliance</span>
              </div>
              <p className="text-zinc-500 leading-normal text-[11px] max-w-sm">
                ModelVerse India operates with strict compliance standards. For complete digital transparency, user security and global policy adherence, please consult our official Google integrated terms:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                <button
                  id="google-terms-of-service-link"
                  onClick={() => setCurrentTab('google-terms')}
                  className="inline-flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition cursor-pointer text-center hover:border-[#D4AF37]/50"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Google Terms of Service</span>
                </button>
                <button
                  id="google-privacy-policy-link"
                  onClick={() => setCurrentTab('google-privacy')}
                  className="inline-flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition cursor-pointer text-center hover:border-[#D4AF37]/50"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span>Google Privacy Policy</span>
                </button>
              </div>
              <p className="text-[10px] text-zinc-600 font-mono italic">
                Authorized Gateway Provider for Premium Casting & Model Escrows in India.
              </p>
            </div>

            <div 
              onClick={() => setCurrentTab('affiliate-disclosure')}
              className="md:col-span-7 bg-[#121212] border border-amber-500/15 rounded-2xl p-5 space-y-3 shadow-lg hover:border-amber-500/35 transition cursor-pointer group text-left"
              title="Click to read full Affiliate Disclosure details"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="font-bold text-zinc-200 group-hover:text-white transition font-sans tracking-wide uppercase text-xs">FTC Affiliate & Earning Disclosure</span>
                </div>
                <span className="inline-flex items-center text-[9px] font-mono font-bold bg-amber-500/10 text-[#D4AF37] px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
                  Affiliate and earning disclaimer applicable
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-zinc-400 leading-relaxed text-[11px] group-hover:text-zinc-350 transition">
                  In accordance with consumer protection regulations, including Federal Trade Commission (FTC) guidelines globally, we disclose that this platform contains highly curated promotional slots, sponsored campaign listings, and specialized product recommendations. 
                </p>
                <p className="text-zinc-500 leading-relaxed text-[11px] group-hover:text-zinc-400 transition">
                  <strong>Commission & Compensation Nature:</strong> When you navigate to external merchant partners, make bookings, or purchase products through recommendations, sponsor deals, or affiliate links displayed on this site, ModelVerse India may receive financial commissions, referral credits, or direct compensation. Click this component to read the comprehensive regulatory page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* GLOBAL MODALS AND OVERLAYS */}
      {isAuthenticated && showEliteModal && eliteModelForModal && (
        <div id="elite-talent-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#121212] text-white shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/5 p-5 bg-[#0a0a0a]">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="font-sans text-lg font-black tracking-tight text-white">Elite Shortlisted Talent</h3>
              </div>
              <button
                onClick={() => {
                  setShowEliteModal(false);
                  setEliteModelForModal(null);
                }}
                className="rounded-full p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-1/2 h-64 rounded-2xl overflow-hidden border border-white/10 relative shrink-0">
                  <img
                    src={eliteModelForModal.portfolio?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'}
                    alt={eliteModelForModal.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md border border-white/10 text-[#D4AF37] font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold">
                    Elite Tier
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-xl font-black text-white leading-tight">{eliteModelForModal.name}</h4>
                    <span className="inline-block mt-1 text-xs text-zinc-400 font-medium font-sans">
                      {eliteModelForModal.category}
                    </span>
                    <div className="mt-2 flex items-center space-x-1.5 text-xs text-zinc-500">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>{eliteModelForModal.city}, {eliteModelForModal.state}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-6 items-center space-x-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 text-[11px] font-bold text-amber-400">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>{eliteModelForModal.rating}</span>
                    </div>
                    {eliteModelForModal.approved && (
                      <span className="flex h-6 items-center space-x-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wide">
                        Verified Profile
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 border-y border-white/5 py-3 text-center text-[10px] font-mono font-bold uppercase text-zinc-400">
                    <div>
                      <span className="block text-[8px] text-zinc-500 font-sans mb-0.5">Height</span>
                      <span className="text-white">{eliteModelForModal.height}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-zinc-500 font-sans mb-0.5">Age</span>
                      <span className="text-white">{eliteModelForModal.age} yrs</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-zinc-500 font-sans mb-0.5">Experience</span>
                      <span className="text-white">{eliteModelForModal.experience}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Daily Shoot Budget</span>
                  <p className="text-lg font-black text-white mt-0.5 font-sans">
                    ₹{eliteModelForModal.startingPrice.toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-zinc-500 font-sans">/ day</span>
                  </p>
                </div>
                <div className="text-right text-[10px] text-zinc-400 leading-relaxed font-sans max-w-[200px]">
                  Includes standard digital media usage & full agency licensing references.
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 p-5 bg-[#0a0a0a] flex gap-3">
              <button
                id="modal-elite-book-btn"
                onClick={() => {
                  handleOpenBookingWizard(eliteModelForModal);
                  setShowEliteModal(false);
                }}
                className="flex-1 py-3 px-5 rounded-full border border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 text-xs font-black uppercase tracking-wider transition active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                <span>Book Session</span>
              </button>

              <button
                id="modal-elite-chat-btn"
                onClick={() => {
                  setSelectedModelForChat(eliteModelForModal);
                  setCurrentTab('chat');
                  setChatModelUserId(eliteModelForModal.userId);
                  setShowEliteModal(false);
                }}
                className="flex-1 py-3 px-5 rounded-full bg-gradient-to-r from-purple-650 to-pink-600 text-white text-xs font-black uppercase tracking-wider shadow-md hover:brightness-110 transition active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {targetModelForPremium && (
        <PremiumUnlockModal
          model={targetModelForPremium}
          isOpen={showPremiumModal}
          planType={premiumPlanType}
          userId={clientId}
          userName={currentUserName}
          userEmail={userEmail}
          onClose={() => {
            setShowPremiumModal(false);
            setTargetModelForPremium(null);
          }}
          onSuccessUnlock={handlePremiumUnlockSuccess}
        />
      )}

      {/* LOTTIE-STYLE SMOOTH PAYMENT VERIFICATION OVERLAY */}
      {verifyingPayment.isOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden">
            {verifyingPayment.step === 'verifying' && (
              <div className="flex flex-col items-center py-6">
                <div className="relative flex items-center justify-center h-20 w-20 mb-6">
                  <div className="absolute inset-0 border-4 border-purple-100 dark:border-purple-900/30 rounded-full animate-pulse" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-purple-650 rounded-full animate-spin" />
                </div>
                <h3 className="font-sans text-lg font-black text-neutral-800 dark:text-neutral-100">Verifying Payment...</h3>
                <p className="text-xs text-purple-700 dark:text-purple-400 font-bold font-mono tracking-wider uppercase mt-1 animate-pulse">Contacting Bank Gateway</p>
                <p className="text-xs text-neutral-550 dark:text-neutral-400 mt-3 max-w-xs leading-relaxed">
                  Verifying transaction state with {verifyingPayment.gateway} secure ledger. Please do not refresh or navigate away.
                </p>
              </div>
            )}

            {verifyingPayment.step === 'success' && (
              <div className="flex flex-col items-center py-4">
                <div className="relative flex items-center justify-center h-24 w-24 mb-4">
                  <motion.div 
                    className="absolute inset-0 bg-emerald-100 dark:bg-emerald-950/40 rounded-full"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <svg className="h-20 w-20 text-emerald-500 relative z-10" viewBox="0 0 52 52" fill="none">
                    <motion.circle 
                      cx="26" 
                      cy="26" 
                      r="23" 
                      stroke="currentColor" 
                      strokeWidth="3.5" 
                      initial={{ pathLength: 0, scale: 0.8, rotate: -90 }}
                      animate={{ pathLength: 1, scale: 1, rotate: 0 }}
                      transition={{ 
                        pathLength: { duration: 0.8, ease: "easeOut" },
                        scale: { type: "spring", stiffness: 120, damping: 10 }
                      }}
                    />
                    <motion.path 
                      d="M16 27l7 7 13.5-13.5" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
                    />
                  </svg>
                </div>

                <h3 className="font-sans text-xl font-black text-neutral-900 dark:text-neutral-50">Transaction Secure!</h3>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold font-mono mt-1 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                  REF: {verifyingPayment.invoiceId}
                </p>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4 leading-relaxed max-w-sm">
                  We successfully received your payment of <strong>₹{verifyingPayment.amount.toLocaleString()}</strong>. Access to {verifyingPayment.modelName ? `${verifyingPayment.modelName}'s measurements & live premium chat` : 'the selected premium license'} is now fully unlocked!
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setVerifyingPayment(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="mt-6 w-full py-3 px-6 rounded-full bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer"
                >
                  Proceed to Unlocked Profile
                </button>
              </div>
            )}

            {verifyingPayment.step === 'failure' && (
              <div className="flex flex-col items-center py-4">
                <div className="relative flex items-center justify-center h-24 w-24 mb-4">
                  <motion.div 
                    className="absolute inset-0 bg-rose-100 dark:bg-rose-950/40 rounded-full"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <svg className="h-20 w-20 text-rose-500 relative z-10" viewBox="0 0 52 52" fill="none">
                    <motion.circle 
                      cx="26" 
                      cy="26" 
                      r="23" 
                      stroke="currentColor" 
                      strokeWidth="3.5" 
                      initial={{ pathLength: 0, scale: 0.8 }}
                      animate={{ pathLength: 1, scale: 1 }}
                      transition={{ 
                        pathLength: { duration: 0.8, ease: "easeOut" },
                        scale: { type: "spring", stiffness: 120, damping: 10 }
                      }}
                    />
                    <motion.path 
                      d="M17 17l18 18M35 17L17 35" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
                    />
                  </svg>
                </div>

                <h3 className="font-sans text-xl font-black text-rose-650 dark:text-rose-500">Transaction Failed</h3>
                <p className="text-[10px] text-rose-700 dark:text-rose-400 font-bold font-mono mt-1 bg-rose-50 dark:bg-rose-950/50 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800/40">
                  Verification Declined
                </p>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4 leading-relaxed max-w-sm">
                  {verifyingPayment.error || 'The banking networks declined the request. Please verify your account balance and credentials, and try again.'}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setVerifyingPayment(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="mt-6 w-full py-3 px-6 rounded-full bg-rose-600 hover:bg-rose-750 text-white text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer"
                >
                  Close & Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showMockCheckout && mockCheckoutData && (
        <MockCheckout
          gateway={mockCheckoutData.gateway}
          planType={mockCheckoutData.planType}
          amount={mockCheckoutData.amount}
          modelId={mockCheckoutData.modelId}
          modelName={mockCheckoutData.modelName}
          userName={mockCheckoutData.userName}
          userEmail={mockCheckoutData.userEmail}
          onCancel={() => {
            setShowMockCheckout(false);
            setMockCheckoutData(null);
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />
      )}

      {targetModelForBooking && (
        isBookingWizardLoading ? (
          <BookingWizardSkeleton
            isOpen={showBookingWizard}
            onClose={() => {
              setShowBookingWizard(false);
              setTargetModelForBooking(null);
            }}
            modelName={targetModelForBooking.name}
          />
        ) : (
          <BookingWizard
            model={targetModelForBooking}
            isOpen={showBookingWizard}
            onClose={() => {
              setShowBookingWizard(false);
              setTargetModelForBooking(null);
            }}
            onSubmitBooking={handleBookingSubmit}
            clientName="Premium Agency (Test Client)"
          />
        )
      )}

      {/* FLOATING ACTION ACTION BUTTONS */}
      <div className={`fixed transition-all duration-300 ${showAdBanner ? 'bottom-120px md:bottom-84px' : 'bottom-6'} right-6 z-40 flex flex-col items-center space-y-3`}>
        <div className="group flex items-center space-x-2">
          <a
            href="https://www.instagram.com/model_verse_india?igsh=MWdhdzU0bThua2ZsNA=="
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-12 w-12 rounded-full bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-lg transition duration-300 hover:scale-105 active:scale-95 focus:outline-none relative group ring-4 ring-white/10"
            id="instagram-action-btn"
          >
            <Instagram className="h-5 w-5" />
            <span className="absolute right-14 scale-0 group-hover:scale-100 transition-all origin-right duration-200 bg-neutral-950 border border-neutral-800 text-white rounded-2xl px-3 py-2 text-[11px] font-black tracking-wide whitespace-nowrap shadow-xl flex items-center space-x-1.5 opacity-0 group-hover:opacity-100">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
              <span className="font-sans text-neutral-200">Instagram Profile</span>
            </span>
          </a>
        </div>

        <div className="group flex items-center space-x-2">
          <a
            href="https://wa.me/918377998636?text=Hello%20ModelVerse%20India%21%20I%20have%20an%20inquiry%20regarding%20model%20booking%20or%20premium%20profile%20unlock."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-[#25D366]/30 shadow-lg transition duration-300 hover:bg-[#128C7E] hover:scale-105 active:scale-95 focus:outline-none relative group ring-4 ring-white/10"
            id="whatsapp-business-fab"
          >
            <span className="absolute -top-1 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white text-[8px] font-black items-center justify-center text-white">1</span>
            </span>
            <MessageCircle className="h-7 w-7 fill-white" />
            <span className="absolute right-16 scale-0 group-hover:scale-100 transition-all origin-right duration-250 bg-neutral-950 border border-neutral-800 text-white rounded-2xl px-3 py-2 text-[11px] font-black tracking-wide whitespace-nowrap shadow-xl flex items-center space-x-1.5 opacity-0 group-hover:opacity-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-sans text-neutral-200">WhatsApp Business Chat</span>
            </span>
          </a>
        </div>
      </div>

      {/* BEAUTIFUL GATING OVERLAY */}
      {!isAuthenticated && !isGuestMode && currentTab !== 'auth' && (
        <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md max-h-[95vh] overflow-y-auto rounded-3xl bg-white p-6 md:p-8 text-left shadow-2xl border border-neutral-200/80 relative text-left ">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-pink-500/10 blur-xl pointer-events-none" />

            <div className="flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2.5 border border-neutral-900 shadow-xl mb-4 mx-auto w-fit">
              <Logo size={28} variant="compact" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight leading-tight text-center font-sans">
              Unlock ModelVerse India
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-500 mt-2 leading-relaxed max-w-xs mx-auto text-center font-medium">
              Access India's premier verified modeling registry, secure casting escrow systems, and real-time coordinator chat modules.
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                onClick={() => {
                  setCurrentTab('auth');
                  setAuthRoleHint('client');
                }}
                className="w-full py-3 px-5 rounded-xl bg-neutral-950 text-white hover:bg-black border border-neutral-900 text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-150 active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
              >
                <LogIn className="h-4 w-4 text-white" />
                <span>Log In to Account</span>
              </button>
              <button
                onClick={() => {
                  setCurrentTab('auth');
                  setAuthRoleHint('client');
                }}
                className="w-full py-3 px-5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border-2 border-neutral-200 text-neutral-800 text-xs font-black uppercase tracking-wider transition-all duration-150 active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
              >
                <UserPlus className="h-4 w-4 text-purple-650" />
                <span>Register Certified Profile</span>
              </button>
              <button
                onClick={() => {
                  handleSetGuestMode(true);
                  setCurrentTab('home');
                }}
                className="w-full py-3 px-5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border-2 border-dashed border-neutral-300 text-neutral-600 hover:text-neutral-900 text-xs font-black uppercase tracking-wider transition-all duration-150 active:scale-98 cursor-pointer flex items-center justify-center space-x-2 animate-pulse"
              >
                <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                <span>Continue as Guest (Limited Access)</span>
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-neutral-150 grid grid-cols-3 gap-2 text-[9px] text-neutral-500 font-mono font-bold uppercase tracking-wider text-center">
              <div className="flex flex-col items-center">
                <span className="text-purple-650 font-black">Client</span>
                <span className="text-[8px] text-neutral-400 mt-0.5 font-sans font-medium">Hire Talents</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-pink-650 font-black">Model</span>
                <span className="text-[8px] text-neutral-400 mt-0.5 font-sans font-medium">Onboard Registry</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-amber-600 font-black">Admin</span>
                <span className="text-[8px] text-neutral-400 mt-0.5 font-sans font-medium">Vetting Panel</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CURSOR */}
      <CustomCursor />

      {/* DYNAMIC SEO METADATA */}
      <DynamicMetadata currentTab={currentTab} focusedModel={models.find(m => m.id === focusedModelId) || null} />

      {/* TOASTS */}
      <ToastNotification toasts={toasts} onDismiss={handleDismissToast} />

      {/* ₹1 SANDBOX WIDGET */}
      <SandboxPaymentWidget 
        onAddPaymentRecord={handleAddPaymentRecord}
        clientId={clientId}
        userEmail={userEmail || ''}
      />

      {/* MONETIZATION AD BANNER */}
      <AnimatePresence>
        {showAdBanner && (
          <motion.div
            initial={{ y: 80, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 80, x: '-50%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            className="fixed bottom-4 left-1/2 z-45 w-[calc(100%-2rem)] max-w-4xl"
          >
            <BannerAd 
              onClose={() => {
                setShowAdBanner(false);
                localStorage.setItem('ad_banner_dismissed', 'true');
              }} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BookingProvider>
          <PaymentProvider>
            <AppContent />
          </PaymentProvider>
          
        </BookingProvider>
      </AppProvider>
    </AuthProvider>
  );
}
