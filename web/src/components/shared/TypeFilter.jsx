import { types } from '../../lib/data';
import { useI18n } from '../../i18n/index.jsx';

// 'All' is the internal value; resource types keep their DataCite names in every language.
const allTypes = ['All', ...types.map(t => t.type)];

export default function TypeFilter({ value, onChange }) {
  const { t, n } = useI18n();
  return (
    <div className="flex flex-wrap gap-1.5">
      {allTypes.map(ty => (
        <button
          key={ty}
          onClick={() => onChange(ty)}
          aria-pressed={value === ty}
          className="chip"
        >
          {ty === 'All' ? t('common.all') : `${ty} (${n(types.find(x => x.type === ty)?.count ?? 0)})`}
        </button>
      ))}
    </div>
  );
}
