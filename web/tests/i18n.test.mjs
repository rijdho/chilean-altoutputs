// The three catalogues must stay in step with en.js, the source of truth.
import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/en.js';
import es from '../src/i18n/es.js';
import de from '../src/i18n/de.js';

const OTHERS = { es, de };
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
const links = (s) => [...s.matchAll(/\]\((.+?)\)/g)].map(m => m[1]).sort();
const cells = (s) => s.split('|').length;

for (const [lang, cat] of Object.entries(OTHERS)) {
  test(`${lang}: no missing and no orphan keys`, () => {
    assert.deepEqual(Object.keys(cat).filter(k => !(k in en)), [], 'orphan keys');
    assert.deepEqual(Object.keys(en).filter(k => !(k in cat)), [], 'missing keys');
  });
  test(`${lang}: placeholders, links and table cells match English`, () => {
    for (const k of Object.keys(en)) {
      if (!(k in cat)) continue;
      assert.deepEqual(placeholders(cat[k]), placeholders(en[k]), `${k}: placeholders`);
      assert.deepEqual(links(cat[k]), links(en[k]), `${k}: links`);
      assert.equal(cells(cat[k]), cells(en[k]), `${k}: table cells`);
    }
  });
}

test('no em dash in any catalogue', () => {
  for (const [lang, cat] of Object.entries({ en, ...OTHERS }))
    for (const [k, v] of Object.entries(cat)) assert.ok(!v.includes('\u2014'), `${lang} ${k}`);
});

test('long strings are translated, not left in English', () => {
  for (const [lang, cat] of Object.entries(OTHERS))
    for (const [k, v] of Object.entries(en))
      if (v.length > 60 && !k.startsWith('about.ref') && !k.startsWith('footer.')) assert.notEqual(cat[k], v, `${lang} ${k}`);
});
