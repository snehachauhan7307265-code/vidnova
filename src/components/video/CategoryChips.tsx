import React from 'react';
import { categories } from '../../data/mock';
import { cn } from '../../utils/cn';
import { motion } from 'motion/react';

interface CategoryChipsProps {
  activeCategory: string;
  onSelect: (category: string) => void;
}

export function CategoryChips({ activeCategory, onSelect }: CategoryChipsProps) {
  return (
    <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md py-3 w-full border-b border-border mb-6">
      <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar px-4 sm:px-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              activeCategory === category 
                ? "bg-white text-black font-bold" 
                : "bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300"
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
