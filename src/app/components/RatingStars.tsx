'use client';

import { useMemo } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  value: number; // 0-5
  onChange?: (next: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}

export default function RatingStars({ value, onChange, size = 'md', readOnly = false }: RatingStarsProps) {
  const sizePx = useMemo(() => (size === 'sm' ? 16 : size === 'lg' ? 24 : 20), [size]);
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {stars.map((s) => {
        const active = value >= s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={readOnly || !onChange}
            onClick={() => onChange && onChange(s)}
            className={`p-0.5 rounded ${readOnly ? 'cursor-default' : 'hover:scale-110'} transition-transform`}
          >
            <Star
              style={{ width: sizePx, height: sizePx }}
              className={`${active ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'} drop-shadow-[0_0_1px_rgba(0,0,0,0.05)]`}
            />
          </button>
        );
      })}
    </div>
  );
}


