import { wrapLabel } from '../../lib/axis.js';

/**
 * A category-axis tick that wraps long names (see wrapLabel). maxLines follows the row height:
 * 3 where rows are tall, 2 where they are about 25px. The full name is in the tooltip.
 */
export default function WrappedTick({ x, y, payload, width, maxLines = 3, format }) {
  const full = format ? format(payload?.value) : payload?.value;
  const lines = wrapLabel(full, width, maxLines);
  const lead = -((lines.length - 1) * 12) / 2;
  return (
    <text x={x} y={y} textAnchor="end" className="recharts-cartesian-axis-tick-value">
      <title>{full}</title>
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? lead + 4 : 12}>{l}</tspan>
      ))}
    </text>
  );
}
