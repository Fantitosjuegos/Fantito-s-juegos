import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500">
    <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6">
      <Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
    </div>
    <h3 className="text-xl font-display font-bold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm max-w-[280px] mb-8">{description}</p>
    
    {action && (
      <button 
        onClick={action.onClick}
        className="px-6 py-3 bg-primary text-primary-foreground font-display font-bold rounded-xl hover:opacity-90 transition-opacity"
      >
        {action.label}
      </button>
    )}
  </div>
);