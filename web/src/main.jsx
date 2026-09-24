import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import OverviewPage from './pages/OverviewPage';
import CompletenessPage from './pages/CompletenessPage';
import RepositoriesPage from './pages/RepositoriesPage';
import AboutPage from './pages/AboutPage';
import './index.css';

const THEME_KEY = 'ca-theme';

const tabs = [
  { path: '/',              label: 'Overview' },
  { path: '/completeness',  label: 'Completeness' },
  { path: '/repos',         label: 'Repositories' },
  { path: '/about',         label: 'About' },
];

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text2)' }}>
            <a href="../" className="hover:underline" style={{ color: 'var(--color-accent)' }}>
              Metadata Audits
            </a>
            <span>/</span>
            <a href="./" className="font-semibold" style={{ color: 'var(--color-text)' }}>
              Chilean AltOutputs
            </a>
          </div>

          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="text-lg cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <nav className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <NavLink
              key={t.path}
              to={t.path}
              end={t.path === '/'}
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
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/"             element={<OverviewPage />} />
          <Route path="/completeness" element={<CompletenessPage />} />
          <Route path="/repos"        element={<RepositoriesPage />} />
          <Route path="/about"        element={<AboutPage />} />
        </Routes>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer
        className="border-t text-center text-xs py-4"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text2)' }}
      >
        For questions about data usage or attribution:{' '}
        <a href="https://rijdho.github.io" style={{ color: 'var(--color-accent)' }}>
          @rijdho
        </a>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
