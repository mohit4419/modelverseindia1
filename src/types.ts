/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'client' | 'model' | 'admin';
export type UserStatus = 'active' | 'suspended';
export type BookingStatus = 'pending' | 'assigned' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type PaymentStatus = 'success' | 'pending' | 'failed';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
}

export interface Model {
  id: string;
  userId: string;
  name: string;
  gender: 'female' | 'male' | 'non-binary' | 'Female' | 'Male' | 'Other' | 'Prefer not to say';
  age: number;
  height: string | number; // e.g. "5'9\"" or 175 (cm)
  city: string;
  state: string;
  languages: string[];
  experience: string; // e.g. "2-5 years", "Fresh Face", "5+ years"
  category: string; // e.g. "Fashion Models", "Commercial Models", etc.
  portfolio: string[]; // images URLs
  portfolioCaptions?: string[]; // captions or descriptions for each portfolio image
  portfolioCategories?: string[]; // categories/tags for each portfolio image (e.g. "Runway", "Editorial")
  videoUrl?: string;
  availabilityStatus?: 'Available' | 'Booked' | 'On-Leave';
  selfieVerified: boolean;
  selfieUrl?: string;
  approved: boolean;
  rejected?: boolean;
  available?: boolean;
  archived?: boolean;
  featured?: boolean;
  verified?: boolean;
  status?: string;
  availability?: string;
  govIdUrl?: string;
  pdfUrl?: string;
  pdfName?: string;
  startingPrice: number; // in INR
  rating: number;
  reviewsCount: number;
  biography: string;
  phone?: string;
  email?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    portfolio?: string;
  };
  measurements?: {
    bust: string;
    waist: string;
    hips: string;
  };
  agencyInfo?: {
    name: string;
    contactName: string;
  };
  additionalDetails?: Record<string, any>;
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  modelId: string;
  modelName: string;
  modelImage: string;
  projectDetails: {
    brandName: string;
    companyName: string;
    campaignType: string;
    shootType: string;
    location: string;
    date: string;
    duration: string;
    budgetRange: string;
    notes?: string;
  };
  status: BookingStatus;
  createdAt: string;
  priceAmount: number;
  pdfSummaryUrl?: string;
  pdfGeneratedAt?: string;
  isSharedWithClient?: boolean;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  amount: number;
  paymentGateway: 'Razorpay' | 'Cashfree' | 'Stripe';
  status: PaymentStatus;
  description: string;
  createdAt: string;
  invoiceId: string;
  sessionId?: string;
  modelId?: string;
  isSandbox?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  imageUrl?: string;
  bookingId?: string;
  isRead: boolean;
}

export interface Review {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  modelId: string;
  rating: number;
  review: string;
  date: string;
  campaignPhotoUrl?: string;
}

export interface BlogItem {
  id: string;
  title: string;
  slug?: string;
  category: string;
  categoryId?: string;
  summary: string;
  content: string;
  excerpt?: string;
  imageUrl: string;
  featuredImage?: string;
  author: string;
  authorName?: string;
  authorId?: string;
  publishedDate: string;
  publishedAt?: string;
  authorEmail?: string;
  authorRole?: 'admin' | 'client' | 'model' | 'contributor' | string;
  userId?: string;
  status?: 'draft' | 'pending' | 'published' | 'rejected';
  isFeatured?: boolean;
  readTime?: number; // in minutes
  views?: number;
  likesCount?: number;
  commentsCount?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface BlogComment {
  id: string;
  blogId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  parentCommentId?: string;
  comment: string;
  status: 'active' | 'hidden';
  createdAt: string;
}

export interface BlogLike {
  id: string;
  blogId: string;
  userId: string;
  createdAt: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
  entityId?: string;
  entityType?: 'model' | 'booking' | 'user' | 'payment' | 'payout';
}

export type PayoutStatus = 'escrowed' | 'pending_approval' | 'released' | 'cancelled';

export interface Payout {
  id: string;
  bookingId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  clientId: string;
  clientName: string;
  amount: number;
  escrowStatus: PayoutStatus;
  createdAt: string;
  releasedAt?: string;
  transactionReference?: string;
  payoutNotes?: string;
}

export interface Post {
  id: string;
  modelId: string;
  modelName: string;
  modelAvatar?: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  likedByMe?: boolean;
}

// Pricing configuration derived securely from environment variables
export const PREMIUM_UNLOCK_AMOUNT = Number((import.meta as any).env.VITE_PREMIUM_UNLOCK_AMOUNT || '399');
