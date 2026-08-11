import React from 'react';
import { Database } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no items currently logged in this database view.',
  icon: Icon = Database,
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 glass-card rounded-xl border border-brand-border/40 my-4 max-w-lg mx-auto">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-brand-surface border border-brand-border text-brand-text-secondary mb-4">
        <Icon size={24} className="opacity-80" />
      </div>
      <h3 className="font-outfit font-semibold text-lg text-brand-text-primary mb-1">
        {title}
      </h3>
      <p className="text-sm text-brand-text-secondary leading-relaxed max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <div className="flex justify-center w-full">
          {action}
        </div>
      )}
    </div>
  );
}
