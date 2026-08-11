import React from 'react';

export default function LoadingState({ variant = 'card', count = 3 }) {
  const renderSkeletons = () => {
    const items = Array.from({ length: count });

    if (variant === 'table') {
      return (
        <div className="w-full space-y-4">
          <div className="flex space-x-4 border-b border-brand-border pb-4">
            <div className="h-4 bg-brand-bg/80 rounded w-1/4 animate-pulse" />
            <div className="h-4 bg-brand-bg/80 rounded w-1/4 animate-pulse" />
            <div className="h-4 bg-brand-bg/80 rounded w-1/4 animate-pulse" />
            <div className="h-4 bg-brand-bg/80 rounded w-1/4 animate-pulse" />
          </div>
          {items.map((_, i) => (
            <div key={i} className="flex space-x-4 py-2 border-b border-brand-border/50">
              <div className="h-6 bg-brand-bg/80 rounded w-1/4 animate-pulse" />
              <div className="h-6 bg-brand-bg/80 rounded w-1/3 animate-pulse" />
              <div className="h-6 bg-brand-bg/80 rounded w-1/6 animate-pulse" />
              <div className="h-6 bg-brand-bg/80 rounded w-1/6 animate-pulse" />
            </div>
          ))}
        </div>
      );
    }

    if (variant === 'stats') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((_, i) => (
            <div key={i} className="glass-card p-6 rounded-xl space-y-4">
              <div className="h-4 bg-brand-bg/80 rounded w-1/2 animate-pulse" />
              <div className="h-8 bg-brand-bg/80 rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-brand-bg/80 rounded w-2/3 animate-pulse" />
            </div>
          ))}
        </div>
      );
    }

    if (variant === 'list') {
      return (
        <div className="space-y-3">
          {items.map((_, i) => (
            <div key={i} className="glass-card p-4 rounded-lg flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-brand-bg/80 rounded w-1/3 animate-pulse" />
                <div className="h-3 bg-brand-bg/80 rounded w-1/2 animate-pulse" />
              </div>
              <div className="h-8 bg-brand-bg/80 rounded w-16 animate-pulse" />
            </div>
          ))}
        </div>
      );
    }

    // Default: Card list layout
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((_, i) => (
          <div key={i} className="glass-card p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="h-5 bg-brand-bg/80 rounded w-1/2 animate-pulse" />
              <div className="h-6 bg-brand-bg/80 rounded w-16 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-brand-bg/80 rounded w-full animate-pulse" />
              <div className="h-4 bg-brand-bg/80 rounded w-5/6 animate-pulse" />
            </div>
            <div className="border-t border-brand-border/40 pt-4 flex justify-between">
              <div className="h-4 bg-brand-bg/80 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-brand-bg/80 rounded w-1/4 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return <div className="py-4 w-full">{renderSkeletons()}</div>;
}
