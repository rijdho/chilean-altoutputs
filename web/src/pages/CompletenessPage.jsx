import { useState } from 'react';
import { fields, types, yearly } from '../lib/data';
import Card from '../components/shared/Card';
import TypeFilter from '../components/shared/TypeFilter';
import EmptyState from '../components/shared/EmptyState';
import RecordsList from '../components/shared/RecordsList';
import { useI18n } from '../i18n/index.jsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';


const tooltipStyle = {
  backgroundColor: 'var(--color-surface)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
};

export default function CompletenessPage() {
  const { t, n, field } = useI18n();
  const [selectedType, setSelectedType] = useState('All');

  const [clickedYear, setClickedYear] = useState(null);
  const [clickedField, setClickedField] = useState(null);

  const typeData = selectedType !== 'All'
    ? types.find(t => t.type === selectedType)
    : null;

  /* Field data: global or per-type */
  const fieldData = typeData
    ? Object.entries(typeData.fields).map(([id, pct]) => {
        const meta = fields.find(f => f.id === id);
        const bySrc = typeData.fieldsBySource?.[id] ?? {};
        return {
          field: field(id, 'label', meta?.label ?? id),
          description: field(id, 'desc', meta?.description ?? ''),
          pct,
          DataCite: bySrc.DataCite ?? 0,
          ANID: bySrc.ANID ?? 0,
          count: Math.round(pct / 100 * typeData.count),
        };
      }).sort((a, b) => b.pct - a.pct)
    : fields.map(f => ({
        field: field(f.id, 'label', f.label),
        description: field(f.id, 'desc', f.description),
        pct: f.pct,
        DataCite: f.bySource?.DataCite ?? 0,
        ANID: f.bySource?.ANID ?? 0,
        count: f.count,
      })).sort((a, b) => b.pct - a.pct);

  /* Yearly data: global or per-type */
  const yearlyData = typeData?.yearly ?? yearly;

  /* Type comparison table (only when "All") */
  const topTypes = types.filter(t => t.count >= 10).slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 style={{ fontSize: '1.7rem', margin: '0 0 4px' }}>
          {t('compl.title')}
        </h1>
        <p className="lede">
          {selectedType === 'All'
            ? t('compl.subAll')
            : t('compl.subType', { type: selectedType, n: n(typeData?.count ?? 0), pct: n(typeData?.avgCompleteness ?? 0) })}
        </p>
      </div>

      {/* Type filter */}
      <Card>
        <TypeFilter value={selectedType} onChange={setSelectedType} />
      </Card>

      {/* ── DataCite vs ANID ─────────────────────────────────────── */}
      <Card title={selectedType === 'All' ? t('compl.cardBySource') : t('compl.cardBySourceType', { type: selectedType })}>
        {fieldData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(350, fieldData.length * 34)}>
            <BarChart data={fieldData} layout="vertical" barGap={2}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" strokeOpacity={0.5} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="field" width={120} tick={{ fontSize: 10 }} />
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
                        {t('common.records', { n: n(d.count ?? 0) })}
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
        ) : (
          <EmptyState />
        )}
      </Card>

      {/* ── By resource type (only when All) ──────────────────────── */}
      {selectedType === 'All' && topTypes.length > 0 && (
        <Card title={t('compl.cardByResType')}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: 'var(--color-text2)' }}>
                  <th className="text-left p-2">{t('th.field')}</th>
                  {topTypes.map(t => (
                    <th key={t.type} className="text-right p-2">{t.type}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map(f => (
                  <tr key={f.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-2 font-medium" style={{ color: 'var(--color-text)' }}>{field(f.id, 'label', f.label)}</td>
                    {topTypes.map(t => {
                      const val = f.byType?.[t.type] ?? 0;
                      return (
                        <td key={t.type} className="p-2 text-right font-mono" style={{
                          color: val > 70 ? 'var(--color-tier1)' : val > 30 ? 'var(--color-tier2)' : 'var(--color-gap)',
                        }}>
                          {val}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-t font-bold" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-2" style={{ color: 'var(--color-text)' }}>{t('common.average')}</td>
                  {topTypes.map(t => (
                    <td key={t.type} className="p-2 text-right font-mono" style={{ color: 'var(--color-accent)' }}>
                      {t.avgCompleteness}%
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Field detail table ────────────────────────────────────── */}
      <Card title={t('compl.cardDetail')}>
        {fieldData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: 'var(--color-text2)' }}>
                  <th className="text-left p-2">{t('th.field')}</th>
                  <th className="text-right p-2">{t('th.overall')}</th>
                  <th className="text-right p-2">DataCite</th>
                  <th className="text-right p-2">ANID</th>
                  <th className="text-right p-2">{t('th.records')}</th>
                  <th className="text-left p-2">{t('th.description')}</th>
                </tr>
              </thead>
              <tbody>
                {fieldData.map(f => (
                  <tr key={f.field} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-2 font-medium" style={{ color: 'var(--color-text)' }}>{f.field}</td>
                    <td className="p-2 text-right font-mono" style={{ color: 'var(--color-accent)' }}>{f.pct}%</td>
                    <td className="p-2 text-right font-mono" style={{ color: 'var(--color-tier1)' }}>
                      {f.DataCite != null ? `${f.DataCite}%` : '--'}
                    </td>
                    <td className="p-2 text-right font-mono" style={{ color: 'var(--color-tier2)' }}>
                      {f.ANID != null ? `${f.ANID}%` : '--'}
                    </td>
                    <td className="p-2 text-right font-mono" style={{ color: 'var(--color-text2)' }}>
                      {n(f.count)}
                    </td>
                    <td className="p-2" style={{ color: 'var(--color-text2)' }}>{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </Card>

      {/* ── Trend + Volume by year ────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card title={selectedType === 'All' ? t('compl.cardTrend') : t('compl.cardTrendType', { type: selectedType })}>
          {yearlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yearlyData}
                onClick={(e) => e?.activeLabel && setClickedYear(Number(e.activeLabel))}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => v != null ? `${v}%` : '--'} contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="dcCompleteness" name="DataCite"
                  stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 2, strokeWidth: 1.5, fill: "var(--color-surface)" }} connectNulls />
                <Line type="monotone" dataKey="anidCompleteness" name="ANID"
                  stroke="var(--color-tier2)" strokeWidth={2} dot={{ r: 2, strokeWidth: 1.5, fill: "var(--color-surface)" }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </Card>

        <Card title={selectedType === 'All' ? t('compl.cardByYear') : t('compl.cardByYearType', { type: selectedType })}>
          {yearlyData.length > 0 ? (
            <>
              <p className="text-xs mb-2" style={{ color: 'var(--color-text2)' }}>{t('common.clickYear')}</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}
                  onClick={(e) => e?.activeLabel && setClickedYear(Number(e.activeLabel))}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" strokeOpacity={0.5} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="bySource.DataCite" name="DataCite" fill="var(--color-accent)" stackId="src" />
                  <Bar dataKey="bySource.ANID" name="ANID" fill="var(--color-tier2)" stackId="src" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <EmptyState />
          )}
        </Card>
      </div>

      {clickedYear && (
        <RecordsList
          title={t('compl.recordsFrom', { year: clickedYear })}
          filter={r => r.year === clickedYear && (selectedType === 'All' || r.type === selectedType)}
          onClose={() => setClickedYear(null)}
        />
      )}
    </div>
  );
}
