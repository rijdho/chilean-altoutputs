import { types } from '../../lib/data';

const allTypes = ['All', ...types.map(t => t.type)];

export default function TypeFilter({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {allTypes.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className="px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer"
          style={{
            background: value === t ? 'var(--color-accent)' : 'transparent',
            color: value === t ? '#fff' : 'var(--color-text2)',
            borderColor: value === t ? 'var(--color-accent)' : 'var(--color-border)',
          }}
        >
          {t}{t !== 'All' ? ` (${types.find(x => x.type === t)?.count ?? 0})` : ''}
        </button>
      ))}
    </div>
  );
}
