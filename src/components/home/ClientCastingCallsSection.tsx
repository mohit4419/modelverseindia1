/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Briefcase, 
  Send, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Building, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { JobRequirement } from '../../types';

interface ClientCastingCallsSectionProps {
  jobRequirements: JobRequirement[];
  onApply: (job: JobRequirement) => void;
  onPostRequirementClick: () => void;
  isLoading?: boolean;
}

export default function ClientCastingCallsSection({
  jobRequirements,
  onApply,
  onPostRequirementClick,
  isLoading = false
}: ClientCastingCallsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  const categories = [
    { id: 'all', label: 'All Castings' },
    { id: 'Fashion Models', label: 'Fashion' },
    { id: 'Commercial Models', label: 'Commercial' },
    { id: 'UGC Creators', label: 'UGC Creators' },
    { id: 'Influencers', label: 'Influencers' },
    { id: 'Actors', label: 'Actors' }
  ];

  const filteredJobs = jobRequirements.filter(j => {
    if (selectedCategory === 'all') return true;
    return j.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleApplyClick = (job: JobRequirement) => {
    onApply(job);
    if (!appliedJobIds.includes(job.id)) {
      setAppliedJobIds(prev => [...prev, job.id]);
    }
  };

  return (
    <section id="homepage-client-castings" className="py-12 bg-white dark:bg-neutral-900 border-b border-black/5 dark:border-white/5 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-mono font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
              <span>Live Client Requirements</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px]">
                {jobRequirements.length} Active
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-3">
              <Briefcase className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              <span>Client Casting Calls & Jobs</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
              Verified brands and agencies looking for talent across India. Apply directly with your ModelVerse profile & portfolio.
            </p>
          </div>

          {/* Action Button: Post Requirement */}
          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={onPostRequirementClick}
              id="section-post-job-btn"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-6 py-3 text-xs sm:text-sm font-black shadow-lg shadow-purple-500/20 transition duration-200 hover:brightness-110 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post Casting Requirement</span>
            </button>
          </div>
        </div>

        {/* Filter Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin select-none">
          <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-purple-500" /> Filter:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-black/5 dark:border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-3xl h-64 border border-black/5 dark:border-white/5 p-6" />
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const isApplied = appliedJobIds.includes(job.id);
              return (
                <motion.div
                  key={job.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="group relative bg-[#FCFBF9] dark:bg-neutral-950 rounded-3xl border border-neutral-200/80 dark:border-white/10 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-purple-500/40 transition-all text-left"
                >
                  {/* Top Header Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
                          {job.companyName ? job.companyName.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 line-clamp-1">
                            <span>{job.companyName}</span>
                            <span title="Verified Client">
                              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                            </span>
                          </h3>
                          <span className="text-[10px] font-mono text-neutral-400 block">
                            Posted {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>

                      {/* Category Tag */}
                      <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider shrink-0 border border-purple-500/20">
                        {job.category}
                      </span>
                    </div>

                    {/* Requirements Description */}
                    <div className="mb-4">
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-3 bg-neutral-100/70 dark:bg-neutral-900/60 p-3 rounded-2xl border border-black/5 dark:border-white/5">
                        "{job.requirements}"
                      </p>
                    </div>

                    {/* Location, Shoot Date, Budget Metadata */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-5 font-sans">
                      <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 p-2 rounded-xl border border-black/5 dark:border-white/5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate text-[11px] font-semibold">{job.location || 'Mumbai'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 p-2 rounded-xl border border-black/5 dark:border-white/5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate text-[11px] font-semibold">{job.shootDate || 'As Agreed'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Budget & Apply Button */}
                  <div className="pt-3 border-t border-neutral-200/60 dark:border-white/5 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">Client Budget</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {job.budget}
                      </span>
                    </div>

                    <button
                      onClick={() => handleApplyClick(job)}
                      className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-md ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white shadow-purple-500/20 active:scale-95'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Apply Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 bg-[#FCFBF9] dark:bg-neutral-950 rounded-3xl border border-neutral-200/80 dark:border-white/10 p-8 max-w-lg mx-auto">
            <Briefcase className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-60" />
            <h4 className="font-black text-sm text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
              No Active Castings in "{selectedCategory}"
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-6 leading-relaxed">
              Are you a client or agency looking for talent? Post your casting requirement now to reach thousands of models.
            </p>
            <button
              onClick={onPostRequirementClick}
              className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 text-xs font-black transition hover:brightness-110 cursor-pointer shadow-lg"
            >
              Post First Requirement
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
