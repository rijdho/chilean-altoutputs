/**
 * Width of a category axis, from the longest label it has to show.
 *
 * Tick labels are set in the monospace face at 11px (index.css), about 0.62em a character,
 * plus room for the tick itself. A fixed width cut "Obras relacionadas" to "ras relacionadas":
 * the Spanish and German labels run longer than the English ones the widths were chosen for.
 */
const CHAR = 11 * 0.62;
const TICK = 16;

export function categoryAxisWidth(labels) {
  const longest = Math.max(0, ...labels.map((s) => String(s ?? '').length));
  return Math.ceil(longest * CHAR) + TICK;
}

/**
 * Split a label into lines that fit an axis of the given width. Monospace makes this exact
 * enough to do by counting characters, which Recharts' own wrapping does not manage here
 * (it measures in a style that is not the one index.css draws, and left long names cut).
 */
export function wrapLabel(label, width, maxLines = 3) {
  const perLine = Math.max(8, Math.floor((width - TICK) / CHAR));
  const lines = [];
  let line = '';
  for (const word of String(label ?? '').split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if ((line + ' ' + word).length <= perLine) line += ' ' + word;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  const out = lines.map((l) => (l.length > perLine ? l.slice(0, perLine - 1) + '…' : l));
  if (out.length > maxLines) out.splice(maxLines - 1, out.length, out[maxLines - 1].slice(0, perLine - 1) + '…');
  return out;
}
