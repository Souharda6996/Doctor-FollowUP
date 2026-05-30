import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Failed to load data.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-48 bg-white/50 rounded-2xl border border-red-100">
      <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
      <p className="text-slate-600 font-medium">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
