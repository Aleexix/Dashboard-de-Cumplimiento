// landing-app.jsx — página de inicio Belltech

const {
  TopBar, DonutMini, Sparkline,
  LockGlyph, ArrowGlyph,
} = window;

// ── Helpers de datos dinámicos ─────────────────────────────────────────────
const MESES_LANDING = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function getDiario() {
  return (typeof DATA_DIARIO !== 'undefined') ? DATA_DIARIO : null;
}

function getMesNom(d) {
  if (!d) return 'mayo';
  return MESES_LANDING[parseInt(d.fecha_hoy.slice(5, 7), 10) - 1];
}

// ── KPI strip ──────────────────────────────────────────────────────────────
function KpiBar({ items }) {
  return (
    <div className="kpi-strip kpi-strip-bar">
      {items.map((k, i) =>
        <div className="kpi-cell" key={i}>
          <span className="kpi-label">{k.label}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className={`kpi-val ${k.tone || ''}`}>{k.val}</span>
            {k.sub && <span className="kpi-trend">{k.sub}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function HeroFull() {
  return (
    <section className="hero hero-full">
      <div className="hero-grid hero-grid-solo">
        <div>
          <span className="hero-eyebrow">Centro de operación · Belltech</span>
          <h1 className="hero-title hero-title-lg">
            Cumplimiento de servicios técnicos, en un lugar.
          </h1>
          <p className="hero-sub">
            Vista consolidada de citas, SLA, llegada al sitio y reprogramaciones para
            los bancos que opera Belltech. Entra a un módulo o explora lo que viene.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Card principal: Dashboard de Cumplimiento ──────────────────────────────
function FeaturedDashCard() {
  const d       = getDiario();
  const pctVal  = d ? d.resumen_mes.pct_cumple : null;
  const pct     = pctVal !== null ? pctVal / 100 : 0.868;
  const pctStr  = pctVal !== null ? pctVal.toFixed(1) : '—';
  const mes     = getMesNom(d);
  const sub     = d ? `cumplimiento · ${mes} MTD` : 'cumplimiento Belltech · citas cumplidas';
  const sparkData = (d && d.timeline && d.timeline.length > 1)
    ? d.timeline.map(t => t.pct_cumple)
    : [78, 79, 82, 80, 83, 82, 85, 84, 86, 86, 87];

  return (
    <a href="dashboard.html" className="card interactive feat" data-tone="green" style={{ padding: 32 }}>
      <div className="feat-h">
        <span className="card-cta feat-cta">
          Entrar al dashboard <span className="arrow"><ArrowGlyph /></span>
        </span>
      </div>

      <h2 className="card-title feat-title">Dashboard de<br />Cumplimiento</h2>
      <p className="card-desc feat-desc">
        Vista consolidada por banco, oficina y servicio. KPIs de cita, SLA,
        llegada al sitio y reprogramaciones. Filtra por entidad o servicio
        para ir al detalle.
      </p>

      <div className="feat-body">
        <DonutMini value={pct} color="var(--green)" size={156} />
        <div className="feat-stack">
          <div className="big-num">{pctStr}<span style={{ fontSize: 42 }}>%</span></div>
          <div className="big-num-sub">{sub}</div>
          <div style={{ marginTop: 18 }}>
            <Sparkline data={sparkData} color="var(--green)" />
          </div>
        </div>
      </div>

    </a>
  );
}

// ── Cluster derecho: Incumplimiento + Reprogramaciones ─────────────────────
function ClusterRight() {
  const d         = getDiario();
  const incHoy    = d ? d.resumen_hoy.incumple : null;
  const totalHoy  = d ? d.resumen_hoy.total    : null;
  const mes       = getMesNom(d);
  const incLabel  = d ? `incumplimientos SLA · hoy` : 'tickets · últimas 24h';
  const kicker    = d ? `${mes} · bancolombia` : '3 bancos';
  const sparkInc  = (d && d.timeline && d.timeline.length > 1)
    ? d.timeline.map(t => t.incumple)
    : [420, 402, 395, 410, 408, 398, 404, 415, 404];

  return (
    <div className="cluster">
      <a href="incumplimiento-diario.html" className="card interactive cluster-card" data-tone="red">
        <div className="card-kicker">
          <span className="badge badge-live" style={{ color: 'var(--red)' }}>HOY · 24H</span>
          <span style={{ color: 'var(--fg-soft)' }}>{kicker}</span>
        </div>
        <h2 className="card-title">Incumplimiento Diario</h2>
        <p className="card-desc">
          Trazabilidad por ticket: causal, SLA, oficina, técnico. Lista navegable
          con alertas en vivo.
        </p>
        <div className="cluster-illus">
          <Sparkline data={sparkInc} color="var(--red)" filled={true} />
        </div>
        <div className="card-foot">
          <div className="card-metric">
            <span className="card-metric-num">{incHoy !== null ? incHoy : '—'}</span>
            <span className="card-metric-label">{incLabel}</span>
          </div>
          <span className="card-cta">Entrar <span className="arrow"><ArrowGlyph /></span></span>
        </div>
      </a>

      <div className="card locked stripe-bg cluster-card" data-tone="orange">
        <div className="lock-cluster"><LockGlyph size={16} /></div>
        <div className="card-inner">
          <div className="card-kicker">
            <span className="badge badge-soon">Próximamente</span>
            <span style={{ color:'var(--fg-soft)', fontFamily:'var(--font-mono)', letterSpacing:'0.04em' }}>
              ETA · Q2 · 2026
            </span>
          </div>
          <h2 className="card-title">Reprogramaciones</h2>
          <p className="card-desc">
            Análisis y reasignación de citas reprogramadas con motivo y reincidencia
            por oficina y técnico.
          </p>
          <div className="card-foot">
            <span className="soon-progress">
              <i style={{ width: '52%' }} />
              <small>build</small>
            </span>
            <button className="soon-notify" onClick={(e) => e.preventDefault()}>Notificarme</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fila próximamente ──────────────────────────────────────────────────────
function SoonRow() {
  const soons = [
    {
      title: 'Auditoría y Evidencias',
      desc: 'Archivo cronológico de actas, fotos y firmas con búsqueda por ticket y exportación.',
      eta: 'Q3 · 2026', tone: 'blue', progress: 38, stage: 'discovery',
    },
    {
      title: 'Alertas y Reportería',
      desc: 'Reportes programados por banco + alertas configurables por umbral y oficina.',
      eta: 'Q4 · 2026', tone: 'brand', progress: 18, stage: 'discovery',
    },
    {
      title: 'Predicción de SLA',
      desc: 'Modelo que estima qué tickets van a incumplir antes de que pase, para intervenir a tiempo.',
      eta: 'Q1 · 2027', tone: 'orange', progress: 8, stage: 'research',
    },
  ];

  return (
    <div className="soon-row">
      <div className="soon-row-head">
        <h3>Próximamente · roadmap</h3>
        <span className="soon-row-sub">3 módulos en exploración para los próximos trimestres</span>
      </div>
      <div className="soon-row-grid soon-row-grid-3">
        {soons.map((m, i) =>
          <div key={i} className="card locked stripe-bg soon-card" data-tone={m.tone}>
            <div className="lock-cluster"><LockGlyph size={16} /></div>
            <div className="card-inner">
              <div className="card-kicker">
                <span className="badge badge-soon">Próximamente</span>
                <span style={{ color:'var(--fg-soft)', fontFamily:'var(--font-mono)', letterSpacing:'0.04em' }}>
                  ETA · {m.eta}
                </span>
              </div>
              <h2 className="card-title">{m.title}</h2>
              <p className="card-desc">{m.desc}</p>
              <div className="card-foot">
                <span className="soon-progress">
                  <i style={{ width: `${m.progress}%` }} />
                  <small>{m.stage}</small>
                </span>
                <button className="soon-notify" onClick={(e) => e.preventDefault()}>Notificarme</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function FootBar() {
  return (
    <footer className="footbar">
      <div className="footbar-l">
        <span className="lb-brand"><span className="lb-brand-dot">B</span>BELLTECH</span>
        <span className="footbar-meta">ATM Operations · Dashboard v2</span>
      </div>
      <div className="footbar-r">
        <span className="footbar-time">Centro de operación</span>
      </div>
    </footer>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
function LandingApp() {
  return (
    <div className="lb lb-full">
      <TopBar />
      <HeroFull />
      <div className="canvas-body canvas-body-full canvas-body-tight">
        <div className="grid-featured-full">
          <FeaturedDashCard />
          <ClusterRight />
        </div>
        <SoonRow />
      </div>
      <FootBar />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LandingApp />);
