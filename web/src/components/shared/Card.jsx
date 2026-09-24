export default function Card({ title, children, className = '' }) {
  return (
    <div
      className={`rounded-lg border p-4 ${className}`}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      {title && (
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
