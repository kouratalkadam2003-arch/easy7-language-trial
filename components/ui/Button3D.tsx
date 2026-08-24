import React from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility function for merging Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'gray';

interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export const Button3D = React.forwardRef<HTMLButtonElement, Button3DProps>(
  ({ className, variant = 'primary', fullWidth = false, children, disabled, ...props }, ref) => {
    
    // Map variants to specific Tailwind classes referencing our index.css tokens
    const variantStyles: Record<ButtonVariant, string> = {
      primary: 'bg-lingo-blue text-white shadow-lingo-blue-dark hover:bg-lingo-blue/90',
      secondary: 'bg-lingo-green text-white shadow-lingo-green-dark hover:bg-lingo-green/90',
      danger: 'bg-lingo-red text-white shadow-lingo-red-dark hover:bg-lingo-red/90',
      gray: 'bg-lingo-gray text-text-muted shadow-lingo-gray-dark hover:bg-lingo-gray/90',
      ghost: 'bg-transparent text-lingo-blue shadow-transparent border-2 border-border-main hover:bg-bg-subtle',
    };

    const baseClasses = cn(
      'relative uppercase font-bold text-sm tracking-wider rounded-xl px-4 py-3 transition-colors outline-none',
      'shadow-3d active:shadow-3d-active',
      fullWidth ? 'w-full' : 'inline-block',
      variantStyles[variant],
      disabled && 'opacity-50 cursor-not-allowed shadow-none transform-none active:transform-none active:shadow-none',
      className
    );

    return (
      <motion.button
        ref={ref}
        className={baseClasses}
        whileTap={disabled ? {} : { y: 4, boxShadow: '0 0px 0 0 var(--tw-shadow-color)' }}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button3D.displayName = 'Button3D';
