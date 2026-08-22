import React from 'react';
import instituteLogoImg from '../../assets/images/institute_logo_1787395498879.jpg';

interface InstituteLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  customClass?: string;
  showText?: boolean;
  textColor?: string;
  subtextColor?: string;
  variant?: 'circle' | 'rounded' | 'square';
  withBorder?: boolean;
  withGlow?: boolean;
  alt?: string;
}

export const INSTITUTE_LOGO_SRC = instituteLogoImg;

export const InstituteLogo: React.FC<InstituteLogoProps> = ({
  size = 'md',
  customClass = '',
  showText = false,
  textColor = 'text-white',
  subtextColor = 'text-amber-400',
  variant = 'rounded',
  withBorder = true,
  withGlow = false,
  alt = 'Biley Academy Official Logo',
}) => {
  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
    custom: '',
  };

  const roundedClasses = {
    circle: 'rounded-full',
    rounded: 'rounded-xl',
    square: 'rounded-none',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;
  const selectedShape = roundedClasses[variant] || roundedClasses.rounded;

  return (
    <div className={`inline-flex items-center gap-3 ${customClass}`}>
      <div
        className={`relative shrink-0 overflow-hidden bg-slate-950 ${selectedSize} ${selectedShape} ${
          withBorder ? 'border border-amber-500/40 shadow-sm' : ''
        } ${withGlow ? 'shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/50' : ''}`}
      >
        <img
          src={INSTITUTE_LOGO_SRC}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback to stylized monogram if asset fails
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-base sm:text-lg leading-tight ${textColor}`}>
              BILEY ACADEMY
            </span>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5 ${subtextColor}`}>
            Since 2026 • Class 5 to 12
          </span>
        </div>
      )}
    </div>
  );
};
