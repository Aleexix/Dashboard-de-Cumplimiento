// =========== CHART DEFAULTS ===========
Chart.defaults.font.family = "'Geist', system-ui, sans-serif";
Chart.defaults.font.size   = 12;
Chart.defaults.color       = '#475569';  /* slate-600 — buen contraste en blanco */
Chart.defaults.borderColor = '#e2e8f0';  /* slate-200 */
Chart.defaults.animation.duration = 250; /* fast — not sluggish */
Chart.defaults.animation.easing   = 'easeOutCubic';

// =========== CONSTANTS ===========
const COLORS = {
  green:  '#16a34a',  /* green-600  */
  red:    '#dc2626',  /* red-600    */
  amber:  '#d97706',  /* amber-600  */
  cyan:   '#0284c7',  /* sky-600    */
  violet: '#7c3aed',  /* violet-600 */
  pink:   '#db2777',  /* pink-600   */
  blue:   '#2563eb',  /* blue-600   */
  dim:    '#94a3b8',  /* slate-400  */
};

const k = DATA.kpis;

// =========== HELPERS ===========
const fmt = n => (n ?? 0).toLocaleString('es-CO');

function fmtFecha(s) {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  const dias  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return dias[d.getDay()] + ' ' + d.getDate() + ' ' + meses[d.getMonth()];
}

function fmtHoras(h) {
  if (h == null || isNaN(h)) return '—';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (hh === 0) return mm + 'm';
  if (mm === 0) return hh + 'h';
  return hh + 'h ' + mm + 'm';
}

function makeGradient(ctx, area, color) {
  const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
  g.addColorStop(0, color + '30');   /* subtle fill for light mode */
  g.addColorStop(1, color + '05');
  return g;
}

// Shared tooltip defaults — white card, crisp text
const TOOLTIP_BASE = {
  backgroundColor: '#ffffff',
  borderColor:     '#e2e8f0',
  borderWidth:     1,
  padding:         10,
  titleColor:      '#0f172a',
  bodyColor:       '#475569',
  footerColor:     '#94a3b8',
  cornerRadius:    8,
  boxShadow:       '0 4px 12px rgba(0,0,0,0.12)',
};
