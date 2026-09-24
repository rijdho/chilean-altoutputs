import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import OverviewPage from './pages/OverviewPage';
import CompletenessPage from './pages/CompletenessPage';
import RepositoriesPage from './pages/RepositoriesPage';
import AboutPage from './pages/AboutPage';
import { LangProvider, useI18n, LANGS } from './i18n/index.jsx';
import './index.css';

const THEME_KEY = 'ca-theme';

const tabs = [
  { path: '/', key: 'tab.overview' },
  { path: '/completeness', key: 'tab.completeness' },
  { path: '/repos', key: 'tab.repos' },
  { path: '/about', key: 'tab.about' },
];

function readTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'light'; } catch { return 'light'; }
}

function App() {
  const { t, tr, lang, setLang } = useI18n();
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage blocked */ }
  }, [theme]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text2)' }}>
            <a href="https://metaudits.rijdho.org/" className="hover:underline" style={{ color: 'var(--color-accent)' }}>
              {t('app.hub')}
            </a>
            <span>/</span>
            <a href="./" className="font-semibold" style={{ color: 'var(--color-text)' }}>
              {t('app.title')}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div role="group" aria-label={t('app.language')} className="flex gap-1 text-xs">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  aria-pressed={lang === l.code}
                  title={l.label}
                  className="px-1.5 py-0.5 rounded cursor-pointer"
                  style={{
                    color: lang === l.code ? '#fff' : 'var(--color-text2)',
                    background: lang === l.code ? 'var(--color-accent)' : 'transparent',
                  }}
                >
                  {l.short}
                </button>
              ))}
            </div>
            <button
              onClick={() => setTheme(v => (v === 'dark' ? 'light' : 'dark'))}
              className="text-lg cursor-pointer"
              title={t('app.theme')}
              aria-label={t('app.theme')}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        <nav className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive ? 'border-current' : 'border-transparent'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-accent)' : 'var(--color-text2)',
                borderColor: isActive ? 'var(--color-accent)' : 'transparent',
              })}
            >
              {t(tab.key)}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/completeness" element={<CompletenessPage />} />
          <Route path="/repos" element={<RepositoriesPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>

      <footer
        className="border-t text-center text-xs py-4 px-4 space-y-1"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text2)' }}
      >
        <div>{tr('footer.by')} &middot; {t('footer.license')} &middot; {tr('footer.source')}</div>
        <div>{tr('footer.family')}</div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </LangProvider>
  </StrictMode>,
);
