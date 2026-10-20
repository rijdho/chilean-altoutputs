export default function KpiCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '18px 16px' }}>
      <div style={{ fontFamily: 'var(--disp)', fontWeight: 800, fontSize: '1.9rem', letterSpacing: '-0.03em',
        lineHeight: 1.1, color: color || 'var(--brand)' }}>
        {value}
      </div>
      <div className="mono" style={{ fontSize: '.72rem', letterSpacing: '.06em', textTransform: 'uppercase',
        color: 'var(--muted)', marginTop: 6 }}>
        {label}
      </div>
      {sub && <div className="muted" style={{ fontSize: '.75rem', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
