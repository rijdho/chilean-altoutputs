export default function KpiCard({ label, value, sub, color }) {
  return (
    <div
      className="rounded-lg border p-4 text-center"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="text-2xl font-bold" style={{ color: color || 'var(--color-accent)' }}>
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--color-text2)' }}>
        {label}
      </div>
      {sub && (
        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text2)', opacity: 0.7 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
