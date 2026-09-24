import { overview, types, repositories, fields } from '../lib/data';
import { ANID_FACETS, ANID_FACETS_DATE, ANID_TOTAL } from '../lib/anid-facets';
import Card from '../components/shared/Card';
import { useI18n } from '../i18n/index.jsx';

// Every number in the text comes from the dashboard data or the dated ANID facets, never typed in.
const software = types.find(t => t.type === 'Software');
const softwareZenodo = software?.repos?.find(r => r.name === 'Zenodo')?.count ?? 0;
const INSTITUTIONAL = ['Repositorio de datos de investigación de la Universidad de Chile', 'Universidad de Chile',
  'Datos de Investigación UC', 'Usach'];
const inst = repositories.filter(r => INSTITUTIONAL.includes(r.name));
const instDois = inst.reduce((s, r) => s + r.count, 0);
const instOther = inst.reduce((s, r) => s + (r.topTypes ?? []).filter(x => x.type !== 'Dataset').reduce((a, x) => a + x.count, 0), 0);
const anidOrcid = fields.find(f => f.id === 'hasOrcid')?.bySource?.ANID ?? 0;
const anidSoftware = ANID_FACETS.find(([k]) => k === 'Software')?.[1] ?? 0;

// Which FAIR principle each field mainly serves.
const METHOD = [
  ['hasOrcid', 'F'], ['hasLicense', 'R'], ['hasOpenLicense', 'R'], ['hasSubjects', 'F'], ['hasDescription', 'F'],
  ['hasFunding', 'R'], ['hasRelatedWorks', 'I'], ['hasVersion', 'R'], ['hasLanguage', 'R'], ['hasPublisher', 'F'],
];

function Section({ title, children }) {
  return (
    <Card title={title}>
      <div className="text-sm space-y-3" style={{ color: 'var(--color-text2)' }}>{children}</div>
    </Card>
  );
}

export default function AboutPage() {
  const { t, tr, n, field, locale } = useI18n();
  const date = (iso) => new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  const th = 'text-left p-1.5';

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{t('about.title')}</h1>

      <Section title={t('about.whatTitle')}>
        <p>{tr('about.what1')}</p>
        <p>{tr('about.what2')}</p>
        <p>{tr('about.what3')}</p>
      </Section>

      <Section title={t('about.policyTitle')}>
        <p>{tr('about.policyIntro')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs mt-2">
            <thead>
              <tr style={{ color: 'var(--color-text2)' }}>
                <th className={th}>{t('about.policyThOutput')}</th>
                <th className={th}>{t('about.policyThReq')}</th>
                <th className={th}>{t('about.policyThDeadline')}</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map(i => {
                const [output, req, deadline] = t(`about.policyRow${i}`).split('|');
                return (
                  <tr key={i} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-1.5 font-medium" style={{ color: 'var(--color-text)' }}>{output}</td>
                    <td className="p-1.5">{req}</td>
                    <td className="p-1.5">{deadline}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2">{tr('about.policyFair')}</p>
        <div className="mt-3 p-3 rounded border" style={{ borderColor: 'var(--color-gap)', background: 'rgba(239,68,68,0.05)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--color-gap)' }}>{t('about.gapTitle')}</p>
          <p className="text-xs mt-1">{tr('about.gap1', { anidSoftware: n(anidSoftware) })}</p>
          <p className="text-xs mt-1">{tr('about.gap2')}</p>
        </div>
      </Section>

      <Section title={t('about.instTitle')}>
        <p>{tr('about.inst1', { instDois: n(instDois), instOther: n(instOther) })}</p>
        <p>{tr('about.inst2', { software: n(software?.count ?? 0), softwareZenodo: n(softwareZenodo) })}</p>
      </Section>

      <Section title={t('about.sourcesTitle')}>
        <p>{tr('about.sourcesDc')}</p>
        <p>{tr('about.sourcesAnid')}</p>
        <p>{tr('about.sourcesDedup')}</p>
        <p className="text-xs" style={{ opacity: 0.7 }}>{tr('about.sourcesExcluded')}</p>
      </Section>

      <Section title={t('about.anidTitle')}>
        <p>{tr('about.anidIntro', { total: n(ANID_TOTAL), date: date(ANID_FACETS_DATE) })}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs mt-2">
            <thead>
              <tr style={{ color: 'var(--color-text2)' }}>
                <th className={th}>{t('about.anidThType')}</th>
                <th className="text-right p-1.5">{t('about.anidThRecords')}</th>
                <th className="text-right p-1.5">%</th>
              </tr>
            </thead>
            <tbody>
              {ANID_FACETS.map(([type, count]) => (
                <tr key={type} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-1.5" style={{ color: 'var(--color-text)' }}>
                    {t(`anidType.${type}`)} <span style={{ opacity: 0.6 }}>({type})</span>
                  </td>
                  <td className="p-1.5 text-right font-mono">{n(count)}</td>
                  <td className="p-1.5 text-right font-mono">
                    {(100 * count / ANID_TOTAL).toLocaleString(locale, { maximumFractionDigits: count * 100 / ANID_TOTAL < 1 ? 2 : 1 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-2" style={{ opacity: 0.7 }}>{tr('about.anidNote', { anidOrcid: n(anidOrcid) })}</p>
      </Section>

      <Section title={t('about.methodTitle')}>
        <p>{t('about.methodIntro')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs mt-2">
            <thead>
              <tr style={{ color: 'var(--color-text2)' }}>
                <th className={th}>{t('th.field')}</th>
                <th className={th}>{t('about.methodThCheck')}</th>
                <th className={th}>FAIR</th>
              </tr>
            </thead>
            <tbody>
              {METHOD.map(([id, letter]) => (
                <tr key={id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-1.5 font-medium" style={{ color: 'var(--color-text)' }}>{field(id, 'label', id)}</td>
                  <td className="p-1.5">{field(id, 'desc', '')}</td>
                  <td className="p-1.5 font-mono" style={{ color: 'var(--color-accent)' }}>{letter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2">{tr('about.methodNote')}</p>
      </Section>

      <Section title={t('about.scopeTitle')}>
        <p>{tr('about.scopeIn')}</p>
        <p>{tr('about.scopeOut')}</p>
        <p>{tr('about.scopeAff')}</p>
      </Section>

      <Section title={t('about.limitsTitle')}>
        <ul className="list-disc list-inside space-y-1">
          {[1, 2, 3, 4, 5].map(i => <li key={i}>{tr(`about.limit${i}`)}</li>)}
        </ul>
      </Section>

      <Section title={t('about.refsTitle')}>
        {[1, 2, 3, 4, 5, 6].map(i => <p key={i}>{tr(`about.ref${i}`)}</p>)}
      </Section>

      <Section title={t('about.pipelineTitle')}>
        <p>{t('about.pipelineIntro')}</p>
        <ol className="list-decimal list-inside space-y-1">
          {[1, 2, 3, 4].map(i => <li key={i}>{tr(`about.pipe${i}`)}</li>)}
        </ol>
        <p className="mt-2">{t('about.pipelineStack')}</p>
        <p className="text-xs mt-2" style={{ opacity: 0.6 }}>
          {overview.generatedAt ? t('about.generated', { date: date(overview.generatedAt) }) : t('about.notGenerated')}
        </p>
      </Section>
    </div>
  );
}
