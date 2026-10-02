import React from 'react';
import { ThemeMode } from '../i18n/translations';

interface LogoProps {
  className?: string;
  theme?: ThemeMode;
}

export const NcConsultingLogo: React.FC<LogoProps> = ({ className = 'h-10', theme = 'neon' }) => {
  const isLight = theme === 'light';

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className="flex flex-col justify-center">
        <span 
          className={`text-base font-extrabold tracking-[0.24em] uppercase font-sans leading-none ${
            isLight ? 'text-black' : 'text-[#CCA342]'
          }`}
        >
          NC CONSULTING
        </span>
      </div>
    </div>
  );
};
