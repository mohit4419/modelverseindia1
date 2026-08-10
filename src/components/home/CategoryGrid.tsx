/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, Zap, Activity, Users, UserCheck, Film, Mic, Megaphone, Stars } from 'lucide-react';

interface CategoryGridProps {
  onSelectCategory: (category: string) => void;
}

const CATEGORY_ITEMS = [
  {
    name: 'Fashion Models',
    icon: Camera,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-pink-900 via-rose-950 to-neutral-950',
    description: 'High fashion couture, runway collections, designer campaigns',
    count: '150+ Models'
  },
  {
    name: 'Commercial Models',
    icon: Zap,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-purple-900 via-indigo-950 to-neutral-950',
    description: 'Print ads, skin cosmetics, television branding, catalogs',
    count: '240+ Models'
  },
  {
    name: 'Fitness Models',
    icon: Activity,
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-emerald-900 via-teal-950 to-neutral-950',
    description: 'Athletic wear, active health tools, gym campaigns',
    count: '80+ Models'
  },
  {
    name: 'Influencers',
    icon: Users,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-amber-900 via-orange-950 to-neutral-950',
    description: 'Social status ambassadors, high profile lifestyle stars',
    count: '180+ Talents'
  },
  {
    name: 'UGC Creators',
    icon: UserCheck,
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-cyan-900 via-blue-950 to-neutral-950',
    description: 'Self-produced high retention organic video curators',
    count: '120+ Creators'
  },
  {
    name: 'Actors',
    icon: Film,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-red-900 via-rose-950 to-neutral-950',
    description: 'Screen actors, OTT series actors, theatre artists',
    count: '95+ Actors'
  },
  {
    name: 'Event Hosts',
    icon: Mic,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-violet-900 via-purple-950 to-neutral-950',
    description: 'Corporate master of ceremonies, high-end automotive expos',
    count: '60+ Presenters'
  },
  {
    name: 'Promotional Models',
    icon: Megaphone,
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-fuchsia-900 via-pink-950 to-neutral-950',
    description: 'Product launches, convention representatives, tech fairs',
    count: '110+ Profiles'
  },
  {
    name: 'Brand Ambassadors',
    icon: Stars,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop',
    gradient: 'from-[#FF5722] via-[#FF6F00] to-neutral-950',
    description: 'Corporate figures, exclusive campaign faces, runway icons',
    count: '45+ Faces'
  }
];

export default function CategoryGrid({ onSelectCategory }: CategoryGridProps) {
  return (
    <section id="homepage-categories" className="py-24 bg-[#FCFBF9] dark:bg-neutral-950 px-4 sm:px-6 lg:px-8 border-b border-black/5 dark:border-white/5">
      <div className="mx-auto max-w-7xl">
        
        {/* Title */}
        <div className="mb-16 text-center">
          <span className="font-mono text-xs font-black uppercase tracking-widest text-[#D4AF37]">
            Casting Categories
          </span>
          <h2 className="mt-2 font-sans text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
            Browse Models By Specialization
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-normal leading-relaxed">
            Discover top-tier models and creators across highly specialized campaign categories. Instant criteria match based on daily rates, location nodes, and verification.
          </p>
        </div>

        {/* Categories Bento-Style Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_ITEMS.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.name}
                id={`cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectCategory(cat.name)}
                className="group relative h-72 overflow-hidden rounded-3xl cursor-pointer border border-black/5 dark:border-white/10 shadow-sm hover:shadow-xl hover:scale-101 transform duration-300 bg-white dark:bg-neutral-900"
              >
                {/* Background Unsplash Image */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />

                {/* Dark Gradient Overlay for text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30 group-hover:from-black/95 group-hover:via-black/65 transition-colors duration-300" />

                {/* Category Metadata content layout */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white text-left z-10">
                  <div className="flex items-center space-x-2 text-[#D4AF37] mb-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 border border-white/10 backdrop-blur text-white">
                      <IconComponent className="h-4 w-4" />
                    </span>
                    <span className="font-mono text-[9px] uppercase font-bold tracking-wider border border-purple-500/30 px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-purple-600/90 to-pink-600/90 shadow-sm">
                      {cat.count}
                    </span>
                  </div>
                  
                  <h3 className="font-sans text-lg font-bold tracking-tight text-white group-hover:text-[#F3D78A] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-neutral-300 font-medium leading-relaxed font-sans line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
