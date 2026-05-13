// =========== KPI VALUES ===========
document.getElementById('kpi-belltech-pct').textContent = k.belltech_pct_cumple.toFixed(1) + '%';
document.getElementById('kpi-belltech-num').textContent = fmt(k.belltech_cumple);
const oficinaTotalCalc   = k.oficina_cumple + k.oficina_incumple;
const oficinaPctIncumple = oficinaTotalCalc > 0
  ? (k.oficina_incumple / oficinaTotalCalc * 100).toFixed(1) + '%'
  : '—';

document.getElementById('kpi-oficina-pct').textContent          = k.oficina_pct_cumple.toFixed(1) + '%';
document.getElementById('kpi-oficina-num').textContent          = fmt(k.oficina_cumple);
document.getElementById('kpi-oficina-incumple').textContent     = fmt(k.oficina_incumple);
document.getElementById('kpi-oficina-incumple-pct').textContent = oficinaPctIncumple;
document.getElementById('kpi-incumple').textContent     = fmt(k.belltech_incumple);
document.getElementById('kpi-reprog').textContent       = fmt(k.belltech_reprog);
document.getElementById('kpi-total').textContent        = fmt(k.total_tickets);

// =========== KPI CLICK HANDLERS ===========
document.querySelectorAll('.kpi').forEach(el => {
  el.addEventListener('click', () => {
    const action = el.dataset.action;
    if (action === 'kpi-belltech-cumple')
      openPanel(
        DATA.tickets.filter(t => t.belltech_estado === 'Cumple'),
        'Tickets · Belltech Cumple Cita',
        'CAUSAL #02 = BELLTECH CUMPLE CITA',
        [{ label: 'Total', value: k.belltech_cumple, accent: true }]
      );
    else if (action === 'kpi-oficina-cumple')
      openPanel(
        DATA.tickets.filter(t => t.responsable === 'OFICINA' && t.causal1 === 'OFICINA CUMPLE SERVICIO'),
        'Tickets · Oficina Cumple Servicio',
        'RESPONSABLE #1 = OFICINA · CAUSAL #01 = OFICINA CUMPLE',
        [{ label: 'Total', value: k.oficina_cumple, accent: true }]
      );
    else if (action === 'kpi-belltech-incumple')
      openPanel(
        DATA.tickets.filter(t => t.belltech_estado === 'Incumple'),
        'Tickets · Belltech Incumple',
        'CAUSAL #02 = INCUMPLE SLA + INCUMPLE CITA',
        [{ label: 'Total', value: k.belltech_incumple, accent: true }]
      );
    else if (action === 'kpi-belltech-reprog')
      openPanel(
        DATA.tickets.filter(t => t.causal2 === 'BELLTECH SOLICITA REPROGRAMACION'),
        'Tickets · Solicita Reprogramación',
        'CAUSAL #02 = BELLTECH SOLICITA REPROGRAMACION',
        [{ label: 'Total', value: k.belltech_reprog, accent: true }]
      );
    else if (action === 'kpi-all')
      openPanel(
        DATA.tickets,
        'Todos los Tickets',
        'Base completa de tickets analizados',
        [{ label: 'Total', value: k.total_tickets, accent: true }]
      );
  });
});
