/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle, Clock, ShieldAlert, FileText, Lock, DollarSign, ExternalLink } from 'lucide-react';
import { PREMIUM_UNLOCK_AMOUNT } from '../../types';

interface TabProps {
  type: 'about' | 'contact' | 'disclaimer' | 'google-terms' | 'google-privacy' | 'affiliate-disclosure';
}

export default function AboutContact({ type }: TabProps) {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setUserName('');
    setUserEmail('');
    setSubject('');
    setMessage('');
  };

  const faqs = [
    {
      q: `How does the ₹${PREMIUM_UNLOCK_AMOUNT} Premium Profile Unlock work?`,
      a: `By paying a minor one-time ₹${PREMIUM_UNLOCK_AMOUNT} certification fee via Razorpay, you securely unlock complete verified measurements, agency direct info, and full-resolution portfolio comps. This helps keep modeling talent safe from unsolicited scouting or marketing spam in India.`
    },
    {
      q: "Is there an escrow protection for client payments in India?",
      a: "Yes! 100% of agreed budget payments are held in secure platform escrow accounts during campaign schedules. Funds are only distributed to models' or agencies' registered bank nodes when clients and talents digitally sign off on campaign deliverables."
    },
    {
      q: "How long does model portfolio approval take?",
      a: "Our casting moderation panel verifies passport/Aadhaar compliance proofs and portfolio quality guidelines within 3-4 hours of talent submitting their registrations."
    },
    {
      q: "Can I manage multiple modeling agencies under ModelVerse India?",
      a: "Enterprise agency multi-account management is currently on our active roadmap for release in late 2026. For now, booking managers can set agency ref contacts directly under model specs."
    }
  ];

  if (type === 'disclaimer') {
    return (
      <div id="disclaimer-portal" className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8 space-y-10 text-neutral-805 dark:text-white transition-colors duration-250 animate-fadeIn">
        <div className="text-center space-y-4">
          <span className="font-mono text-xs font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1.5">
            LEGAL DISCLAIMERS
          </span>
          <h2 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-2">
            General Platform Disclaimer
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xs sm:text-sm text-neutral-500 dark:text-zinc-400">
            Please read these notices and system parameters carefully before using our premium model discovery and digital escrow ecosystem.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-neutral-200 dark:border-white/5 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-[#D4AF37] shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">1. No Agency Guarantee or Direct Representation</h3>
              <p className="text-xs text-neutral-600 dark:text-zinc-400 mt-2 leading-relaxed">
                ModelVerse India acts solely as a secure interactive technology medium connecting independent professional artists and booking brand coordinators. We do not operate as an exclusive modeling agency, employer, or talent management company. We do not guarantee callbacks, successful campaigns, or earnings of any kind.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-neutral-100 dark:border-white/5 pt-6">
            <Clock className="h-5 w-5 text-indigo-400 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">2. Escrow & Contract Limitations</h3>
              <p className="text-xs text-neutral-600 dark:text-zinc-400 mt-2 leading-relaxed">
                While ModelVerse maintains secure digital escrow wallets for campaigns, we are not a financial institution. Any disputes regarding contract performance, shoot timelines, and image rights clearances must be settled directly between the client and the model as specified in their platform-generated work agreements.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-neutral-100 dark:border-white/5 pt-6">
            <Lock className="h-5 w-5 text-emerald-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">3. Verification & Profile Accuracy</h3>
              <p className="text-xs text-neutral-600 dark:text-zinc-400 mt-2 leading-relaxed">
                We make reasonable efforts to verify the identity (via Aadhaar, passport, and real-time Selfie-Verification checks) of participating talents. However, users are strictly advised to exercise professional caution, schedule initial meetings in safe studio settings, and verify credentials independently before agreeing to physical bookings.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-zinc-500 font-mono">
            ModelVerse India Escrow System • Version 3.4 • All platform rights reserved.
          </p>
        </div>
      </div>
    );
  }

  if (type === 'google-terms') {
    return (
      <div id="google-terms-portal" className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8 space-y-10 text-neutral-805 dark:text-white transition-colors duration-250 animate-fadeIn">
        <div className="text-center space-y-4">
          <span className="font-mono text-xs font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5">
            GOOGLE TERMS & CONDITIONS
          </span>
          <h2 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-2">
            Google Terms of Service
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xs sm:text-sm text-neutral-500 dark:text-zinc-400">
            ModelVerse India integrates with Google services. Please find the core terms and official policies below.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-neutral-200 dark:border-white/5 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-[#D4AF37] shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Google Services Integration</h3>
              <p className="text-xs text-neutral-600 dark:text-zinc-400 mt-2 leading-relaxed">
                By signing in with Google, utilizing Google Maps Platform widgets, or accessing calendar/email sync parameters within ModelVerse India, you acknowledge and agree that your usage is subject to the official Google Terms of Service and applicable product policies.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-neutral-100 dark:border-white/5 pt-6">
            <ShieldAlert className="h-5 w-5 text-indigo-400 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">User Code of Conduct</h3>
              <p className="text-xs text-neutral-600 dark:text-zinc-400 mt-2 leading-relaxed">
                You must comply with Google's policies for non-harmful, non-abusive usage of credentials and integrations. Spamming, unauthorized harvesting, or automated credential stuffing will result in permanent service termination.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center items-center">
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-5 py-3 bg-gradient-to-tr from-[#D4AF37] to-[#F9E29C] text-black text-xs font-black rounded-full hover:brightness-110 shadow-md transition cursor-pointer"
            >
              <span>View Official Google Terms of Service</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'google-privacy') {
    return (
      <div id="google-privacy-portal" className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8 space-y-10 text-neutral-805 dark:text-white transition-colors duration-250 animate-fadeIn">
        <div className="text-center space-y-4">
          <span className="font-mono text-xs font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-1.5">
            GOOGLE PRIVACY POLICY
          </span>
          <h2 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-2">
            Google Privacy & Opt-Out Policy
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xs sm:text-sm text-neutral-500 dark:text-zinc-400">
            Learn how user data is securely managed, tracked, and how to configure your browser opt-outs.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-neutral-200 dark:border-white/5 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-emerald-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Privacy Commitment</h3>
              <p className="text-xs text-neutral-600 dark:text-zinc-400 mt-2 leading-relaxed">
                ModelVerse India prioritizes user privacy. When signing in or registering profiles, we securely store credential references and contact details. We do not sell or lease private modeling data or contact specifications to unsolicited marketers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-neutral-100 dark:border-white/5 pt-6">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Google Opt-Out Controls</h3>
              <p className="text-xs text-neutral-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Because we utilize Google AdSense tracking pixels and analytical insights, you can manage your personalized advertising options, opt-out of Google cookies, or configure browser settings directly on Google's privacy settings network.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center items-center">
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-5 py-3 bg-gradient-to-tr from-neutral-800 to-neutral-700 dark:from-neutral-700 dark:to-neutral-600 text-white text-xs font-bold rounded-full hover:brightness-110 shadow-md transition cursor-pointer"
            >
              <span>View Official Google Privacy Policy</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'affiliate-disclosure') {
    return (
      <div id="affiliate-disclosure-portal" className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8 space-y-10 text-neutral-805 dark:text-white transition-colors duration-250 animate-fadeIn">
        <div className="text-center space-y-4">
          <span className="font-mono text-xs font-black uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-3 py-1.5">
            FTC AFFILIATE & EARNINGS DISCLOSURE
          </span>
          <h2 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-2">
            Affiliate and Earning Disclaimer
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xs sm:text-sm text-neutral-500 dark:text-zinc-400">
            Complete transparency on platform sponsorships, product recommendations, and advertising commissions.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-neutral-200 dark:border-white/5 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-amber-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">FTC Guidelines & Commission Disclosure</h3>
              <p className="text-xs text-neutral-600 dark:text-zinc-400 mt-2 leading-relaxed">
                In compliance with the Federal Trade Commission (FTC) guidelines and consumer safety laws globally, please assume that certain product links, brand recommendations, hardware items, photoshoot kits, and talent training workshops linked from ModelVerse India represent affiliate placements. 
              </p>
              <p className="text-xs text-neutral-600 dark:text-zinc-400 mt-2 leading-relaxed font-semibold">
                This means we may earn a commercial commission or referral fee if you purchase products or services through those external destinations. This commission does not alter your final price or add any overhead costs to your checkout.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-neutral-100 dark:border-white/5 pt-6">
            <FileText className="h-5 w-5 text-indigo-400 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Advertising & Google AdSense Operations</h3>
              <p className="text-xs text-neutral-600 dark:text-zinc-400 mt-2 leading-relaxed">
                We implement these affiliate commission structures alongside Google AdSense contextual placements, direct brand sponsors, and paid model profiles. This multiple-stream monetization framework enables us to continuously operate, expand, and offer state-of-the-art escrow contract tools for modeling talent and agencies in India.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'about') {
    return (
      <div id="about-us-portal" className="mx-auto max-w-5xl py-12 px-4 sm:px-6 lg:px-8 space-y-16 text-neutral-850 dark:text-white transition-colors duration-250">
        
        {/* Mission block */}
        <div className="text-center space-y-4">
          <span className="font-mono text-xs font-black uppercase tracking-widest text-[#D4AF37] bg-neutral-100 dark:bg-white/5 border border-[#D4AF37]/30 rounded-full px-3 py-1.5">
            ESTABLISHED 2026
          </span>
          <h2 className="font-sans text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-4">
            India's Leading Casting Ecosystem
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-sm sm:text-base text-neutral-600 dark:text-zinc-400 leading-relaxed font-normal">
            ModelVerse India specializes in streamlining model discovery, secure contract escrow, real-time campaign chat arrangements, and automated financial settlements. We empower brands, couturiers, and event directors to connect seamlessly with verified models, actors, event hosts, and digital UGC creators.
          </p>
        </div>

        {/* Corporate core metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="rounded-2xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-[#121212] p-6 shadow-2xl">
            <strong className="block text-3xl font-extrabold text-[#D4AF37]">6 +</strong>
            <span className="text-xs text-neutral-500 dark:text-zinc-450 mt-1.5 block uppercase font-mono tracking-wider font-bold">Niche Agencies Consolidated</span>
          </div>
          <div className="rounded-2xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-[#121212] p-6 shadow-2xl">
            <strong className="block text-3xl font-extrabold text-[#D4AF37]">₹25,00,000 +</strong>
            <span className="text-xs text-neutral-500 dark:text-zinc-450 mt-1.5 block uppercase font-mono tracking-wider font-bold">Escrow Settled Safely</span>
          </div>
          <div className="rounded-2xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-[#121212] p-6 shadow-2xl">
            <strong className="block text-3xl font-extrabold text-[#D4AF37]">100%</strong>
            <span className="text-xs text-neutral-500 dark:text-zinc-450 mt-1.5 block uppercase font-mono tracking-wider font-bold">Selfie & ID Verified Talent</span>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="border-t border-neutral-200 dark:border-white/5 pt-12">
          <div className="mb-8 text-center sm:text-left">
            <h3 className="font-sans text-xl font-black text-neutral-900 dark:text-white">Frequently Asked Questions</h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-450 mt-1">Get fast guidance on casting approvals, payments, and client rules.</p>
          </div>

          <div className="space-y-4 max-w-4xl">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-[#121212] shadow-2xl overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-sans text-xs sm:text-sm font-bold text-neutral-800 dark:text-white hover:bg-neutral-50 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <HelpCircle className="h-4.5 w-4.5 text-[#D4AF37] shrink-0" />
                </button>
                {activeFaq === idx && (
                  <div className="p-4 pt-0 border-t border-neutral-200 dark:border-white/5 text-[11px] sm:text-xs text-neutral-600 dark:text-zinc-400 leading-relaxed font-semibold bg-neutral-50/50 dark:bg-black/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // CONTACT US PORTAL
  return (
    <div id="contact-us-portal" className="mx-auto max-w-5xl py-12 px-4 sm:px-6 lg:px-8 text-neutral-850 dark:text-white animate-fadeIn transition-colors duration-250">
      <div className="mb-12 text-center">
        <h2 className="font-sans text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Contact ModelVerse India Support
        </h2>
        <p className="mt-3 text-xs text-neutral-500 dark:text-zinc-450 max-w-md mx-auto leading-relaxed">
          Need special casting coordination, bulk enterprise contracts, or invoice mediation? Reach our support crew 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Contact info details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-[#121212] p-6 shadow-2xl space-y-6 text-xs text-neutral-600 dark:text-zinc-400">
            <h4 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">Casting Head Office</h4>
            
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 dark:text-white">C-326 Nariman Point</strong>
                <p className="text-neutral-500 dark:text-zinc-500 mt-1">Marine Drive East, Mumbai, Maharashtra 400021</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 dark:text-white">Call Support Nodes</strong>
                <p className="text-neutral-500 dark:text-zinc-500 mt-1">+91 8377998636 (Escrow Help)</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 dark:text-white">Corporate Inquiries</strong>
                <p className="text-neutral-500 dark:text-zinc-500 mt-1">info.business.mv@modelverseindia.com</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 dark:text-white">Business Hours</strong>
                <p className="text-neutral-500 dark:text-zinc-500 mt-1">10:00 AM - 7:00 PM (Monday - Saturday)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form panel */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121212] border border-neutral-200 dark:border-white/5 rounded-2xl p-6 shadow-2xl">
          {submitted ? (
            <div className="text-center py-12 space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-550/15 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce border border-emerald-500/30">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-base font-extrabold text-neutral-900 dark:text-white">Message Transmitted!</h3>
              <p className="text-xs text-neutral-500 dark:text-zinc-400 max-w-sm mx-auto">
                We have logged your escalation concern. A Senior Casting Manager will follow up at your email in 90 minutes.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 rounded-full border border-neutral-300 dark:border-white/10 px-5 py-2 text-xs font-semibold text-neutral-750 dark:text-white hover:bg-neutral-50 dark:hover:bg-white/10 transition cursor-pointer"
              >
                Send another dispatch
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-350 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aman Sethi"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-[#FCFBF9] dark:bg-white/5 px-3 py-2 text-xs font-medium text-neutral-800 dark:text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-350 mb-1">Your Corporate Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. aman@company.co"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-[#FCFBF9] dark:bg-white/5 px-3 py-2 text-xs font-medium text-neutral-800 dark:text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-350 mb-1">Subject Matter *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Request support with bulk corporate bookings"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-[#FCFBF9] dark:bg-white/5 px-3 py-2 text-xs font-medium text-neutral-800 dark:text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-350 mb-1">Detailed Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your casting escalation, bank payout questions..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-[#FCFBF9] dark:bg-white/5 px-3 py-2 text-xs font-medium text-neutral-800 dark:text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F9E29C] text-black text-xs font-black flex items-center justify-center space-x-1.5 transition active:scale-98 hover:brightness-110 cursor-pointer shadow-lg"
              >
                <Send className="h-4 w-4" />
                <span>Transmit Escalation Protocol</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
