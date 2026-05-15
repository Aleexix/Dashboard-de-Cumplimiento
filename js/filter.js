// =========== FILTRO POR MES ===========

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

let F_MONTH = null; // "2026-04" o null

function getFilteredTickets() {
  if (!F_MONTH) return DATA.tickets;
  return DATA.tickets.filter(t => t.fecha_coord?.slice(0, 7) === F_MONTH);
}

// ── Inicializar pills ─────────────────────────────────────────────────────────
function initFilters() {
  // Solo meses con al menos 3 días distintos de datos
  const monthDays = {};
  DATA.tickets.forEach(t => {
    const m = t.fecha_coord?.slice(0, 7);
    if (!m) return;
    if (!monthDays[m]) monthDays[m] = new Set();
    monthDays[m].add(t.fecha_coord);
  });
  const months = Object.keys(monthDays).filter(m => monthDays[m].size >= 3).sort();

  const bar = document.getElementById('filter-months');
  bar.innerHTML = months.map(m => {
    const [y, mo] = m.split('-');
    return `<button class="filter-pill" data-month="${m}">${MONTH_NAMES[+mo - 1]} ${y}</button>`;
  }).join('');

  bar.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.month;
      if (F_MONTH === m) {
        F_MONTH = null;
        btn.classList.remove('active');
      } else {
        bar.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        F_MONTH = m;
        btn.classList.add('active');
      }
      document.getElementById('filter-clear').style.display = F_MONTH ? '' : 'none';
      applyFilters();
    });
  });

  document.getElementById('filter-clear').addEventListener('click', () => {
    F_MONTH = null;
    bar.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
    document.getElementById('filter-clear').style.display = 'none';
    applyFilters();
  });
}

// ── Aplicar filtro ────────────────────────────────────────────────────────────
function applyFilters() {
  const tix = getFilteredTickets();
  const n   = tix.length;
  const bc  = tix.filter(t => t.belltech_estado === 'Cumple').length;
  const bi  = tix.filter(t => t.belltech_estado === 'Incumple').length;
  const br  = tix.filter(t => t.belltech_estado === 'Reprogramación').length;
  const oc  = tix.filter(t => t.causal1 === 'OFICINA CUMPLE SERVICIO').length;
  const oi  = tix.filter(t => t.causal1 === 'OFICINA INCUMPLE SERVICIO').length;
  const ot  = oc + oi;

  // KPIs
  document.getElementById('kpi-belltech-pct').textContent = n ? (bc*100/n).toFixed(1)+'%' : '—';
  document.getElementById('kpi-belltech-num').textContent = fmt(bc);
  document.getElementById('kpi-oficina-pct').textContent  = ot ? (oc*100/ot).toFixed(1)+'%' : '—';
  document.getElementById('kpi-oficina-num').textContent       = fmt(oc);
  document.getElementById('kpi-oficina-incumple').textContent  = fmt(oi);
  document.getElementById('kpi-oficina-incumple-pct').textContent = ot ? (oi*100/ot).toFixed(1)+'%' : '—';
  document.getElementById('kpi-incumple').textContent = fmt(bi);
  document.getElementById('kpi-reprog').textContent   = fmt(br);
  document.getElementById('kpi-total').textContent    = fmt(n);

  // Timeline
  const tlMap = {};
  tix.forEach(t => {
    const f = t.fecha_coord; if (!f) return;
    if (!tlMap[f]) tlMap[f] = { cumple:0, incumple:0, reprogramacion:0 };
    const e = t.belltech_estado;
    if (e === 'Cumple')          tlMap[f].cumple++;
    else if (e === 'Incumple')   tlMap[f].incumple++;
    else if (e === 'Reprogramación') tlMap[f].reprogramacion++;
  });
  window._filteredTimeline = Object.entries(tlMap).sort().map(([fecha,v]) => ({ fecha, ...v }));
  window._filteredTickets  = tix;
  renderTimeline(window._currentTimelineMode || 'absolute');

  // Day lists
  const topD = (kind, top) => {
    const c = {};
    tix.forEach(t => {
      const f = t.fecha_coord; if (!f) return;
      if (kind==='belltech' && t.belltech_estado==='Incumple') c[f]=(c[f]||0)+1;
      if (kind==='oficina'  && t.causal1==='OFICINA INCUMPLE SERVICIO') c[f]=(c[f]||0)+1;
    });
    return Object.entries(c).map(([fecha,count])=>({fecha,count})).sort((a,b)=>b.count-a.count).slice(0,top);
  };
  renderDayList('dias-belltech', topD('belltech', 5), COLORS.red,   'belltech');
  renderDayList('dias-oficina',  topD('oficina',  5), COLORS.amber, 'oficina');

  // Donut Belltech
  const btMap = {};
  tix.forEach(t => { if (t.causal2) btMap[t.causal2]=(btMap[t.causal2]||0)+1; });
  const btArr = Object.entries(btMap).sort((a,b)=>b[1]-a[1]);
  _upd('chart-belltech', btArr.map(([l])=>l), [btArr.map(([,v])=>v)], [btArr.map(([l])=>belltechColor(l))]);

  // Ciudades
  const ciuMap = {};
  tix.forEach(t => {
    if (!t.ciudad) return;
    if (!ciuMap[t.ciudad]) ciuMap[t.ciudad]={total:0,incumple:0};
    ciuMap[t.ciudad].total++;
    if (t.belltech_estado==='Incumple') ciuMap[t.ciudad].incumple++;
  });
  const ciuArr = Object.entries(ciuMap).map(([ciudad,v])=>({ciudad,...v})).sort((a,b)=>b.total-a.total).slice(0,15);
  _upd('chart-ciudades', ciuArr.map(d=>d.ciudad), [ciuArr.map(d=>d.total), ciuArr.map(d=>d.incumple)]);

  // Tipo servicio
  const tsMap = {};
  tix.forEach(t => {
    if (!t.tipo_servicio) return;
    if (!tsMap[t.tipo_servicio]) tsMap[t.tipo_servicio]={total:0,incumple:0};
    tsMap[t.tipo_servicio].total++;
    if (t.belltech_estado==='Incumple') tsMap[t.tipo_servicio].incumple++;
  });
  const tsArr = Object.entries(tsMap).map(([tipo,v])=>({tipo,...v})).sort((a,b)=>b.total-a.total);
  _upd('chart-tiposervicio', tsArr.map(d=>d.tipo), [tsArr.map(d=>d.total-d.incumple), tsArr.map(d=>d.incumple)]);

  // Tipif incumple
  const tipMap = {};
  tix.forEach(t => { if (t.belltech_estado==='Incumple'&&t.tipificacion) tipMap[t.tipificacion]=(tipMap[t.tipificacion]||0)+1; });
  const tipArr = Object.entries(tipMap).sort((a,b)=>b[1]-a[1]).slice(0,10);
  _upd('chart-tipif-incumple', tipArr.map(([l])=>l), [tipArr.map(([,v])=>v)]);

  // Títulos incumple
  const titMap = {};
  tix.filter(t=>t.belltech_estado==='Incumple'&&t.titulo).forEach(t=>titMap[t.titulo]=(titMap[t.titulo]||0)+1);
  const titArr = Object.entries(titMap).sort((a,b)=>b[1]-a[1]).slice(0,10);
  _upd('chart-titulo-incumple', titArr.map(([l])=>l), [titArr.map(([,v])=>v)]);

  // Sucursales
  const sucMap = {};
  tix.forEach(t => {
    if (!t.sucursal) return;
    if (!sucMap[t.sucursal]) sucMap[t.sucursal]={incumple:0};
    if (t.belltech_estado==='Incumple') sucMap[t.sucursal].incumple++;
  });
  const sucArr = Object.entries(sucMap).map(([sucursal,v])=>({sucursal,...v})).sort((a,b)=>b.incumple-a.incumple).slice(0,10);
  _upd('chart-sucursales', sucArr.map(d=>d.sucursal), [sucArr.map(d=>d.incumple)]);

  // Técnico
  const tecMap = {};
  tix.forEach(t => {
    if (!t.asignado||t.belltech_estado!=='Incumple'||t.asignado.includes('@gmail.com')) return;
    const nombre = t.asignado.includes('<') ? t.asignado.slice(0,t.asignado.indexOf('<')).trim() : t.asignado.trim();
    if (nombre) tecMap[nombre]=(tecMap[nombre]||0)+1;
  });
  const tecArr = Object.entries(tecMap).sort((a,b)=>b[1]-a[1]).slice(0,10);
  _upd('chart-tecnico-incumple', tecArr.map(([l])=>l), [tecArr.map(([,v])=>v)]);

  // Responsable atención
  const respMap = {};
  tix.forEach(t => { if (t.responsable_atencion) respMap[t.responsable_atencion]=(respMap[t.responsable_atencion]||0)+1; });
  renderResponsableList('responsable-atencion-list',
    Object.entries(respMap).sort((a,b)=>b[1]-a[1]).map(([label,count])=>({label,count})));

  // Sección de banco activa (excluir VS — tiene sus propios datos inmunes al filtro)
  const activeSection = document.querySelector('.bank-section.active:not(#section-global):not(#section-vs)');
  if (activeSection) {
    const bankKey = activeSection.id.replace('section-', '');
    applyBankFilter(bankKey);
  }

  // ATMs top
  const atmMap = {};
  tix.forEach(t => {
    if (!t.serie) return;
    if (!atmMap[t.serie]) atmMap[t.serie]={serie:t.serie,total:0,incumple:0};
    atmMap[t.serie].total++;
    if (t.belltech_estado==='Incumple') atmMap[t.serie].incumple++;
  });
  const atmArr = Object.values(atmMap).sort((a,b)=>b.incumple-a.incumple).slice(0,10);
  _upd('chart-atms-top', atmArr.map(d=>'#'+d.serie), [atmArr.map(d=>d.total-d.incumple), atmArr.map(d=>d.incumple)]);
}

function _upd(id, labels, datasets, colors) {
  const ch = Chart.getChart(document.getElementById(id));
  if (!ch) return;
  ch.data.labels = labels;
  datasets.forEach((d, i) => { if (ch.data.datasets[i]) ch.data.datasets[i].data = d; });
  if (colors) colors.forEach((c, i) => { if (ch.data.datasets[i]) ch.data.datasets[i].backgroundColor = c; });
  ch.update();
}

// ── Filtrar sección de banco activa ───────────────────────────────────────────
function applyBankFilter(bankKey) {
  const p   = bankKey;
  const tix = getFilteredTickets().filter(t => t.banco === bankKey);
  const n   = tix.length;
  const bc  = tix.filter(t => t.belltech_estado === 'Cumple').length;
  const bi  = tix.filter(t => t.belltech_estado === 'Incumple').length;
  const br  = tix.filter(t => t.belltech_estado === 'Reprogramación').length;
  const oc  = tix.filter(t => t.causal1 === 'OFICINA CUMPLE SERVICIO').length;
  const oi  = tix.filter(t => t.causal1 === 'OFICINA INCUMPLE SERVICIO').length;
  const ot  = oc + oi;

  // KPIs del banco
  const setKpi = (id, val, sub) => {
    const el = document.getElementById(id);
    if (!el) return;
    const v = el.querySelector('.value'); if (v) v.textContent = val;
    const s = el.querySelector('.sub');   if (s && sub !== undefined) s.textContent = sub;
  };
  setKpi(`${p}-kpi-c1`, n ? (bc*100/n).toFixed(1)+'%' : '—', `cumple cita · ${fmt(bc)}`);
  setKpi(`${p}-kpi-c2`, ot ? (oc*100/ot).toFixed(1)+'%' : '—');
  setKpi(`${p}-kpi-incumple`, fmt(bi));
  setKpi(`${p}-kpi-reprog`,   fmt(br));
  setKpi(`${p}-kpi-total`,    fmt(n));

  // Timeline del banco
  const tlMap = {};
  tix.forEach(t => {
    const f = t.fecha_coord; if (!f) return;
    if (!tlMap[f]) tlMap[f] = {cumple:0,incumple:0,reprogramacion:0};
    const e = t.belltech_estado;
    if (e==='Cumple') tlMap[f].cumple++;
    else if (e==='Incumple') tlMap[f].incumple++;
    else if (e==='Reprogramación') tlMap[f].reprogramacion++;
  });
  const tlArr = Object.entries(tlMap).sort().map(([fecha,v])=>({fecha,...v}));
  const fn = window._bankRenderFns?.[bankKey];
  if (fn) fn('absolute', tlArr, tix);

  // Charts del banco
  const ciuMap = {};
  tix.forEach(t => {
    if (!t.ciudad) return;
    if (!ciuMap[t.ciudad]) ciuMap[t.ciudad]={total:0,incumple:0};
    ciuMap[t.ciudad].total++;
    if (t.belltech_estado==='Incumple') ciuMap[t.ciudad].incumple++;
  });
  const ciuArr = Object.entries(ciuMap).map(([ciudad,v])=>({ciudad,...v})).sort((a,b)=>b.total-a.total).slice(0,15);
  _upd(`${p}-chart-ciudades`, ciuArr.map(d=>d.ciudad),
    [ciuArr.map(d=>d.total), ciuArr.map(d=>d.incumple)]);

  const tsMap = {};
  tix.forEach(t => {
    if (!t.tipo_servicio) return;
    if (!tsMap[t.tipo_servicio]) tsMap[t.tipo_servicio]={total:0,incumple:0};
    tsMap[t.tipo_servicio].total++;
    if (t.belltech_estado==='Incumple') tsMap[t.tipo_servicio].incumple++;
  });
  const tsArr = Object.entries(tsMap).map(([tipo,v])=>({tipo,...v})).sort((a,b)=>b.total-a.total);
  _upd(`${p}-chart-tiposerv`, tsArr.map(d=>d.tipo),
    [tsArr.map(d=>d.total-d.incumple), tsArr.map(d=>d.incumple)]);

  const tipMap = {};
  tix.forEach(t => { if (t.belltech_estado==='Incumple'&&t.tipificacion) tipMap[t.tipificacion]=(tipMap[t.tipificacion]||0)+1; });
  const tipArr = Object.entries(tipMap).sort((a,b)=>b[1]-a[1]).slice(0,10);
  _upd(`${p}-chart-tipif`, tipArr.map(([l])=>l), [tipArr.map(([,v])=>v)]);

  const btMap = {};
  tix.forEach(t => { if (t.causal2) btMap[t.causal2]=(btMap[t.causal2]||0)+1; });
  const btArr = Object.entries(btMap).sort((a,b)=>b[1]-a[1]);
  _upd(`${p}-chart-belltech`, btArr.map(([l])=>l),
    [btArr.map(([,v])=>v)], [btArr.map(([l])=>belltechColor(l))]);

  // Responsable en Atención del banco
  const respMap = {};
  tix.forEach(t => { if (t.responsable_atencion) respMap[t.responsable_atencion]=(respMap[t.responsable_atencion]||0)+1; });
  const respArr = Object.entries(respMap).sort((a,b)=>b[1]-a[1]).map(([label,count])=>({label,count}));
  renderResponsableList(`${p}-responsable-list`, respArr, tix);
}

// Hook para cuando se crea un banco en modo lazy
window._onBankCreated = (bankKey) => {
  if (F_MONTH) applyBankFilter(bankKey);
};

initFilters();
