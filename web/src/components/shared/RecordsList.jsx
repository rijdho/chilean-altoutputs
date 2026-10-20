import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/index.jsx';

/* Lazy-loaded records cache: fetched once, reused */
let _cache = null;
let _promise = null;

function loadRecords() {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = fetch('./data/records-lite.json')
    .then(r => {
      if (!r.ok) throw new Error(`records-lite: HTTP ${r.status}`);
      return r.json();
    })
    .then(data => { _cache = data; return data; });
  _promise.catch(() => { _promise = null; }); // allow a retry
  return _promise;
}

/**
 * Shows a filterable list of records matching a condition.
 * Loads records-lite.json lazily on first render.
 */
export default function RecordsList({ filter, title, onClose, initialSource }) {
  const { t, n } = useI18n();
  const [sourceFilter, setSourceFilter] = useState(initialSource || 'All');
  const [records, setRecords] = useState(_cache);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (_cache) { setRecords(_cache); setLoading(false); return; }
    loadRecords()
      .then(data => { setRecords(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (error) {
    return (
      <div className="mt-3 p-3 rounded border" onClick={e => e.stopPropagation()} style={{
        borderColor: 'var(--color-border)', background: 'var(--color-surface)',
      }}>
        <div className="flex justify-between items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--color-text2)' }}>{t('common.loadError')}</span>
          <button onClick={() => window.location.reload()} className="text-xs underline cursor-pointer whitespace-nowrap" style={{ color: 'var(--color-accent)' }}>{t('common.reload')}</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-3 p-3 rounded border" onClick={e => e.stopPropagation()} style={{
        borderColor: 'var(--color-border)', background: 'var(--color-surface)',
      }}>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: 'var(--color-text2)' }}>{t('common.loading')}</span>
          <button onClick={onClose} className="text-xs underline cursor-pointer" style={{ color: 'var(--color-accent)' }}>{t('common.close')}</button>
        </div>
      </div>
    );
  }

  const baseMatches = (records || []).filter(filter);
  const matches = (sourceFilter === 'All'
    ? baseMatches
    : baseMatches.filter(r => r.source === sourceFilter)
  ).sort((a, b) => (b.year || 0) - (a.year || 0));

  const dcCount = baseMatches.filter(r => r.source === 'DataCite').length;
  const anidCount = baseMatches.filter(r => r.source === 'ANID').length;

  return (
    <div className="mt-3 p-3 rounded border animate-fade-in" onClick={e => e.stopPropagation()} style={{
      borderColor: 'var(--color-border)',
      background: 'var(--color-surface)',
    }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
          {t('common.listTitle', { title, n: n(matches.length) })}
        </span>
        <button
          onClick={onClose}
          className="text-xs underline cursor-pointer"
          style={{ color: 'var(--color-accent)' }}
        >
          {t('common.close')}
        </button>
      </div>

      {/* Source toggle */}
      {dcCount > 0 && anidCount > 0 && (
        <div className="flex gap-1.5 mb-2">
          {[
            { key: 'All', label: `${t('common.all')} (${n(baseMatches.length)})` },
            { key: 'DataCite', label: `DataCite (${n(dcCount)})` },
            { key: 'ANID', label: `ANID (${n(anidCount)})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSourceFilter(key)}
              className="px-2 py-0.5 text-xs rounded-full border cursor-pointer transition-colors"
              style={{
                background: sourceFilter === key ? (key === 'ANID' ? 'var(--color-tier2)' : key === 'DataCite' ? 'var(--color-accent)' : 'var(--color-text2)') : 'transparent',
                color: sourceFilter === key ? '#fff' : 'var(--color-text2)',
                borderColor: sourceFilter === key ? 'transparent' : 'var(--color-border)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-auto" style={{ maxHeight: '480px' }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0" style={{ background: 'var(--color-surface)' }}>
            <tr style={{ color: 'var(--color-text2)' }}>
              <th className="text-left p-1">{t('th.title')}</th>
              <th className="text-left p-1">{t('th.type')}</th>
              <th className="text-left p-1">{t('th.source')}</th>
              <th className="text-left p-1">{t('th.year')}</th>
              <th className="text-left p-1">{t('th.license')}</th>
              <th className="text-left p-1">{t('th.doi')}</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((r, i) => (
              <tr key={i} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <td className="p-1" style={{ color: 'var(--color-text)', maxWidth: 300 }}>
                  <span className="line-clamp-1">{r.title || t('common.untitled')}</span>
                </td>
                <td className="p-1" style={{ color: 'var(--color-text2)' }}>{r.type}</td>
                <td className="p-1" style={{
                  color: r.source === 'DataCite' ? 'var(--color-accent)' : 'var(--color-tier2)',
                }}>{r.source}</td>
                <td className="p-1 font-mono" style={{ color: 'var(--color-text2)' }}>{r.year || '--'}</td>
                <td className="p-1" style={{ color: 'var(--color-text2)' }}>{r.license}</td>
                <td className="p-1">
                  {r.doi ? (
                    <a
                      href={`https://doi.org/${r.doi}`}
                      target="_blank"
                      rel="noopener"
                      className="font-mono hover:underline"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {r.doi.length > 30 ? r.doi.slice(0, 28) + '...' : r.doi}
                    </a>
                  ) : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
