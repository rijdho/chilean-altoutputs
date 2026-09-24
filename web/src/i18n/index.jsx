/**
 * Interface languages: English (source of truth), Spanish, German.
 *
 * Resolved at load in this order: ?lang= → the previous choice (localStorage) →
 * navigator.languages → English. Switching relabels what is on screen; nothing is refetched.
 * A key missing in a locale falls back to English, so a partial translation degrades to
 * mixed language rather than blank UI. tests/i18n.test.mjs keeps the catalogues in step.
 *
 * Not translated, on purpose: DataCite resource types (Dataset, Software, ...), schema and
 * organisation names (DataCite, ORCID, OAI-PMH, ANID). They are what a user types or looks up.
 */
import { createContext, useContext, useEffect, useMemo, useState, Fragment } from 'react';
import en from './en.js';
import es from './es.js';
import de from './de.js';

export const LANGS = [
  { code: 'en', label: 'English', short: 'EN', locale: 'en-GB' },
  { code: 'es', label: 'Español', short: 'ES', locale: 'es-CL' },
  { code: 'de', label: 'Deutsch', short: 'DE', locale: 'de-AT' },
];
const CATALOGUES = { en, es, de };
const STORAGE_KEY = 'ca-lang';

function detect() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q && CATALOGUES[q]) return q;
  } catch { /* no URL */ }
  try {
    const s = window.localStorage.getItem(STORAGE_KEY);
    if (s && CATALOGUES[s]) return s;
  } catch { /* storage blocked */ }
  for (const l of (typeof navigator !== 'undefined' && navigator.languages) || []) {
    const c = String(l).slice(0, 2).toLowerCase();
    if (CATALOGUES[c]) return c;
  }
  return 'en';
}

function lookup(lang, key) {
  const v = CATALOGUES[lang]?.[key];
  return v !== undefined ? v : en[key];
}

function fill(text, params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));
}

/** Inline markup in catalogue strings: **bold**, *em*, `code`, [text](url). */
function rich(text) {
  const out = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={i++}>{m[1]}</strong>);
    else if (m[2]) out.push(<em key={i++}>{m[2]}</em>);
    else if (m[3]) out.push(<code key={i++}>{m[3]}</code>);
    else out.push(<a key={i++} href={m[5]} target="_blank" rel="noopener" style={{ color: 'var(--color-accent)' }}>{m[4]}</a>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
}

const I18n = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(detect);
  useEffect(() => {
    document.documentElement.lang = lang;
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch { /* storage blocked */ }
  }, [lang]);
  const value = useMemo(() => {
    const locale = LANGS.find(l => l.code === lang).locale;
    const t = (key, params) => fill(String(lookup(lang, key) ?? key), params);
    return {
      lang, setLang, locale,
      t,
      /** A catalogue string with inline markup, as React nodes. */
      tr: (key, params) => rich(t(key, params)),
      /** A number in the interface language's format. */
      n: (v) => (typeof v === 'number' ? v.toLocaleString(locale) : v),
      /** A field label or description, falling back to the pipeline's English text. */
      field: (id, part, fallback) => {
        const v = lookup(lang, `field.${id}.${part}`);
        return v !== undefined ? v : fallback;
      },
    };
  }, [lang]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export const useI18n = () => useContext(I18n);
