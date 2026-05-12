// =========== PANEL DOM REFS ===========
const overlay    = document.getElementById('overlay');
const panel      = document.getElementById('panel');
const panelBody  = document.getElementById('panel-body');
const panelTitle = document.getElementById('panel-title');
const panelSub   = document.getElementById('panel-sub');
const panelMeta  = document.getElementById('panel-meta');
const searchInput = document.getElementById('panel-search');

let currentFiltered = [];
let currentTitle    = '';
let currentSub      = '';

// =========== TICKET HELPERS ===========
function statusOfTicket(t) {
  if (t.belltech_estado === 'Cumple')         return ['cumple',   'BELLTECH CUMPLE'];
  if (t.belltech_estado === 'Incumple')       return ['incumple', 'BELLTECH INCUMPLE'];
  if (t.belltech_estado === 'Reprogramación') return ['reprog',   'REPROGRAMACIÓN'];
  if (t.causal1 === 'OFICINA INCUMPLE SERVICIO') return ['incumple', 'OFICINA INCUMPLE'];
  if (t.causal1 === 'OFICINA CUMPLE SERVICIO')   return ['cumple',   'OFICINA CUMPLE'];
  return ['neutro', t.causal2 || t.causal1 || '—'];
}

function renderTickets(list) {
  if (!list.length) {
    panelBody.innerHTML = '<div class="empty-state"><div class="icon">∅</div>No se encontraron tickets para este filtro.</div>';
    return;
  }

  const ciudades = new Set(list.map(t => t.ciudad).filter(Boolean));
  const tipos    = new Set(list.map(t => t.tipo_servicio).filter(Boolean));
  const cumple   = list.filter(t => t.belltech_estado === 'Cumple').length;
  const incumple = list.filter(t => t.belltech_estado === 'Incumple').length;

  const miniStats = `
    <div class="mini-stats">
      <div class="mini-stat"><div class="ms-val">${fmt(list.length)}</div><div class="ms-lbl">tickets</div></div>
      <div class="mini-stat"><div class="ms-val" style="color:var(--green)">${fmt(cumple)}</div><div class="ms-lbl">cumple</div></div>
      <div class="mini-stat"><div class="ms-val" style="color:var(--red)">${fmt(incumple)}</div><div class="ms-lbl">incumple</div></div>
      <div class="mini-stat"><div class="ms-val">${ciudades.size}</div><div class="ms-lbl">ciudades</div></div>
      <div class="mini-stat"><div class="ms-val">${tipos.size}</div><div class="ms-lbl">tipos serv.</div></div>
    </div>`;

  const cards = list.map(t => {
    const [statusCls, statusLbl] = statusOfTicket(t);
    // Calcular tiempo de llegada al sitio
    const llegadaH = (t.hora_llegada_sitio && t.coord)
      ? (new Date(t.hora_llegada_sitio) - new Date(t.coord)) / 3600000
      : null;
    const llegadaFmt = (llegadaH !== null && llegadaH >= 0) ? fmtHoras(llegadaH) : null;

    return `
      <div class="ticket-card">
        <div class="tk-head">
          <div><div class="tk-id">#${t.id || '—'}</div></div>
          <div class="tk-status ${statusCls}">${statusLbl}</div>
        </div>
        <div class="tk-title">${t.titulo || '<span style="color:var(--text-mute)">Sin título</span>'}</div>

        ${t.asignado ? `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:8px;background:var(--bg-2);border-radius:7px;border:1px solid var(--line)">
          <span style="font-size:18px">👷</span>
          <div>
            <div style="font-size:9px;font-weight:600;color:var(--text-mute);text-transform:uppercase;letter-spacing:.06em">Técnico asignado</div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${t.asignado}</div>
          </div>
          ${llegadaFmt ? `
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:9px;font-weight:600;color:var(--text-mute);text-transform:uppercase;letter-spacing:.06em">Tiempo llegada</div>
            <div style="font-size:14px;font-weight:700;color:var(--cyan)">${llegadaFmt}</div>
          </div>` : ''}
        </div>` : llegadaFmt ? `
        <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;margin-bottom:8px;background:var(--cyan-glow);border:1px solid rgba(2,132,199,.25);border-radius:6px">
          <span style="font-size:11px;font-weight:600;color:var(--text-mute)">LLEGADA AL SITIO</span>
          <span style="font-size:13px;font-weight:700;color:var(--cyan)">${llegadaFmt}</span>
        </div>` : ''}

        <div class="tk-meta">
          <div><span class="lbl">Sucursal</span><b>${t.sucursal || '—'}</b></div>
          <div><span class="lbl">Ciudad</span><b>${t.ciudad || '—'}</b></div>
          <div><span class="lbl">Tipo serv.</span><b>${t.tipo_servicio || '—'}</b></div>
          <div><span class="lbl">Tipo</span><b>${t.tipo || '—'}</b></div>
          <div><span class="lbl">Tipificación</span><b>${t.tipificacion || '—'}</b></div>
          <div><span class="lbl">Sub-tipif.</span><b>${t.subtipif || '—'}</b></div>
          <div><span class="lbl">Responsable</span><b>${t.responsable || '—'}</b></div>
          <div><span class="lbl">Causal #2</span><b>${t.causal2 || '—'}</b></div>
          <div><span class="lbl">Modelo</span><b>${t.modelo || '—'}</b></div>
          <div><span class="lbl">MAU</span><b>${t.mau || '—'}</b></div>
          <div><span class="lbl">Creado</span><b>${t.creacion || '—'}</b></div>
          <div><span class="lbl">Coordinación</span><b>${t.coord || '—'}</b></div>
        </div>
      </div>`;
  }).join('');

  panelBody.innerHTML = miniStats + cards;
}

// =========== PANEL OPEN / CLOSE ===========
function openPanel(filtered, title, sub, metaPills) {
  currentFiltered = filtered;
  currentTitle    = title;
  currentSub      = sub;
  panelTitle.textContent = title;
  panelSub.textContent   = sub;
  panelMeta.innerHTML = (metaPills || []).map(p =>
    `<span class="meta-pill ${p.accent ? 'accent' : ''}"><strong>${p.label}:</strong> ${p.value}</span>`
  ).join('');
  searchInput.value = '';
  renderTickets(filtered);
  overlay.classList.add('open');
  panel.classList.add('open');
  panelBody.scrollTop = 0;
}

function closePanel() {
  overlay.classList.remove('open');
  panel.classList.remove('open');
}

overlay.addEventListener('click', closePanel);
document.getElementById('panel-close').addEventListener('click', closePanel);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

// =========== SEARCH ===========
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { renderTickets(currentFiltered); return; }
  const filtered = currentFiltered.filter(t =>
    [t.id, t.sucursal, t.ciudad, t.tipificacion, t.subtipif, t.tipo_servicio, t.titulo, t.mau, t.modelo, t.responsable, t.causal1, t.causal2]
      .some(v => v && String(v).toLowerCase().includes(q))
  );
  renderTickets(filtered);
});

// =========== CSV EXPORT ===========
function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

document.getElementById('btn-export').addEventListener('click', () => {
  const cols   = ['id','sucursal','ciudad','mau','modelo','tipo','tipo_servicio','tipificacion','subtipif','responsable','causal1','causal2','belltech_estado','creacion','coord','cierre','titulo'];
  const header = ['Ticket ID','Sucursal','Ciudad','MAU','Modelo','Tipo','Tipo Servicio','Tipificación','SubTipificación','Responsable #1','Causal #1','Causal #2','Estado Belltech','Creación','Coordinación','Cierre','Título'];
  const rows = [header.join(',')];
  currentFiltered.forEach(t => rows.push(cols.map(c => csvEscape(t[c])).join(',')));
  const csv  = '﻿' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `tickets_${currentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
