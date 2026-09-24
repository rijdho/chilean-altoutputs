export default function EmptyState({ message }) {
  return (
    <div className="text-center py-12" style={{ color: 'var(--color-text2)' }}>
      <p className="text-sm">{message || 'No data yet — run the pipeline.'}</p>
    </div>
  );
}
