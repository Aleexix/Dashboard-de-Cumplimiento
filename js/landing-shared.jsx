// landing-shared.jsx — componentes compartidos del landing

const { useState, useEffect, useMemo } = React;

// ── Icons ──────────────────────────────────────────────────────────────────
const ArrowGlyph = () =>
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;

const LockGlyph = ({ size = 18 }) =>
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
  </svg>;

// ── Mini illustrations ─────────────────────────────────────────────────────
function DonutMini({ value = 0.868, color = 'var(--green)', size = 84 }) {
  const C = 2 * Math.PI * 38;
  return (
    <svg className="donut" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" strokeWidth="10" />
      <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${value * C} ${C}`} strokeLinecap="butt"
        transform="rotate(-90 50 50)" />
      <text x="50" y="55" textAnchor="middle" className="donut-num" style={{ fill: color }}>
        {(value * 100).toFixed(1)}%
      </text>
    </svg>
  );
}

function Sparkline({ data, color = 'var(--orange)', filled = true }) {
  const pts = data || [12, 16, 14, 22, 20, 28, 26, 34, 30, 40, 38, 46];
  const w = 200, h = 56;
  const max = Math.max(...pts), min = Math.min(...pts);
  const xs = pts.map((_, i) => i / (pts.length - 1) * (w - 4) + 2);
  const ys = pts.map((v) => h - 4 - (v - min) / (max - min || 1) * (h - 12));
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const area = `${d} L${xs[xs.length - 1]} ${h} L${xs[0]} ${h} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {filled && <path d={area} fill={`color-mix(in oklab, ${color} 14%, transparent)`} />}
      <path d={d} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill={color} />
    </svg>
  );
}

// ── TopBar ─────────────────────────────────────────────────────────────────
function TopBar() {
  return (
    <header className="lb-topbar">
      <a className="lb-brand" href="/">
        <img
          src="images/logo-belltech.svg"
          alt="Belltech"
          style={{ height: 28, display: 'block' }}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
        <span style={{ display: 'none', alignItems: 'center', gap: 8 }}>
          <span className="lb-brand-dot">B</span>BELLTECH
        </span>
      </a>
    </header>
  );
}

Object.assign(window, {
  ArrowGlyph, LockGlyph,
  DonutMini, Sparkline,
  TopBar,
});
