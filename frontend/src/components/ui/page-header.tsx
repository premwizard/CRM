import React from "react";
import { LucideIcon, Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export function PageHeader({
  title,
  description,
  actionText,
  onAction,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border mb-6 gap-4">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-6 h-6 text-primary" />}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {actionText && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
