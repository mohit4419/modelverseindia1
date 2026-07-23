/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Award, Sparkles, Check, Lock, ArrowRight, Zap, Users, Building2, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Model, PREMIUM_UNLOCK_AMOUNT } from '../../types';
import PremiumUnlockModal from './PremiumUnlockModal';
import { accessControlService } from '../../services/accessControl.service';

const DEFAULT_SAMPLE_MODEL: Model = {
  id: 'm1',
  name: 'Ananya Sharma',
  gender: 'female',
  age: 24,
  height: '5\'10"',
  city: 'Mumbai',
  state: 'Maharashtra',
  languages: ['English', 'Hindi'],
  experience: '3-5 years',
  category: 'Fashion & Runway',
  startingPrice: 25000,
  portfolio: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'],
  selfieVerified: true,
  approved: true,
  rating: 4.9,
  reviewsCount: 28,
  userId: 'user_ananya_1',
  agencyInfo: {
    name: 'Elite Model Management India',
    contactName: 'Rajesh Sharma'
  },
  biography: 'Experienced high-fashion and commercial model based in Mumbai.',
  measurements: {
    bust: '34"',
    waist: '25"',
    hips: '36"'
  }
};

export default function CastingRatesPage() {
  const { models, triggerToast, setCurrentTab } = useApp();
  const { userEmail, currentUserName } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'enterprise'>('premium');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const targetModel = models && models.length > 0 ? models[0] : DEFAULT_SAMPLE_MODEL;

  const userTier = accessControlService.getPaymentTier(userEmail || 'guest_client');
  const isEnterpriseActive = accessControlService.hasEnterpriseAccess(userEmail || 'guest_client');

  const handleOpenPayment = (plan: 'premium' | 'enterprise') => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    const tierName = selectedPlan === 'enterprise' ? 'Enterprise Agency License' : 'Individual Profile Unlock';
    triggerToast(
      'Payment Verified!',
      `Successfully unlocked ${tierName}. Access permissions updated.`,
      'success'
    );
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-pink-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span>Transparent Casting & Licensing Passes</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Casting Rates & <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">Verification Passes</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Access verified measurements, direct agency contacts, and high-resolution comp cards with zero hidden booking commissions.
        </p>

        {isEnterpriseActive && (
          <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-bold shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Active Subscription: Enterprise Agency Tier (Full Access Unlocked)</span>
          </div>
        )}
      </div>

      {/* Pricing Tier Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mb-20">
        
        {/* Individual Tier Card */}
        <div className="relative rounded-3xl bg-neutral-900/90 border border-neutral-800 p-8 flex flex-col justify-between hover:border-purple-500/40 transition duration-300 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <Users className="h-3.5 w-3.5" />
                <span>Single Shoot Pass</span>
              </div>
              <span className="text-xs font-mono text-neutral-400">One-time payment</span>
            </div>

            <h3 className="text-2xl font-black text-white">Individual Profile Unlock</h3>
            <p className="text-xs text-neutral-400 mt-2 min-h-[36px]">
              Ideal for independent casting directors and brands looking to book a specific talent.
            </p>

            <div className="my-6 pt-4 border-t border-neutral-800 flex items-baseline space-x-2">
              <span className="text-4xl font-black text-white">₹{PREMIUM_UNLOCK_AMOUNT}</span>
              <span className="text-sm font-semibold text-neutral-400">($3.99 USD)</span>
              <span className="text-xs text-neutral-500 font-mono">/ single profile</span>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Unlock Verified Measurements (Bust, Waist, Hips)',
                'Direct Agency Representation Contacts',
                'Download High-Resolution Comp Card PDF',
                'Direct In-App Chat & Date Negotiations',
                'Escrow Protection & Deposit Guarantee'
              ].map((feature, i) => (
                <li key={i} className="flex items-start space-x-3 text-xs text-neutral-300">
                  <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <button
              onClick={() => handleOpenPayment('premium')}
              className="w-full py-3.5 px-6 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider border border-neutral-700 hover:border-purple-500/50 transition duration-200 cursor-pointer flex items-center justify-center space-x-2 active:scale-98 shadow-md"
            >
              <Zap className="h-4 w-4 text-purple-400" />
              <span>Pay Now (₹{PREMIUM_UNLOCK_AMOUNT} / $3.99)</span>
            </button>
            <p className="text-[10px] text-center text-neutral-500 mt-2 font-mono">
              Processed securely via Razorpay & Instant UPI
            </p>
          </div>
        </div>

        {/* Enterprise Tier Card */}
        <div className="relative rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-900 to-amber-950/30 border-2 border-amber-500/60 p-8 flex flex-col justify-between hover:border-amber-400 transition duration-300 shadow-2xl overflow-hidden">
          {/* Featured Badge */}
          <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl shadow-md">
            Most Popular for Agencies
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Building2 className="h-3.5 w-3.5" />
                <span>Unlimited Pass</span>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">Full Campaign License</span>
            </div>

            <h3 className="text-2xl font-black text-white">Enterprise Agency Pass</h3>
            <p className="text-xs text-neutral-400 mt-2 min-h-[36px]">
              Designed for production houses, ad agencies, and fashion brands managing multi-talent campaigns.
            </p>

            <div className="my-6 pt-4 border-t border-neutral-800 flex items-baseline space-x-2">
              <span className="text-4xl font-black text-amber-400">₹4,999</span>
              <span className="text-sm font-semibold text-neutral-400">($499 USD)</span>
              <span className="text-xs text-neutral-500 font-mono">/ full access</span>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Unlimited Model Unlocks Across All Indian Cities',
                'Priority AI Talent Matching & Availability Matrix',
                'Direct Escrow Verification & Auto PDF Contract Generator',
                'Dedicated Account Director & Priority Hotline',
                'Commercial Multi-City Shoot Licensing Included'
              ].map((feature, i) => (
                <li key={i} className="flex items-start space-x-3 text-xs text-neutral-200">
                  <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <button
              onClick={() => handleOpenPayment('enterprise')}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-black font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition duration-200 cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
            >
              <Award className="h-4 w-4 text-black" />
              <span>Pay Now — Upgrade to Enterprise Pass (₹4,999 / $499)</span>
            </button>
            <p className="text-[10px] text-center text-amber-400/80 mt-2 font-mono">
              Includes Official GST Tax Invoice & Escrow Protection
            </p>
          </div>
        </div>

      </div>

      {/* Value Pillars */}
      <div className="max-w-4xl mx-auto border-t border-neutral-800 pt-16">
        <h2 className="text-xl font-bold text-center text-white mb-8">
          Why Choose ModelVerse India Certified Unlocks?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
            <ShieldCheck className="h-8 w-8 text-purple-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Anti-Spam Talent Protection</h4>
            <p className="text-xs text-neutral-400">
              Verified passes prevent unauthorized scraping, keeping talent privacy secure.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
            <Lock className="h-8 w-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Direct Agency Verification</h4>
            <p className="text-xs text-neutral-400">
              Connect directly with official representation without middleman markups.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
            <Sparkles className="h-8 w-8 text-pink-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Instant Escrow Security</h4>
            <p className="text-xs text-neutral-400">
              Payments remain in escrow until shoot details are accepted and verified.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => setCurrentTab('models')}
            className="inline-flex items-center space-x-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
          >
            <span>Explore Models Directory</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Razorpay / UPI Payment Modal Integration */}
      <PremiumUnlockModal
        model={targetModel}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccessUnlock={handlePaymentSuccess}
        planType={selectedPlan}
        userId={userEmail || 'client_user'}
        userName={currentUserName || (userEmail ? userEmail.split('@')[0] : 'Client')}
        userEmail={userEmail || 'client@modelverse.in'}
      />
    </div>
  );
}
