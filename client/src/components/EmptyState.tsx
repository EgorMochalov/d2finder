import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  hint?: string;
}

export default function EmptyState({ icon: Icon, title, hint }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <p className="text-text text-sm font-medium">{title}</p>
      {hint && <p className="text-muted text-xs mt-1 max-w-xs mx-auto leading-relaxed">{hint}</p>}
    </div>
  );
}
