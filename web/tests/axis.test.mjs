import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryAxisWidth, wrapLabel } from '../src/lib/axis.js';

test('an axis is wide enough for its longest label', () => {
  // "Obras relacionadas" was cut to "ras relacionadas" by a fixed width of 110.
  assert.ok(categoryAxisWidth(['Licencia', 'Obras relacionadas']) > 110);
  assert.equal(categoryAxisWidth(['ab']), categoryAxisWidth(['cd']));
});
test('wrapped lines fit the axis and keep every word', () => {
  const name = 'ICPSR - Interuniversity Consortium for Political and Social Research';
  const lines = wrapLabel(name, 220);
  const perLine = Math.floor((220 - 16) / (11 * 0.62));
  for (const l of lines) assert.ok(l.length <= perLine, l);
  assert.equal(lines.join(' '), name);
});
test('a label too long for three lines ends in an ellipsis', () => {
  const lines = wrapLabel('word '.repeat(40), 220);
  assert.equal(lines.length, 3);
  assert.ok(lines[2].endsWith('…'));
});
