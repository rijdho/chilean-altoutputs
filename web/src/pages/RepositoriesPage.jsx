import { useState } from 'react';
import { repositories, types } from '../lib/data';
import Card from '../components/shared/Card';
import TypeFilter from '../components/shared/TypeFilter';
import RecordsList from '../components/shared/RecordsList';
import EmptyState from '../components/shared/EmptyState';
import { useI18n } from '../i18n/index.jsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';



const tooltipStyle = {
  backgroundColor: 'var(--color-surface)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
};

const isChilean = (name) =>
  /chile/i.test(name) || /\bUCh\b/i.test(name) || /\bPUC\b/i.test(name) ||
  /\bUSACH\b/i.test(name) || /\bANID\b/i.test(name) || /Santiago/i.test(name) ||
  /Valparaiso/i.test(name) || /Concepci/i.test(name);

export default function RepositoriesPage() {
  const { t, n: fmt } = useI18n();
  const [selectedType, setSelectedType] = useState('All');
  const [selectedRepo, setSelectedRepo] = useState(null);

  const typeData = selectedType !== 'All'
    ? types.find(t => t.type === selectedType)
    : null;

  /* Repos: global or per-type */
  const repoData = typeData?.repos ?? repositories;

  /* Split by source */
  const dcRepos = repoData
    .filter(r => (r.bySource?.DataCite ?? r.count) > 0)
    .slice(0, 15);

  const anidRepos = typeData
    ? repoData.filter(r => (r.bySource?.ANID ?? 0) > 0).slice(0, 10)
    : repositories
        .filter(r => (r.bySource?.ANID ?? 0) > 0 && (r.bySource?.ANID ?? 0) >= (r.bySource?.DataCite ?? 0))
        .map(r => ({ ...r, count: r.bySource.ANID }))
        .slice(0, 10);

  /* Institutional vs international */
  const chileanRepos = repoData.filter(r => isChilean(r.name));
  const intlRepos = repoData.filter(r => !isChilean(r.name)).slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 style={{ fontSize: '1.7rem', margin: '0 0 4px' }}>
          {t('repos.title')}
        </h1>
        <p className="lede">
          {selectedType === 'All'
            ? t('repos.subAll')
            : t('repos.subType', { type: selectedType, n: fmt(typeData?.count ?? 0) })}
        </p>
      </div>

      {/* Type filter */}
      <Card>
        <TypeFilter value={selectedType} onChange={setSelectedType} />
      </Card>

      {/* ── Top repositories ──────────────────────────────────────── */}
      <Card title={selectedType === 'All' ? t('repos.cardTop') : t('repos.cardTopType', { type: selectedType })}>
        {dcRepos.length > 0 ? (
          <>
            <p className="text-xs mb-2" style={{ color: 'var(--color-text2)' }}>{t('common.clickBar')}</p>
            <ResponsiveContainer width="100%" height={Math.max(300, dcRepos.length * 30)}>
              <BarChart data={dcRepos} layout="vertical" barGap={4}
                onClick={(e) => e?.activeLabel && setSelectedRepo(e.activeLabel)}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={220} tick={{ fontSize: 9 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="text-xs p-2 rounded border" style={tooltipStyle}>
                        <div className="font-bold mb-1">{d.name}</div>
                        <div>{t('common.recordsPct', { n: fmt(d.count), pct: fmt(d.avgCompleteness) })}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" name={t('series.records')} fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {selectedRepo && (
              <RecordsList
                title={selectedRepo}
                filter={r => r.publisher === selectedRepo && (selectedType === 'All' || r.type === selectedType)}
                onClose={() => setSelectedRepo(null)}
              />
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </Card>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <Card title={t('repos.cardDetails')}>
        {repoData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: 'var(--color-text2)' }}>
                  <th className="text-left p-2">{t('th.repository')}</th>
                  <th className="text-right p-2">{t('th.records')}</th>
                  <th className="text-right p-2">{t('th.completeness')}</th>
                </tr>
              </thead>
              <tbody>
                {repoData.slice(0, 30).map(r => (
                  <tr key={r.name} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-2 font-medium" style={{ color: 'var(--color-text)' }}>{r.name}</td>
                    <td className="p-2 text-right font-mono">{fmt(r.count)}</td>
                    <td className="p-2 text-right font-mono" style={{ color: 'var(--color-tier1)' }}>
                      {r.avgCompleteness}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </Card>

      {/* ── Institutional vs International ─────────────────────────── */}
      <Card title={selectedType === 'All' ? t('repos.cardChileIntl') : t('repos.cardChileIntlType', { type: selectedType })}>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--color-tier1)' }}>
              {t('repos.chilean', { n: fmt(chileanRepos.length), m: fmt(chileanRepos.reduce((s, r) => s + r.count, 0)) })}
            </h4>
            {chileanRepos.length > 0 ? (
              <div className="space-y-1 text-xs" style={{ color: 'var(--color-text2)' }}>
                {chileanRepos.map(r => (
                  <div key={r.name} className="flex justify-between">
                    <span className="truncate mr-2">{r.name}</span>
                    <span className="font-mono flex-shrink-0">{fmt(r.count)} ({r.avgCompleteness}%)</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--color-gap)' }}>
                {t('repos.noChilean', { type: selectedType === 'All' ? t('common.all') : selectedType })}
              </p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--color-tier2)' }}>
              {t('repos.intl', { n: fmt(intlRepos.length), m: fmt(intlRepos.reduce((s, r) => s + r.count, 0)) })}
            </h4>
            <div className="space-y-1 text-xs" style={{ color: 'var(--color-text2)' }}>
              {intlRepos.map(r => (
                <div key={r.name} className="flex justify-between">
                  <span className="truncate mr-2">{r.name}</span>
                  <span className="font-mono flex-shrink-0">{fmt(r.count)} ({r.avgCompleteness}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
