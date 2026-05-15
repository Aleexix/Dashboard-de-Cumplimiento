// =========== BANK CONFIG ===========
const BANK_LOGOS = {
  bancolombia: 'images/bancolombia.svg',
  bbva:        'images/bbva-2.svg',
  davivienda:  'images/logo-davivienda.svg',
};

const BANK_CONFIGS = {
  bancolombia: {
    name:    'Bancolombia',
    color:   '#F9B115',
    dark:    '#0D3866',
    glow:    'rgba(249,177,21,0.12)',
    bg:      'rgba(249,177,21,0.06)',
    border:  'rgba(249,177,21,0.2)',
  },
  bbva: {
    name:    'BBVA',
    color:   '#00AEEF',
    dark:    '#004A97',
    glow:    'rgba(0,174,239,0.12)',
    bg:      'rgba(0,174,239,0.06)',
    border:  'rgba(0,174,239,0.2)',
  },
  davivienda: {
    name:    'Davivienda',
    color:   '#E30613',
    dark:    '#002060',
    glow:    'rgba(227,6,19,0.12)',
    bg:      'rgba(227,6,19,0.06)',
    border:  'rgba(227,6,19,0.2)',
  },
};

// =========== BANK SECTION GENERATION ===========
const createdBankSections = new Set();

function initBankNav() {
  const banks = Object.keys(DATA.banks || {});
  if (!banks.length) return;

  const nav = document.getElementById('bank-nav');
  const container = document.getElementById('bank-sections');

  // Separator between global and bank tabs
  const sep = document.createElement('div');
  sep.className = 'bank-nav-sep';
  nav.appendChild(sep);

  banks.forEach(bankKey => {
    const cfg = BANK_CONFIGS[bankKey] || {
      name: bankKey.charAt(0).toUpperCase() + bankKey.slice(1),
      color: '#8b5cf6', dark: '#1a1a2e', glow: 'rgba(139,92,246,0.12)',
      bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.2)',
    };

    // Tab button with logo
    const btn = document.createElement('button');
    btn.className = 'bank-tab-btn';
    btn.dataset.bank = bankKey;
    const logo = BANK_LOGOS[bankKey];
    btn.innerHTML = logo
      ? `<img src="${logo}" class="bank-logo" alt="${cfg.name}">`
      : `<span class="bank-global-label">${cfg.name}</span>`;
    nav.appendChild(btn);

    // Section container
    const sec = document.createElement('div');
    sec.id = 'section-' + bankKey;
    sec.className = 'bank-section';
    container.appendChild(sec);

    btn.addEventListener('click', () => switchBank(bankKey));
  });

  // Global tab click
  document.querySelector('[data-bank="global"]').addEventListener('click', () => switchBank('global'));
}

function switchBank(bankKey) {
  // Toggle active tab
  document.querySelectorAll('.bank-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-bank="${bankKey}"]`).classList.add('active');

  // Toggle active section
  document.querySelectorAll('.bank-section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + bankKey).classList.add('active');

  // Scroll to top of section
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Lazy-create charts for this bank (only once)
  if (bankKey !== 'global' && bankKey !== 'vs' && !createdBankSections.has(bankKey)) {
    createdBankSections.add(bankKey);
    createBankSection(bankKey);
    if (window._onBankCreated) window._onBankCreated(bankKey);
  }
}

function createBankSection(bankKey) {
  const bd  = DATA.banks[bankKey];
  const cfg = BANK_CONFIGS[bankKey] || {};
  const bk  = DATA.tickets.filter(t => t.banco === bankKey);
  const p   = bankKey; // prefix for IDs
  const k   = bd.kpis;

  const sec = document.getElementById('section-' + bankKey);

  const logoSrc = BANK_LOGOS[p] || '';

  // ── Header ──────────────────────────────────────────────────────────────
  sec.innerHTML = `
    <div class="bank-section-header" style="border-color:${cfg.border}">
      <div class="bank-logo-bar" style="background:${cfg.color}"></div>
      ${logoSrc ? `<img src="${logoSrc}" class="bank-section-logo" alt="${cfg.name}">` : `<span class="bank-header-info"><div class="bank-title" style="color:${cfg.color}">${cfg.name}</div></span>`}
      <div class="bank-header-info">
        <div class="bank-sub" style="color:${cfg.color};font-weight:600">${fmt(k.total_tickets)} tickets</div>
      </div>
      <div class="bank-header-range">
        <span style="color:var(--green);font-weight:600">${k.belltech_pct_cumple.toFixed(1)}%</span> cumple<br>
        <span style="color:var(--red);font-weight:600">${fmt(k.belltech_incumple)}</span> incumple
      </div>
    </div>

    <!-- KPIs -->
    <section class="kpi-grid">
      <div class="kpi good" id="${p}-kpi-c1" style="--accent:${cfg.color}">
        <div class="label">Cumplimiento Belltech</div>
        <div class="value" style="color:${cfg.color};text-shadow:0 0 30px ${cfg.glow}">${k.belltech_pct_cumple.toFixed(1)}%</div>
        <div class="sub">cumple cita · ${fmt(k.belltech_cumple)}</div>
      </div>
      ${bankKey !== 'bbva' ? `
      <div class="kpi good" id="${p}-kpi-c2" style="--accent:${cfg.color}">
        <div class="label">Cumplimiento Oficina</div>
        <div class="value" style="color:${cfg.color};text-shadow:0 0 30px ${cfg.glow}">${k.oficina_pct_cumple.toFixed(1)}%</div>
        <div class="sub" style="flex-direction:column;align-items:flex-start;gap:4px">
          <span style="color:var(--green)">▲ ${fmt(k.oficina_cumple)} cumplen</span>
          <span style="color:var(--red)">▼ ${fmt(k.oficina_incumple)} incumplen · ${k.oficina_incumple + k.oficina_cumple > 0 ? (k.oficina_incumple*100/(k.oficina_incumple+k.oficina_cumple)).toFixed(1)+'%' : '—'}</span>
        </div>
      </div>` : ''}
      <div class="kpi bad" id="${p}-kpi-incumple">
        <div class="label">Incumplimientos Belltech</div>
        <div class="value tabular">${fmt(k.belltech_incumple)}</div>
        <div class="sub">SLA + cita</div>
      </div>
      <div class="kpi warn" id="${p}-kpi-reprog">
        <div class="label">Reprogramaciones</div>
        <div class="value tabular">${fmt(k.belltech_reprog)}</div>
        <div class="sub">solicitudes Belltech</div>
      </div>
      <div class="kpi info" id="${p}-kpi-total" style="--accent:${cfg.color}">
        <div class="label">Total Tickets</div>
        <div class="value tabular" style="color:${cfg.color}">${fmt(k.total_tickets)}</div>
        <div class="sub">en el período</div>
      </div>
    </section>

    <!-- Charts row 1: Belltech donut + Timeline -->
    <div class="section-title" style="--color:${cfg.color}">
      Cumplimiento Belltech
      <span class="small">CAUSAL #02</span>
    </div>
    <div class="grid">
      <div class="card col-5">
        <div class="card-head"><div>
          <div class="card-title">Cumplimiento ${cfg.name}</div>
          <div class="card-sub">CAUSAL #02 · clic en segmento</div>
        </div><div class="card-tag">CLICK</div></div>
        <div class="chart-box tall"><canvas id="${p}-chart-belltech"></canvas></div>
      </div>
      <div class="card col-7">
        <div class="card-head"><div>
          <div class="card-title">Evolución diaria</div>
          <div class="card-sub">Cumple vs Incumple vs Reprog</div>
        </div>
        <div class="tabs" id="${p}-tabs-tl">
          <button class="tab active" data-mode="absolute">ABSOLUTO</button>
          <button class="tab" data-mode="pct">% CUMPL.</button>
        </div></div>
        <div class="chart-box tall"><canvas id="${p}-chart-timeline"></canvas></div>
      </div>
    </div>

    <!-- Charts row 2: Ciudades + Tipos -->
    <div class="section-title">Análisis Operacional <span class="small">ciudades · tipos · tipificaciones</span></div>
    <div class="grid">
      <div class="card col-7">
        <div class="card-head"><div>
          <div class="card-title">Volumen e incumplimiento por ciudad</div>
          <div class="card-sub">Top 15 ciudades</div>
        </div><div class="card-tag">CLICK BARRA</div></div>
        <div class="chart-box tall"><canvas id="${p}-chart-ciudades"></canvas></div>
      </div>
      <div class="card col-5">
        <div class="card-head"><div>
          <div class="card-title">Tipo de servicio</div>
          <div class="card-sub">Cumple vs Incumple</div>
        </div><div class="card-tag">CLICK</div></div>
        <div class="chart-box tall"><canvas id="${p}-chart-tiposerv"></canvas></div>
      </div>
      <div class="card col-7">
        <div class="card-head"><div>
          <div class="card-title">Tipificaciones que generan incumplimiento</div>
          <div class="card-sub">Top 10 razones de incumplimiento Belltech</div>
        </div><div class="card-tag">CLICK</div></div>
        <div class="chart-box"><canvas id="${p}-chart-tipif"></canvas></div>
      </div>
      <div class="card col-5">
        <div class="card-head"><div>
          <div class="card-title">Responsable en Atención</div>
          <div class="card-sub">Motivo de incumplimiento · Hoja 2</div>
        </div><div class="card-tag">CLICK FILA</div></div>
        <div class="day-list" id="${p}-responsable-list"></div>
      </div>
    </div>
  `;

  // ── KPI click handlers ────────────────────────────────────────────────────
  document.getElementById(`${p}-kpi-c1`).addEventListener('click', () =>
    openPanel(bk.filter(t => t.belltech_estado === 'Cumple'),
      `${cfg.name} · Belltech Cumple`, 'CAUSAL #02 = CUMPLE',
      [{ label: 'Total', value: k.belltech_cumple, accent: true }]));

  if (bankKey !== 'bbva')
    document.getElementById(`${p}-kpi-c2`).addEventListener('click', () =>
      openPanel(bk.filter(t => t.causal1 === 'OFICINA CUMPLE SERVICIO'),
        `${cfg.name} · Oficina Cumple`, 'CAUSAL #01 = OFICINA CUMPLE',
        [{ label: 'Total', value: k.oficina_cumple, accent: true }]));

  document.getElementById(`${p}-kpi-incumple`).addEventListener('click', () =>
    openPanel(bk.filter(t => t.belltech_estado === 'Incumple'),
      `${cfg.name} · Incumplimientos`, 'CAUSAL #02 = INCUMPLE',
      [{ label: 'Total', value: k.belltech_incumple, accent: true }]));

  document.getElementById(`${p}-kpi-reprog`).addEventListener('click', () =>
    openPanel(bk.filter(t => t.belltech_estado === 'Reprogramación'),
      `${cfg.name} · Reprogramaciones`, 'CAUSAL #02 = REPROGRAMACIÓN',
      [{ label: 'Total', value: k.belltech_reprog, accent: true }]));

  document.getElementById(`${p}-kpi-total`).addEventListener('click', () =>
    openPanel(bk, `${cfg.name} · Todos los tickets`, 'Base completa',
      [{ label: 'Total', value: k.total_tickets, accent: true }]));

  // ── Donut Belltech ────────────────────────────────────────────────────────
  const btTotal = bd.belltech_causal.reduce((a, b) => a + b.count, 0);
  new Chart(document.getElementById(`${p}-chart-belltech`), {
    type: 'doughnut',
    data: {
      labels: bd.belltech_causal.map(d => d.label),
      datasets: [{
        data: bd.belltech_causal.map(d => d.count),
        backgroundColor: bd.belltech_causal.map(d => belltechColor(d.label) + 'ee'),
        borderColor: '#ffffff', borderWidth: 3, hoverOffset: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      onClick: (e, els) => {
        if (!els.length) return;
        const label = bd.belltech_causal[els[0].index].label;
        const list  = bk.filter(t => t.causal2 === label);
        openPanel(list, `${cfg.name} · ${label}`, 'CAUSAL #02 = ' + label, [{ label: 'Tickets', value: list.length, accent: true }]);
      },
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, color: '#334155', font: { size: 11 }, boxWidth: 12, boxHeight: 12 } },
        tooltip: { ...TOOLTIP_BASE, callbacks: { label: c => ` ${c.label}: ${fmt(c.raw)} (${(c.raw*100/btTotal).toFixed(1)}%)` } },
      },
    },
    plugins: [{
      id: 'ct',
      afterDraw(chart) {
        const { ctx, chartArea: { top, bottom, left, right } } = chart;
        const x = (left+right)/2, y = (top+bottom)/2;
        ctx.save(); ctx.textAlign = 'center';
        ctx.fillStyle = cfg.color;
        ctx.font = "800 34px 'Bricolage Grotesque', serif";
        ctx.fillText(k.belltech_pct_cumple.toFixed(1) + '%', x, y - 4);
        ctx.fillStyle = '#64748b';
        ctx.font = "500 10px 'JetBrains Mono', monospace";
        ctx.fillText('CUMPLIMIENTO', x, y + 16);
        ctx.restore();
      },
    }],
  });

  // ── Timeline ──────────────────────────────────────────────────────────────
  let bankTLChart;
  function renderBankTimeline(mode, tlOverride, bkOverride) {
    const tl      = tlOverride || bd.timeline;
    const tickets = bkOverride || bk;
    const labels   = tl.map(d => d.fecha);
    const cumpleD  = tl.map(d => d.cumple);
    const incumpleD= tl.map(d => d.incumple);
    const reprogD  = tl.map(d => d.reprogramacion);
    let datasets;
    if (mode === 'pct') {
      datasets = [{ label: '% Cumplimiento', data: tl.map(d => { const t = d.cumple+d.incumple+d.reprogramacion; return t ? +(d.cumple*100/t).toFixed(1) : null; }), borderColor: cfg.color, backgroundColor: cfg.color + '20', fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 6, borderWidth: 2.5 }];
    } else {
      datasets = [
        { label: 'Cumple',    data: cumpleD,  borderColor: cfg.color, backgroundColor: ctx => { const c = ctx.chart; if (!c.chartArea) return cfg.color+'20'; return makeGradient(c.ctx, c.chartArea, cfg.color); }, fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 6, borderWidth: 2.5 },
        { label: 'Incumple',  data: incumpleD,borderColor: COLORS.red,   backgroundColor: ctx => { const c = ctx.chart; if (!c.chartArea) return COLORS.red+'20'; return makeGradient(c.ctx, c.chartArea, COLORS.red); }, fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 6, borderWidth: 2 },
        { label: 'Reprog',    data: reprogD,  borderColor: COLORS.amber,  backgroundColor: ctx => { const c = ctx.chart; if (!c.chartArea) return COLORS.amber+'20'; return makeGradient(c.ctx, c.chartArea, COLORS.amber); }, fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 6, borderWidth: 1.5 },
      ];
    }
    if (bankTLChart) bankTLChart.destroy();
    bankTLChart = new Chart(document.getElementById(`${p}-chart-timeline`), {
      type: 'line', data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        onClick: (e, els) => {
          if (!els.length) return;
          const fecha = labels[els[0].index];
          const list  = tickets.filter(t => t.fecha_coord === fecha);
          openPanel(list, `${cfg.name} · ${fmtFecha(fecha)}`, fecha, [{ label: 'Tickets', value: list.length, accent: true }]);
        },
        plugins: {
          legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, padding: 12, color: '#334155', font: { size: 11 } } },
          tooltip: { ...TOOLTIP_BASE, titleColor: '#334155', bodyColor: '#475569', callbacks: { title: items => fmtFecha(items[0].label) } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: 10, font: { family: "'JetBrains Mono', monospace", size: 10 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(31,41,55,0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace", size: 10 } }, max: mode === 'pct' ? 100 : undefined },
        },
      },
    });
  }
  renderBankTimeline('absolute');
  document.querySelectorAll(`#${p}-tabs-tl .tab`).forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll(`#${p}-tabs-tl .tab`).forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      renderBankTimeline(t.dataset.mode);
    });
  });

  // Exponer para filter.js
  window._bankRenderFns = window._bankRenderFns || {};
  window._bankRenderFns[bankKey] = renderBankTimeline;

  // Responsable en Atención del banco
  renderResponsableList(`${p}-responsable-list`,
    bd.responsable_atencion_stats || [],
    bk);

  // Cajeros reincidentes del banco (hoja 3)
  const reincBk = bd.reincidentes || [];
  if (reincBk.length) {
    const reincSection = document.createElement('div');
    reincSection.innerHTML = `
      <div class="section-title">Cajeros Reincidentes <span class="small">Hoja 3 · Abril–Mayo completo</span></div>
      <div class="grid">
        <div class="card col-12">
          <div class="card-head"><div>
            <div class="card-title">Top cajeros con más tickets en el período · ${cfg.name}</div>
            <div class="card-sub">Datos consolidados · hover para ver ciudad y sitio</div>
          </div></div>
          <div id="${p}-reincidentes-box" style="position:relative;height:${Math.max(280, reincBk.length * 28)}px">
            <canvas id="${p}-chart-reincidentes"></canvas>
          </div>
        </div>
      </div>`;
    sec.appendChild(reincSection);
    renderReincidentesChart(`${p}-chart-reincidentes`, `${p}-reincidentes-box`, reincBk);
  }

  // ── Ciudades ──────────────────────────────────────────────────────────────
  new Chart(document.getElementById(`${p}-chart-ciudades`), {
    type: 'bar',
    data: {
      labels: bd.ciudades.map(d => d.ciudad),
      datasets: [
        { label: 'Total', data: bd.ciudades.map(d => d.total), backgroundColor: cfg.color + 'aa', borderRadius: 6, borderSkipped: false, barPercentage: 0.7 },
        { label: 'Incumple', data: bd.ciudades.map(d => d.incumple), backgroundColor: '#f87171cc', borderRadius: 6, borderSkipped: false, barPercentage: 0.7 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      onClick: (e, els) => {
        if (!els.length) return;
        const ciudad = bd.ciudades[els[0].index].ciudad;
        const list = els[0].datasetIndex === 0
          ? bk.filter(t => t.ciudad === ciudad)
          : bk.filter(t => t.ciudad === ciudad && t.belltech_estado === 'Incumple');
        openPanel(list, `${cfg.name} · ${ciudad}`, 'Ciudad = ' + ciudad, [{ label: 'Tickets', value: list.length, accent: true }]);
      },
      plugins: {
        legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, padding: 10, color: '#334155', font: { size: 11 } } },
        tooltip: { ...TOOLTIP_BASE, callbacks: { footer: () => 'Clic para ver tickets' } },
      },
      scales: {
        x: { beginAtZero: true, grid: { color: 'rgba(31,41,55,0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace", size: 10 } } },
        y: { grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
      },
    },
  });

  // ── Tipo Servicio ─────────────────────────────────────────────────────────
  new Chart(document.getElementById(`${p}-chart-tiposerv`), {
    type: 'bar',
    data: {
      labels: bd.tipos_servicio.map(d => d.tipo),
      datasets: [
        { label: 'Cumple',   data: bd.tipos_servicio.map(d => d.total - d.incumple), backgroundColor: cfg.color + 'aa', borderRadius: 6, borderSkipped: false, stack: 's' },
        { label: 'Incumple', data: bd.tipos_servicio.map(d => d.incumple),           backgroundColor: '#f87171cc', borderRadius: 6, borderSkipped: false, stack: 's' },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      onClick: (e, els) => {
        if (!els.length) return;
        const tipo = bd.tipos_servicio[els[0].index].tipo;
        const list = els[0].datasetIndex === 1
          ? bk.filter(t => t.tipo_servicio === tipo && t.belltech_estado === 'Incumple')
          : bk.filter(t => t.tipo_servicio === tipo && t.belltech_estado !== 'Incumple');
        openPanel(list, `${tipo} · ${cfg.name}`, 'Tipo servicio = ' + tipo, [{ label: 'Tickets', value: list.length, accent: true }]);
      },
      plugins: {
        legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, padding: 10, color: '#334155', font: { size: 11 } } },
        tooltip: { ...TOOLTIP_BASE, callbacks: { footer: () => 'Clic para ver tickets' } },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
        y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(31,41,55,0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace", size: 10 } } },
      },
    },
  });

  // ── Tipificaciones incumple ───────────────────────────────────────────────
  new Chart(document.getElementById(`${p}-chart-tipif`), {
    type: 'bar',
    data: {
      labels: bd.tipif_incumple.map(d => d.tipif),
      datasets: [{
        label: 'Incumplimientos',
        data: bd.tipif_incumple.map(d => d.count),
        backgroundColor: ctx => {
          const v = ctx.parsed.x ?? 0;
          const max = Math.max(...bd.tipif_incumple.map(d => d.count));
          return cfg.color + Math.round((0.35 + (v/max)*0.55) * 255).toString(16).padStart(2,'0');
        },
        borderRadius: 6, borderSkipped: false, barPercentage: 0.75,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      onClick: (e, els) => {
        if (!els.length) return;
        const tipif = bd.tipif_incumple[els[0].index].tipif;
        const list  = bk.filter(t => t.tipificacion === tipif && t.belltech_estado === 'Incumple');
        openPanel(list, `${tipif} · ${cfg.name}`, 'TIPIFICACIÓN = ' + tipif, [{ label: 'Tickets', value: list.length, accent: true }]);
      },
      plugins: {
        legend: { display: false },
        tooltip: { ...TOOLTIP_BASE, callbacks: { footer: () => 'Clic para ver tickets' } },
      },
      scales: {
        x: { beginAtZero: true, grid: { color: 'rgba(31,41,55,0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace", size: 10 } } },
        y: { grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
      },
    },
  });
}

// ── % dinámico para donut Belltech (recalcula con los segmentos visibles) ─────
function calcDonutPct(chart) {
  const dataset = chart.data.datasets[0];
  const labels  = chart.data.labels;
  let cumple = 0, total = 0;
  dataset.data.forEach((val, i) => {
    if (chart.getDataVisibility(i)) {   // Chart.js 4: API correcta para donut
      total += val;
      const l = (labels[i] || '').toUpperCase();
      if (l.includes('CUMPLE') && !l.includes('INCUMPLE')) cumple += val;
    }
  });
  if (!total) return { pct: '—', color: '#64748b' };
  const pct = (cumple / total * 100).toFixed(1);
  const color = pct >= 90 ? '#16a34a' : pct >= 70 ? '#d97706' : '#dc2626';
  return { pct: pct + '%', color };
}

// ── Color semántico para causales Belltech ────────────────────────────────────
function belltechColor(label) {
  const l = (label || '').toUpperCase();
  // INCUMPLE debe ir antes que CUMPLE — "INCUMPLE" contiene la subcadena "CUMPLE"
  if (l.includes('INCUMPLE SLA'))  return '#ea580c';  // naranja oscuro
  if (l.includes('INCUMPLE CITA')) return '#dc2626';  // rojo
  if (l.includes('REPROG'))        return '#eab308';  // amarillo
  if (l.includes('CUMPLE'))        return '#16a34a';  // verde
  return '#64748b';
}

// Inicializar nav y tabs al cargar
initBankNav();

// =========== PRE-COMPUTED DATA FOR NEW CHARTS ===========

// Top 10 sucursales con más incumplimientos Belltech
const sucursalesData = (() => {
  const map = {};
  DATA.tickets.forEach(t => {
    if (!t.sucursal) return;
    if (!map[t.sucursal]) map[t.sucursal] = { sucursal: t.sucursal, incumple: 0, total: 0 };
    map[t.sucursal].total++;
    if (t.belltech_estado === 'Incumple') map[t.sucursal].incumple++;
  });
  return Object.values(map).sort((a, b) => b.incumple - a.incumple).slice(0, 10);
})();

// Top 10 títulos que más generan incumplimiento Belltech
const tituloIncumpleData = (() => {
  const map = {};
  DATA.tickets
    .filter(t => t.belltech_estado === 'Incumple' && t.titulo)
    .forEach(t => { map[t.titulo] = (map[t.titulo] || 0) + 1; });
  return Object.entries(map)
    .map(([titulo, count]) => ({ titulo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
})();

// =========== RESPONSABLE EN ATENCIÓN (HOJA 2) ===========
function renderResponsableList(elId, list, ticketPool) {
  const el = document.getElementById(elId);
  if (!el) return;
  const pool = ticketPool || DATA.tickets;
  if (!list || !list.length) {
    el.innerHTML = '<div style="color:var(--text-mute);padding:20px;text-align:center;font-size:12px;">Sin datos · sube el Excel con la Hoja 2<br><span style="font-size:10px;opacity:.6">NOMBRE · CIUDAD · CODIGO · FECHA · RESPONSABLE EN ATENCIÓN · CAUSAL</span></div>';
    return;
  }
  const RESP_COLORS = {
    'DISPONIBILIDAD': COLORS.cyan,
    'TÉCNICO':        COLORS.green,
    'TECNICO':        COLORS.green,
    'TORRE':          COLORS.amber,
    'LOGISTICA':      COLORS.violet,
    'LOGÍSTICA':      COLORS.violet,
  };
  const max = list[0].count;
  el.innerHTML = list.map((d, i) => {
    const color = RESP_COLORS[d.label.toUpperCase()] || COLORS.dim;
    return `
      <div class="day-row ${i === 0 ? 'first' : ''}" data-idx="${i}"
           style="--accent:${color};--accent-text:${color};cursor:pointer">
        <div class="bar-bg" style="width:${(d.count / max * 100).toFixed(1)}%"></div>
        <div class="day-date">${d.label}</div>
        <div class="day-count">${d.count}</div>
      </div>`;
  }).join('');

  el.querySelectorAll('.day-row').forEach((row, i) => {
    row.addEventListener('click', () => {
      const d = list[i];
      const tickets = pool.filter(t => t.responsable_atencion === d.label);
      openPanel(
        tickets,
        'Responsable · ' + d.label,
        'RESPONSABLE EN ATENCIÓN = ' + d.label,
        [{ label: 'Tickets', value: d.count, accent: true }]
      );
    });
  });
}

renderResponsableList('responsable-atencion-list', DATA.responsable_atencion_stats || []);


// =========== TOP 10 LLEGADA AL SITIO MÁS LENTA ===========
// Pre-computa top 10 global y por tipo de servicio
const llegadaAllItems = (() => {
  const items = [];
  DATA.tickets.forEach(t => {
    if (!t.hora_llegada_sitio || !t.coord) return;
    const hours = (new Date(t.hora_llegada_sitio) - new Date(t.coord)) / 3600000;
    if (hours < 0 || hours > 720) return;
    items.push({
      label:  (t.ciudad || t.sucursal || '#' + t.id || '—').slice(0, 22),
      tipo:   t.tipo_servicio || 'Sin tipo',
      ciudad: t.ciudad || '—',
      id:     t.id,
      hours:  +hours.toFixed(1),
      ticket: t,
    });
  });
  return items.sort((a, b) => b.hours - a.hours);
})();

function llegadaSlice(tipo) {
  const filtered = tipo === 'Todos'
    ? llegadaAllItems
    : llegadaAllItems.filter(d => d.tipo === tipo);
  return filtered.slice(0, 10);  // más lento primero (índice 0 = top de la barra)
}

const llegadaTipos = ['Todos', ...new Set(llegadaAllItems.map(d => d.tipo))];
const llegadaTop10 = llegadaSlice('Todos');

const hasLlegadaData = llegadaTop10.length > 0;

if (!hasLlegadaData) {
  const el = document.getElementById('chart-llegada-sitio');
  if (el) el.closest('.chart-box').innerHTML =
    '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:8px;color:var(--text-mute);font-size:12px;text-align:center">' +
    '<div style="font-size:28px;opacity:.3">⏱</div>' +
    '<div>Re-sube el Excel con la columna<br><strong style="color:var(--cyan)">HORA LLEGADA SITIO</strong></div></div>';
} else {
  // ── Construir dataset a partir de un slice de datos ───────────────────────
  function llegadaDataset(slice) {
    const maxH = slice[0]?.hours  || 1;
    const minH = slice[slice.length - 1]?.hours || 0;
    const range = maxH - minH || 1;
    return {
      labels: slice.map(d => d.label),
      bg: slice.map(d => {
        const t = (d.hours - minH) / range;
        if (t > 0.65) return COLORS.red   + 'cc';
        if (t > 0.30) return COLORS.amber + 'cc';
        return COLORS.cyan + 'bb';
      }),
      border: slice.map(d => {
        const t = (d.hours - minH) / range;
        if (t > 0.65) return COLORS.red;
        if (t > 0.30) return COLORS.amber;
        return COLORS.cyan;
      }),
      values: slice.map(d => d.hours),
    };
  }

  let currentSlice = llegadaTop10;

  const llegadaChartInst = new Chart(document.getElementById('chart-llegada-sitio'), {
    type: 'bar',
    data: (() => {
      const ds = llegadaDataset(currentSlice);
      return {
        labels: ds.labels,
        datasets: [{
          label: 'Horas hasta llegada',
          data: ds.values,
          backgroundColor: ds.bg,
          borderColor: ds.border,
          borderWidth: 1.5,
          borderRadius: [0, 6, 6, 0],
          borderSkipped: false,
          barPercentage: 0.72,
        }],
      };
    })(),
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      layout: { padding: { right: 52 } },
      onClick: (e, els) => {
        if (!els.length) return;
        const d = currentSlice[els[0].index];
        openPanel([d.ticket], 'Llegada lenta · ' + d.ciudad, 'Ticket #' + d.id + ' · ' + fmtHoras(d.hours) + ' hasta llegar', [
          { label: 'Tiempo', value: fmtHoras(d.hours), accent: true },
          { label: 'Tipo',   value: d.tipo },
          { label: 'Ciudad', value: d.ciudad },
        ]);
      },
      plugins: {
        legend: { display: false },
        tooltip: { ...TOOLTIP_BASE, callbacks: {
          title:  items => 'Ticket #' + currentSlice[items[0].dataIndex].id,
          label:  c => '  ' + fmtHoras(c.parsed.x) + ' hasta llegada al sitio',
          footer: items => currentSlice[items[0].dataIndex].tipo + ' · ' + currentSlice[items[0].dataIndex].ciudad,
        }},
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(226,232,240,0.7)', drawTicks: false },
          border: { display: false },
          ticks: { color: '#64748b', font: { size: 10 }, callback: v => fmtHoras(v), maxTicksLimit: 6 },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#334155', font: { size: 11 } },
        },
      },
      animation: { duration: 200 },
    },
    plugins: [{
      id: 'valueLabels',
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        chart.getDatasetMeta(0).data.forEach((bar, i) => {
          ctx.save();
          ctx.fillStyle = '#475569';
          ctx.font = "600 11px 'Geist', system-ui, sans-serif";
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(fmtHoras(currentSlice[i].hours), bar.x + 6, bar.y);
          ctx.restore();
        });
      },
    }],
  });

  // ── Filtros por tipo de servicio ──────────────────────────────────────────
  const filtersEl = document.getElementById('llegada-filters');
  if (filtersEl && llegadaTipos.length > 1) {
    filtersEl.className = 'tabs';
    filtersEl.style.flexWrap = 'wrap';
    llegadaTipos.forEach(tipo => {
      const btn = document.createElement('button');
      btn.className = 'tab' + (tipo === 'Todos' ? ' active' : '');
      btn.textContent = tipo;
      btn.addEventListener('click', () => {
        filtersEl.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSlice = llegadaSlice(tipo);
        const ds = llegadaDataset(currentSlice);
        llegadaChartInst.data.labels                          = ds.labels;
        llegadaChartInst.data.datasets[0].data               = ds.values;
        llegadaChartInst.data.datasets[0].backgroundColor    = ds.bg;
        llegadaChartInst.data.datasets[0].borderColor        = ds.border;
        llegadaChartInst.update();
      });
      filtersEl.appendChild(btn);
    });
  }
}

// =========== DONUT BELLTECH ===========
const belltechTotal = DATA.belltech_causal.reduce((a, b) => a + b.count, 0);
new Chart(document.getElementById('chart-belltech'), {
  type: 'doughnut',
  data: {
    labels: DATA.belltech_causal.map(d => d.label),
    datasets: [{
      data: DATA.belltech_causal.map(d => d.count),
      backgroundColor: DATA.belltech_causal.map(d => belltechColor(d.label)),
      borderColor: '#ffffff', borderWidth: 3, hoverOffset: 8,
    }],
  },
  options: {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    onClick: (e, els) => {
      if (!els.length) return;
      const label = DATA.belltech_causal[els[0].index].label;
      const count = DATA.belltech_causal[els[0].index].count;
      const list  = DATA.tickets.filter(t => t.causal2 === label);
      openPanel(list, 'Belltech · ' + label, 'CAUSAL #02 = ' + label, [{ label: 'Tickets', value: count, accent: true }]);
    },
    plugins: {
      legend: { position: 'bottom', labels: { padding: 12, color: '#334155', font: { size: 11 }, boxWidth: 12, boxHeight: 12 } },
      tooltip: { ...TOOLTIP_BASE, callbacks: { label: c => ' ' + c.label + ': ' + fmt(c.raw) + ' (' + (c.raw * 100 / belltechTotal).toFixed(1) + '%) — clic para ver' } },
    },
  },
  plugins: [{
    id: 'centerText',
    afterDraw(chart) {
      const { ctx, chartArea: { top, bottom, left, right } } = chart;
      const x = (left + right) / 2, y = (top + bottom) / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#16a34a';
      ctx.font = "800 36px 'Bricolage Grotesque', serif";
      ctx.fillText(k.belltech_pct_cumple.toFixed(1) + '%', x, y - 4);
      ctx.fillStyle = '#64748b';
      ctx.font = "500 10px 'JetBrains Mono', monospace";
      ctx.fillText('CUMPLIMIENTO', x, y + 16);
      ctx.restore();
    },
  }],
});

// =========== LISTAS DE DÍAS ===========
function renderDayList(elId, list, color, kind) {
  const max = list.length ? list[0].count : 1;
  const el  = document.getElementById(elId);
  if (!list.length) {
    el.innerHTML = '<div style="color:#5a6678; padding:20px; text-align:center;">Sin incumplimientos registrados</div>';
    return;
  }
  el.innerHTML = list.map((d, i) => `
    <div class="day-row ${i === 0 ? 'first' : ''}" data-fecha="${d.fecha}" data-count="${d.count}"
         style="--accent: ${i === 0 ? color : color + '66'}; --accent-text: ${i === 0 ? color : '#334155'};">
      <div class="bar-bg" style="width: ${d.count / max * 100}%;"></div>
      <div class="day-date">${fmtFecha(d.fecha)} <span style="color:#5a6678; font-size:10px;">· ${d.fecha}</span></div>
      <div class="day-count">${d.count}</div>
    </div>
  `).join('');

  el.querySelectorAll('.day-row').forEach(r => {
    r.addEventListener('click', () => {
      const fecha = r.dataset.fecha;
      let tickets, title, sub;
      if (kind === 'belltech') {
        tickets = DATA.tickets.filter(t => t.fecha_coord === fecha && t.belltech_estado === 'Incumple');
        title   = 'Belltech Incumple · ' + fmtFecha(fecha);
        sub     = 'Fecha coordinación ' + fecha + ' · CAUSAL #02 = incumple SLA/CITA';
      } else {
        tickets = DATA.tickets.filter(t => t.fecha_coord === fecha && t.causal1 === 'OFICINA INCUMPLE SERVICIO');
        title   = 'Oficina Incumple · ' + fmtFecha(fecha);
        sub     = 'Fecha coordinación ' + fecha + ' · CAUSAL #01 = OFICINA INCUMPLE';
      }
      openPanel(tickets, title, sub, [{ label: 'Tickets', value: tickets.length, accent: true }, { label: 'Fecha', value: fecha }]);
    });
  });
}

renderDayList('dias-belltech', DATA.belltech_incumple_dias.slice(0, 5), COLORS.red,   'belltech');
renderDayList('dias-oficina',  DATA.oficina_incumple_dias.slice(0, 5),  COLORS.amber, 'oficina');

// =========== TIMELINE ===========
let timelineChart;

function timelineClick(e, els, mode, tix) {
  if (!els.length) return;
  tix = tix || DATA.tickets;
  const tl    = window._filteredTimeline || DATA.timeline;
  const idx   = els[0].index;
  const fecha = tl[idx].fecha;
  if (mode === 'pct') {
    const tickets = tix.filter(t => t.fecha_coord === fecha && t.belltech_estado);
    openPanel(tickets, 'Tickets del día ' + fmtFecha(fecha), 'Todos los servicios con estado Belltech · ' + fecha, [{ label: 'Total', value: tickets.length, accent: true }]);
    return;
  }
  const ds = els[0].datasetIndex;
  const estado = ds === 0 ? 'Cumple' : ds === 1 ? 'Incumple' : 'Reprogramación';
  const label  = ds === 0 ? 'Belltech Cumple' : ds === 1 ? 'Belltech Incumple' : 'Reprogramación';
  const tickets = tix.filter(t => t.fecha_coord === fecha && t.belltech_estado === estado);
  openPanel(tickets, label + ' · ' + fmtFecha(fecha), fecha + ' · CAUSAL #02 = ' + estado, [{ label: 'Tickets', value: tickets.length, accent: true }, { label: 'Fecha', value: fecha }]);
}

function renderTimeline(mode) {
  window._currentTimelineMode = mode;
  const tl      = window._filteredTimeline || DATA.timeline;
  const allTix  = window._filteredTickets  || DATA.tickets;
  const labels  = tl.map(d => d.fecha);
  const cumple  = tl.map(d => d.cumple);
  const incumple = tl.map(d => d.incumple);
  const reprog  = tl.map(d => d.reprogramacion);
  let datasets, stacked = false;

  if (mode === 'pct') {
    const pct = tl.map(d => {
      const total = d.cumple + d.incumple + d.reprogramacion;
      return total ? +(d.cumple * 100 / total).toFixed(1) : null;
    });
    datasets = [{
      label: '% Cumplimiento', data: pct, borderColor: COLORS.green,
      backgroundColor: ctx => { const c = ctx.chart; if (!c.chartArea) return COLORS.green + '20'; return makeGradient(c.ctx, c.chartArea, COLORS.green); },
      fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 6, borderWidth: 2.5,
    }];
  } else {
    stacked = mode === 'stack';
    datasets = [
      { label: 'Cumple',        data: cumple,   borderColor: COLORS.green, backgroundColor: stacked ? COLORS.green + 'cc' : ctx => { const c = ctx.chart; if (!c.chartArea) return COLORS.green + '30'; return makeGradient(c.ctx, c.chartArea, COLORS.green); }, fill: !stacked, tension: 0.35, pointRadius: 0, pointHoverRadius: 6, borderWidth: 2.5, stack: 'a' },
      { label: 'Incumple',      data: incumple, borderColor: COLORS.red,   backgroundColor: stacked ? COLORS.red   + 'cc' : ctx => { const c = ctx.chart; if (!c.chartArea) return COLORS.red   + '30'; return makeGradient(c.ctx, c.chartArea, COLORS.red);   }, fill: !stacked, tension: 0.35, pointRadius: 0, pointHoverRadius: 6, borderWidth: 2.5, stack: 'a' },
      { label: 'Reprogramación', data: reprog,   borderColor: COLORS.amber, backgroundColor: stacked ? COLORS.amber + 'cc' : ctx => { const c = ctx.chart; if (!c.chartArea) return COLORS.amber + '20'; return makeGradient(c.ctx, c.chartArea, COLORS.amber); }, fill: !stacked, tension: 0.35, pointRadius: 0, pointHoverRadius: 6, borderWidth: 2,   stack: 'a' },
    ];
  }

  if (timelineChart) timelineChart.destroy();
  timelineChart = new Chart(document.getElementById('chart-timeline'), {
    type: stacked ? 'bar' : 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      onClick: (e, els) => timelineClick(e, els, mode, allTix),
      plugins: {
        legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, padding: 14, color: '#334155', font: { size: 11 } } },
        tooltip: { ...TOOLTIP_BASE, titleColor: '#334155', bodyColor: '#475569', callbacks: { title: items => fmtFecha(items[0].label) + ' · clic para ver tickets' } },
      },
      scales: {
        x: { stacked, grid: { display: false }, ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: 12, font: { family: "'JetBrains Mono', monospace", size: 10 } } },
        y: { stacked, beginAtZero: true, grid: { color: 'rgba(31, 41, 55, 0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace", size: 10 } }, max: mode === 'pct' ? 100 : undefined },
      },
    },
  });
}

renderTimeline('absolute');
document.querySelectorAll('#tabs-timeline .tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('#tabs-timeline .tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    renderTimeline(t.dataset.mode);
  });
});

// =========== CIUDADES ===========
new Chart(document.getElementById('chart-ciudades'), {
  type: 'bar',
  data: {
    labels: DATA.ciudades.map(d => d.ciudad),
    datasets: [
      { label: 'Total tickets',      data: DATA.ciudades.map(d => d.total),    backgroundColor: COLORS.cyan + 'aa', borderRadius: 6, borderSkipped: false, barPercentage: 0.7 },
      { label: 'Incumple Belltech',  data: DATA.ciudades.map(d => d.incumple), backgroundColor: COLORS.red  + 'cc', borderRadius: 6, borderSkipped: false, barPercentage: 0.7 },
    ],
  },
  options: {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    onClick: (e, els) => {
      if (!els.length) return;
      const ciudad = DATA.ciudades[els[0].index].ciudad;
      if (els[0].datasetIndex === 0) {
        const list = DATA.tickets.filter(t => t.ciudad === ciudad);
        openPanel(list, 'Ciudad · ' + ciudad, 'Todos los tickets de ' + ciudad, [{ label: 'Total', value: list.length, accent: true }, { label: 'Ciudad', value: ciudad }]);
      } else {
        const list = DATA.tickets.filter(t => t.ciudad === ciudad && t.belltech_estado === 'Incumple');
        openPanel(list, ciudad + ' · Incumple Belltech', 'Tickets incumple en ' + ciudad, [{ label: 'Total', value: list.length, accent: true }, { label: 'Ciudad', value: ciudad }]);
      }
    },
    plugins: {
      legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, padding: 12, color: '#334155', font: { size: 11 } } },
      tooltip: { ...TOOLTIP_BASE, callbacks: { footer: () => 'Clic para ver tickets' } },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(31,41,55,0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace", size: 10 } } },
      y: { grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
    },
  },
});


// =========== TIPO SERVICIO ===========
new Chart(document.getElementById('chart-tiposervicio'), {
  type: 'bar',
  data: {
    labels: DATA.tipos_servicio.map(d => d.tipo),
    datasets: [
      { label: 'Cumple',   data: DATA.tipos_servicio.map(d => d.total - d.incumple), backgroundColor: COLORS.green + 'cc', borderRadius: 6, borderSkipped: false, stack: 's' },
      { label: 'Incumple', data: DATA.tipos_servicio.map(d => d.incumple),           backgroundColor: COLORS.red   + 'cc', borderRadius: 6, borderSkipped: false, stack: 's' },
    ],
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    onClick: (e, els) => {
      if (!els.length) return;
      const tipo = DATA.tipos_servicio[els[0].index].tipo;
      if (els[0].datasetIndex === 1) {
        const list = DATA.tickets.filter(t => t.tipo_servicio === tipo && t.belltech_estado === 'Incumple');
        openPanel(list, tipo + ' · Incumple Belltech', 'Tickets de tipo ' + tipo + ' con incumplimiento', [{ label: 'Total', value: list.length, accent: true }, { label: 'Tipo', value: tipo }]);
      } else {
        const list = DATA.tickets.filter(t => t.tipo_servicio === tipo && t.belltech_estado !== 'Incumple');
        openPanel(list, tipo + ' · Cumple/Reprog', 'Tickets de tipo ' + tipo + ' sin incumplimiento', [{ label: 'Total', value: list.length, accent: true }, { label: 'Tipo', value: tipo }]);
      }
    },
    plugins: {
      legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, padding: 12, color: '#334155', font: { size: 11 } } },
      tooltip: { ...TOOLTIP_BASE, callbacks: { footer: () => 'Clic para ver tickets' } },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
      y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(31,41,55,0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace", size: 10 } } },
    },
  },
});

// =========== TOP SUCURSALES CON MÁS INCUMPLIMIENTOS (NUEVO) ===========
new Chart(document.getElementById('chart-sucursales'), {
  type: 'bar',
  data: {
    labels: sucursalesData.map(d => d.sucursal),
    datasets: [{
      label: 'Incumplimientos',
      data: sucursalesData.map(d => d.incumple),
      backgroundColor: ctx => {
        const v = ctx.parsed.x ?? 0;
        const max = Math.max(...sucursalesData.map(d => d.incumple));
        return 'rgba(248, 113, 113, ' + (0.35 + (v / max) * 0.55) + ')';
      },
      borderRadius: 6, borderSkipped: false, barPercentage: 0.75,
    }],
  },
  options: {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    onClick: (e, els) => {
      if (!els.length) return;
      const sucursal = sucursalesData[els[0].index].sucursal;
      const list = DATA.tickets.filter(t => t.sucursal === sucursal && t.belltech_estado === 'Incumple');
      openPanel(list, sucursal + ' · Incumple Belltech', 'SUCURSAL = ' + sucursal + ' · incumplimiento Belltech', [{ label: 'Total', value: list.length, accent: true }, { label: 'Sucursal', value: sucursal }]);
    },
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP_BASE, callbacks: { footer: () => 'Clic para ver tickets' } },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(31,41,55,0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace", size: 10 } } },
      y: { grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
    },
  },
});

// =========== TIPIFICACIONES QUE INCUMPLEN BELLTECH ===========
new Chart(document.getElementById('chart-tipif-incumple'), {
  type: 'bar',
  data: {
    labels: DATA.tipif_incumple.map(d => d.tipif),
    datasets: [{
      label: 'Incumplimientos',
      data: DATA.tipif_incumple.map(d => d.count),
      backgroundColor: ctx => {
        const v = ctx.parsed.x ?? 0;
        const max = Math.max(...DATA.tipif_incumple.map(d => d.count));
        return 'rgba(248, 113, 113, ' + (0.4 + (v / max) * 0.5) + ')';
      },
      borderRadius: 6, borderSkipped: false, barPercentage: 0.75,
    }],
  },
  options: {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    onClick: (e, els) => {
      if (!els.length) return;
      const tipif = DATA.tipif_incumple[els[0].index].tipif;
      const list  = DATA.tickets.filter(t => t.tipificacion === tipif && t.belltech_estado === 'Incumple');
      openPanel(list, tipif + ' · Incumple Belltech', 'TIPIFICACIÓN = ' + tipif + ' con incumplimiento Belltech', [{ label: 'Total', value: list.length, accent: true }, { label: 'Tipificación', value: tipif }]);
    },
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP_BASE, callbacks: { footer: () => 'Clic para ver tickets' } },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(31,41,55,0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace", size: 10 } } },
      y: { grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
    },
  },
});

// =========== TÍTULOS QUE MÁS GENERAN INCUMPLIMIENTO (NUEVO) ===========
new Chart(document.getElementById('chart-titulo-incumple'), {
  type: 'bar',
  data: {
    labels: tituloIncumpleData.map(d => d.titulo),
    datasets: [{
      label: 'Incumplimientos',
      data: tituloIncumpleData.map(d => d.count),
      backgroundColor: ctx => {
        const v = ctx.parsed.x ?? 0;
        const max = Math.max(...tituloIncumpleData.map(d => d.count));
        return 'rgba(167, 139, 250, ' + (0.35 + (v / max) * 0.55) + ')';
      },
      borderRadius: 6, borderSkipped: false, barPercentage: 0.75,
    }],
  },
  options: {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    onClick: (e, els) => {
      if (!els.length) return;
      const titulo = tituloIncumpleData[els[0].index].titulo;
      const list   = DATA.tickets.filter(t => t.titulo === titulo && t.belltech_estado === 'Incumple');
      openPanel(list, titulo + ' · Incumple Belltech', 'TÍTULO = ' + titulo + ' con incumplimiento Belltech', [{ label: 'Total', value: list.length, accent: true }, { label: 'Título', value: titulo }]);
    },
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP_BASE, callbacks: { footer: () => 'Clic para ver tickets' } },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(31,41,55,0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace", size: 10 } } },
      y: { grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
    },
  },
});


// =========== TOP ATMs MÁS PROBLEMÁTICOS ===========
// Usa datos reales si DATA.tickets tiene campo 'serie', si no usa placeholder
const hasSerieData = DATA.tickets.some(t => t.serie);

if (hasSerieData) {
  // Quitar badge PLACEHOLDER de las tarjetas de ATMs
  document.querySelectorAll('[data-placeholder="serie"]').forEach(el => {
    el.textContent = 'CLICK BARRA';
    el.style.cssText = '';
  });
}

const atmTopData = hasSerieData ? (() => {
  const map = {};
  DATA.tickets.forEach(t => {
    if (!t.serie) return;
    if (!map[t.serie]) map[t.serie] = { serie: t.serie, total: 0, incumple: 0 };
    map[t.serie].total++;
    if (t.belltech_estado === 'Incumple') map[t.serie].incumple++;
  });
  return Object.values(map).sort((a, b) => b.incumple - a.incumple).slice(0, 10);
})() : [
  // PLACEHOLDER: se reemplaza automáticamente al subir Excel con columna SERIE
  { serie: '1042', total: 12, incumple: 8 },
  { serie: '3891', total: 10, incumple: 7 },
  { serie: '5234', total: 9,  incumple: 6 },
  { serie: '7103', total: 8,  incumple: 5 },
  { serie: '2456', total: 8,  incumple: 4 },
  { serie: '8811', total: 7,  incumple: 4 },
  { serie: '4029', total: 6,  incumple: 3 },
  { serie: '6350', total: 6,  incumple: 3 },
  { serie: '9017', total: 5,  incumple: 2 },
  { serie: '1763', total: 4,  incumple: 2 },
];

new Chart(document.getElementById('chart-atms-top'), {
  type: 'bar',
  data: {
    labels: atmTopData.map(d => '#' + d.serie),
    datasets: [
      {
        label: 'Cumple / Reprog',
        data: atmTopData.map(d => d.total - d.incumple),
        backgroundColor: COLORS.green + 'aa',
        borderRadius: 0, borderSkipped: false, stack: 'atm', barPercentage: 0.65,
      },
      {
        label: 'Incumple Belltech',
        data: atmTopData.map(d => d.incumple),
        backgroundColor: COLORS.red + 'cc',
        borderRadius: [0, 6, 6, 0], borderSkipped: false, stack: 'atm', barPercentage: 0.65,
      },
    ],
  },
  options: {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    onClick: (e, els) => {
      if (!els.length) return;
      const d   = atmTopData[els[0].index];
      const pct = ((d.incumple / d.total) * 100).toFixed(1);
      const isIncumple = els[0].datasetIndex === 1;
      const list = DATA.tickets.filter(t =>
        t.serie === d.serie && (isIncumple ? t.belltech_estado === 'Incumple' : t.belltech_estado !== 'Incumple')
      );
      openPanel(list, 'ATM #' + d.serie + (isIncumple ? ' · Incumple' : ' · Cumple/Reprog'),
        'SERIE = ' + d.serie,
        [{ label: 'Tickets', value: list.length, accent: true }, { label: '% Incumple', value: pct + '%' }]);
    },
    plugins: {
      legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, padding: 12, color: '#334155', font: { size: 11 } } },
      tooltip: { ...TOOLTIP_BASE, callbacks: {
        title: items => 'ATM #' + atmTopData[items[0].dataIndex].serie,
        footer: items => {
          const d = atmTopData[items[0].dataIndex];
          return '  ' + ((d.incumple / d.total) * 100).toFixed(1) + '% incumplimiento · Clic para ver tickets';
        },
      }},
    },
    scales: {
      x: { stacked: true, beginAtZero: true, grid: { color: 'rgba(31,41,55,0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace", size: 10 }, stepSize: 1 } },
      y: { stacked: true, grid: { display: false }, ticks: { color: '#334155', font: { family: "'JetBrains Mono', monospace", size: 12, weight: '600' } } },
    },
  },
});

// =========== TÉCNICO CON MÁS INCUMPLIMIENTOS ===========
const tecnicoIncumpleData = (() => {
  const map = {};  // nombre_limpio → { count, raws: Set de valores originales }
  DATA.tickets.forEach(t => {
    if (!t.asignado || t.belltech_estado !== 'Incumple') return;
    const raw = t.asignado;
    if (raw.includes('@gmail.com')) return;
    const nombre = raw.includes('<')
      ? raw.slice(0, raw.indexOf('<')).trim()
      : raw.trim();
    if (!nombre) return;
    if (!map[nombre]) map[nombre] = { count: 0, raws: new Set() };
    map[nombre].count++;
    map[nombre].raws.add(raw);
  });
  return Object.entries(map)
    .map(([tecnico, d]) => ({ tecnico, count: d.count, raws: [...d.raws] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
})();

new Chart(document.getElementById('chart-tecnico-incumple'), {
  type: 'bar',
  data: {
    labels: tecnicoIncumpleData.map(d => d.tecnico),
    datasets: [{
      label: 'Incumplimientos',
      data: tecnicoIncumpleData.map(d => d.count),
      backgroundColor: ctx => {
        const v = ctx.parsed.x ?? 0;
        const max = Math.max(...tecnicoIncumpleData.map(d => d.count));
        return 'rgba(220, 38, 38, ' + (0.35 + (v / max) * 0.55) + ')';
      },
      borderRadius: 6, borderSkipped: false, barPercentage: 0.72,
    }],
  },
  options: {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    onClick: (e, els) => {
      if (!els.length) return;
      const d    = tecnicoIncumpleData[els[0].index];
      const list = DATA.tickets.filter(t => d.raws.includes(t.asignado) && t.belltech_estado === 'Incumple');
      openPanel(list, d.tecnico + ' · Incumplimientos',
        'TÉCNICO = ' + d.tecnico + ' · BELLTECH INCUMPLE',
        [{ label: 'Incumplimientos', value: d.count, accent: true }]);
    },
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP_BASE, callbacks: {
        title:  items => tecnicoIncumpleData[items[0].dataIndex].tecnico,
        label:  c => '  ' + c.parsed.x + ' incumplimientos',
        footer: () => 'Clic para ver tickets',
      }},
    },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(31,41,55,0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono', monospace", size: 10 }, stepSize: 1 } },
      y: { grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } },
    },
  },
});


// =========== CAJEROS REINCIDENTES (HOJA 3) ===========
function reincColor(total) {
  if (total <= 1) return 'rgba(22,163,74,0.80)';    // verde  ≤ 1
  if (total <= 4) return 'rgba(217,119,6,0.85)';    // ámbar  2–4
  return            'rgba(220,38,38,0.85)';          // rojo   > 4
}

function renderReincidentesChart(canvasId, boxId, data, showCliente) {
  if (!data || !data.length) return;

  const PAGE_SIZE  = 15;
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  let   currentPage = 0;
  let   chartInst   = null;

  const box = document.getElementById(boxId);
  if (!box) return;
  box.style.height = (PAGE_SIZE * 32 + 10) + 'px';

  // Paginación
  const BTN = 'padding:4px 11px;border-radius:6px;border:1px solid var(--line-2);background:var(--bg-2);color:var(--text-dim);font-size:12px;font-weight:600;cursor:pointer';
  const pag = document.createElement('div');
  pag.id = boxId + '-pag';
  pag.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 4px 4px;flex-wrap:wrap';
  pag.innerHTML = `
    <button id="${boxId}-prev" style="${BTN}" disabled>◀</button>
    <span style="font-size:11px;color:var(--text-mute);font-family:'JetBrains Mono',monospace">Página</span>
    <input id="${boxId}-input" type="number" min="1" max="${totalPages}" value="1"
      style="width:52px;padding:3px 6px;border-radius:6px;border:1px solid var(--line-2);background:var(--bg-2);color:var(--text);font-size:12px;font-weight:600;font-family:'JetBrains Mono',monospace;text-align:center">
    <span id="${boxId}-total" style="font-size:11px;color:var(--text-mute);font-family:'JetBrains Mono',monospace">/ ${totalPages}</span>
    <button id="${boxId}-next" style="${BTN}">▶</button>
    <span id="${boxId}-count" style="margin-left:auto;font-size:10px;font-weight:600;color:var(--text-mute);font-family:'JetBrains Mono',monospace"></span>`;
  box.insertAdjacentElement('afterend', pag);

  function goTo(page) {
    currentPage = Math.max(0, Math.min(page, totalPages - 1));
    renderPage(currentPage);
  }

  function renderPage(page) {
    const slice = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    if (chartInst) { chartInst.destroy(); chartInst = null; }

    chartInst = new Chart(document.getElementById(canvasId), {
      type: 'bar',
      data: {
        labels: slice.map(d => '#' + d.serie),
        datasets: [{
          label: 'Tickets en el período',
          data:  slice.map(d => d.total),
          backgroundColor: ctx => reincColor(slice[ctx.dataIndex]?.total ?? 0),
          borderRadius: 6, borderSkipped: false, barPercentage: 0.75,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        events: ['mousemove', 'mouseout'],
        plugins: {
          legend: { display: false },
          tooltip: { ...TOOLTIP_BASE,
            callbacks: {
              title:  items => 'Serie #' + slice[items[0].dataIndex].serie,
              label:  c => '  ' + c.parsed.x + ' tickets en el período',
              footer: items => {
                const d = slice[items[0].dataIndex];
                const lines = [];
                if (showCliente && d.cliente) lines.push('Cliente: ' + d.cliente);
                if (d.ciudad) lines.push('Ciudad: ' + d.ciudad);
                if (d.sitio)  lines.push('Sitio: '  + d.sitio);
                return lines;
              },
            },
          },
        },
        scales: {
          x: { beginAtZero: true, grid: { color: 'rgba(31,41,55,0.5)' }, ticks: { color: '#64748b', font: { family: "'JetBrains Mono',monospace", size: 10 }, stepSize: 1 } },
          y: { grid: { display: false }, ticks: { color: '#334155', font: { family: "'JetBrains Mono',monospace", size: 12, weight: '600' } } },
        },
      },
    });

    // Controles
    const inp   = document.getElementById(boxId + '-input');
    const prev  = document.getElementById(boxId + '-prev');
    const next  = document.getElementById(boxId + '-next');
    const count = document.getElementById(boxId + '-count');
    if (inp)   inp.value = page + 1;
    if (prev)  { prev.disabled = page === 0;               prev.style.opacity = page === 0 ? '0.4' : '1'; }
    if (next)  { next.disabled = page === totalPages - 1;  next.style.opacity = page === totalPages - 1 ? '0.4' : '1'; }
    if (count) {
      const from = page * PAGE_SIZE + 1;
      const to   = Math.min((page + 1) * PAGE_SIZE, data.length);
      count.textContent = `${from}–${to} de ${data.length}`;
    }
  }

  renderPage(0);

  document.getElementById(boxId + '-prev')?.addEventListener('click', () => goTo(currentPage - 1));
  document.getElementById(boxId + '-next')?.addEventListener('click', () => goTo(currentPage + 1));

  document.getElementById(boxId + '-input')?.addEventListener('change', e => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) goTo(val - 1);
  });
  document.getElementById(boxId + '-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const val = parseInt(e.target.value, 10); if (!isNaN(val)) goTo(val - 1); }
  });
}

// Renderizar global
renderReincidentesChart(
  'chart-reincidentes-global',
  'reincidentes-box-global',
  DATA.reincidentes || [],
  true   // mostrar cliente en hover
);
// Mostrar sección si hay datos
if ((DATA.reincidentes || []).length) {
  document.getElementById('reincidentes-title-global').style.display = '';
  document.getElementById('reincidentes-grid-global').style.display  = '';
}

// =========== INSIGHT ===========
{
  const peakBelltech = DATA.belltech_incumple_dias[0];
  const peakOficina  = DATA.oficina_incumple_dias[0];
  const worstCity    = [...DATA.ciudades].sort((a, b) => b.incumple - a.incumple)[0];
  const topTipif     = DATA.tipif_incumple[0];
  const topTitulo    = tituloIncumpleData[0];

  document.getElementById('insight-text').innerHTML =
    'Belltech registra <strong>' + k.belltech_pct_cumple.toFixed(1) + '% de cumplimiento</strong> contra ' + k.belltech_incumple + ' incumplimientos. ' +
    'El peor día fue <em>' + fmtFecha(peakBelltech.fecha) + '</em> con ' + peakBelltech.count + ' incumplimientos. ' +
    'La tipificación más asociada a fallos es <em>' + topTipif.tipif + '</em> (' + topTipif.count + ' casos), ' +
    'y el título más frecuente en incumplimientos es <em>' + (topTitulo ? topTitulo.titulo : '—') + '</em>' + (topTitulo ? ' (' + topTitulo.count + ' casos)' : '') + '. ' +
    'La ciudad con más incumplimientos Belltech es <em>' + worstCity.ciudad + '</em> (' + worstCity.incumple + ' de ' + worstCity.total + '). ' +
    'Oficina mantiene un sólido <strong>' + k.oficina_pct_cumple.toFixed(1) + '%</strong> de cumplimiento; su peor día fue ' + fmtFecha(peakOficina.fecha) + '.';
}
