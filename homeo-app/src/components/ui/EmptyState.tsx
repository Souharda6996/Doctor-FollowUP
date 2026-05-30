import React from 'react';
import { FileQuestion, DivideIcon as LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = FileQuestion, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
