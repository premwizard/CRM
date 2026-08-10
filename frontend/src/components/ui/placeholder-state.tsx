import React from 'react';
import { LucideIcon, Layers } from 'lucide-react';

interface PlaceholderStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export function PlaceholderState({
  title,
  description,
  icon: Icon = Layers,
  actionText,
  onAction,
}: PlaceholderStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-lg bg-card text-center my-4">
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">{description}</p>
      {actionText && (
        <button
          onClick={onAction}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
