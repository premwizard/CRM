'use client';

import React from 'react';
import { useTheme } from '@/components/providers/theme-provider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
      ) : (
        <Sun className="w-5 h-5 text-muted-foreground hover:text-foreground" />
      )}
    </button>
  );
}
