import { useI18n } from '../../i18n/index.jsx';

export default function EmptyState({ message }) {
  const { t } = useI18n();
  return (
    <div className="text-center py-12" style={{ color: 'var(--color-text2)' }}>
      <p className="text-sm">{message || t('common.empty')}</p>
    </div>
  );
}
