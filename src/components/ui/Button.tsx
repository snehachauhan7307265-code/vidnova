import React from 'react';
import { cn } from '../../utils/cn';
import { motion, HTMLMotionProps } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white hover:opacity-90',
      secondary: 'bg-white/5 border border-white/5 text-zinc-300 hover:bg-white/10 hover:text-white',
      outline: 'border border-border bg-transparent hover:bg-white/5 hover:text-white',
      ghost: 'hover:bg-white/5 text-zinc-400 hover:text-white',
      glass: 'bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-8 text-lg',
      icon: 'h-10 w-10 flex items-center justify-center p-2 rounded-full',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
