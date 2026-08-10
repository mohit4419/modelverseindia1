/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, Sparkles, TrendingUp, Users, DollarSign, Calendar, Eye, 
  Trash2, Ban, CheckCircle, RefreshCcw, ShieldCheck, Mail, Clock, 
  Zap, Check, X, Activity, Filter, Search, Database, UserCheck, 
  UserX, AlertCircle, ExternalLink, ChevronRight, Image as ImageIcon,
  SlidersHorizontal, CheckSquare
} from 'lucide-react';
import { Model, Booking, BookingStatus, PaymentRecord, User, AuditLog, Payout, PayoutStatus } from '../../types';
import { dbService } from '../../services/db';

interface AdminDashboardProps {
  models: Model[];
  bookings: Booking[];
  payments: PaymentRecord[];
  onApproveModel: (modelId: string) => void;
  onRejectModel: (modelId: string) => void;
  onSuspendUser: (userId: string) => void;
  onDeleteModel?: (modelId: string) => void;
  onDeleteUser?: (userId: string) => void;
  onUpdateBookingStatus?: (bookingId: string, status: BookingStatus) => void;
  onBatchApproveModels?: (modelIds: string[]) => void;
  onImpersonateUser?: (user: any) => void;
}

export default function AdminDashboard({
  models,
  bookings,
  payments,
  onApproveModel,
  onRejectModel,
  onSuspendUser,
  onDeleteModel,
  onDeleteUser,
  onUpdateBookingStatus,
  onBatchApproveModels,
  onImpersonateUser
}: AdminDashboardProps) {
  
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'talent' | 'users' | 'bookings' | 'financials' | 'database'>('overview');

  // Audit Logs & Payouts state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  // Model Moderation state
  const [talentFilter, setTalentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [talentSearch, setTalentSearch] = useState<string>('');
  const [selectedModelForView, setSelectedModelForView] = useState<Model | null>(null);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);

  // User Management state
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'client' | 'model' | 'agency' | 'admin' | 'suspended'>('all');
  const [userSearch, setUserSearch] = useState<string>('');

  // Booking Management state
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');

  // Supabase Database Connection states
  const [dbStatus, setDbStatus] = useState<'idle' | 'testing' | 'connected' | 'connected_no_tables' | 'error'>('idle');
  const [dbErrorMsg, setDbErrorMsg] = useState<string>('');

  // Load audit logs and users list
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const u = await dbService.getUsers();
      setUsersList(u || []);
    } catch (err) {
      console.error('Failed to fetch users list:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const unsubscribeAudit = dbService.subscribeToAuditLogs((logs) => {
      setAuditLogs(logs || []);
    });
    return () => {
      unsubscribeAudit();
    };
  }, []);

  const runDatabaseDiagnostics = async () => {
    setDbStatus('testing');
    setDbErrorMsg('');
    try {
      const res = await dbService.testSupabaseConnection();
      if (res.success) {
        setDbStatus(res.error === 'CONNECTED_NO_TABLES' ? 'connected_no_tables' : 'connected');
      } else {
        setDbStatus('error');
        setDbErrorMsg(res.error || 'Unknown Supabase connection error');
      }
    } catch (err: any) {
      setDbStatus('error');
      setDbErrorMsg(err.message || String(err));
    }
  };

  useEffect(() => {
    if (activeTab === 'database') {
      runDatabaseDiagnostics();
    }
  }, [activeTab]);

  // Model statistics
  const pendingModels = models.filter(m => m.approved === false && !m.rejected && (m as any).status !== 'suspended');
  const approvedModels = models.filter(m => m.approved === true && (m as any).status !== 'suspended');
  const rejectedModels = models.filter(m => m.rejected === true || (m as any).status === 'rejected');
  const suspendedModels = models.filter(m => (m as any).status === 'suspended');

  // Filtered models for Talent Tab
  const filteredModels = models.filter(m => {
    if (talentFilter === 'pending') {
      if (m.approved !== false || m.rejected || (m as any).status === 'suspended') return false;
    } else if (talentFilter === 'approved') {
      if (m.approved !== true || (m as any).status === 'suspended') return false;
    } else if (talentFilter === 'rejected') {
      if (!m.rejected && (m as any).status !== 'rejected') return false;
    } else if (talentFilter === 'suspended') {
      if ((m as any).status !== 'suspended') return false;
    }

    if (talentSearch.trim()) {
      const q = talentSearch.toLowerCase();
      const matchName = m.name?.toLowerCase().includes(q);
      const matchCity = m.city?.toLowerCase().includes(q);
      const matchCat = m.category?.toLowerCase().includes(q);
      const matchEmail = m.email?.toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchCat && !matchEmail) return false;
    }
    return true;
  });

  // Filtered users for Users Tab
  const filteredUsers = usersList.filter(u => {
    if (userRoleFilter === 'suspended') {
      if (u.status !== 'suspended') return false;
    } else if (userRoleFilter !== 'all') {
      if (u.role !== userRoleFilter) return false;
    }

    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchId = u.id?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId) return false;
    }
    return true;
  });

  // Filtered bookings for Bookings Tab
  const filteredBookings = bookings.filter(b => {
    if (bookingStatusFilter !== 'all' && b.status !== bookingStatusFilter) return false;
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase();
      const matchBrand = b.projectDetails?.brandName?.toLowerCase().includes(q);
      const matchClient = b.clientName?.toLowerCase().includes(q);
      const matchModel = b.modelName?.toLowerCase().includes(q);
      if (!matchBrand && !matchClient && !matchModel) return false;
    }
    return true;
  });

  // Revenue calculation
  const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const handleToggleSelectModel = (id: string) => {
    setSelectedModelIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllPending = () => {
    const pendingIds = pendingModels.map(m => m.id);
    if (selectedModelIds.length === pendingIds.length) {
      setSelectedModelIds([]);
    } else {
      setSelectedModelIds(pendingIds);
    }
  };

  const handleBatchApprove = () => {
    if (selectedModelIds.length === 0) return;
    if (onBatchApproveModels) {
      onBatchApproveModels(selectedModelIds);
      setSelectedModelIds([]);
    } else {
      selectedModelIds.forEach(id => onApproveModel(id));
      setSelectedModelIds([]);
    }
  };

  // Bookings statistics
  const pendingBookings = bookings.filter(b => b.status === 'pending');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-neutral-900/90 border border-neutral-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-xl text-white shadow-lg shadow-purple-500/20">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Super Admin Command Center</h1>
                <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono">
                  Live System
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">Manage talent approvals, user accounts, campaign bookings, and platform moderation.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchUsers();
                if (activeTab === 'database') runDatabaseDiagnostics();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Sync System Data</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto scrollbar-none select-none">
          {[
            { id: 'overview', label: 'Overview', icon: Activity, count: null },
            { id: 'talent', label: 'Talent Approvals', icon: Sparkles, count: pendingModels.length > 0 ? pendingModels.length : null },
            { id: 'users', label: 'User Directory', icon: Users, count: usersList.length },
            { id: 'bookings', label: 'Bookings', icon: Calendar, count: pendingBookings.length > 0 ? `🚨 ${pendingBookings.length} Pending` : bookings.length },
            { id: 'financials', label: 'Financials', icon: DollarSign, count: null },
            { id: 'database', label: 'System Health', icon: Database, count: null },
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
            {/* Pending Bookings Notice Banner */}
            {pendingBookings.length > 0 && (
              <div className="bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-neutral-900 border border-purple-500/40 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-purple-900/20">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-purple-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-purple-200">Action Required: {pendingBookings.length} Booking Proposal{pendingBookings.length > 1 ? 's' : ''} Pending Approval</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Review client campaign requirements and approve or assign models to proposals.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setBookingStatusFilter('pending');
                    setActiveTab('bookings');
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl transition cursor-pointer whitespace-nowrap shadow-md"
                >
                  Review Pending Proposals ({pendingBookings.length}) &rarr;
                </button>
              </div>
            )}
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{pendingModels.length}</div>
                <p className="text-[11px] text-amber-400 font-medium">Model applications awaiting review</p>
              </div>

              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Approved Talent</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{approvedModels.length}</div>
                <p className="text-[11px] text-emerald-400 font-medium">Live verified profiles on platform</p>
              </div>

              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{usersList.length}</div>
                <p className="text-[11px] text-blue-400 font-medium">Clients, models, and agencies</p>
              </div>

              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">₹{totalRevenue.toLocaleString()}</div>
                <p className="text-[11px] text-purple-400 font-medium">Platform processed transactions</p>
              </div>
            </div>

            {/* Pending Approvals Notice Banner */}
            {pendingModels.length > 0 && (
              <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-neutral-900 border border-amber-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-amber-200">Action Required: {pendingModels.length} Model Application{pendingModels.length > 1 ? 's' : ''} Pending</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Review model profiles and verify credentials before publishing cards to frontend.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTalentFilter('pending');
                    setActiveTab('talent');
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black rounded-xl transition cursor-pointer whitespace-nowrap"
                >
                  Review Pending Applications &rarr;
                </button>
              </div>
            )}

            {/* Recent Audit Activity */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Recent System Audit Logs
                </h3>
                <span className="text-[11px] text-neutral-400 font-mono">{auditLogs.length} Records</span>
              </div>

              {auditLogs.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6 text-center">No system audit logs logged yet.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {auditLogs.slice(0, 10).map((log, idx) => (
                    <div key={log.id || idx} className="p-3.5 bg-neutral-950/60 border border-neutral-800/80 rounded-xl flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-300">{log.action}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">• {new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-neutral-300 text-xs mt-1">{log.details}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded font-mono shrink-0">
                        {log.performedBy || 'Admin'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TALENT APPROVALS & MODERATION */}
        {activeTab === 'talent' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-neutral-900/80 border border-neutral-800 p-4 rounded-2xl">
              {/* Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {[
                  { id: 'pending', label: 'Pending', count: pendingModels.length },
                  { id: 'approved', label: 'Approved', count: approvedModels.length },
                  { id: 'rejected', label: 'Rejected', count: rejectedModels.length },
                  { id: 'suspended', label: 'Suspended', count: suspendedModels.length },
                  { id: 'all', label: 'All Talent', count: models.length },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setTalentFilter(f.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      talentFilter === f.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/10 font-mono">
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search & Batch Actions */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search model by name, city..."
                    value={talentSearch}
                    onChange={(e) => setTalentSearch(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {talentFilter === 'pending' && pendingModels.length > 0 && (
                  <button
                    onClick={handleBatchApprove}
                    disabled={selectedModelIds.length === 0}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      selectedModelIds.length > 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Approve Selected ({selectedModelIds.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Talent Table / Grid */}
            {filteredModels.length === 0 ? (
              <div className="text-center py-16 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl space-y-3">
                <Sparkles className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">No model profiles found for "{talentFilter}" filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModels.map((model) => {
                  const isPending = model.approved === false && !model.rejected && (model as any).status !== 'suspended';
                  const isApproved = model.approved === true && (model as any).status !== 'suspended';
                  const isRejected = model.rejected === true || (model as any).status === 'rejected';
                  const isSuspended = (model as any).status === 'suspended';

                  const avatarUrl = model.portfolio?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80';

                  return (
                    <div
                      key={model.id}
                      className={`bg-neutral-900/90 border rounded-2xl p-4 flex flex-col justify-between space-y-4 transition hover:border-purple-500/50 ${
                        isPending ? 'border-amber-500/30' : isSuspended ? 'border-red-500/30' : isRejected ? 'border-neutral-800 opacity-75' : 'border-neutral-800'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {talentFilter === 'pending' && (
                              <input
                                type="checkbox"
                                checked={selectedModelIds.includes(model.id)}
                                onChange={() => handleToggleSelectModel(model.id)}
                                className="w-4 h-4 rounded accent-purple-600 bg-neutral-950 border-neutral-700 cursor-pointer"
                              />
                            )}
                            <div className="relative">
                              <img
                                src={avatarUrl}
                                alt={model.name}
                                className="w-12 h-12 rounded-xl object-cover border border-neutral-700"
                              />
                              {model.selfieVerified && (
                                <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-neutral-950 p-0.5 rounded-full" title="Selfie Verified">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white leading-snug">{model.name}</h4>
                              <p className="text-[11px] text-neutral-400">{model.category} • {model.city}</p>
                              <p className="text-[10px] text-purple-400 font-mono font-bold mt-0.5">₹{model.startingPrice?.toLocaleString()}/day</p>
                            </div>
                          </div>

                          {/* Status Pill */}
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : isSuspended
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          }`}>
                            {isApproved ? 'Live Card' : isPending ? 'Pending' : isSuspended ? 'Suspended' : 'Rejected'}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                          {model.biography || 'No biography details provided.'}
                        </p>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedModelForView(model)}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {!isApproved && (
                            <button
                              onClick={() => onApproveModel(model.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Approve profile and publish card to frontend"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {!isRejected && !isSuspended && (
                            <button
                              onClick={() => onRejectModel(model.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Reject application and hide card from frontend"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}

                          <button
                            onClick={() => onSuspendUser(model.userId || model.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              isSuspended
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500 hover:text-neutral-950'
                                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-amber-950 hover:text-amber-400'
                            }`}
                            title={isSuspended ? 'Reactivate Model Account' : 'Suspend Model Account'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>

                          {onDeleteModel && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to PERMANENTLY DELETE model profile "${model.name}" from the database? This action cannot be undone.`)) {
                                  onDeleteModel(model.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-xs font-bold bg-neutral-800 text-red-400 border border-neutral-700 hover:bg-red-600 hover:text-white transition cursor-pointer"
                              title="Permanently Delete Model Profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USER DIRECTORY & MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-neutral-900/80 border border-neutral-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: 'All Users' },
                  { id: 'client', label: 'Clients' },
                  { id: 'model', label: 'Models' },
                  { id: 'agency', label: 'Agencies' },
                  { id: 'admin', label: 'Admins' },
                  { id: 'suspended', label: 'Suspended' },
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setUserRoleFilter(r.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      userRoleFilter === r.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search user by name, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-neutral-950 text-neutral-400 font-mono uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">User Identity</th>
                      <th className="py-3.5 px-4 font-bold">Role</th>
                      <th className="py-3.5 px-4 font-bold">Account Status</th>
                      <th className="py-3.5 px-4 font-bold">Joined</th>
                      <th className="py-3.5 px-4 font-bold text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-neutral-500">
                          No registered users found matching filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isSuspended = user.status === 'suspended';
                        return (
                          <tr key={user.id} className="hover:bg-neutral-800/40 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold uppercase">
                                  {(user.name || user.email || 'U')[0]}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{user.name || 'Unnamed User'}</div>
                                  <div className="text-[11px] text-neutral-400 font-mono">{user.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300 font-mono border border-neutral-700">
                                {user.role}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isSuspended ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {isSuspended ? 'Suspended' : 'Active'}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                              {(user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'N/A'}
                            </td>

                            <td className="py-3 px-4 text-right space-x-2">
                              {onImpersonateUser && (
                                <button
                                  onClick={() => onImpersonateUser(user)}
                                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-bold transition cursor-pointer"
                                  title="Log in as this user for support troubleshooting"
                                >
                                  Login As User
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  onSuspendUser(user.id);
                                  setTimeout(fetchUsers, 400);
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                  isSuspended
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30'
                                }`}
                              >
                                {isSuspended ? 'Reactivate' : 'Suspend'}
                              </button>

                              {onDeleteUser && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE user account "${user.name || user.email}" (ID: ${user.id}) from database? This action cannot be undone.`)) {
                                      onDeleteUser(user.id);
                                      setTimeout(fetchUsers, 400);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-[11px] font-bold transition cursor-pointer"
                                  title="Permanently Delete User Account"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-neutral-900/80 border border-neutral-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {['all', 'pending', 'assigned', 'accepted', 'completed', 'cancelled'].map(s => (
                  <button
                    key={s}
                    onClick={() => setBookingStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer whitespace-nowrap ${
                      bookingStatusFilter === s
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search brand, model, client..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Bookings Grid */}
            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl text-neutral-400 text-xs font-bold uppercase tracking-wider">
                No bookings found for current selection.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBookings.map((b) => (
                  <div key={b.id} className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{b.projectDetails?.brandName || 'Campaign Project'}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">Model: <span className="text-purple-300 font-bold">{b.modelName}</span> • Client: {b.clientName}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {b.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800">
                      <div>Date: <span className="text-neutral-200 font-mono">{b.projectDetails?.date || 'TBD'}</span></div>
                      <div className="font-bold text-emerald-400 font-mono text-sm">₹{b.priceAmount?.toLocaleString()}</div>
                    </div>

                    {onUpdateBookingStatus && (
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">Update Status:</span>
                        <select
                          value={b.status}
                          onChange={(e) => onUpdateBookingStatus(b.id, e.target.value as BookingStatus)}
                          className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned (Approve)</option>
                          <option value="accepted">Accepted</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: FINANCIALS */}
        {activeTab === 'financials' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Processed Payments</span>
                <div className="text-2xl font-black text-white">₹{totalRevenue.toLocaleString()}</div>
                <p className="text-[11px] text-emerald-400 font-medium">{payments.length} Transaction Records</p>
              </div>
            </div>

            {/* Payments List */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-neutral-800 font-bold text-xs uppercase tracking-wider text-neutral-400">
                Payment Transactions
              </div>
              <div className="divide-y divide-neutral-800/60 max-h-96 overflow-y-auto">
                {payments.length === 0 ? (
                  <p className="text-xs text-neutral-500 p-6 text-center">No payment transactions recorded.</p>
                ) : (
                  payments.map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{p.description || 'Booking Escrow Payment'}</div>
                        <div className="text-neutral-400 text-[11px]">Invoice: {p.invoiceId || p.id} • {p.paymentGateway}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-400 font-mono text-sm">₹{p.amount?.toLocaleString()}</div>
                        <span className="text-[10px] text-emerald-400 uppercase font-bold">{p.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DATABASE DIAGNOSTICS */}
        {activeTab === 'database' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Supabase Cloud Database Diagnostics</h3>
                </div>
                <button
                  onClick={runDatabaseDiagnostics}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Re-test Connection</span>
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-xs">
                <span className="font-bold text-neutral-400">Connection Status:</span>
                {dbStatus === 'testing' && <span className="text-amber-400 animate-pulse font-mono font-bold">Testing connection...</span>}
                {dbStatus === 'connected' && <span className="text-emerald-400 font-mono font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Connected & Active Tables Found</span>}
                {dbStatus === 'connected_no_tables' && <span className="text-amber-400 font-mono font-bold">Connected (Tables missing - run SQL schema)</span>}
                {dbStatus === 'error' && <span className="text-red-400 font-mono font-bold">Connection Failed ({dbErrorMsg})</span>}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODEL INSPECTION MODAL */}
      {selectedModelForView && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-6 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedModelForView.portfolio?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80'}
                  alt={selectedModelForView.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-neutral-700"
                />
                <div>
                  <h3 className="text-lg font-black text-white">{selectedModelForView.name}</h3>
                  <p className="text-xs text-neutral-400">{selectedModelForView.category} • {selectedModelForView.city}, {selectedModelForView.state}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-purple-400 font-mono">₹{selectedModelForView.startingPrice?.toLocaleString()}/day</span>
                    {selectedModelForView.selfieVerified && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3 h-3" /> Selfie Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedModelForView(null)}
                className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Information */}
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-neutral-400 uppercase tracking-wider block mb-1">Biography</span>
                <p className="text-neutral-300 leading-relaxed bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  {selectedModelForView.biography || 'No biography details specified.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-center">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Gender</span>
                  <span className="font-bold text-neutral-200 uppercase">{selectedModelForView.gender || 'Female'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Age</span>
                  <span className="font-bold text-neutral-200">{selectedModelForView.age || 23} yrs</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Height</span>
                  <span className="font-bold text-neutral-200">{selectedModelForView.height || '175 cm'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Experience</span>
                  <span className="font-bold text-neutral-200">{selectedModelForView.experience || 'Fresh Face'}</span>
                </div>
              </div>

              {/* Portfolio Photos */}
              <div>
                <span className="font-bold text-neutral-400 uppercase tracking-wider block mb-2">Portfolio Gallery ({selectedModelForView.portfolio?.length || 0})</span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {selectedModelForView.portfolio?.slice(0, 4).map((photo, i) => (
                    <img key={i} src={photo} alt="" className="w-full h-24 rounded-xl object-cover border border-neutral-800" />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
              {onDeleteModel && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE model profile "${selectedModelForView.name}" from database? This cannot be undone.`)) {
                      onDeleteModel(selectedModelForView.id);
                      setSelectedModelForView(null);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Model</span>
                </button>
              )}

              <button
                onClick={() => {
                  onRejectModel(selectedModelForView.id);
                  setSelectedModelForView(null);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition cursor-pointer"
              >
                Reject Application
              </button>

              <button
                onClick={() => {
                  onApproveModel(selectedModelForView.id);
                  setSelectedModelForView(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Approve Model Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
