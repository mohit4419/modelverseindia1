/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Model, Booking, PaymentRecord, Message, Review, User, BlogItem, AuditLog, Payout, Post, PREMIUM_UNLOCK_AMOUNT } from '../../types';
import { sanitizeValue, isDummyModel } from './helpers';

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    action: 'Registration Approval',
    performedBy: 'admin@modelverse.in',
    details: 'Approved model Priya Sharma portfolio after verification of identity card.',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    entityId: 'u_p_sharma',
    entityType: 'model'
  },
  {
    id: 'log_2',
    action: 'Booking Status Change',
    performedBy: 'admin@modelverse.in',
    details: 'Sabyasachi Couture campaign status updated from pending to accepted.',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    entityId: 'b_test_1',
    entityType: 'booking'
  },
  {
    id: 'log_3',
    action: 'User Suspension Change',
    performedBy: 'admin@modelverse.in',
    details: 'User accounts checked and synchronized for security guidelines.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    entityType: 'user'
  }
];

export const SEED_USERS: User[] = [
  {
    id: 'c_test',
    role: 'client',
    name: 'Demo Client',
    email: 'client@modelverse.in',
    phone: '+91 98765 43210',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm1',
    role: 'model',
    name: 'Pooja Hegde',
    email: 'model@modelverse.in',
    phone: '+91 91111 22222',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'a_admin',
    role: 'admin',
    name: 'Super Admin',
    email: 'admin@modelverse.in',
    phone: '+91 99999 88888',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    createdAt: new Date().toISOString(),
  }
];

export const MODEL_IMAGES: Record<string, string[]> = {
  priya: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800'
  ],
  kabir: [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800'
  ]
};

export const SEED_MODELS: Model[] = [];

export const SEED_REVIEWS: Review[] = [
  {
    id: 'r1',
    clientId: 'c1',
    clientName: 'Manish Kumar (Sabyasachi)',
    clientAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150',
    modelId: 'm1',
    rating: 5,
    review: 'Priya brought outstanding poise and grace to our Royal Heritage collection photoshoot. Highly cooperative, professional, and effortless in adapting to high-stress ramp adjustments.',
    date: 'Jun 12, 2026'
  },
  {
    id: 'r2',
    clientId: 'c2',
    clientName: 'Aman Deep (Cult.fit)',
    clientAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150',
    modelId: 'm2',
    rating: 5,
    review: 'Kabir exceeded our campaign expectations. Excellent physical condition, endless stamina during an outdoor athletic and sports-performance shoot in heavy heat.',
    date: 'Jun 15, 2026'
  },
  {
    id: 'r3',
    clientId: 'c3',
    clientName: 'Kriti Sen (Nykaa Creative)',
    clientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150',
    modelId: 'm5',
    rating: 4.5,
    review: 'Rhea is a wonderful face for digital cosmetics. Extremely expressive, understands lighting well, and saved us hours of post-production with her high-precision skin radiance.',
    date: 'Jun 08, 2026'
  }
];

export const SEED_BLOGS: BlogItem[] = [
  {
    id: 'b1',
    title: 'How to Build a High-Converting Modeling Portfolio in India',
    category: 'Industry Tips',
    summary: 'Essential guidelines for Indian modeling talent to draft a visual portfolio that grabs the immediate attention of major casting agencies and couture directors.',
    content: `Building a modeling portfolio is your first calling card. In the Indian fashion industry—ranging from high-fashion couture in Delhi or Mumbai to heavy commercial and catalog work—agencies look for versatility and canvas quality.\n\n### 1. The Power of "Polaroids"\nFirst thing first, casting directors want to see your natural face. These are called casting digitals or polaroids. Avoid thick makeup, wear basic, close-fitting clothing (like a black tank top and blue jeans), and shoot in crisp, natural window daylight. Include:\n- A headshot (front)\n- Profile headshots (left and right)\n- Full-length body shot\n- Three-quarter length body shot\n\n### 2. Diversify Your Looks\nYour portfolio shouldn't just contain one aesthetic. Showcase:\n- **Traditional Indian Wear:** Highly demanded for Indian weddings and festive seasons.\n- **Western Casuals:** Perfect for e-commerce catalog auditions.\n- **High Fashion/Avant-Garde:** Demonstrates your editorial expression of lines and shadows.\n\n### 3. Work with Professional Photographers\nWhile beginner models do "TFP" (Time for Print) tests, investing in a reputable fashion photographer who understands agency standards makes a dramatic difference. Ensure your photos tell a story and stay updated with your latest hairstyle and body measurements!`,
    imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop',
    author: 'Karan Mehra (Inega Director)',
    publishedDate: 'Jun 14, 2026'
  },
  {
    id: 'b2',
    title: 'The Rise of UGC Creators and Influencers in Commercial Modeling',
    category: 'Casting Guides',
    summary: 'Why modern lifestyle brands across Bangalore, Mumbai, and Gurgaon are shifting budget shares towards authentic, self-managed user-generated content creators.',
    content: `The marketing landscape in 2026 has witnessed a massive decentralization of media. Traditional models are expanding their skillset into speaking, script-building, and self-publishing, while authentic UGC creators are gaining runway recognition.\n\n### Why Brands Prefer UGC\nUnlike high-glamour billboard models who are silent ambassadors, UGC creators speak directly to the smartphone camera, making product benefits feel like a recommendation from a reliable close friend. This authentic presentation triggers a 4x higher purchase conversion rate for social media campaigns.\n\n### Key Skills for Modern UGC Models:\n- **Flawless lighting setup:** Mastering small ring lights, softboxes, and natural ambient lighting in a background.\n- **Dynamic copywriting:** Writing a 15-second TikTok/Reel hook that retains the consumer in the first 2 seconds.\n- **Clean voice-overs:** Clear, energetic pronunciation of brand names in multiple languages (English, Hindi, regional).\n\nBrand campaigns now seek creators who can deliver both beautiful visuals and rich performance. ModelVerse India bridges this gap by labeling creators clearly for high-intent agencies!`,
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop',
    author: 'Nisha Sundaram (E-com Casting lead)',
    publishedDate: 'Jun 18, 2026'
  }
];

export const SEED_BOOKINGS: Booking[] = [
  {
    id: 'bk_1',
    clientId: 'c1',
    clientName: 'Manish Kumar (Sabyasachi)',
    modelId: 'm1',
    modelName: 'Priya Sharma',
    modelImage: MODEL_IMAGES.priya?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800',
    projectDetails: {
      brandName: 'Sabyasachi Couture',
      companyName: 'Sabyasachi India Private Limited',
      campaignType: 'High Fashion Editorial',
      shootType: 'Outdoor Runway & Heritage Fort Shoot',
      location: 'Jaipur, Rajasthan',
      date: '2026-07-10',
      duration: '3 Days',
      budgetRange: '₹1,00,000 - ₹1,50,000',
      notes: 'Heritage collection jewelry shoot. Accommodation, travel, and meals will be covered by the company.'
    },
    status: 'completed',
    createdAt: '2026-06-11T12:00:00Z',
    priceAmount: 105000
  },
  {
    id: 'bk_2',
    clientId: 'c2',
    clientName: 'Aman Deep (Cult.fit)',
    modelId: 'm2',
    modelName: 'Kabir Mehra',
    modelImage: MODEL_IMAGES.kabir?.[0] || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800',
    projectDetails: {
      brandName: 'Cult.Sport Athleisure',
      companyName: 'Cult.sport India',
      campaignType: 'Commercial Catalog',
      shootType: 'Indoor Studio & Fitness Zone',
      location: 'Bangalore, Karnataka',
      date: '2026-07-22',
      duration: '1 Day',
      budgetRange: '₹25,000 - ₹35,000',
      notes: 'Showcasing the winter compression pants and hoodies range.'
    },
    status: 'accepted',
    createdAt: '2026-06-14T15:30:00Z',
    priceAmount: 28000
  },
  {
    id: 'bk_3',
    clientId: 'c_test',
    clientName: 'Premium Agency (Test Client)',
    modelId: 'm1',
    modelName: 'Priya Sharma',
    modelImage: MODEL_IMAGES.priya?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800',
    projectDetails: {
      brandName: 'Vogue India Cover Shoot',
      companyName: 'Condé Nast India',
      campaignType: 'Magazine Cover',
      shootType: 'Studio Fashion Editorial',
      location: 'Mumbai, Maharashtra',
      date: '2026-06-30',
      duration: '2 Days',
      budgetRange: '₹70,000 - ₹90,000',
      notes: 'Theme is \"Modern Indian Monochromes\". Styling provided by Vogue stylists.'
    },
    status: 'pending',
    createdAt: '2026-06-20T08:00:00Z',
    priceAmount: 70000
  }
];

export const SEED_PAYMENTS: PaymentRecord[] = [
  {
    id: 'p_1',
    userId: 'c1',
    userName: 'Manish Kumar (Sabyasachi)',
    amount: 105000,
    paymentGateway: 'Razorpay',
    status: 'success',
    description: 'Campaign Booking for Priya Sharma (3 Days)',
    createdAt: '2026-06-11T12:15:00Z',
    invoiceId: 'MVI-2026-1039'
  },
  {
    id: 'p_2',
    userId: 'c2',
    userName: 'Aman Deep (Cult.fit)',
    amount: 28000,
    paymentGateway: 'Razorpay',
    status: 'success',
    description: 'Commercial Booking for Kabir Mehra (1 Day)',
    createdAt: '2026-06-14T15:45:00Z',
    invoiceId: 'MVI-2026-1040'
  },
  {
    id: 'p_3',
    userId: 'c_test',
    userName: 'Premium Agency (Test Client)',
    amount: PREMIUM_UNLOCK_AMOUNT,
    paymentGateway: 'Razorpay',
    status: 'success',
    description: 'Premium Profile Unlock for Priya Sharma',
    createdAt: '2026-06-20T08:05:00Z',
    invoiceId: 'MVI-PRE-1002'
  }
];

export const SEED_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    senderId: 'c1',
    receiverId: 'u_p_sharma',
    content: 'Hi Priya, we loved your portfolio slides. Are you available for a heritage shoot in Jaipur around July 10th?',
    timestamp: '2026-06-11T11:00:00Z',
    isRead: true,
    bookingId: 'bk_1'
  },
  {
    id: 'msg_2',
    senderId: 'u_p_sharma',
    receiverId: 'c1',
    content: 'Hi Manish! Thank you so much. Yes, July 10th to 13th is currently free in my calendar. I would be thrilled to work on this!',
    timestamp: '2026-06-11T11:15:00Z',
    isRead: true,
    bookingId: 'bk_1'
  },
  {
    id: 'msg_3',
    senderId: 'c1',
    receiverId: 'u_p_sharma',
    content: 'Excellent, I will submit the official booking request and initiate the escrow deposit now!',
    timestamp: '2026-06-11T11:30:00Z',
    isRead: true,
    bookingId: 'bk_1'
  },
  {
    id: 'msg_4',
    senderId: 'c2',
    receiverId: 'u_k_mehra',
    content: 'Hi Kabir, doing a Cult.Sport winter compression wear campaign in Bangalore. Single day shoot.',
    timestamp: '2026-06-14T14:40:00Z',
    isRead: true,
    bookingId: 'bk_2'
  },
  {
    id: 'msg_5',
    senderId: 'u_k_mehra',
    receiverId: 'c2',
    content: 'Awesome! That sounds perfect. I am fully fit and ready to fly down to Bangalore. Let\'s do it.',
    timestamp: '2026-06-14T15:00:00Z',
    isRead: true,
    bookingId: 'bk_2'
  }
];

export const SEED_PAYOUTS: Payout[] = [
  {
    id: 'pay_1',
    bookingId: 'bk_1',
    brandName: 'Sabyasachi Couture',
    modelId: 'm1',
    modelName: 'Priya Sharma',
    clientId: 'c1',
    clientName: 'Manish Kumar (Sabyasachi)',
    amount: 105000,
    escrowStatus: 'pending_approval',
    createdAt: '2026-06-11T12:00:00Z',
    payoutNotes: 'Campaign successfully completed. Client has marked booking as completed and verified deliverables.'
  },
  {
    id: 'pay_2',
    bookingId: 'bk_2',
    brandName: 'Cult.Sport Athleisure',
    modelId: 'm2',
    modelName: 'Kabir Mehra',
    clientId: 'c2',
    clientName: 'Aman Deep (Cult.fit)',
    amount: 28000,
    escrowStatus: 'escrowed',
    createdAt: '2026-06-14T15:30:00Z',
    payoutNotes: 'Funds held in escrow. Awaiting campaign completion confirmation.'
  }
];

export const SEED_POSTS: Post[] = [
  {
    id: 'post_1',
    modelId: 'm1',
    modelName: 'Priya Sharma',
    modelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600',
    caption: 'Walking the ramp for Lakme Fashion Week was an absolute dream! ✨ So grateful to the incredible team and designers who put this masterpiece together. #LFW #Runway #FashionModel #Couture',
    likesCount: 142,
    commentsCount: 18,
    createdAt: '2026-06-28T14:30:00Z',
    likedByMe: false
  },
  {
    id: 'post_2',
    modelId: 'm2',
    modelName: 'Kabir Mehra',
    modelAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600',
    caption: 'Early morning grind. Sweat today, shine tomorrow. 💪 Partnered up with Nike India for their new summer athleisure line. Stay tuned for the official release! 👟⚡ #FitnessModel #Workouts #Activewear #Athlete',
    likesCount: 98,
    commentsCount: 12,
    createdAt: '2026-06-29T08:15:00Z',
    likedByMe: false
  },
  {
    id: 'post_3',
    modelId: 'm3',
    modelName: 'Anjali Rao',
    modelAvatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=150',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600',
    caption: 'A cup of coffee and some UGC scripting before the camera rolls! ☕🎬 Creating content that speaks to the heart. What brand should I review next? Let me know! 👇 #UGCCreator #ContentCreation #Lifestyle #Aesthetic',
    likesCount: 74,
    commentsCount: 22,
    createdAt: '2026-06-30T11:45:00Z',
    likedByMe: false
  },
  {
    id: 'post_4',
    modelId: 'm5',
    modelName: 'Rhea Kapoor',
    modelAvatar: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=150',
    imageUrl: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600',
    caption: 'Flawless skin is always in. Behind the scenes from my skincare commercial campaign for Nykaa. The glow is real! ✨💧 #CommercialModel #Skincare #BeautyCampaign #BehindTheScenes',
    likesCount: 120,
    commentsCount: 15,
    createdAt: '2026-07-01T16:20:00Z',
    likedByMe: false
  },
  {
    id: 'post_5',
    modelId: 'm4',
    modelName: 'Vikram Singh',
    modelAvatar: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=150',
    imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=600',
    caption: 'Between takes on set. Acting is not about being someone different. It’s about finding the similarity in what is apparently different, then finding myself in there. 🎬🎭 #ActorLife #ShootDays #BehindTheCamera #OTTSeries',
    likesCount: 112,
    commentsCount: 9,
    createdAt: '2026-07-02T10:00:00Z',
    likedByMe: false
  }
];

export function initializeLocalStorage() {
  if (typeof window === 'undefined') return;

  try {
    const existingModelsStr = localStorage.getItem('mvi_models');
    if (existingModelsStr) {
      const parsed = JSON.parse(existingModelsStr);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(m => !isDummyModel(m));
        localStorage.setItem('mvi_models', JSON.stringify(cleaned));
      }
    } else {
      localStorage.setItem('mvi_models', JSON.stringify([]));
    }
  } catch (e) {
    localStorage.setItem('mvi_models', JSON.stringify([]));
  }
  if (!localStorage.getItem('mvi_reviews')) {
    localStorage.setItem('mvi_reviews', JSON.stringify(SEED_REVIEWS));
  }
  if (!localStorage.getItem('mvi_blogs')) {
    localStorage.setItem('mvi_blogs', JSON.stringify(SEED_BLOGS));
  }
  if (!localStorage.getItem('mvi_bookings')) {
    localStorage.setItem('mvi_bookings', JSON.stringify([]));
  }
  if (!localStorage.getItem('mvi_payments')) {
    localStorage.setItem('mvi_payments', JSON.stringify(SEED_PAYMENTS));
  }
  if (!localStorage.getItem('mvi_messages')) {
    localStorage.setItem('mvi_messages', JSON.stringify(SEED_MESSAGES));
  }
  if (!localStorage.getItem('mvi_unlocked_profiles')) {
    // Stores unlocked profile model IDs format: ['m1', 'm2']
    localStorage.setItem('mvi_unlocked_profiles', JSON.stringify(['m4', 'm6'])); // some are free/purchased
  }
  if (!localStorage.getItem('mvi_payouts')) {
    localStorage.setItem('mvi_payouts', JSON.stringify(SEED_PAYOUTS));
  }
  if (!localStorage.getItem('mvi_posts')) {
    localStorage.setItem('mvi_posts', JSON.stringify(SEED_POSTS));
  }

  // Auto-sanitize all local storage values on startup to prevent 404 console errors from stale upload URLs
  const keysToSanitize = [
    'mvi_models',
    'mvi_users',
    'mvi_reviews',
    'mvi_blogs',
    'mvi_bookings',
    'mvi_payments',
    'mvi_messages',
    'mvi_payouts',
    'mvi_posts'
  ];

  for (const key of keysToSanitize) {
    try {
      const val = localStorage.getItem(key);
      if (val) {
        const parsed = JSON.parse(val);
        const sanitized = sanitizeValue(parsed);
        localStorage.setItem(key, JSON.stringify(sanitized));
      }
    } catch (e) {
      console.warn(`[Sanitizer] Failed to sanitize key ${key}:`, e);
    }
  }
}

// Global invocation of LocalStorage initialization
initializeLocalStorage();
