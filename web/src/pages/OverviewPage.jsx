import { useState, useEffect } from 'react';
import { overview, types, licenses as licensesRaw, institutions, fields as fieldsData } from '../lib/data';
import KpiCard from '../components/shared/KpiCard';
import Card from '../components/shared/Card';
import TypeFilter from '../components/shared/TypeFilter';
import RecordsList from '../components/shared/RecordsList';
import { useI18n } from '../i18n/index.jsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

const allLicenses = licensesRaw?.distribution ?? (Array.isArray(licensesRaw) ? licensesRaw : []);

const shortenLicense = (name) => {
  if (!name) return 'Unknown';
  if (name === '(none)' || name === 'No license') return 'No license';
  return name
    .replace('Creative Commons ', 'CC ')
    .replace('Attribution', 'BY')
    .replace('Non Commercial', 'NC')
    .replace('No Derivatives', 'ND')
    .replace('Share Alike', 'SA')
    .replace(' International', '')
    .replace(' 4.0', '')
    .replace(' License', '')
    .replace(' only', '')
    .replace(' or later', '+');
};


const tooltipStyle = {
  backgroundColor: 'var(--color-surface)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
};

import EmptyState from '../components/shared/EmptyState';

/* Compute license distribution from records-lite for a given filter */
function computeLicenses(records) {
  const counts = {};
  for (const r of records) {
    const lic = r.license || 'No license';
    if (!counts[lic]) counts[lic] = { total: 0, DataCite: 0, ANID: 0 };
    counts[lic].total++;
    counts[lic][r.source] = (counts[lic][r.source] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, d]) => ({
      license: shortenLicense(name),
      rawName: name,
      count: d.total,
      DataCite: d.DataCite,
      ANID: d.ANID,
    }))
    .sort((a, b) => b.count - a.count);
}

/* Compute top institutions from records-lite */
function computeInstitutions(records) {
  // Simple: count publisher occurrences as proxy
  // For real institutions we'd need affiliation data, which isn't in records-lite
  return null; // use pre-aggregated
}

export default function OverviewPage() {
  const { t, n: fmt, field } = useI18n();
  const licLabel = (l) => (l === 'No license' ? t('common.noLicense') : l === 'Unknown' ? t('common.unknown') : l);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [selectedLicenseSource, setSelectedLicenseSource] = useState(null);
  const [clickedType, setClickedType] = useState(null);
  const [clickedRepo, setClickedRepo] = useState(null);

  const [recordsLite, setRecordsLite] = useState(null);

  const hasData = overview.totalRecords > 0;
  const typeData = selectedType !== 'All' ? types.find(t => t.type === selectedType) : null;

  /* Lazy load records-lite only when filtering by type */
  useEffect(() => {
    if (selectedType !== 'All' && !recordsLite) {
      fetch('./data/records-lite.json').then(r => r.json()).then(setRecordsLite);
    }
  }, [selectedType, recordsLite]);

  /* License data: pre-aggregated for All, computed for filtered type */
  const licenseData = selectedType === 'All'
    ? allLicenses.slice(0, 20).map(l => ({
        license: shortenLicense(l.name),
        count: l.count,
        DataCite: l.DataCite ?? 0,
        ANID: l.ANID ?? 0,
      }))
    : recordsLite
      ? computeLicenses(recordsLite.filter(r => r.type === selectedType))
      : [];

  /* KPIs */
  const totalCount = typeData?.count ?? overview.totalRecords;
  const dcCount = typeData?.bySource?.DataCite ?? overview.bySource?.DataCite ?? 0;
  const anidCount = typeData?.bySource?.ANID ?? overview.bySource?.ANID ?? 0;
  const avgCompl = typeData?.avgCompleteness ?? overview.avgCompleteness;

  /* Top repos for selected type */
  const repos = typeData?.repos ?? null;

  /* Top institutions (only for All: not available per type) */
  const topInstitutions = selectedType === 'All' ? institutions.slice(0, 10) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          {t('overview.title')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text2)' }}>
          {hasData
            ? selectedType === 'All'
              ? t('overview.subAll', { n: fmt(overview.totalRecords) })
              : t('overview.subType', { type: selectedType, n: fmt(totalCount), pct: fmt(avgCompl) })
            : t('overview.subEmpty')}
        </p>
        {selectedType === 'All' && (
          <p className="text-xs mt-2 max-w-2xl" style={{ color: 'var(--color-text2)', opacity: 0.8 }}>
            {t('overview.lede')}
          </p>
        )}
      </div>

      {/* Type filter */}
      <Card>
        <TypeFilter value={selectedType} onChange={(t) => { setSelectedType(t); setSelectedLicense(null); setSelectedLicenseSource(null); setClickedType(null); setClickedRepo(null); }} />
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label={selectedType === 'All' ? t('overview.kpiTotal') : selectedType}
          value={hasData ? fmt(totalCount) : '--'}
        />
        <KpiCard
          label="DataCite"
          value={hasData ? fmt(dcCount) : '--'}
          sub={t('overview.kpiDcSub')}
        />
        <KpiCard
          label="ANID"
          value={hasData ? fmt(anidCount) : '--'}
          sub={t('overview.kpiAnidSub')}
        />
        <KpiCard
          label={t('overview.kpiCompl')}
          value={hasData ? `${fmt(avgCompl)}%` : '--'}
          sub={t('overview.kpiComplSub')}
          color={hasData ? 'var(--color-tier1)' : undefined}
        />
      </div>

      {/* ── Completeness by field ─────────────────────────────────── */}
      <Card title={selectedType === 'All' ? t('overview.cardCompl') : t('overview.cardComplType', { type: selectedType })}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={typeData
              ? Object.entries(typeData.fields).map(([k, v]) => {
                  const meta = fieldsData.find(f => f.id === k);
                  return {
                    field: field(k, 'label', meta?.label ?? k),
                    description: field(k, 'desc', meta?.description ?? ''),
                    DataCite: typeData.fieldsBySource?.[k]?.DataCite ?? v,
                    ANID: typeData.fieldsBySource?.[k]?.ANID ?? null,
                    count: Math.round(v / 100 * typeData.count),
                    total: typeData.count,
                  };
                })
              : fieldsData.map(f => ({
                  field: field(f.id, 'label', f.label),
                  description: field(f.id, 'desc', f.description),
                  DataCite: f.bySource?.DataCite ?? f.pct,
                  ANID: f.bySource?.ANID ?? null,
                  count: f.count,
                  total: overview.totalRecords,
                }))
            }
            layout="vertical"
            barGap={2}
          >
            <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" strokeOpacity={0.5} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="field" width={110} tick={{ fontSize: 10 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="text-xs p-2 rounded border max-w-xs" style={tooltipStyle}>
                    <div className="font-bold">{d.field}</div>
                    <div style={{ color: 'var(--color-text2)' }}>{d.description}</div>
                    <div className="mt-1">
                      <span style={{ color: 'var(--color-accent)' }}>DataCite: {d.DataCite}%</span>
                      {d.ANID != null && <span style={{ color: 'var(--color-tier2)' }}> | ANID: {d.ANID}%</span>}
                    </div>
                    <div style={{ color: 'var(--color-text2)' }}>
                      {t('common.recordsOf', { n: fmt(d.count), total: fmt(d.total) })}
                    </div>
                  </div>
                );
              }}
            />
            <Legend />
            <Bar dataKey="DataCite" name="DataCite" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="ANID" name="ANID" fill="var(--color-tier2)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Records by type (only when All) ───────────────────────── */}
      {selectedType === 'All' && (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <Card title={t('overview.cardByType')}>
              {types.length > 0 ? (
                <>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text2)' }}>{t('common.clickBar')}</p>
                  <ResponsiveContainer width="100%" height={Math.max(250, types.length * 36)}>
                    <BarChart
                      data={types.map(t => ({
                        type: t.type,
                        DataCite: t.bySource?.DataCite ?? 0,
                        ANID: t.bySource?.ANID ?? 0,
                      }))}
                      layout="vertical"
                      onClick={(e) => e?.activeLabel && setClickedType(e.activeLabel)}
                      style={{ cursor: 'pointer' }}
                    >
                      <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" strokeOpacity={0.5} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="type" width={140} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={v => fmt(v)} contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="DataCite" name="DataCite" fill="var(--color-accent)" stackId="src" />
                      <Bar dataKey="ANID" name="ANID" fill="var(--color-tier2)" stackId="src" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <EmptyState />
              )}
            </Card>

            <Card title={t('overview.cardAvgByType')}>
              {types.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(250, types.length * 36)}>
                  <BarChart
                    data={[...types].sort((a, b) => b.avgCompleteness - a.avgCompleteness).map(t => ({
                      type: t.type,
                      DataCite: t.completenessbySource?.DataCite ?? t.avgCompleteness,
                      ANID: t.completenessbySource?.ANID ?? null,
                    }))}
                    layout="vertical"
                    barGap={2}
                  >
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" strokeOpacity={0.5} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="type" width={140} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => v != null ? `${v}%` : '--'} contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="DataCite" name="DataCite" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="ANID" name="ANID" fill="var(--color-tier2)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState />
              )}
            </Card>
          </div>

          {clickedType && (
            <RecordsList
              title={clickedType}
              filter={r => r.type === clickedType}
              onClose={() => setClickedType(null)}
            />
          )}
        </>
      )}

      {/* ── Top repositories (for selected type) ──────────────────── */}
      {repos && (
        <Card title={t('overview.cardTopRepos', { type: selectedType })}>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text2)' }}>{t('common.clickBar')}</p>
          <ResponsiveContainer width="100%" height={Math.max(200, repos.length * 28)}>
            <BarChart data={repos} layout="vertical"
              onClick={(e) => e?.activeLabel && setClickedRepo(e.activeLabel)}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" strokeOpacity={0.5} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 9 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="text-xs p-2 rounded border" style={tooltipStyle}>
                      <div className="font-bold">{d.name}</div>
                      <div>{t('common.recordsPct', { n: fmt(d.count), pct: fmt(d.avgCompleteness) })}</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" name={t('series.records')} fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {clickedRepo && (
            <RecordsList
              title={clickedRepo}
              filter={r => r.publisher === clickedRepo && (selectedType === 'All' || r.type === selectedType)}
              onClose={() => setClickedRepo(null)}
            />
          )}
        </Card>
      )}

      {/* ── Licenses + Institutions ───────────────────────────────── */}
      <hr style={{ borderColor: 'var(--color-border)' }} />

      <div className="grid md:grid-cols-2 gap-4">
        <Card title={selectedType === 'All' ? t('overview.cardLicenses') : t('overview.cardLicensesType', { type: selectedType })}>
          {licenseData.length > 0 ? (
            <>
              <p className="text-xs mb-2" style={{ color: 'var(--color-text2)' }}>{t('common.clickBar')}</p>
              <ResponsiveContainer width="100%" height={Math.max(280, licenseData.length * 28)}>
                <BarChart data={licenseData} layout="vertical" style={{ cursor: 'pointer' }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" strokeOpacity={0.5} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="license" width={130} tick={{ fontSize: 9 }} tickFormatter={licLabel} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="DataCite" name="DataCite" fill="var(--color-accent)" stackId="src"
                    onClick={(d) => { setSelectedLicense(d.license); setSelectedLicenseSource('DataCite'); }}
                  />
                  <Bar dataKey="ANID" name="ANID" fill="var(--color-tier2)" stackId="src" radius={[0, 4, 4, 0]}
                    onClick={(d) => { setSelectedLicense(d.license); setSelectedLicenseSource('ANID'); }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <EmptyState />
          )}
        </Card>

        {/* Right column: institutions (always) */}
        <Card title={selectedType === 'All' ? t('overview.cardInstitutions') : t('overview.cardInstitutionsType', { type: selectedType })}>
          {topInstitutions ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topInstitutions} layout="vertical" barGap={4}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 9 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="text-xs p-2 rounded border" style={tooltipStyle}>
                        <div className="font-bold mb-1">{d.name}</div>
                        <div>{t('common.records', { n: fmt(d.count) })}</div>
                        {d.topTypes?.map(t => (
                          <div key={t.type} style={{ color: 'var(--color-text2)' }}>{t.type}: {t.count}</div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" name={t('series.records')} fill="var(--color-tier2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex gap-8 py-6 justify-center text-sm" style={{ color: 'var(--color-text2)' }}>
              <div className="text-center">
                <div className="text-2xl font-bold font-mono" style={{ color: 'var(--color-accent)' }}>{fmt(dcCount)}</div>
                <div className="text-xs mt-1">DataCite</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-mono" style={{ color: 'var(--color-tier2)' }}>{fmt(anidCount)}</div>
                <div className="text-xs mt-1">ANID</div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Records list below when license clicked */}
      {selectedLicense && (
        <RecordsList
          title={licLabel(selectedLicense)}
          filter={r => {
            const lic = shortenLicense(r.license || 'No license');
            return lic === selectedLicense && (selectedType === 'All' || r.type === selectedType);
          }}
          initialSource={selectedLicenseSource}
          onClose={() => { setSelectedLicense(null); setSelectedLicenseSource(null); }}
        />
      )}
    </div>
  );
}
