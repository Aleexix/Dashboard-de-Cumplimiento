// =========== SECCIÓN VS: COMPARATIVA MES A MES ===========

const VS_MONTH_NAMES = {
  '01':'Enero','02':'Febrero','03':'Marzo','04':'Abril','05':'Mayo','06':'Junio',
  '07':'Julio','08':'Agosto','09':'Septiembre','10':'Octubre','11':'Noviembre','12':'Diciembre',
};

function vsMonthName(m) {
  return m ? (VS_MONTH_NAMES[m.split('-')[1]] || m) : '—';
}

// Meses con al menos 3 días de datos (excluye bordes como 31-Mar)
const vsAvailMonths = (() => {
  const days = {};
  DATA.tickets.forEach(t => {
    const m = t.fecha_coord?.slice(0, 7); if (!m) return;
    if (!days[m]) days[m] = new Set();
    days[m].add(t.fecha_coord);
  });
  return Object.keys(days).filter(m => days[m].size >= 3).sort();
})();

// Necesitamos al menos 2 meses para comparar
if (vsAvailMonths.length < 2) { /* no inicializar */ }
else {

const M1 = vsAvailMonths[0];                          // primer mes (Abril)
const M2 = vsAvailMonths[vsAvailMonths.length - 1];   // último mes (Mayo)
const M1N = vsMonthName(M1);
const M2N = vsMonthName(M2);

let vsBank   = 'todos';
let vsCharts = {};

function getVSColors() {
  if (vsBank === 'todos' || !BANK_CONFIGS[vsBank]) {
    return { c1: COLORS.cyan, c2: '#7c3aed', c1a: COLORS.cyan + 'cc', c2a: 'rgba(124,58,237,.8)', grad: 'linear-gradient(90deg,var(--cyan),#7c3aed)' };
  }
  const cfg = BANK_CONFIGS[vsBank];
  return {
    c1:   cfg.color,
    c2:   cfg.dark,
    c1a:  cfg.color + 'cc',
    c2a:  cfg.dark  + 'cc',
    grad: `linear-gradient(90deg,${cfg.color},${cfg.dark})`,
  };
}

// ── Helpers de cómputo ────────────────────────────────────────────────────────
function vsTickets() {
  let tix = DATA.tickets;
  if (vsBank !== 'todos') tix = tix.filter(t => t.banco === vsBank);
  return {
    t1: tix.filter(t => t.fecha_coord?.slice(0, 7) === M1),
    t2: tix.filter(t => t.fecha_coord?.slice(0, 7) === M2),
  };
}

function kpiOf(tix) {
  const n  = tix.length;
  const bc = tix.filter(t => t.belltech_estado === 'Cumple').length;
  const bi = tix.filter(t => t.belltech_estado === 'Incumple').length;
  const br = tix.filter(t => t.belltech_estado === 'Reprogramación').length;
  return { total: n, cumple_pct: n ? +(bc * 100 / n).toFixed(1) : 0, incumple: bi, reprog: br };
}

function delta(v1, v2, higherIsBetter) {
  if (v1 === v2) return { icon: '=', color: 'var(--text-mute)' };
  const better = higherIsBetter ? v2 > v1 : v2 < v1;
  return better
    ? { icon: '▲', color: 'var(--green)' }
    : { icon: '▼', color: 'var(--red)' };
}

function groupBy(tix, field, valFn) {
  const m = {};
  tix.forEach(t => {
    const k = t[field]; if (!k) return;
    if (!m[k]) m[k] = 0;
    m[k] += valFn(t);
  });
  return m;
}

// ── Render principal ──────────────────────────────────────────────────────────
function renderVS() {
  const { t1, t2 } = vsTickets();
  const k1 = kpiOf(t1);
  const k2 = kpiOf(t2);
  const cl = getVSColors();

  // KPI cards
  const kpis = [
    { label: 'Cumpl. Belltech',  v1: k1.cumple_pct + '%', v2: k2.cumple_pct + '%', r1: k1.cumple_pct, r2: k2.cumple_pct, hib: true  },
    { label: 'Incumplimientos',  v1: fmt(k1.incumple),    v2: fmt(k2.incumple),    r1: k1.incumple,   r2: k2.incumple,   hib: false },
    { label: 'Reprogramaciones', v1: fmt(k1.reprog),      v2: fmt(k2.reprog),      r1: k1.reprog,     r2: k2.reprog,     hib: false },
    { label: 'Total tickets',    v1: fmt(k1.total),       v2: fmt(k2.total),       r1: k1.total,      r2: k2.total,      hib: null  },
  ];

  document.getElementById('vs-kpis').innerHTML = kpis.map(k => {
    const d = k.hib !== null ? delta(k.r1, k.r2, k.hib) : { icon: '→', color: 'var(--text-mute)' };
    return `
      <div class="kpi" style="cursor:default;--accent:${cl.c1};border-left-color:${cl.c1}">
        <div class="label">${k.label}</div>
        <div style="display:flex;align-items:center;gap:10px;margin:6px 0">
          <span style="font-size:20px;font-weight:800;color:${cl.c1};letter-spacing:-.02em">${k.v1}</span>
          <span style="font-size:18px;font-weight:700;color:${d.color}">${d.icon}</span>
          <span style="font-size:20px;font-weight:800;color:${cl.c2};letter-spacing:-.02em">${k.v2}</span>
        </div>
        <div class="sub">
          <span style="color:${cl.c1};font-weight:600">${M1N}</span>
          <span style="color:var(--text-mute)">→</span>
          <span style="color:${cl.c2};font-weight:600">${M2N}</span>
        </div>
      </div>`;
  }).join('');

  renderVSCiudades(t1, t2, cl);
  renderVSTipif(t1, t2, cl);
  renderVSTipoServ(t1, t2, cl);
  renderVSTecnico(t1, t2, cl);
}

// ── Ciudades ──────────────────────────────────────────────────────────────────
function renderVSCiudades(t1, t2, cl) {
  const inc1 = groupBy(t1, 'ciudad', t => t.belltech_estado === 'Incumple' ? 1 : 0);
  const inc2 = groupBy(t2, 'ciudad', t => t.belltech_estado === 'Incumple' ? 1 : 0);
  const all  = new Set([...Object.keys(inc1), ...Object.keys(inc2)]);
  const rows = [...all]
    .map(c => ({ c, v1: inc1[c] || 0, v2: inc2[c] || 0 }))
    .sort((a, b) => (b.v1 + b.v2) - (a.v1 + a.v2))
    .slice(0, 15);

  if (vsCharts.ciu) vsCharts.ciu.destroy();
  vsCharts.ciu = new Chart(document.getElementById('vs-chart-ciudades'), {
    type: 'bar',
    data: {
      labels: rows.map(d => d.c),
      datasets: [
        { label: M1N, data: rows.map(d => d.v1), backgroundColor: cl.c1a, borderRadius: 4, barPercentage: 0.75 },
        { label: M2N, data: rows.map(d => d.v2), backgroundColor: cl.c2a, borderRadius: 4, barPercentage: 0.75 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: {
        legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, padding: 10, color: '#334155', font: { size: 11 } } },
        tooltip: { ...TOOLTIP_BASE, callbacks: {
          footer: items => {
            const d = rows[items[0].dataIndex];
            const diff = d.v2 - d.v1;
            if (diff === 0) return '= Sin cambio';
            return diff < 0 ? `▼ ${Math.abs(diff)} menos incumplimientos` : `▲ ${diff} más incumplimientos`;
          },
        }},
      },
      scales: {
        x: { beginAtZero: true, grid: { color: 'rgba(31,41,55,.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono',monospace", size: 10 }, stepSize: 1 } },
        y: { grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
      },
    },
  });
}

// ── Tipificaciones ────────────────────────────────────────────────────────────
function renderVSTipif(t1, t2, cl) {
  const m1 = groupBy(t1.filter(t => t.belltech_estado === 'Incumple'), 'tipificacion', () => 1);
  const m2 = groupBy(t2.filter(t => t.belltech_estado === 'Incumple'), 'tipificacion', () => 1);
  const all = new Set([...Object.keys(m1), ...Object.keys(m2)]);
  const rows = [...all]
    .map(k => ({ k, v1: m1[k] || 0, v2: m2[k] || 0 }))
    .sort((a, b) => (b.v1 + b.v2) - (a.v1 + a.v2))
    .slice(0, 10);

  if (vsCharts.tipif) vsCharts.tipif.destroy();
  vsCharts.tipif = new Chart(document.getElementById('vs-chart-tipif'), {
    type: 'bar',
    data: {
      labels: rows.map(d => d.k),
      datasets: [
        { label: M1N, data: rows.map(d => d.v1), backgroundColor: cl.c1a, borderRadius: 4, barPercentage: 0.75 },
        { label: M2N, data: rows.map(d => d.v2), backgroundColor: cl.c2a, borderRadius: 4, barPercentage: 0.75 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: {
        legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, padding: 10, color: '#334155', font: { size: 11 } } },
        tooltip: { ...TOOLTIP_BASE, callbacks: {
          footer: items => {
            const d = rows[items[0].dataIndex];
            const diff = d.v2 - d.v1;
            if (diff === 0) return '= Sin cambio';
            return diff < 0 ? `▼ ${Math.abs(diff)} menos casos` : `▲ ${diff} más casos`;
          },
        }},
      },
      scales: {
        x: { beginAtZero: true, grid: { color: 'rgba(31,41,55,.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono',monospace", size: 10 }, stepSize: 1 } },
        y: { grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
      },
    },
  });
}

// ── Tipo de servicio ──────────────────────────────────────────────────────────
function renderVSTipoServ(t1, t2, cl) {
  const m1 = groupBy(t1.filter(t => t.belltech_estado === 'Incumple'), 'tipo_servicio', () => 1);
  const m2 = groupBy(t2.filter(t => t.belltech_estado === 'Incumple'), 'tipo_servicio', () => 1);
  const all = new Set([...Object.keys(m1), ...Object.keys(m2)]);
  const rows = [...all]
    .map(k => ({ k, v1: m1[k] || 0, v2: m2[k] || 0 }))
    .sort((a, b) => (b.v1 + b.v2) - (a.v1 + a.v2));

  if (vsCharts.ts) vsCharts.ts.destroy();
  vsCharts.ts = new Chart(document.getElementById('vs-chart-tiposerv'), {
    type: 'bar',
    data: {
      labels: rows.map(d => d.k),
      datasets: [
        { label: M1N, data: rows.map(d => d.v1), backgroundColor: cl.c1a, borderRadius: 4, barPercentage: 0.75 },
        { label: M2N, data: rows.map(d => d.v2), backgroundColor: cl.c2a, borderRadius: 4, barPercentage: 0.75 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, padding: 10, color: '#334155', font: { size: 11 } } },
        tooltip: { ...TOOLTIP_BASE, callbacks: {
          footer: items => {
            const d = rows[items[0].dataIndex];
            const diff = d.v2 - d.v1;
            if (diff === 0) return '= Sin cambio';
            return diff < 0 ? `▼ ${Math.abs(diff)} menos incumplimientos` : `▲ ${diff} más incumplimientos`;
          },
        }},
      },
      scales: {
        x: { beginAtZero: true, grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
        y: { beginAtZero: true, grid: { color: 'rgba(31,41,55,.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono',monospace", size: 10 }, stepSize: 1 } },
      },
    },
  });
}

// ── Técnicos ──────────────────────────────────────────────────────────────────
function renderVSTecnico(t1, t2, cl) {
  const clean = tix => {
    const m = {};
    tix.forEach(t => {
      if (!t.asignado || t.belltech_estado !== 'Incumple' || t.asignado.includes('@gmail.com')) return;
      const n = t.asignado.includes('<') ? t.asignado.slice(0, t.asignado.indexOf('<')).trim() : t.asignado.trim();
      if (n) m[n] = (m[n] || 0) + 1;
    });
    return m;
  };
  const m1 = clean(t1), m2 = clean(t2);
  const all = new Set([...Object.keys(m1), ...Object.keys(m2)]);
  const rows = [...all]
    .map(k => ({ k, v1: m1[k] || 0, v2: m2[k] || 0 }))
    .sort((a, b) => (b.v1 + b.v2) - (a.v1 + a.v2))
    .slice(0, 10);

  if (vsCharts.tec) vsCharts.tec.destroy();
  vsCharts.tec = new Chart(document.getElementById('vs-chart-tecnico'), {
    type: 'bar',
    data: {
      labels: rows.map(d => d.k),
      datasets: [
        { label: M1N, data: rows.map(d => d.v1), backgroundColor: cl.c1a, borderRadius: 4, barPercentage: 0.75 },
        { label: M2N, data: rows.map(d => d.v2), backgroundColor: cl.c2a, borderRadius: 4, barPercentage: 0.75 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: {
        legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, padding: 10, color: '#334155', font: { size: 11 } } },
        tooltip: { ...TOOLTIP_BASE, callbacks: {
          footer: items => {
            const d = rows[items[0].dataIndex];
            const diff = d.v2 - d.v1;
            if (diff === 0) return '= Sin cambio';
            return diff < 0 ? `▼ ${Math.abs(diff)} menos incumplimientos` : `▲ ${diff} más incumplimientos`;
          },
        }},
      },
      scales: {
        x: { beginAtZero: true, grid: { color: 'rgba(31,41,55,.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono',monospace", size: 10 }, stepSize: 1 } },
        y: { grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
      },
    },
  });
}

// ── Inicializar ───────────────────────────────────────────────────────────────
function initVS() {
  // Tab button
  const nav = document.getElementById('bank-nav');
  const sep = document.createElement('div');
  sep.className = 'bank-nav-sep';
  nav.appendChild(sep);

  const btn = document.createElement('button');
  btn.className = 'bank-tab-btn';
  btn.dataset.bank = 'vs';
  btn.innerHTML = `<span style="font-weight:700;font-size:12px">${M1N} <span style="color:var(--text-mute);font-weight:400;font-size:10px">VS</span> ${M2N}</span>`;
  nav.appendChild(btn);
  btn.addEventListener('click', () => switchBank('vs'));

  // Available banks for filter
  const availBanks = Object.keys(DATA.banks || {});
  const bankPills = [
    { key: 'todos', label: 'Todos' },
    ...availBanks.map(b => ({ key: b, label: BANK_CONFIGS[b]?.name || b })),
  ];

  // Section HTML
  const sec = document.createElement('div');
  sec.id = 'section-vs';
  sec.className = 'bank-section';
  sec.innerHTML = `
    <div class="filter-bar" style="margin-top:16px">
      <span class="filter-label">Banco</span>
      <div class="filter-pills" id="vs-bank-pills">
        ${bankPills.map((b, i) => `
          <button class="filter-pill${i === 0 ? ' active' : ''}" data-vsbank="${b.key}">${b.label}</button>
        `).join('')}
      </div>
    </div>

    <section class="kpi-grid" id="vs-kpis" style="margin-top:16px"></section>

    <div class="section-title">¿En qué ciudades mejoramos? <span class="small">Incumplimientos ${M1N} vs ${M2N}</span></div>
    <div class="grid">
      <div class="card col-12">
        <div class="card-head"><div>
          <div class="card-title">Incumplimientos por ciudad</div>
          <div class="card-sub">Top 15 · azul = ${M1N} · violeta = ${M2N} · hover para ver diferencia</div>
        </div></div>
        <div class="chart-box tall"><canvas id="vs-chart-ciudades"></canvas></div>
      </div>
    </div>

    <div class="section-title">Análisis Comparativo <span class="small">${M1N} vs ${M2N}</span></div>
    <div class="grid">
      <div class="card col-6">
        <div class="card-head"><div>
          <div class="card-title">Tipificaciones · incumplimientos</div>
          <div class="card-sub">Top 10 · ${M1N} vs ${M2N}</div>
        </div></div>
        <div class="chart-box tall"><canvas id="vs-chart-tipif"></canvas></div>
      </div>
      <div class="card col-6">
        <div class="card-head"><div>
          <div class="card-title">Tipo de servicio · incumplimientos</div>
          <div class="card-sub">${M1N} vs ${M2N}</div>
        </div></div>
        <div class="chart-box tall"><canvas id="vs-chart-tiposerv"></canvas></div>
      </div>
      <div class="card col-12">
        <div class="card-head"><div>
          <div class="card-title">Técnicos · incumplimientos</div>
          <div class="card-sub">Top 10 técnicos Belltech · ${M1N} vs ${M2N}</div>
        </div></div>
        <div class="chart-box"><canvas id="vs-chart-tecnico"></canvas></div>
      </div>
    </div>
  `;

  document.getElementById('bank-sections').appendChild(sec);

  // Bank filter
  sec.querySelectorAll('[data-vsbank]').forEach(pill => {
    pill.addEventListener('click', () => {
      sec.querySelectorAll('[data-vsbank]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      vsBank = pill.dataset.vsbank;
      renderVS();
    });
  });

  renderVS();
}

initVS();

} // end if (vsAvailMonths.length >= 2)
