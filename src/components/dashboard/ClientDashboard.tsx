/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Download, 
  FileText, 
  Check, 
  ArrowUpRight, 
  ExternalLink,
  Info,
  XCircle
} from 'lucide-react';
import { Booking, Model, BookingStatus } from '../../types';

interface ClientDashboardProps {
  bookings: Booking[];
  models: Model[];
  clientId: string;
  triggerToast: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
  onUpdateBookingStatus?: (bookingId: string, status: BookingStatus) => void;
}

export default function ClientDashboard({
  bookings,
  models,
  clientId,
  triggerToast,
  onUpdateBookingStatus
}: ClientDashboardProps) {
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'cancelled'>('all');

  // Filter bookings belonging to this client (matching by clientId, projectDetails.clientId, or email)
  const clientBookings = bookings.filter(b => 
    b.clientId === clientId || 
    (b.projectDetails && (b.projectDetails as any)?.clientId === clientId) ||
    (b as any).clientEmail?.toLowerCase() === clientId?.toLowerCase()
  );

  // Filter based on active status tab
  const filteredBookings = clientBookings.filter(b => {
    if (activeStatusTab === 'all') return true;
    if (activeStatusTab === 'pending') {
      return b.status === 'pending' || b.status === 'assigned';
    }
    if (activeStatusTab === 'cancelled') {
      return b.status === 'cancelled' || b.status === 'rejected';
    }
    return b.status === activeStatusTab;
  });

  const handleDownloadPdf = (bk: Booking) => {
    if (!bk.pdfSummaryUrl) return;
    try {
      const link = document.createElement('a');
      link.href = bk.pdfSummaryUrl;
      link.download = `Booking_Summary_Ref_${bk.id.substring(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      triggerToast(
        'Contract Downloaded',
        'Professional booking contract summary PDF downloaded successfully.',
        'success'
      );
    } catch (err) {
      console.error('Failed to download PDF:', err);
      triggerToast('Download Failed', 'Could not open or download the contract PDF.', 'error');
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    if (!onUpdateBookingStatus) return;
    if (window.confirm('Are you sure you want to cancel this campaign booking offer? Your escrowed deposit will be returned.')) {
      onUpdateBookingStatus(bookingId, 'cancelled');
    }
  };

  return (
    <div id="client-bookings-dashboard" className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-black/5 dark:border-white/10 pb-6 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-purple-50 dark:bg-purple-950/30 text-purple-650 dark:text-purple-400 font-mono uppercase tracking-wider mb-2">
            <Briefcase className="h-3 w-3" /> Client Hub
          </span>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            My Campaign Bookings
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl font-medium">
            Monitor escrow-protected campaign requests, track model availability status, and review verified professional contract summaries.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/5 dark:border-white/5 mb-6 overflow-x-auto whitespace-nowrap">
        {([
          { id: 'all', label: 'All Bookings' },
          { id: 'pending', label: 'Pending / Assigned' },
          { id: 'accepted', label: 'Active Contracts' },
          { id: 'completed', label: 'Finalized' },
          { id: 'cancelled', label: 'Cancelled / Declined' }
        ] as const).map((tab) => {
          const count = tab.id === 'all' 
            ? clientBookings.length 
            : tab.id === 'pending'
              ? clientBookings.filter(b => b.status === 'pending' || b.status === 'assigned').length
              : tab.id === 'cancelled'
                ? clientBookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length
                : clientBookings.filter(b => b.status === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveStatusTab(tab.id)}
              className={`py-3 px-4 border-b-2 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeStatusTab === tab.id
                  ? 'border-purple-600 text-purple-650 dark:border-purple-400 dark:text-purple-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black font-mono ${
                activeStatusTab === tab.id
                  ? 'bg-purple-600 text-white dark:bg-purple-400 dark:text-black'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-zinc-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bookings Display */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-black/5 dark:border-white/5 rounded-3xl bg-neutral-50/50 dark:bg-neutral-950/30">
          <Briefcase className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mx-auto animate-pulse" />
          <h3 className="text-xs font-black text-neutral-700 dark:text-zinc-300 mt-4 uppercase tracking-wider font-mono">
            No Bookings Found
          </h3>
          <p className="text-[11px] text-neutral-400 mt-1 max-w-xs mx-auto font-medium">
            There are currently no campaign bookings matching this category. Initiate a booking from any model's spec profile!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBookings.map((bk) => {
            const modelProfile = models.find(m => m.id === bk.modelId);
            const verifiedContract = bk.pdfSummaryUrl && bk.isSharedWithClient;

            return (
              <div 
                key={bk.id}
                className="border border-black/5 dark:border-white/10 rounded-2xl bg-white dark:bg-[#121212] overflow-hidden flex flex-col shadow-sm hover:shadow transition-all duration-200"
              >
                
                {/* Header Information */}
                <div className="p-5 flex items-start gap-4 border-b border-black/5 dark:border-white/5">
                  <img 
                    src={bk.modelImage || ""} 
                    alt={bk.modelName}
                    className="h-12 w-12 rounded-xl object-cover shrink-0 border border-black/5 dark:border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-neutral-900 dark:text-white truncate">
                        {bk.modelName}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full font-mono font-black text-[9px] uppercase border tracking-wider ${
                        bk.status === 'pending' 
                          ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-500/20'
                          : bk.status === 'assigned'
                          ? 'bg-amber-100 text-[#FF6F00] border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                          : bk.status === 'accepted'
                          ? 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-500/20'
                          : bk.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/20'
                          : bk.status === 'rejected'
                          ? 'bg-red-50 text-red-650 border-red-200 dark:bg-red-950/25 dark:text-red-400 dark:border-red-500/20'
                          : 'bg-neutral-55 text-neutral-500 border-neutral-200 dark:bg-neutral-950/20 dark:text-neutral-400 dark:border-neutral-500/20'
                      }`}>
                        {bk.status === 'pending' ? 'awaiting admin' :
                         bk.status === 'assigned' ? 'awaiting model' :
                         bk.status === 'rejected' ? 'declined by model' :
                         bk.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-450 font-mono mt-0.5 truncate">
                      REF ID: MVI-Ref-{bk.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Body Details Grid */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <span className="block text-[8px] font-black uppercase font-mono tracking-wider text-neutral-400 dark:text-zinc-500">
                        Brand Node
                      </span>
                      <strong className="text-[11.5px] font-bold text-neutral-900 dark:text-white block mt-0.5 truncate">
                        {bk.projectDetails.brandName}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black uppercase font-mono tracking-wider text-neutral-400 dark:text-zinc-500">
                        Escrow Budget Secured
                      </span>
                      <strong className="text-[11.5px] font-bold text-[#D4AF37] block mt-0.5">
                        ₹{bk.priceAmount.toLocaleString('en-IN')}.00
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black uppercase font-mono tracking-wider text-neutral-400 dark:text-zinc-500">
                        Date Scheduled
                      </span>
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-300 flex items-center gap-1 mt-1 font-medium">
                        <Calendar className="h-3 w-3 text-neutral-400" /> {bk.projectDetails.date}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black uppercase font-mono tracking-wider text-neutral-400 dark:text-zinc-500">
                        Campaign Duration
                      </span>
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-300 flex items-center gap-1 mt-1 font-medium">
                        <Clock className="h-3 w-3 text-neutral-400" /> {bk.projectDetails.duration}
                      </span>
                    </div>
                  </div>

                  {/* Project Notes */}
                  {bk.projectDetails.notes && (
                    <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/5">
                      <span className="block text-[8.5px] font-bold text-neutral-400 dark:text-zinc-500 uppercase font-mono mb-1">
                        Campaign Directives
                      </span>
                      <p className="text-[10px] text-neutral-600 dark:text-zinc-400 leading-relaxed italic line-clamp-2">
                        "{bk.projectDetails.notes}"
                      </p>
                    </div>
                  )}

                  {/* Booking details depending on state */}
                  {bk.status === 'pending' && (
                    <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 flex flex-col gap-2">
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-normal font-medium">
                        Your booking has been received and is currently in escrow. The admin is verifying the brand alignment before forwarding this campaign proposal to the model.
                      </p>
                      {onUpdateBookingStatus && (
                        <button
                          onClick={() => handleCancelBooking(bk.id)}
                          className="w-full py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancel Proposal & Refund Escrow
                        </button>
                      )}
                    </div>
                  )}

                  {bk.status === 'assigned' && (
                    <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/25 flex flex-col gap-2">
                      <p className="text-[10px] text-[#FF6F00] dark:text-amber-400 leading-normal font-medium">
                        Admin Approved! The campaign proposal has been forwarded to <strong>{bk.modelName}</strong>. Awaiting their professional availability confirmation.
                      </p>
                      {onUpdateBookingStatus && (
                        <button
                          onClick={() => handleCancelBooking(bk.id)}
                          className="w-full py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancel Proposal & Refund Escrow
                        </button>
                      )}
                    </div>
                  )}

                  {bk.status === 'rejected' && (
                    <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                      <p className="text-[10px] text-red-650 dark:text-red-400 leading-normal font-medium">
                        The model declined this booking proposal due to scheduling conflicts or creative differences. Your escrowed deposit of <strong>₹{bk.priceAmount.toLocaleString()}</strong> has been fully refunded.
                      </p>
                    </div>
                  )}

                  {bk.status === 'cancelled' && (
                    <div className="p-3 rounded-xl bg-neutral-500/5 border border-neutral-550/20">
                      <p className="text-[10px] text-neutral-500 dark:text-zinc-400 leading-normal font-medium">
                        This campaign booking proposal was cancelled by you. Your escrowed deposit of <strong>₹{bk.priceAmount.toLocaleString()}</strong> has been fully refunded.
                      </p>
                    </div>
                  )}

                  {/* Shared verified contract summary */}
                  {verifiedContract ? (
                    <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> Verified Contract Summary Available
                      </div>
                      <p className="text-[9.5px] text-neutral-500 dark:text-zinc-400 leading-relaxed font-medium">
                        The talent's booking agency has generated, validated, and published the official contract PDF for this accepted campaign assignment.
                      </p>
                      <button
                        onClick={() => handleDownloadPdf(bk)}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" /> Download Contract Summary PDF
                      </button>
                    </div>
                  ) : bk.status === 'accepted' ? (
                    <div className="p-3 rounded-xl bg-purple-50/40 dark:bg-purple-950/10 border border-purple-500/10 flex items-start gap-2.5">
                      <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[10px] font-bold text-purple-650 dark:text-purple-400">
                          Awaiting Agency Verification
                        </h5>
                        <p className="text-[9px] text-neutral-400 mt-0.5 leading-normal font-medium">
                          The talent has accepted your booking proposal! Once the agency generates and shares the PDF contract summary, you will be able to download it here for your records.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
                
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
