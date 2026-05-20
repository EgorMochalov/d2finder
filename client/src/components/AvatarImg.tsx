import { useState } from 'react';
import { resolveMediaUrl } from '../lib/api';

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  square?: boolean;
}

export default function AvatarImg({ src, alt, className = 'w-10 h-10', square }: Props) {
  const [failed, setFailed] = useState(false);
  const url = resolveMediaUrl(src);

  const base = square ? 'avatar-square' : 'avatar';

  if (!url || failed) {
    return <div className={`${base} ${className}`}>{alt[0]?.toUpperCase() || '?'}</div>;
  }

  return (
    <div className={`${base} ${className} overflow-hidden`}>
      <img src={url} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} />
    </div>
  );
}
