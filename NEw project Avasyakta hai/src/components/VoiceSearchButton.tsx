import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { VoiceSearchModal } from './VoiceSearchModal';
import { useLanguage } from '@/context/LanguageContext';

interface VoiceSearchButtonProps {
  onResult: (query: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  ariaLabel?: string;
}

export function VoiceSearchButton({
  onResult,
  className = '',
  size = 'md',
  title,
  ariaLabel,
}: VoiceSearchButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language } = useLanguage();

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
  }[size];

  const iconSizes = {
    sm: 15,
    md: 17,
    lg: 20,
  }[size];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`group relative inline-flex items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 shadow-xs transition-all duration-200 active:scale-95 cursor-pointer ${sizeClasses} ${className}`}
        title={
          title ||
          (language === 'hi' ? 'बोलकर नौकरी खोजें (Voice Search)' : 'Search by Voice')
        }
        aria-label={ariaLabel || 'Voice search'}
      >
        <Mic
          size={iconSizes}
          className="transition-transform group-hover:scale-110 text-emerald-600 dark:text-emerald-400"
        />

        {/* Small green active dot indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </button>

      <VoiceSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onResult={onResult}
      />
    </>
  );
}
