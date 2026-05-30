import React from 'react';

interface SkeletonProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className = '' }: SkeletonProps) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-full skeleton flex-shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 bg-slate-200 rounded skeleton w-3/4" />
          <div className="space-y-2">
            {Array.from({ length: lines - 1 }).map((_, i) => (
              <div key={i} className="h-3 bg-slate-200 rounded skeleton w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
