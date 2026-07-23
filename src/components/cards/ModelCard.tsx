import React from 'react';
import { Model } from '../../types';
import { MapPin, Star, Sparkles } from 'lucide-react';

interface ModelCardProps {
  model: Model;
  onClick?: () => void;
}

export default function ModelCard({ model, onClick }: ModelCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm transition hover:shadow-md cursor-pointer"
    >
      <div className="aspect-[3/4] w-full overflow-hidden bg-neutral-100 relative">
        <img
          src={model.portfolio[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'}
          alt={model.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
        />
        {model.featured && (
          <span className="absolute top-3 left-3 inline-flex items-center space-x-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[9px] font-bold text-amber-400 border border-amber-500/30">
            <Sparkles className="h-2.5 w-2.5 fill-amber-500" />
            <span>Elite</span>
          </span>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="font-sans text-sm font-black text-neutral-900 dark:text-white group-hover:text-purple-650 dark:group-hover:text-pink-400 transition">
              {model.name}
            </h4>
            <div className="flex items-center space-x-0.5 text-xs text-amber-500 font-bold">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>{model.rating}</span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 font-medium mt-0.5">{model.category}</p>
        </div>
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-1 text-[11px] text-neutral-500">
            <MapPin className="h-3.5 w-3.5" />
            <span>{model.city}</span>
          </div>
          <span className="text-xs font-black text-neutral-900 dark:text-white">
            ₹{model.startingPrice.toLocaleString('en-IN')}/day
          </span>
        </div>
      </div>
    </div>
  );
}
