// =========== UPLOAD ===========
(function () {
  const drop     = document.getElementById('upload-drop');
  const input    = document.getElementById('file-input');
  const status   = document.getElementById('upload-status');
  const current  = document.getElementById('upload-current');
  const progress = document.getElementById('upload-progress');

  // Mostrar archivo actualmente cargado al arrancar
  fetch('/api/status')
    .then(r => r.json())
    .then(d => {
      if (d.current_file) {
        current.textContent = 'Archivo activo: ' + d.current_file;
      }
    })
    .catch(() => {}); // silencioso si no hay servidor

  // ── Helpers de UI ────────────────────────────────────────────────────────
  function setStatus(state, text) {
    status.className = 'upload-status ' + state;
    status.textContent = text;
  }

  function setProgress(pct) {
    progress.style.width = pct + '%';
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  drop.addEventListener('dragover', e => {
    e.preventDefault();
    drop.classList.add('drag-over');
  });

  ['dragleave', 'dragend'].forEach(ev =>
    drop.addEventListener(ev, () => drop.classList.remove('drag-over'))
  );

  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  });

  // ── Click en la zona (sin activar el label) ───────────────────────────────
  drop.addEventListener('click', e => {
    if (e.target.tagName === 'LABEL' || e.target.tagName === 'INPUT') return;
    input.click();
  });

  input.addEventListener('change', () => {
    if (input.files[0]) uploadFile(input.files[0]);
    input.value = ''; // reset para permitir resubida del mismo archivo
  });

  // ── Upload ────────────────────────────────────────────────────────────────
  function uploadFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      setStatus('error', 'Solo .xlsx y .xls');
      return;
    }

    setStatus('loading', 'Procesando…');
    setProgress(20);
    current.textContent = 'Subiendo ' + file.name + '…';

    const form = new FormData();
    form.append('file', file);

    // Simular progreso visual
    let fakeProgress = 20;
    const ticker = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + 8, 85);
      setProgress(fakeProgress);
    }, 200);

    fetch('/api/upload', { method: 'POST', body: form })
      .then(r => r.json())
      .then(data => {
        clearInterval(ticker);
        setProgress(100);

        if (data.error) {
          setStatus('error', 'Error: ' + data.error);
          current.textContent = 'Error al procesar el archivo';
          setTimeout(() => setProgress(0), 1500);
          return;
        }

        const stats = data.stats || {};
        const serieMsg = stats.has_serie ? ' · SERIE detectada ✓' : ' · sin campo SERIE';
        setStatus('success', `✓ ${stats.total_tickets?.toLocaleString('es-CO') ?? '?'} tickets${serieMsg}`);
        current.textContent = 'Archivo activo: ' + data.filename;

        // Recargar la página tras 1.2s para mostrar los datos nuevos
        setTimeout(() => {
          setProgress(0);
          window.location.reload();
        }, 1200);
      })
      .catch(err => {
        clearInterval(ticker);
        setProgress(0);
        setStatus('error', 'No se pudo conectar con el servidor');
        current.textContent = 'Verifica que server.py esté corriendo';
        console.error(err);
      });
  }
})();