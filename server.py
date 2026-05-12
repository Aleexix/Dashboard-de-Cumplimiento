#!/usr/bin/env python3
"""
Servidor local · Dashboard de Cumplimiento ATM Operations
Maneja la subida de Excel y regenera data.js automáticamente.

Uso:
    python server.py
Acceso:
    http://localhost:5000
"""

from flask import Flask, request, jsonify, send_from_directory
import os, json, glob, traceback, unicodedata
from datetime import datetime
from collections import defaultdict

try:
    import pandas as pd
except ImportError:
    print("\nERROR: pandas no instalado.")
    print("Ejecuta:  pip install -r requirements.txt\n")
    raise SystemExit(1)

# ─── RUTAS ────────────────────────────────────────────────────────────────────
BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(BASE_DIR, 'input')
DATA_JS   = os.path.join(BASE_DIR, 'js', 'data.js')
os.makedirs(INPUT_DIR, exist_ok=True)

# ─── MAPEO FLEXIBLE DE COLUMNAS ───────────────────────────────────────────────
# campo_interno → variantes posibles en el Excel (case-insensitive)
COLUMN_MAP = {
    'id':            ['id', 'ticket', 'número ticket', 'numero ticket', 'ticket id', 'n° ticket', 'no ticket'],
    'mau':           ['mau'],
    'sucursal':      ['sucursal', 'branch'],
    'ciudad':        ['ciudad', 'city'],
    'tipo_servicio': ['tipo servicio', 'tipo_servicio', 'service type', 'tipo de servicio', 'tiposervicio'],
    'tipo':          ['tipo', 'type', 'tipo ticket'],
    'tipificacion':  ['tipificacion', 'tipificación', 'tipif'],
    'subtipif':      ['subtipif', 'sub tipificacion', 'subtipificacion', 'sub tipificación', 'subtipificación'],
    'responsable':   ['responsable', 'responsable #1', 'responsable1', 'resp #1'],
    'causal1':       ['causal #01', 'causal1', 'causal #1', 'causal 1', 'causal01', 'causal 01'],
    'causal2':       ['causal #02', 'causal2', 'causal #2', 'causal 2', 'causal02', 'causal 02'],
    'creacion':      ['creacion', 'creación', 'fecha creacion', 'fecha creación', 'fecha de creacion', 'apertura', 'open date'],
    'coord':         ['coord', 'coordinacion', 'coordinación', 'fecha coordinacion', 'fecha coord', 'fecha de coordinacion'],
    'cierre':        ['cierre', 'fecha cierre', 'fecha de cierre', 'close date', 'closed'],
    'titulo':        ['titulo', 'título', 'title', 'nombre', 'descripcion', 'descripción', 'subject'],
    'modelo':        ['modelo', 'model', 'modelo atm', 'modelo cajero'],
    'serie':              ['serie', 'serial', 'nro cajero', 'número cajero', 'numero cajero', 'serial number', 'nro. cajero', 'n° cajero'],
    'hora_llegada_sitio': ['hora llegada sitio', 'hora_llegada_sitio', 'llegada al sitio', 'hora llegada al sitio'],
    'hora_llegada':       ['hora llegada'],
    'codigo_error_nh':    ['código error nh', 'codigo error nh', 'error nh', 'cod error nh', 'código error'],
    'cliente':            ['cliente', 'client', 'banco', 'entidad', 'empresa'],
    'asignado':           ['# asignado', '#asignado', 'asignado', 'tecnico asignado', 'técnico asignado', 'assigned', 'tecnico'],
}

# Detección de banco a partir del nombre de cliente
def get_banco(cliente):
    if not cliente: return None
    c = str(cliente).upper()
    if 'BANCOLOMBIA' in c: return 'bancolombia'
    if 'BBVA'        in c: return 'bbva'
    if 'DAVIVIENDA'  in c: return 'davivienda'
    return norm(str(cliente))   # otro banco: usar nombre normalizado

REQUIRED_FIELDS = ['id', 'creacion', 'coord', 'tipo_servicio']

# ─── FLASK APP ────────────────────────────────────────────────────────────────
app = Flask(__name__)

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(BASE_DIR, path)

@app.route('/api/debug-columns')
def api_debug_columns():
    """Muestra qué columnas tiene el archivo actual y cómo se mapean."""
    files = glob.glob(os.path.join(INPUT_DIR, '*'))
    if not files:
        return jsonify({'error': 'No hay archivo en input/'}), 404
    try:
        df = pd.read_excel(files[0])
        df.columns = [str(c).strip() for c in df.columns]
        mapping, missing = map_columns(df)
        return jsonify({
            'file':    os.path.basename(files[0]),
            'excel_columns': list(df.columns),
            'mapped':  mapping,
            'missing': missing,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status')
def api_status():
    files = glob.glob(os.path.join(INPUT_DIR, '*'))
    current = os.path.basename(files[0]) if files else None
    return jsonify({'current_file': current})

@app.route('/api/upload', methods=['POST'])
def api_upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No se recibió ningún archivo.'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'Nombre de archivo vacío.'}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ('.xlsx', '.xls'):
        return jsonify({'error': f'Formato no soportado ({ext}). Solo .xlsx y .xls'}), 400

    # Limpiar carpeta input/ → solo un archivo a la vez
    for f in glob.glob(os.path.join(INPUT_DIR, '*')):
        os.remove(f)

    filepath = os.path.join(INPUT_DIR, file.filename)
    file.save(filepath)

    try:
        stats = process_excel(filepath)
        return jsonify({'success': True, 'filename': file.filename, 'stats': stats})
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': str(e)}), 500


# ─── HELPERS DE FECHA ─────────────────────────────────────────────────────────
def fmt_datetime(val):
    if val is None:
        return None
    try:
        if pd.isna(val):   # captura NaT, float NaN y None
            return None
    except (TypeError, ValueError):
        pass
    if hasattr(val, 'strftime'):
        return val.strftime('%Y-%m-%d %H:%M')
    s = str(val).strip()
    if not s:
        return None
    try:
        return pd.to_datetime(s).strftime('%Y-%m-%d %H:%M')
    except Exception:
        return s

def fmt_date(val):
    try:
        if pd.isna(val):
            return None
    except (TypeError, ValueError):
        pass
    dt = fmt_datetime(val)
    return dt[:10] if dt and len(dt) >= 10 else dt

DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

def dia_semana(date_str):
    if not date_str:
        return None
    try:
        return DIAS[datetime.strptime(date_str[:10], '%Y-%m-%d').weekday()]
    except Exception:
        return None

def hours_diff(t1, t2):
    if not t1 or not t2:
        return None
    try:
        d1, d2 = pd.to_datetime(t1), pd.to_datetime(t2)
        if pd.isna(d1) or pd.isna(d2):
            return None
        diff = (d2 - d1).total_seconds() / 3600
        return round(diff, 2) if 0 <= diff < 8760 else None
    except Exception:
        return None

def belltech_estado(causal2):
    if not causal2:
        return None
    c = str(causal2).upper()
    if 'INCUMPLE' in c: return 'Incumple'       # antes que CUMPLE — "INCUMPLE" contiene "CUMPLE"
    if 'REPROG'   in c: return 'Reprogramación'
    if 'CUMPLE'   in c: return 'Cumple'
    return None

def clean_serie(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if isinstance(val, float):
        return str(int(val))
    return str(val).strip() or None


# ─── MAPEO DE COLUMNAS ────────────────────────────────────────────────────────
def norm(s):
    """Normaliza string: minúsculas, sin tildes, sin espacios extra."""
    return unicodedata.normalize('NFD', str(s)).encode('ascii', 'ignore').decode().strip().lower()

def map_columns(df):
    # Dos índices: exacto (con tildes) y normalizado (sin tildes)
    col_exact = {c.strip().lower(): c for c in df.columns}
    col_norm  = {norm(c): c for c in df.columns}
    mapping, missing = {}, []

    for field, variants in COLUMN_MAP.items():
        matched = None
        for v in variants:
            if v.lower() in col_exact:
                matched = col_exact[v.lower()]
                break
            if norm(v) in col_norm:
                matched = col_norm[norm(v)]
                break
        if matched:
            mapping[field] = matched
        else:
            missing.append(field)

    required_missing = [f for f in REQUIRED_FIELDS if f not in mapping]
    if required_missing:
        raise ValueError(
            f"Columnas requeridas no encontradas: {required_missing}.\n"
            f"Columnas disponibles en el archivo: {list(df.columns)}"
        )

    return mapping, missing

def get_val(row, field, mapping, default=None):
    col = mapping.get(field)
    if col is None:
        return default
    val = row.get(col)
    if isinstance(val, float) and pd.isna(val):
        return default
    return val if val is not None else default


# ─── PROCESAMIENTO EXCEL ──────────────────────────────────────────────────────
def process_excel(filepath):
    df = pd.read_excel(filepath)
    df.columns = [str(c).strip() for c in df.columns]

    col_map, missing = map_columns(df)

    # ── Tickets ───────────────────────────────────────────────────────────────
    tickets = []
    for _, row in df.iterrows():
        row = row.to_dict()
        g = lambda f, d=None: get_val(row, f, col_map, d)

        creacion_raw = g('creacion')
        coord_raw    = g('coord')
        cierre_raw   = g('cierre')

        creacion = fmt_datetime(creacion_raw)
        coord    = fmt_datetime(coord_raw)
        cierre   = fmt_datetime(cierre_raw)
        f_coord  = fmt_date(coord_raw)
        f_creac  = fmt_date(creacion_raw)
        causal2  = g('causal2')
        estado   = belltech_estado(causal2)

        tickets.append({
            'id':             g('id'),
            'mau':            g('mau'),
            'sucursal':       g('sucursal'),
            'ciudad':         g('ciudad'),
            'tipo_servicio':  g('tipo_servicio'),
            'tipo':           g('tipo'),
            'tipificacion':   g('tipificacion'),
            'subtipif':       g('subtipif'),
            'responsable':    g('responsable'),
            'causal1':        g('causal1'),
            'causal2':        causal2,
            'belltech_estado': estado,
            'creacion':       creacion,
            'coord':          coord,
            'cierre':         cierre,
            'fecha_coord':    f_coord,
            'fecha_creacion': f_creac,
            'dia_semana':     dia_semana(f_coord),
            'modelo':             g('modelo'),
            'titulo':             g('titulo'),
            'serie':              clean_serie(g('serie')),
            'hora_llegada_sitio': fmt_datetime(g('hora_llegada_sitio')),
            'hora_llegada':       fmt_datetime(g('hora_llegada')),
            'codigo_error_nh':    g('codigo_error_nh'),
            'cliente':            g('cliente'),
            'banco':              get_banco(g('cliente')),
            'asignado':           g('asignado'),
        })

    # ── KPIs ──────────────────────────────────────────────────────────────────
    total      = len(tickets)
    b_cumple   = sum(1 for t in tickets if t['belltech_estado'] == 'Cumple')
    b_incumple = sum(1 for t in tickets if t['belltech_estado'] == 'Incumple')
    b_reprog   = sum(1 for t in tickets if t['belltech_estado'] == 'Reprogramación')
    o_cumple   = sum(1 for t in tickets if t['causal1'] == 'OFICINA CUMPLE SERVICIO')
    o_incumple = sum(1 for t in tickets if t['causal1'] == 'OFICINA INCUMPLE SERVICIO')
    o_total    = o_cumple + o_incumple

    tiempos = [hours_diff(t['creacion'], t['cierre']) for t in tickets if t['creacion'] and t['cierre']]
    tiempos = [h for h in tiempos if h is not None]
    avg_hrs  = round(sum(tiempos) / len(tiempos), 2) if tiempos else 0

    fechas   = sorted(t['fecha_coord'] for t in tickets if t['fecha_coord'])

    kpis = {
        'total_tickets':        total,
        'belltech_cumple':      b_cumple,
        'belltech_incumple':    b_incumple,
        'belltech_reprog':      b_reprog,
        'belltech_pct_cumple':  round(b_cumple * 100 / total, 2) if total else 0,
        'oficina_cumple':       o_cumple,
        'oficina_incumple':     o_incumple,
        'oficina_pct_cumple':   round(o_cumple * 100 / o_total, 2) if o_total else 0,
        'tiempo_promedio_horas': avg_hrs,
        'fecha_min': fechas[0]  if fechas else None,
        'fecha_max': fechas[-1] if fechas else None,
    }

    # ── Causales ──────────────────────────────────────────────────────────────
    def count_by(field):
        c = defaultdict(int)
        for t in tickets:
            v = t.get(field)
            if v: c[v] += 1
        return [{'label': k, 'count': v} for k, v in sorted(c.items(), key=lambda x: -x[1])]

    # Causal1 filtrado solo a entradas de OFICINA (cumple/incumple)
    def oficina_causal_filtered():
        c = defaultdict(int)
        for t in tickets:
            v = t.get('causal1')
            if v and 'OFICINA' in str(v).upper():
                c[v] += 1
        return [{'label': k, 'count': v} for k, v in sorted(c.items(), key=lambda x: -x[1])]

    # ── Días con más incumplimientos ──────────────────────────────────────────
    def top_dias(kind='belltech', top=15):
        c = defaultdict(int)
        for t in tickets:
            f = t['fecha_coord']
            if not f: continue
            if kind == 'belltech' and t['belltech_estado'] == 'Incumple':
                c[f] += 1
            elif kind == 'oficina' and t['causal1'] == 'OFICINA INCUMPLE SERVICIO':
                c[f] += 1
        return [{'fecha': k, 'count': v} for k, v in sorted(c.items(), key=lambda x: -x[1])[:top]]

    # ── Timeline ──────────────────────────────────────────────────────────────
    tl = defaultdict(lambda: {'cumple': 0, 'incumple': 0, 'reprogramacion': 0})
    for t in tickets:
        f = t['fecha_coord']
        if not f: continue
        e = t['belltech_estado']
        if   e == 'Cumple':          tl[f]['cumple']         += 1
        elif e == 'Incumple':        tl[f]['incumple']       += 1
        elif e == 'Reprogramación':  tl[f]['reprogramacion'] += 1
    timeline = [{'fecha': k, **v} for k, v in sorted(tl.items())]

    # ── Ciudades (top 15) ─────────────────────────────────────────────────────
    ciu = defaultdict(lambda: {'total': 0, 'incumple': 0})
    for t in tickets:
        c = t['ciudad']
        if not c: continue
        ciu[c]['total'] += 1
        if t['belltech_estado'] == 'Incumple':
            ciu[c]['incumple'] += 1
    ciudades = sorted(
        [{'ciudad': k, **v} for k, v in ciu.items()],
        key=lambda x: -x['total']
    )[:15]

    # ── Tipos de servicio ─────────────────────────────────────────────────────
    ts = defaultdict(lambda: {'total': 0, 'incumple': 0})
    for t in tickets:
        s = t['tipo_servicio']
        if not s: continue
        ts[s]['total'] += 1
        if t['belltech_estado'] == 'Incumple':
            ts[s]['incumple'] += 1
    tipos_servicio = sorted(
        [{'tipo': k, **v} for k, v in ts.items()],
        key=lambda x: -x['total']
    )

    # ── Top tipificaciones con incumplimiento ─────────────────────────────────
    tipif = defaultdict(int)
    for t in tickets:
        if t['belltech_estado'] == 'Incumple' and t['tipificacion']:
            tipif[t['tipificacion']] += 1
    tipif_incumple = [
        {'tipif': k, 'count': v}
        for k, v in sorted(tipif.items(), key=lambda x: -x[1])[:10]
    ]

    # ── Agregación por banco ──────────────────────────────────────────────────
    def build_bank_data(bt):
        if not bt: return None
        n = len(bt)
        bc = sum(1 for t in bt if t['belltech_estado'] == 'Cumple')
        bi = sum(1 for t in bt if t['belltech_estado'] == 'Incumple')
        br = sum(1 for t in bt if t['belltech_estado'] == 'Reprogramación')
        oc = sum(1 for t in bt if t['causal1'] == 'OFICINA CUMPLE SERVICIO')
        oi = sum(1 for t in bt if t['causal1'] == 'OFICINA INCUMPLE SERVICIO')
        ot = oc + oi
        hrs = [h for h in (hours_diff(t['creacion'], t['cierre']) for t in bt if t['creacion'] and t['cierre']) if h is not None]
        fs  = sorted(t['fecha_coord'] for t in bt if t['fecha_coord'])

        bk_kpis = {
            'total_tickets': n, 'belltech_cumple': bc, 'belltech_incumple': bi, 'belltech_reprog': br,
            'belltech_pct_cumple': round(bc*100/n, 2) if n else 0,
            'oficina_cumple': oc, 'oficina_incumple': oi,
            'oficina_pct_cumple': round(oc*100/ot, 2) if ot else 0,
            'tiempo_promedio_horas': round(sum(hrs)/len(hrs), 2) if hrs else 0,
            'fecha_min': fs[0] if fs else None, 'fecha_max': fs[-1] if fs else None,
        }

        def cnt(field, filt=None):
            c = defaultdict(int)
            for t in bt:
                v = t.get(field)
                if v and (filt is None or filt(v)): c[v] += 1
            return [{'label': k, 'count': v} for k, v in sorted(c.items(), key=lambda x: -x[1])]

        tl = defaultdict(lambda: {'cumple': 0, 'incumple': 0, 'reprogramacion': 0})
        for t in bt:
            f = t['fecha_coord']
            if not f: continue
            e = t['belltech_estado']
            if   e == 'Cumple':         tl[f]['cumple']         += 1
            elif e == 'Incumple':       tl[f]['incumple']       += 1
            elif e == 'Reprogramación': tl[f]['reprogramacion'] += 1

        ciu = defaultdict(lambda: {'total': 0, 'incumple': 0})
        for t in bt:
            c = t['ciudad']
            if not c: continue
            ciu[c]['total'] += 1
            if t['belltech_estado'] == 'Incumple': ciu[c]['incumple'] += 1

        ts = defaultdict(lambda: {'total': 0, 'incumple': 0})
        for t in bt:
            s = t['tipo_servicio']
            if not s: continue
            ts[s]['total'] += 1
            if t['belltech_estado'] == 'Incumple': ts[s]['incumple'] += 1

        tipif = defaultdict(int)
        for t in bt:
            if t['belltech_estado'] == 'Incumple' and t['tipificacion']:
                tipif[t['tipificacion']] += 1

        def top_dias_b(kind):
            c = defaultdict(int)
            for t in bt:
                f = t['fecha_coord']
                if not f: continue
                if kind == 'belltech' and t['belltech_estado'] == 'Incumple': c[f] += 1
                elif kind == 'oficina' and t['causal1'] == 'OFICINA INCUMPLE SERVICIO': c[f] += 1
            return [{'fecha': k, 'count': v} for k, v in sorted(c.items(), key=lambda x: -x[1])[:15]]

        return {
            'kpis':                   bk_kpis,
            'belltech_causal':        cnt('causal2'),
            'oficina_causal':         cnt('causal1', lambda v: 'OFICINA' in str(v).upper()),
            'belltech_incumple_dias': top_dias_b('belltech'),
            'oficina_incumple_dias':  top_dias_b('oficina'),
            'timeline':               [{'fecha': k, **v} for k, v in sorted(tl.items())],
            'ciudades':               sorted([{'ciudad': k, **v} for k, v in ciu.items()], key=lambda x: -x['total'])[:15],
            'tipos_servicio':         sorted([{'tipo': k, **v} for k, v in ts.items()], key=lambda x: -x['total']),
            'tipif_incumple':         [{'tipif': k, 'count': v} for k, v in sorted(tipif.items(), key=lambda x: -x[1])[:10]],
        }

    BANK_ORDER = ['bancolombia', 'bbva', 'davivienda']
    seen = set()
    all_bancos = []
    for b in BANK_ORDER:                                  # primero el orden preferido
        if any(t.get('banco') == b for t in tickets):
            seen.add(b); all_bancos.append(b)
    for t in tickets:                                     # luego cualquier otro banco
        b = t.get('banco')
        if b and b not in seen:
            seen.add(b); all_bancos.append(b)
    banks = {b: build_bank_data([t for t in tickets if t.get('banco') == b]) for b in all_bancos}

    # ── Armar DATA ────────────────────────────────────────────────────────────
    data = {
        'kpis':                   kpis,
        'oficina_causal':         oficina_causal_filtered(),
        'belltech_causal':        count_by('causal2'),
        'belltech_incumple_dias': top_dias('belltech'),
        'oficina_incumple_dias':  top_dias('oficina'),
        'timeline':               timeline,
        'ciudades':               ciudades,
        'tipos_servicio':         tipos_servicio,
        'tipif_incumple':         tipif_incumple,
        'tickets':                tickets,
        'banks':                  banks,
    }

    js = 'const DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    with open(DATA_JS, 'w', encoding='utf-8') as f:
        f.write(js)

    has_serie = any(t['serie'] for t in tickets)
    return {
        'total_tickets':    total,
        'has_serie':        has_serie,
        'columns_mapped':   list(col_map.keys()),
        'columns_missing':  missing,
    }


# ─── MAIN ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print('\n' + '─' * 45)
    print('  Dashboard ATM Operations · Servidor local')
    print('─' * 45)
    print('  Abre http://localhost:5000 en tu navegador')
    print('  Ctrl+C para detener')
    print('─' * 45 + '\n')
    app.run(debug=False, port=5000, host='0.0.0.0')