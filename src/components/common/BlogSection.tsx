/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  Share2, 
  Sparkles, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Save, 
  Image as ImageIcon 
} from 'lucide-react';
import { dbService } from '../../services/db';
import { BlogItem } from '../../types';

interface BlogSectionProps {
  currentRole?: string;
  userEmail?: string;
}

const PRESET_IMAGES = [
  {
    name: 'Runway Elite',
    url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Studio Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Couture Editorial',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Polaroid Natural',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Lighting Masterclass',
    url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop'
  }
];

export default function BlogSection({ currentRole, userEmail }: BlogSectionProps) {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<BlogItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Editor form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Industry Tips');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImageUrl, setFormImageUrl] = useState(PRESET_IMAGES[0].url);
  const [formAuthor, setFormAuthor] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const isAdmin = currentRole === 'admin';

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = () => {
    dbService.getBlogs().then(setBlogs);
  };

  const handleCopyLink = (blogId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/blog/${blogId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory('Industry Tips');
    setFormSummary('');
    setFormContent('');
    setFormImageUrl(PRESET_IMAGES[0].url);
    setFormAuthor(`Super Admin (${userEmail || 'admin@modelverse.in'})`);
    setFormError('');
    setFormSuccess('');
    setIsEditorOpen(true);
  };

  const openEditForm = (blog: BlogItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(blog.id);
    setFormTitle(blog.title);
    setFormCategory(blog.category);
    setFormSummary(blog.summary);
    setFormContent(blog.content);
    setFormImageUrl(blog.imageUrl);
    setFormAuthor(blog.author);
    setFormError('');
    setFormSuccess('');
    setIsEditorOpen(true);
  };

  const handleDeleteBlog = async (blogId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you absolutely sure you want to delete this blog post from the platform?')) {
      await dbService.deleteBlog(blogId);
      loadBlogs();
      if (selectedBlog?.id === blogId) {
        setSelectedBlog(null);
      }
    }
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formTitle.trim()) {
      setFormError('Please enter a guide title.');
      return;
    }
    if (!formSummary.trim()) {
      setFormError('Please write a brief scannable summary.');
      return;
    }
    if (!formContent.trim()) {
      setFormError('Please write the core guide body content.');
      return;
    }

    const newBlog: BlogItem = {
      id: editingId || 'blog_' + Date.now(),
      title: formTitle.trim(),
      category: formCategory,
      summary: formSummary.trim(),
      content: formContent.trim(),
      imageUrl: formImageUrl.trim(),
      author: formAuthor.trim() || `Admin (${userEmail || 'admin@modelverse.in'})`,
      publishedDate: editingId 
        ? (blogs.find(b => b.id === editingId)?.publishedDate || 'Jul 11, 2026') 
        : new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    };

    try {
      await dbService.saveBlog(newBlog);
      setFormSuccess(editingId ? 'Guide updated successfully!' : 'New guide published live!');
      setTimeout(() => {
        setIsEditorOpen(false);
        loadBlogs();
      }, 1000);
    } catch (err) {
      setFormError('Failed to save the blog post. Please try again.');
    }
  };

  return (
    <div id="blog-panel-portal" className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8 bg-[#FCFBF9] dark:bg-[#0a0a0a] min-h-screen text-neutral-800 dark:text-white transition-colors duration-200">
      
      {/* Admin Creator Trigger Bar */}
      {isAdmin && !isEditorOpen && (
        <div className="mb-8 max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/35 rounded-2xl p-6 gap-4">
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-wider font-mono font-black text-[#D4AF37] block">ADMINISTRATOR PORTAL ACTIVE</span>
            <h3 className="text-md font-bold text-neutral-900 dark:text-white mt-1">Academy Content Management System</h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">Publish expert casting insights, posing guides, and industrial updates live.</p>
          </div>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#bfa032] text-black text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shrink-0 border border-[#D4AF37]"
          >
            <Plus className="h-4 w-4 stroke-[3px]" />
            <span>Create & Post Blog</span>
          </button>
        </div>
      )}

      {/* Dynamic Slide-down Editor Section */}
      {isEditorOpen && (
        <div className="mb-12 max-w-3xl mx-auto bg-white dark:bg-[#121212] border-2 border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 shadow-2xl animate-fadeIn text-left">
          <div className="flex justify-between items-center border-b border-neutral-150 dark:border-white/5 pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" />
              <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white font-sans">
                {editingId ? 'Edit Academy Guide' : 'Publish New Academy Guide'}
              </h3>
            </div>
            <button 
              onClick={() => setIsEditorOpen(false)}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSaveBlog} className="space-y-5">
            {formError && (
              <div className="p-3 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-500/30">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-350 uppercase tracking-wide mb-1.5">Title / Topic *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., How to Excel in Bridal Shoots"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-250 dark:border-white/10 bg-[#FAFAF9] dark:bg-[#070707] text-neutral-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-350 uppercase tracking-wide mb-1.5">Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-250 dark:border-white/10 bg-[#FAFAF9] dark:bg-[#070707] text-neutral-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
                >
                  <option value="Industry Tips">Industry Tips</option>
                  <option value="Behind the Scenes">Behind the Scenes</option>
                  <option value="Portfolio Advice">Portfolio Advice</option>
                  <option value="Casting News">Casting News</option>
                  <option value="Model Education">Model Education</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-350 uppercase tracking-wide mb-1.5">Author Pen Name *</label>
                <input
                  type="text"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  placeholder="Author Name (e.g. Karan Mehra)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-250 dark:border-white/10 bg-[#FAFAF9] dark:bg-[#070707] text-neutral-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-350 uppercase tracking-wide mb-1.5">Visual Banner URL *</label>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-250 dark:border-white/10 bg-[#FAFAF9] dark:bg-[#070707] text-neutral-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Unsplash Preset Selection */}
            <div>
              <span className="block text-[10px] font-bold text-neutral-500 dark:text-zinc-450 uppercase tracking-wide mb-1.5">Or Quick Select Premium Cover Photo:</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setFormImageUrl(preset.url)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                      formImageUrl === preset.url
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-white/5 text-neutral-500 dark:text-zinc-400 hover:border-neutral-400'
                    }`}
                  >
                    <ImageIcon className="h-3 w-3" />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-350 uppercase tracking-wide mb-1.5">Brief Summary *</label>
              <textarea
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                placeholder="A compelling 1-2 sentence hook explaining what readers will learn from this guide..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-250 dark:border-white/10 bg-[#FAFAF9] dark:bg-[#070707] text-neutral-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-[#D4AF37] focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-zinc-350 uppercase tracking-wide mb-1.5">Core Guide Content (Support Paragraphs) *</label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Type or paste the comprehensive guide text here. You can use standard paragraphs or list out tips sequentially..."
                rows={10}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-250 dark:border-white/10 bg-[#FAFAF9] dark:bg-[#070707] text-neutral-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-[#D4AF37] focus:outline-none font-sans leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3.5 pt-4 border-t border-neutral-150 dark:border-white/5">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-5 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-200 dark:hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2 bg-gradient-to-tr from-[#D4AF37] to-[#F9E29C] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:brightness-105 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{editingId ? 'Update Guide' : 'Publish Guide'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedBlog ? (
        /* Blog Detail Reader */
        <div className="max-w-3xl mx-auto animate-fadeIn bg-white dark:bg-[#121212] rounded-2xl border border-neutral-200 dark:border-white/5 p-6 sm:p-10 shadow-2xl text-left">
          <button
            onClick={() => setSelectedBlog(null)}
            className="mb-8 flex items-center space-x-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to casting insights</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider font-mono">
              <span>{selectedBlog.category}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{selectedBlog.publishedDate}</span>
              </div>
            </div>

            {/* Quick Admin action panel inside detail page */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    openEditForm(selectedBlog, e);
                    setSelectedBlog(null);
                  }}
                  className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 transition cursor-pointer"
                  title="Edit Guide"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => handleDeleteBlog(selectedBlog.id, e)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition cursor-pointer"
                  title="Delete Guide"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <h2 className="font-sans text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-3.5 leading-tight">
            {selectedBlog.title}
          </h2>

          <div className="mt-4 flex items-center space-x-4 border-y border-neutral-150 dark:border-white/5 py-3.5 text-xs text-neutral-500 dark:text-zinc-400">
            <div className="flex items-center space-x-1.5">
              <User className="h-4 w-4 text-neutral-400 dark:text-zinc-500" />
              <strong>By: {selectedBlog.author}</strong>
            </div>
          </div>

          <div className="my-8 rounded-2xl overflow-hidden aspect-video border border-neutral-200 dark:border-white/5 bg-black">
            <img src={selectedBlog.imageUrl} alt={selectedBlog.title} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          </div>

          {/* Render blog markdown-inspired custom content safely */}
          <div className="prose prose-neutral dark:prose-invert max-w-none text-xs sm:text-sm text-neutral-700 dark:text-zinc-350 leading-relaxed font-normal whitespace-pre-line">
            {selectedBlog.content}
          </div>

          {/* Social share widget mock */}
          <div className="border-t border-neutral-150 dark:border-white/5 mt-10 pt-6 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-wider">Share this casting article</span>
            <button
              onClick={() => handleCopyLink(selectedBlog.id)}
              className="flex items-center space-x-1.5 rounded-full border border-neutral-350 dark:border-white/10 hover:border-neutral-800 dark:hover:border-white hover:bg-neutral-50 dark:hover:bg-white/5 px-4 py-2 text-xs font-bold text-neutral-700 dark:text-zinc-300 transition cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Blog List Homepage */
        <div>
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 inline-flex items-center space-x-1.5 rounded-full bg-neutral-100 dark:bg-white/5 px-3 py-1.5 border border-neutral-350 dark:border-[#D4AF37]/35">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="font-mono text-[10px] font-black uppercase text-[#D4AF37]">Insights & Industry Guides</span>
            </div>
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-4xl mt-3">
              ModelVerse Academy India
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-650 dark:text-zinc-400 text-sm">
              Get behind-the-scenes coaching, portfolio guides, agency insider tips, and updates directly from the casting crew.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {blogs.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBlog(b)}
                className="group cursor-pointer flex flex-col rounded-2xl bg-white dark:bg-[#121212] border border-neutral-200 dark:border-white/5 overflow-hidden shadow-lg dark:shadow-2xl transition duration-300 hover:border-[#D4AF37]/30 hover:-translate-y-1 transform text-left"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-black border-b border-neutral-250 dark:border-white/5 animate-shimmer">
                  <img src={b.imageUrl} alt={b.title} referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-300 group-hover:scale-102" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#D4AF37] border border-white/10">
                    {b.category}
                  </span>
                  
                  {/* Quick Admin Control Overlay on Grid Cards */}
                  {isAdmin && (
                    <div className="absolute right-3 top-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/10 z-20">
                      <button
                        onClick={(e) => openEditForm(b, e)}
                        className="p-1 rounded-md bg-white/10 text-white hover:bg-[#D4AF37] hover:text-black transition cursor-pointer"
                        title="Edit Guide"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteBlog(b.id, e)}
                        className="p-1 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition cursor-pointer"
                        title="Delete Guide"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-medium text-neutral-500 dark:text-zinc-500">{b.publishedDate}</span>
                    <h3 className="font-sans text-md font-extrabold text-neutral-900 dark:text-white mt-1.5 group-hover:text-[#D4AF37] transition duration-200">
                      {b.title}
                    </h3>
                    <p className="mt-2 text-xs text-neutral-650 dark:text-zinc-400 leading-relaxed font-normal line-clamp-2">
                      {b.summary}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-neutral-150 dark:border-white/5 flex items-center justify-between text-xs text-neutral-500 dark:text-zinc-400">
                    <span className="font-semibold text-neutral-700 dark:text-zinc-300 font-sans">By: {b.author.split('(')[0]}</span>
                    <span className="font-extrabold text-[#D4AF37] group-hover:underline flex items-center gap-1 hover:brightness-110">
                      <span>Read Guide</span>
                      <BookOpen className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
