/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, TrendingUp, DollarSign, Calendar, Eye, Archive, 
  CheckCircle, XCircle, AlertCircle, Settings, User as UserIcon, 
  MapPin, Activity, FileText, Sparkles, Star, Check, ChevronDown, 
  ShieldCheck, Building, Clock, ArrowUpRight, UploadCloud, Loader2, 
  X, Instagram, Twitter, Globe, Percent, Plus, Download, RotateCcw, 
  RotateCw, ZoomIn, ZoomOut, Sliders, Camera, Award
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Model, Booking, BookingStatus, PaymentRecord } from '../../types';
import { dbService } from '../../services/db';
import { useApp } from '../../context/AppContext';
import AICreativeStudio from './AICreativeStudio';

interface AgentDashboardProps {
  models: Model[];
  bookings: Booking[];
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  onUpdateModel: (updatedModel: Model) => void;
  triggerToast: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
  onUpdateBooking?: (updatedBooking: Booking) => void;
}

export default function AgentDashboard({
  models,
  bookings,
  onUpdateBookingStatus,
  onUpdateModel,
  triggerToast,
  onUpdateBooking
}: AgentDashboardProps) {
  const { setCurrentTab } = useApp();

  // Find registered model or default to first model
  const currentUser = dbService.getCurrentSessionUser();
  const defaultModel = (currentUser && models.find(m => m.userId === currentUser.id || m.email?.toLowerCase() === currentUser.email?.toLowerCase())) || models[0];
  const [selectedModelId, setSelectedModelId] = useState<string>(defaultModel?.id || '');

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'job-board' | 'bookings' | 'profile' | 'payouts' | 'ai-studio'>('overview');
  const [bookingSubFilter, setBookingSubFilter] = useState<'assigned' | 'accepted' | 'completed' | 'all'>('assigned');
  const [clientJobs, setClientJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobs = await dbService.getJobRequirements();
        setClientJobs(jobs);
      } catch (err) {
        console.warn('Failed to load client jobs in AgentDashboard:', err);
      }
    };
    fetchJobs();
    const timer = setInterval(fetchJobs, 3000);
    return () => clearInterval(timer);
  }, []);

  // Keep selected model in sync with logged-in user if they are a model
  useEffect(() => {
    const user = dbService.getCurrentSessionUser();
    if (user && user.role === 'model') {
      const myModel = models.find(m => m.userId === user.id || m.email?.toLowerCase() === user.email?.toLowerCase());
      if (myModel && myModel.id !== selectedModelId) {
        setSelectedModelId(myModel.id);
      }
    }
  }, [models, selectedModelId]);

  // Active Model instance
  const activeModel = models.find(m => m.id === selectedModelId);

  // Profile Edit state
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [startingPrice, setStartingPrice] = useState<number>(15000);
  const [biography, setBiography] = useState('');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [socialPortfolio, setSocialPortfolio] = useState('');
  const [portfolio1, setPortfolio1] = useState('');
  const [portfolio2, setPortfolio2] = useState('');
  const [portfolio3, setPortfolio3] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Crop & Rotate Modal state
  const [editingImage, setEditingImage] = useState<{
    src: string;
    key: string;
    callback: (base64: string) => void;
  } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);

  // Sync edit fields when active model changes
  useEffect(() => {
    if (activeModel) {
      setName(activeModel.name || '');
      setCity(activeModel.city || '');
      setStartingPrice(activeModel.startingPrice || 15000);
      setBiography(activeModel.biography || '');
      setBust(activeModel.measurements?.bust || '34"');
      setWaist(activeModel.measurements?.waist || '26"');
      setHips(activeModel.measurements?.hips || '36"');
      setPhone(activeModel.phone || '');
      setEmail(activeModel.email || '');
      setVideoUrl(activeModel.videoUrl || '');
      setInstagram(activeModel.socialLinks?.instagram || '');
      setTwitter(activeModel.socialLinks?.twitter || '');
      setSocialPortfolio(activeModel.socialLinks?.portfolio || '');
      setPortfolio1(activeModel.portfolio?.[0] || '');
      setPortfolio2(activeModel.portfolio?.[1] || '');
      setPortfolio3(activeModel.portfolio?.[2] || '');
    }
  }, [selectedModelId, activeModel]);

  if (!activeModel) {
    return (
      <div className="mx-auto max-w-2xl py-20 px-6 text-center text-white font-sans animate-fadeIn">
        <div className="inline-flex p-4 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-6 shadow-xl">
          <Sparkles className="h-10 w-10 text-purple-400" />
        </div>
        <h3 className="text-2xl font-black tracking-tight">No Registered Model Profile Found</h3>
        <p className="text-zinc-400 mt-2 text-sm max-w-md mx-auto leading-relaxed font-medium">
          You are logged in as a model, but haven't completed your model registration form yet. Submit your profile details to list yourself on ModelVerse India.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => setCurrentTab('become-model')}
            className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 transition cursor-pointer"
          >
            Complete Model Registration
          </button>
        </div>
      </div>
    );
  }

  // Model-specific booking matching helper
  const isMyBooking = (b: Booking) => {
    const mId = activeModel.id;
    const uId = activeModel.userId;
    const modelEmail = activeModel.email?.toLowerCase();
    const modelName = activeModel.name?.toLowerCase();

    const matchId = b.modelId === mId || b.modelId === uId;
    const matchDetails = b.projectDetails && ((b.projectDetails as any)?.modelId === mId || (b.projectDetails as any)?.modelId === uId);
    const matchEmail = modelEmail && (b as any).modelEmail?.toLowerCase() === modelEmail;
    const matchName = modelName && b.modelName?.toLowerCase() === modelName;
    return matchId || matchDetails || matchEmail || matchName;
  };

  // Model Bookings: ONLY include bookings approved/assigned by Admin (exclude pending, rejected, and cancelled)
  const allMyBookings = bookings.filter(b => isMyBooking(b));
  const approvedBookings = allMyBookings.filter(b => b.status !== 'pending' && b.status !== 'rejected' && b.status !== 'cancelled');

  const assignedBookings = approvedBookings.filter(b => b.status === 'assigned');
  const acceptedBookings = approvedBookings.filter(b => b.status === 'accepted');
  const completedBookings = approvedBookings.filter(b => b.status === 'completed');

  // Earnings calculations
  const completedEarnings = completedBookings.reduce((sum, b) => sum + (b.priceAmount || activeModel.startingPrice || 15000), 0);
  const activeEarnings = acceptedBookings.reduce((sum, b) => sum + (b.priceAmount || activeModel.startingPrice || 15000), 0);
  const pendingEarnings = assignedBookings.reduce((sum, b) => sum + (b.priceAmount || activeModel.startingPrice || 15000), 0);
  const totalEarnings = completedEarnings + activeEarnings;

  // Profile Analytics
  const seedViewsValue = activeModel.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const profileViews = Math.round((activeModel.rating * 150) + (approvedBookings.length * 45) + (seedViewsValue % 450) + 215);
  const conversionRate = approvedBookings.length > 0
    ? (((acceptedBookings.length + completedBookings.length) / approvedBookings.length) * 100).toFixed(1)
    : '100.0';

  // Filtered Bookings for the Bookings Tab
  const filteredTabBookings = approvedBookings.filter(b => {
    if (bookingSubFilter === 'assigned') return b.status === 'assigned';
    if (bookingSubFilter === 'accepted') return b.status === 'accepted';
    if (bookingSubFilter === 'completed') return b.status === 'completed';
    return true;
  });

  // Toggle profile archiving
  const handleToggleVisibility = async () => {
    const nextArchived = !activeModel.archived;
    const updated: Model = {
      ...activeModel,
      archived: nextArchived
    };

    try {
      await dbService.saveModel(updated);
      onUpdateModel(updated);
      triggerToast(
        nextArchived ? 'Profile Archived' : 'Profile Live',
        nextArchived 
          ? `${activeModel.name} has been archived. Profile is hidden from search directory.` 
          : `${activeModel.name} is now live on the public directory!`,
        'success'
      );
    } catch (err) {
      console.error('Failed to update visibility:', err);
      triggerToast('Error', 'Failed to update visibility settings.', 'error');
    }
  };

  // Handle saving model profile edits
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const portfolioArray: string[] = [];
    if (portfolio1) portfolioArray.push(portfolio1);
    if (portfolio2) portfolioArray.push(portfolio2);
    if (portfolio3) portfolioArray.push(portfolio3);

    const updated: Model = {
      ...activeModel,
      name,
      city,
      startingPrice: Number(startingPrice) || 15000,
      biography,
      phone,
      email,
      videoUrl,
      portfolio: portfolioArray,
      measurements: {
        bust,
        waist,
        hips
      },
      socialLinks: {
        instagram,
        twitter,
        portfolio: socialPortfolio
      }
    };

    try {
      await dbService.saveModel(updated);
      onUpdateModel(updated);
      triggerToast(
        'Profile Saved!',
        `Your casting details and measurements have been updated in the system.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to save profile changes:', err);
      triggerToast('Error', 'Failed to update profile details.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // PDF Contract Generator for Model Bookings
  const downloadBookingContract = (b: Booking) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(20, 20, 25);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('MODELVERSE INDIA', 14, 22);

      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      doc.text('OFFICIAL CAMPAIGN CASTING AGREEMENT', 14, 30);

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Booking Reference: ${b.id}`, 14, 55);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Brand / Client: ${b.projectDetails?.brandName || b.clientName}`, 14, 65);
      doc.text(`Model Talent: ${b.modelName}`, 14, 73);
      doc.text(`Shoot Date: ${b.projectDetails?.date || 'As Agreed'}`, 14, 81);
      doc.text(`Location: ${b.projectDetails?.location || 'Studio Set'}`, 14, 89);
      doc.text(`Agreed Fee: ₹${(b.priceAmount || activeModel.startingPrice || 15000).toLocaleString()}`, 14, 97);
      doc.text(`Escrow Status: ${b.status.toUpperCase()}`, 14, 105);

      doc.save(`ModelVerse_Contract_${b.id}.pdf`);
      triggerToast('Contract Downloaded', 'PDF campaign agreement summary saved.', 'success');
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Profile Command Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-neutral-900/90 border border-neutral-800 p-6 rounded-3xl shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <img
                src={activeModel.portfolio?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80'}
                alt={activeModel.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-purple-500/40 shadow-lg"
              />
              {activeModel.selfieVerified && (
                <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-neutral-950 p-1 rounded-full shadow" title="Selfie Verified Talent">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white">{activeModel.name}</h1>
                <span className="px-3 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full font-mono">
                  {activeModel.category}
                </span>
              </div>
              <p className="text-xs text-neutral-400 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span>{activeModel.city}, {activeModel.state || 'India'}</span>
                <span>•</span>
                <span className="text-purple-300 font-bold font-mono">₹{activeModel.startingPrice?.toLocaleString()}/day</span>
              </p>
              
              <div className="flex items-center gap-2 pt-1">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  activeModel.approved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {activeModel.approved ? 'Profile Live & Verified' : 'Pending Admin Verification'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  !activeModel.archived ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {!activeModel.archived ? 'Visible on Directory' : 'Archived'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleVisibility}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border ${
                activeModel.archived
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>{activeModel.archived ? 'Publish Profile' : 'Archive Profile'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto scrollbar-none select-none">
          {[
            { id: 'overview', label: 'Overview', icon: Activity, count: null },
            { id: 'job-board', label: 'Live Client Casting Requirements', icon: Briefcase, count: clientJobs.length },
            { id: 'bookings', label: 'Campaign Bookings', icon: Calendar, count: assignedBookings.length > 0 ? `🚨 ${assignedBookings.length} Action Needed` : approvedBookings.length },
            { id: 'profile', label: 'Edit Profile & Portfolio', icon: Settings, count: null },
            { id: 'payouts', label: 'Earnings & Payouts', icon: DollarSign, count: null },
            { id: 'ai-studio', label: 'AI Creative Studio', icon: Sparkles, count: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-neutral-800 text-neutral-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Action Needed Banner for Assigned Bookings */}
            {assignedBookings.length > 0 && (
              <div className="bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-neutral-900 border border-purple-500/40 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-purple-900/20">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-purple-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-purple-200">
                      {assignedBookings.length} Campaign Proposal{assignedBookings.length > 1 ? 's' : ''} Approved by Admin & Awaiting Your Confirmation!
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Admin has reviewed and assigned client campaign requests to you. Review project details and accept or decline.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setBookingSubFilter('assigned');
                    setActiveTab('bookings');
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl transition cursor-pointer whitespace-nowrap shadow-md"
                >
                  Review Assigned Proposals ({assignedBookings.length}) &rarr;
                </button>
              </div>
            )}

            {/* Live Client Casting Requirements Alert Banner */}
            {clientJobs.length > 0 && (
              <div className="bg-gradient-to-r from-pink-950/40 via-purple-900/20 to-neutral-900 border border-purple-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-pink-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-purple-200">
                      {clientJobs.length} Live Client Casting Requirement{clientJobs.length > 1 ? 's' : ''} Active!
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Explore active brand casting calls and submit your portfolio directly to clients.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('job-board')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl transition cursor-pointer whitespace-nowrap shadow-md"
                >
                  View Casting Calls ({clientJobs.length}) &rarr;
                </button>
              </div>
            )}

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Earnings</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">₹{totalEarnings.toLocaleString()}</div>
                <p className="text-[11px] text-emerald-400 font-medium">Secured campaign payouts</p>
              </div>

              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Campaigns</span>
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{acceptedBookings.length}</div>
                <p className="text-[11px] text-purple-400 font-medium">Accepted shoots in progress</p>
              </div>

              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Profile Views</span>
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{profileViews.toLocaleString()}</div>
                <p className="text-[11px] text-blue-400 font-medium">Directory impressions</p>
              </div>

              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Acceptance Rate</span>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{conversionRate}%</div>
                <p className="text-[11px] text-amber-400 font-medium">Casting completion metric</p>
              </div>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-purple-400" />
                Live Portfolio Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Daily Starting Rate</span>
                  <div className="text-lg font-black text-emerald-400 font-mono">₹{activeModel.startingPrice?.toLocaleString()}/day</div>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Body Measurements</span>
                  <div className="text-xs font-bold text-neutral-200">
                    Bust: {activeModel.measurements?.bust || '34"'} • Waist: {activeModel.measurements?.waist || '26"'} • Hips: {activeModel.measurements?.hips || '36"'}
                  </div>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Portfolio Photos</span>
                  <div className="text-xs font-bold text-neutral-200">{activeModel.portfolio?.length || 0} Uploaded Images</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CASTING JOB BOARD */}
        {activeTab === 'job-board' && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-2xl space-y-2">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                Live Client Casting Requirements ({clientJobs.length})
              </h3>
              <p className="text-xs text-neutral-400">
                Browse project specifications posted directly by production houses, brands, and agencies. Click <strong>Apply for Casting</strong> to send a direct message with your portfolio link.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clientJobs.map((job) => (
                <div key={job.id} className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-purple-400 font-mono tracking-wider">{job.category}</span>
                        <h4 className="text-base font-black text-white mt-0.5">{job.companyName}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-bold shrink-0">
                        {job.budget}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {job.requirements}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-neutral-800">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                      <span>Location: <strong className="text-neutral-200">{job.location}</strong></span>
                      <span>Date: <strong className="text-neutral-200">{job.shootDate || 'Immediate'}</strong></span>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          await dbService.applyForJobRequirement(job, activeModel);
                          triggerToast(
                            'Application Sent!',
                            `Your profile and direct message have been sent to ${job.companyName}.`,
                            'success'
                          );
                        } catch (err) {
                          console.error('Application failed:', err);
                          triggerToast('Error', 'Failed to send application.', 'error');
                        }
                      }}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Apply for Casting</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CAMPAIGN BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Booking Filter Pills */}
            <div className="flex items-center gap-2 bg-neutral-900/80 border border-neutral-800 p-2 rounded-2xl overflow-x-auto scrollbar-none">
              {[
                { id: 'assigned', label: 'Action Needed (Assigned)', count: assignedBookings.length },
                { id: 'accepted', label: 'Active Campaigns', count: acceptedBookings.length },
                { id: 'completed', label: 'Completed', count: completedBookings.length },
                { id: 'all', label: 'All Approved Bookings', count: approvedBookings.length },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setBookingSubFilter(sub.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    bookingSubFilter === sub.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                >
                  <span>{sub.label}</span>
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/10 font-mono">
                    {sub.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Bookings Display Grid */}
            {filteredTabBookings.length === 0 ? (
              <div className="text-center py-16 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl space-y-3">
                <Calendar className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">No campaign bookings in "{bookingSubFilter}" filter</p>
                <p className="text-[11px] text-neutral-500">Client proposals will show up here after being reviewed and approved by the admin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTabBookings.map((booking) => {
                  const isAssigned = booking.status === 'assigned';
                  const isAccepted = booking.status === 'accepted';
                  const isCompleted = booking.status === 'completed';

                  return (
                    <div key={booking.id} className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 font-mono">
                            {booking.projectDetails?.campaignType || 'Casting Campaign'}
                          </span>
                          <h4 className="text-base font-black text-white mt-0.5">
                            {booking.projectDetails?.brandName || 'Brand Project'}
                          </h4>
                          <p className="text-xs text-neutral-400 mt-1">Client: <span className="text-neutral-200 font-bold">{booking.clientName}</span></p>
                        </div>

                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider ${
                          isAssigned
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : isAccepted
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {isAssigned ? 'Awaiting Your Accept' : isAccepted ? 'Active / Escrow Secured' : 'Completed'}
                        </span>
                      </div>

                      <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-neutral-300">
                          <span>Shoot Date:</span>
                          <span className="font-mono font-bold text-white">{booking.projectDetails?.date || 'To be scheduled'}</span>
                        </div>
                        <div className="flex items-center justify-between text-neutral-300">
                          <span>Shoot Location:</span>
                          <span className="font-medium text-neutral-200">{booking.projectDetails?.location || 'Studio Location'}</span>
                        </div>
                        <div className="flex items-center justify-between text-neutral-300 pt-1 border-t border-neutral-800/60">
                          <span>Agreed Fee:</span>
                          <span className="font-bold font-mono text-emerald-400 text-sm">
                            ₹{(booking.priceAmount || activeModel.startingPrice || 15000).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 flex items-center justify-between gap-3">
                        <button
                          onClick={() => downloadBookingContract(booking)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF Contract</span>
                        </button>

                        {isAssigned && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onUpdateBookingStatus(booking.id, 'rejected')}
                              className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition cursor-pointer"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => onUpdateBookingStatus(booking.id, 'accepted')}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-600/20"
                            >
                              <Check className="w-4 h-4" />
                              <span>Accept Booking</span>
                            </button>
                          </div>
                        )}

                        {isAccepted && (
                          <button
                            onClick={() => onUpdateBookingStatus(booking.id, 'completed')}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EDIT PROFILE & PORTFOLIO */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveDetails} className="space-y-6 animate-fadeIn">
            <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-2xl space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Settings className="w-4 h-4 text-purple-400" />
                Casting Details & Rate Card
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-400 mb-1">Full Stage Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-400 mb-1">City Base</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-400 mb-1">Daily Starting Rate (₹ INR)</label>
                  <input
                    type="number"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-400 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Measurements */}
              <div className="space-y-3 pt-2">
                <label className="block font-bold text-neutral-400 text-xs uppercase tracking-wider">Vital Measurements</label>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-500 block mb-1">Bust</span>
                    <input
                      type="text"
                      value={bust}
                      onChange={(e) => setBust(e.target.value)}
                      placeholder='e.g. 34"'
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 block mb-1">Waist</span>
                    <input
                      type="text"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      placeholder='e.g. 26"'
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 block mb-1">Hips</span>
                    <input
                      type="text"
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      placeholder='e.g. 36"'
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="block font-bold text-neutral-400 text-xs">Biography & Experience Overview</label>
                <textarea
                  rows={3}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Portfolio Photos */}
              <div className="space-y-3 pt-2">
                <label className="block font-bold text-neutral-400 text-xs uppercase tracking-wider">Portfolio Gallery Images</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { val: portfolio1, setter: setPortfolio1, label: 'Primary Cover Image' },
                    { val: portfolio2, setter: setPortfolio2, label: 'Runway / Editorial' },
                    { val: portfolio3, setter: setPortfolio3, label: 'Commercial Look' },
                  ].map((p, i) => (
                    <div key={i} className="space-y-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 font-bold block">{p.label}</span>
                      {p.val ? (
                        <div className="relative group">
                          <img src={p.val} alt="" className="w-full h-32 rounded-lg object-cover border border-neutral-700" />
                          <button
                            type="button"
                            onClick={() => p.setter('')}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={p.val}
                          onChange={(e) => p.setter(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-purple-600/30 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Profile Details</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 4: EARNINGS & PAYOUTS */}
        {activeTab === 'payouts' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Completed Earnings</span>
                <div className="text-2xl font-black text-white">₹{completedEarnings.toLocaleString()}</div>
                <p className="text-[11px] text-emerald-400 font-medium">Ready for bank transfer</p>
              </div>

              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Active Escrow Balance</span>
                <div className="text-2xl font-black text-white">₹{activeEarnings.toLocaleString()}</div>
                <p className="text-[11px] text-purple-400 font-medium">Held in client escrow</p>
              </div>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Bank Payout Requests
              </h3>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Platform payouts are released directly to your verified bank account or UPI ID upon completion of active campaign assignments. Contact support or super admin for instant bank payouts.
              </p>
            </div>
          </div>
        )}

        {/* TAB 5: AI CREATIVE STUDIO */}
        {activeTab === 'ai-studio' && (
          <div className="animate-fadeIn">
            <AICreativeStudio userEmail={activeModel.email || 'model@modelverse.in'} triggerToast={triggerToast} />
          </div>
        )}

      </div>
    </div>
  );
}
