/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Send, Building, DollarSign, MapPin, Calendar, FileText, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { dbService } from '../../services/db';
import { useAuth } from '../../hooks/useAuth';
import { JobRequirement } from '../../types';

interface JobRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
  onSuccess?: (newJob: JobRequirement) => void;
}

export default function JobRequirementModal({
  isOpen,
  onClose,
  triggerToast,
  onSuccess
}: JobRequirementModalProps) {
  const { clientId, userEmail, currentUserName } = useAuth();

  const [companyName, setCompanyName] = useState(currentUserName !== 'Guest' ? currentUserName : '');
  const [category, setCategory] = useState('Fashion Models');
  const [requirements, setRequirements] = useState('');
  const [location, setLocation] = useState('Mumbai');
  const [shootDate, setShootDate] = useState('As Agreed');
  const [budget, setBudget] = useState('₹45,000 / Day');
  const [contactEmail, setContactEmail] = useState(userEmail !== 'guest@modelverse.in' ? userEmail : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !requirements.trim() || !budget.trim()) {
      triggerToast('Missing Fields', 'Please fill in Company Name, Job Requirements, and Budget details.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await dbService.createJobRequirement({
        clientId: clientId || 'c_test',
        companyName: companyName.trim(),
        category,
        requirements: requirements.trim(),
        location: location.trim(),
        shootDate: shootDate.trim(),
        budget: budget.trim(),
        contactEmail: contactEmail.trim()
      });

      triggerToast(
        'Requirement Posted Live!',
        `Your casting requirement for "${companyName}" has been published to the homepage & broadcast to model dashboards.`,
        'success'
      );

      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err) {
      console.error('Failed to post job requirement:', err);
      triggerToast('Error', 'Failed to publish job requirement. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-left text-neutral-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">Post Casting Requirement</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Broadcast your project requirements to top verified models in India.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-neutral-300 mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-purple-400" />
              <span>Company / Brand Name *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lakme Fashion / Zara Studio / Nykaa"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-300 mb-1">Casting Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="Fashion Models">Fashion Models</option>
                <option value="Commercial Models">Commercial Models</option>
                <option value="Fitness Models">Fitness Models</option>
                <option value="UGC Creators">UGC Creators</option>
                <option value="Influencers">Influencers</option>
                <option value="Actors">Actors</option>
                <option value="Event Hosts">Event Hosts</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-300 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Budget Details *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ₹50,000 / Day or Negotiable"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Shoot Location</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai / Delhi / Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Target Shoot Date</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 15th Aug 2026 or Immediate"
                value={shootDate}
                onChange={(e) => setShootDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-neutral-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-pink-400" />
              <span>Specific Job Requirements & Description *</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe the campaign specs, height requirements, gender preferences, styling, and deliverables..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-300 mb-1">Contact Email (Optional)</label>
            <input
              type="email"
              placeholder="casting@yourbrand.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-purple-600/30 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Post Requirement Live</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
