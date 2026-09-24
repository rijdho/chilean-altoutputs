import { overview } from '../lib/data';
import Card from '../components/shared/Card';

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        About this Audit
      </h1>

      <Card title="What is this?">
        <div className="text-sm space-y-3" style={{ color: 'var(--color-text2)' }}>
          <p>
            This dashboard audits the metadata completeness of Chilean non-article research outputs
            — datasets, software, images, collections, notebooks, models, and other types that are
            often invisible in traditional bibliometric analyses.
          </p>
          <p>
            Chile enacted <strong>Ley 21.105</strong> (2018), creating the Ministry of Science and
            establishing an open access mandate for publicly funded research. ANID (formerly CONICYT)
            requires funded projects to deposit outputs in open repositories. But while journal articles
            receive extensive metadata attention, non-article outputs are often deposited with minimal
            description, making them hard to discover, cite, and reuse.
          </p>
          <p>
            This audit asks: <em>are Chilean research outputs beyond articles actually findable,
            well-described, and reusable?</em>
          </p>
        </div>
      </Card>

      <Card title="ANID Open Access Policy (2022)">
        <div className="text-sm space-y-3" style={{ color: 'var(--color-text2)' }}>
          <p>
            ANID's{' '}
            <a href="https://s3.amazonaws.com/documentos.anid.cl/estudios/Politica_acceso_a_informacion_cientifica_2022.pdf"
              target="_blank" rel="noopener" style={{ color: 'var(--color-accent)' }}>
              Politica de Acceso Abierto
            </a>{' '}
            (2022) mandates open access for all publicly funded research. It covers two types of outputs:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs mt-2">
              <thead>
                <tr style={{ color: 'var(--color-text2)' }}>
                  <th className="text-left p-1.5">Output</th>
                  <th className="text-left p-1.5">Requirement</th>
                  <th className="text-left p-1.5">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Publications', 'Deposit accepted manuscript (AM) in ANID Repository', '6 months from publication'],
                  ['SciELO articles', 'Report DOI only (exempt from deposit)', '30 business days'],
                  ['Research data', 'Deposit in ANID, institutional, or disciplinary repo (OAI-PMH interoperable)', '1 year after final report'],
                  ['Data Management Plan', 'Mandatory, but narrative PDF — not machine-actionable', 'At project start'],
                ].map(([output, req, deadline]) => (
                  <tr key={output} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-1.5 font-medium" style={{ color: 'var(--color-text)' }}>{output}</td>
                    <td className="p-1.5">{req}</td>
                    <td className="p-1.5">{deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2">
            The policy explicitly adopts <strong>FAIR principles</strong> for research data: persistent identifiers,
            enriched metadata, open protocols, clear licenses. Repositories must be OAI-PMH interoperable.
            Non-compliance affects <em>current and future funding transfers</em>.
          </p>
          <div className="mt-3 p-3 rounded border" style={{ borderColor: 'var(--color-gap)', background: 'rgba(239,68,68,0.05)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--color-gap)' }}>
              Critical gap: Software and source code
            </p>
            <p className="text-xs mt-1">
              The policy does <strong>not mention software, source code, or computational notebooks</strong> anywhere
              in its 11 pages. It only covers "publicaciones" (articles, books, theses) and "datos de investigacion"
              (research data). While ANID's repository platform technically accepts software deposits (8 records exist),
              there is no binding requirement to deposit research software. This contrasts with Horizon Europe's
              mandate for open-source software and the NIH's 2023 Data Management and Sharing Policy.
            </p>
            <p className="text-xs mt-1">
              The mandatory DMP is a narrative PDF template (3 sections, max 50MB per data package) — not
              machine-readable, not structured, and not aligned with the RDA DMP Common Standard. Only 211
              DMPs exist in the ANID repository out of ~60,000 funded projects. The policy also does not
              mandate a specific license (only "clear and visible"), does not require ORCID (though the DMP
              template asks for it), and prescribes no metadata standard beyond OAI-PMH interoperability.
            </p>
          </div>
        </div>
      </Card>

      <Card title="The Institutional Gap">
        <div className="text-sm space-y-3" style={{ color: 'var(--color-text2)' }}>
          <p>
            Chilean universities operate institutional Dataverse instances (Universidad de Chile,
            PUC, USACH) with over 6,000 DOIs — but <strong>all typed as "Dataset"</strong>.
            Zero software DOIs exist in any Chilean institutional repository.
          </p>
          <p>
            Meanwhile, ~320 software DOIs with Chilean affiliations exist in DataCite — almost
            entirely deposited on <strong>Zenodo</strong> by individual researchers. This reveals
            a structural gap: Chilean institutional infrastructure does not support software deposits,
            pushing researchers to international platforms without institutional oversight.
          </p>
          <p>
            ANID's own repository (<code>repositorio.anid.cl</code>) contains ~170,000 records but
            only <strong>8 software</strong> and <strong>250 research data</strong> entries. The vast
            majority are grant proposals (60K), articles (50K), theses (25K), and final reports (15K).
          </p>
        </div>
      </Card>

      <Card title="Data Sources">
        <div className="text-sm space-y-3" style={{ color: 'var(--color-text2)' }}>
          <p>
            <strong style={{ color: 'var(--color-accent)' }}>DataCite REST API</strong> — All DOIs
            with Chilean creator affiliations (<code>creators.affiliation.name:*Chile*</code>),
            filtered to non-article resource types: Dataset, Software, Image, Collection, Model,
            Audiovisual, ComputationalNotebook, Workflow, OutputManagementPlan, and Other.
            Cursor-based pagination with polite rate limiting.
          </p>
          <p>
            <strong style={{ color: 'var(--color-accent)' }}>ANID OAI-PMH</strong> — Metadata
            harvested from ANID's DSpace repository via the OAI-PMH protocol using the <code>dim</code> format
            (DSpace Internal Metadata — the richest available, preserving <code>datacite.*</code>,
            <code>oaire.*</code>, and <code>dc.*</code> with full qualifiers). Endpoint:{' '}
            <code>repositorio.be-anid.com/server/oai/request</code>.
          </p>
          <p>
            Records from both sources are deduplicated by DOI (DataCite preferred when both have the same record).
          </p>
          <p className="text-xs" style={{ opacity: 0.7 }}>
            <strong>Not included:</strong> La Referencia (225K Chilean records, but zero software or
            dataset types — only aggregates articles, theses, and reports from SciELO Chile and ANID).
          </p>
        </div>
      </Card>

      <Card title="ANID Repository: What's Inside?">
        <div className="text-sm space-y-3" style={{ color: 'var(--color-text2)' }}>
          <p>
            ANID's repository (~170K records) is primarily a grant management system, not a data
            repository. Entity type breakdown:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs mt-2">
              <thead>
                <tr style={{ color: 'var(--color-text2)' }}>
                  <th className="text-left p-1.5">Type</th>
                  <th className="text-right p-1.5">Records</th>
                  <th className="text-right p-1.5">%</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Proyecto (grants)', '59,910', '35.1%'],
                  ['Articulo (articles)', '49,631', '29.1%'],
                  ['Tesis (theses)', '24,996', '14.6%'],
                  ['InformeFinal (final reports)', '14,621', '8.6%'],
                  ['Journal (metadata)', '9,617', '5.6%'],
                  ['Ponencia (proceedings)', '6,537', '3.8%'],
                  ['DatoInvestigacion (research data)', '250', '0.15%'],
                  ['PlanGestionDatos (DMPs)', '211', '0.12%'],
                  ['Patente (patents)', '210', '0.12%'],
                  ['Software', '8', '<0.01%'],
                ].map(([type, count, pct]) => (
                  <tr key={type} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-1.5" style={{ color: 'var(--color-text)' }}>{type}</td>
                    <td className="p-1.5 text-right font-mono">{count}</td>
                    <td className="p-1.5 text-right font-mono">{pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-2" style={{ opacity: 0.7 }}>
            ANID stores OpenAIRE-aligned metadata internally (<code>oaire.fundingReference</code>,
            <code>oaire.resourceType</code>) but does not expose it as a separate OAI-PMH format.
            The <code>dim</code> format provides the richest access. Notably, ANID records contain
            no ORCID identifiers but excellent funding info (FONDECYT folio, program, instrument).
          </p>
        </div>
      </Card>

      <Card title="Methodology: 10 Metadata Fields Audited">
        <div className="text-sm space-y-3" style={{ color: 'var(--color-text2)' }}>
          <p>
            Each record is scored against 10 metadata fields essential for FAIR compliance:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs mt-2">
              <thead>
                <tr style={{ color: 'var(--color-text2)' }}>
                  <th className="text-left p-1.5">Field</th>
                  <th className="text-left p-1.5">What it checks</th>
                  <th className="text-left p-1.5">FAIR</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['ORCID', 'At least one creator has an ORCID identifier', 'F'],
                  ['License', 'Explicit license specified (any)', 'R'],
                  ['Open License', 'CC-BY, CC0, MIT, GPL, Apache, BSD', 'R'],
                  ['Subjects', 'Subject keywords or classification', 'F'],
                  ['Description', 'Non-trivial description (>20 words)', 'F'],
                  ['Funding', 'Funder name, award number, or grant ID', 'A'],
                  ['Related Works', 'Links to related DOIs or identifiers', 'I'],
                  ['Version', 'Version number or info', 'R'],
                  ['Language', 'Language code specified', 'F'],
                  ['Publisher', 'Publisher or repository name', 'A'],
                ].map(([field, desc, fair]) => (
                  <tr key={field} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-1.5 font-medium" style={{ color: 'var(--color-text)' }}>{field}</td>
                    <td className="p-1.5">{desc}</td>
                    <td className="p-1.5 font-mono" style={{ color: 'var(--color-accent)' }}>{fair}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2">
            Completeness = percentage of fields present per record. Binary scoring (present/absent).
          </p>
        </div>
      </Card>

      <Card title="Scope">
        <div className="text-sm space-y-3" style={{ color: 'var(--color-text2)' }}>
          <p>
            <strong>Included:</strong> All Chilean non-article research outputs with DOIs in DataCite,
            plus non-article outputs from ANID's OAI-PMH endpoint. This covers datasets, software,
            images, collections, audiovisual materials, models, workflows, notebooks, data management
            plans, and patents.
          </p>
          <p>
            <strong>Excluded:</strong> Journal articles, conference papers, theses, books, book chapters,
            and preprints — these are covered by Crossref, OpenAlex, and traditional bibliometric tools.
            Also excluded: outputs without DOIs (not trackable via DataCite) and La Referencia records
            (no non-article types available).
          </p>
          <p>
            <strong>Affiliation matching:</strong> DataCite records are matched by
            <code> creators.affiliation.name:*Chile*</code> (text search on affiliation field).
            This may include international collaborations with at least one Chilean co-author.
          </p>
        </div>
      </Card>

      <Card title="Limitations">
        <div className="text-sm space-y-3" style={{ color: 'var(--color-text2)' }}>
          <ul className="list-disc list-inside space-y-1">
            <li>Only captures outputs with DOIs (DataCite) or in ANID repositories — outputs on GitHub,
              GitLab, or personal websites without DOIs are invisible</li>
            <li>Affiliation detection relies on free-text matching, which may miss records using
              institution names in Spanish or abbreviated forms</li>
            <li>Chilean Dataverse instances register everything as "Dataset" regardless of actual content
              type — the 6,000+ UChile/PUC/USACH "datasets" may include software, models, and other types</li>
            <li>ANID OAI-PMH contains no ORCID identifiers, so ORCID completeness reflects only DataCite records</li>
            <li>Metadata completeness is binary (present/absent) — quality and accuracy are not assessed</li>
            <li>Some records appear in both DataCite and ANID — deduplicated by DOI where possible</li>
          </ul>
        </div>
      </Card>

      <Card title="References">
        <div className="text-sm space-y-2" style={{ color: 'var(--color-text2)' }}>
          <p>
            <a href="https://www.bcn.cl/leychile/navegar?idNorma=1119730" target="_blank" rel="noopener"
              style={{ color: 'var(--color-accent)' }}>
              Ley 21.105 — Ministerio de Ciencia, Tecnologia, Conocimiento e Innovacion
            </a>{' '}
            — Biblioteca del Congreso Nacional de Chile, 2018
          </p>
          <p>
            <a href="https://www.anid.cl/politica-de-acceso-abierto/" target="_blank" rel="noopener"
              style={{ color: 'var(--color-accent)' }}>
              Politica de Acceso Abierto a Informacion Cientifica y Datos de Investigacion
            </a>{' '}
            — ANID
          </p>
          <p>
            <a href="https://doi.org/10.1038/sdata.2016.18" target="_blank" rel="noopener"
              style={{ color: 'var(--color-accent)' }}>
              The FAIR Guiding Principles for scientific data management and stewardship
            </a>{' '}
            — Wilkinson et al., Scientific Data, 2016
          </p>
          <p>
            <a href="https://support.datacite.org/docs/api" target="_blank" rel="noopener"
              style={{ color: 'var(--color-accent)' }}>
              DataCite REST API v2
            </a>
          </p>
          <p>
            <a href="https://www.openarchives.org/pmh/" target="_blank" rel="noopener"
              style={{ color: 'var(--color-accent)' }}>
              OAI-PMH — Open Archives Initiative Protocol for Metadata Harvesting
            </a>
          </p>
          <p>
            <a href="https://repositorio.anid.cl" target="_blank" rel="noopener"
              style={{ color: 'var(--color-accent)' }}>
              Repositorio ANID
            </a>{' '}
            — DSpace 7, OAI-PMH endpoint at repositorio.be-anid.com
          </p>
        </div>
      </Card>

      <Card title="Pipeline">
        <div className="text-sm space-y-2" style={{ color: 'var(--color-text2)' }}>
          <p>Four-step offline pipeline:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              <strong style={{ color: 'var(--color-accent)' }}>Fetch DataCite</strong>
              {' '}— Query DataCite API for Chilean non-article DOIs (~14K records, 13 resource types)
            </li>
            <li>
              <strong style={{ color: 'var(--color-accent)' }}>Harvest ANID</strong>
              {' '}— OAI-PMH harvest in DIM format (~750 non-article records from 170K total)
            </li>
            <li>
              <strong style={{ color: 'var(--color-accent)' }}>Analyze</strong>
              {' '}— Normalize, deduplicate by DOI, score 10 metadata fields per record
            </li>
            <li>
              <strong style={{ color: 'var(--color-accent)' }}>Aggregate</strong>
              {' '}— Generate dashboard JSONs (overview, types, fields, repos, licenses, yearly, institutions)
            </li>
          </ol>
          <p className="mt-2">
            Dashboard: React + Vite + Tailwind CSS + Recharts. Static deployment on Cloudflare Pages.
          </p>
          <p className="text-xs mt-2" style={{ opacity: 0.6 }}>
            Generated: {overview.generatedAt
              ? new Date(overview.generatedAt).toLocaleDateString()
              : 'Not yet generated'}
          </p>
        </div>
      </Card>
    </div>
  );
}
