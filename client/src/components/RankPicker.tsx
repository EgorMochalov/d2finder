interface Props {
  value: number;
  onChange: (v: number) => void;
  allowPlus?: boolean;
}

const RANKS = [
  { label: 'Herald', icon: '👶', mmr: 0 },
  { label: 'Guardian', icon: '🛡️', mmr: 770 },
  { label: 'Crusader', icon: '⚔️', mmr: 1540 },
  { label: 'Archon', icon: '🌟', mmr: 2310 },
  { label: 'Legend', icon: '💀', mmr: 3080 },
  { label: 'Ancient', icon: '🏛️', mmr: 3850 },
  { label: 'Divine', icon: '👼', mmr: 4620 },
  { label: 'Immortal', icon: '🏆', mmr: 5420 },
];

export default function RankPicker({ value, onChange, allowPlus }: Props) {
  return (
    <div className="rank-picker">
      <button
        type="button"
        onClick={() => onChange(0)}
        className={`rank-option ${value === 0 ? 'selected' : ''}`}
      >—</button>
      {RANKS.map((r, i) => {
        const v = allowPlus ? i + 1 : r.mmr;
        const sel = allowPlus ? value === v || value === -(i + 1) : value === r.mmr;
        return (
          <button
            key={r.label}
            type="button"
            onClick={() => onChange(sel ? 0 : v)}
            className={`rank-option ${sel ? 'selected' : ''}`}
            title={`${r.icon} ${r.label}`}
          >
            {r.icon} {r.label}
          </button>
        );
      })}
    </div>
  );
}
