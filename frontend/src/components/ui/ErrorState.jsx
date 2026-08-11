import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'System Error',
  message = 'Failed to connect to the EOC central network. Please verify that the services are online.',
  retry = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 glass-card border-brand-rose/20 bg-rose-950/10 rounded-xl my-6 max-w-lg mx-auto">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-rose/10 border border-brand-rose/20 text-brand-rose mb-4">
        <AlertCircle size={24} />
      </div>
      <h3 className="font-outfit font-semibold text-lg text-brand-text-primary mb-1">
        {title}
      </h3>
      <p className="text-sm text-brand-text-secondary leading-relaxed max-w-sm mb-6">
        {message}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-surface border border-brand-border hover:border-brand-violet/30 hover:bg-brand-surface-light text-brand-text-primary transition-all cursor-pointer"
        >
          <RefreshCw size={14} />
          Retry Connection
        </button>
      )}
    </div>
  );
}
