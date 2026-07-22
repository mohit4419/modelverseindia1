/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  id: string;
  name?: string;
  email?: string;
  role: 'client' | 'model' | 'admin';
  phone?: string;
  status: 'active' | 'suspended';
  avatarUrl?: string;
  favorites?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  phoneNumber?: string;
  createdAt?: string;
}

export interface Model {
  id: string;
  userId: string;
  name: string;
  gender?: string;
  age?: number;
  height?: string | number;
  city: string;
  state: string;
  languages?: string[];
  experience?: string;
  category: string;
  portfolio?: string[];
  portfolioCaptions?: string[];
  portfolioCategories?: string[];
  videoUrl?: string;
  availabilityStatus?: string;
  selfieVerified?: boolean;
  selfieUrl?: string;
  approved?: boolean;
  available?: boolean;
  archived?: boolean;
  featured?: boolean;
  verified?: boolean;
  status?: string;
  availability?: string;
  govIdUrl?: string;
  pdfUrl?: string;
  pdfName?: string;
  startingPrice?: number;
  rating?: number;
  reviewsCount?: number;
  biography?: string;
  phone?: string;
  email?: string;
  socialLinks?: Record<string, any>;
  measurements?: Record<string, any>;
  agencyInfo?: Record<string, any>;
  additionalDetails?: Record<string, any>;
  createdAt?: string;
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  modelId: string;
  modelName: string;
  modelImage: string;
  projectDetails: Record<string, any>;
  status: 'pending' | 'assigned' | 'accepted' | 'rejected' | 'canceled' | 'completed';
  createdAt: string;
  priceAmount: number;
  pdfSummaryUrl?: string;
  pdfGeneratedAt?: string;
  isSharedWithClient?: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  amount: number;
  paymentGateway: 'Razorpay' | 'Cashfree' | 'Stripe' | 'UPI';
  status: 'success' | 'pending' | 'failed' | 'refunded';
  description?: string;
  createdAt: string;
  invoiceId?: string;
  sessionId?: string;
  modelId?: string;
  modelName?: string;
}

export interface Review {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  modelId: string;
  rating: number;
  review: string;
  date?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead?: boolean;
  bookingId?: string;
}
