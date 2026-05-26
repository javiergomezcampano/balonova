/* ============================================================
   partidos.js — Vista y lógica de gestión de partidos
   ------------------------------------------------------------
   Listado de partidos, formulario de alta/edición y registro
   de goles, todo gestionado en el navegador con fetch.
   ============================================================ */

async function VistaPartidos() {
  App.acciones.innerHTML = '<button class="btn btn-primary" id="btn-nuevo-part">+ Nuevo partido</button>';
  document.getElementById('btn-nuevo-part').addEventListener('click', () => formularioPartido());
  await listarPartidos();
}

/**
 * Pide los partidos a la API y los pinta como tarjetas.
 */
async function listarPartidos() {
  App.vista.innerHTML = '<p style="color:var(--muted)">Cargando…</p>';

  let partidos;
  try {
    partidos = await API.partidos.listar();
  } catch (e) {
    App.vista.innerHTML = `<div class="alert alert-error">${escapar(e.message)}</div>`;
    return;
  }

  if (partidos.length === 0) {
    App.vista.innerHTML = '<div class="table-card" style="padding:24px;color:var(--muted)">No hay partidos registrados. Pulsa «+ Nuevo partido».</div>';
    return;
  }

  const tarjetas = partidos.map((p) => {
    const f = partirFecha(p.fecha);
    const jugado = p.goles_favor !== null && p.goles_favor !== undefined;
    const letra = letraResultado(p.resultado);

    // Color del marcador según el resultado
    let colorScore = 'var(--text)';
    if (letra === 'W') colorScore = 'var(--win)';
    else if (letra === 'D') colorScore = 'var(--draw)';
    else if (letra === 'L') colorScore = 'var(--loss)';

    const marcador = jugado
      ? `<div class="partido-score" style="color:${colorScore}">${p.goles_favor}–${p.goles_contra}</div>`
      : `<div class="partido-score pending">Pendiente</div>`;

    return `
      <div class="partido-card">
        <div class="partido-date-block">
          <div class="partido-day">${f.dia}</div>
          <div class="partido-month">${f.mes}</div>
        </div>
        <div class="partido-sep"></div>
        <div class="partido-info">
          <div class="partido-rival">${escapar(p.rival)}</div>
          <div class="partido-meta">${escapar(p.hora || '--')} · ${escapar(p.lugar || 'Sin lugar')}</div>
        </div>
        ${marcador}
        <span class="partido-type ${escapar(p.tipo.toLowerCase())}">${escapar(p.tipo)}</span>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn btn-ghost" style="padding:5px 12px;font-size:12px" data-editar="${p.id_partido}">Editar</button>
          <button class="btn btn-ghost" style="padding:5px 12px;font-size:12px;color:var(--accent)" data-goles="${p.id_partido}">Goles</button>
          <button class="btn btn-ghost" style="padding:5px 12px;font-size:12px;color:var(--loss)" data-eliminar="${p.id_partido}" data-rival="${escapar(p.rival)}">Eliminar</button>
        </div>
      </div>`;
  }).join('');

  App.vista.innerHTML = `<div class="partidos-list">${tarjetas}</div>`;

  App.vista.querySelectorAll('[data-editar]').forEach((b) =>
    b.addEventListener('click', () => formularioPartido(parseInt(b.dataset.editar, 10))));
  App.vista.querySelectorAll('[data-goles]').forEach((b) =>
    b.addEventListener('click', () => formularioGoles(parseInt(b.dataset.goles, 10))));
  App.vista.querySelectorAll('[data-eliminar]').forEach((b) =>
    b.addEventListener('click', () => eliminarPartido(parseInt(b.dataset.eliminar, 10), b.dataset.rival)));
}

/**
 * Formulario de alta o edición de un partido.
 */
async function formularioPartido(id = null) {
  let p = {};
  if (id) {
    try { p = await API.partidos.obtener(id); }
    catch (e) { mostrarAviso(e.message, 'error'); return; }
  }

  const tipos = ['Liga','Copa','Amistoso'];
  const opcTipo = tipos.map((t) => `<option value="${t}" ${t === p.tipo ? 'selected' : ''}>${t}</option>`).join('');

  App.vista.innerHTML = `
    <div class="form-card">
      <h2 class="form-title">${id ? 'Editar partido' : 'Nuevo partido'}</h2>
      <form id="form-partido">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Rival *</label>
            <input class="form-input" type="text" id="p-rival" required value="${escapar(p.rival || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-input" id="p-tipo">${opcTipo}</select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha *</label>
            <input class="form-input" type="date" id="p-fecha" required value="${p.fecha || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Hora</label>
            <input class="form-input" type="time" id="p-hora" value="${p.hora || ''}">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label">Lugar</label>
          <input class="form-input" type="text" id="p-lugar" value="${escapar(p.lugar || '')}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Goles a favor</label>
            <input class="form-input" type="number" id="p-gf" min="0" value="${p.goles_favor ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Goles en contra</label>
            <input class="form-input" type="number" id="p-gc" min="0" value="${p.goles_contra ?? ''}">
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:8px">
          <button type="submit" class="btn btn-primary">Guardar</button>
          <button type="button" class="btn btn-ghost" id="p-cancelar">Cancelar</button>
        </div>
      </form>
    </div>`;

  document.getElementById('p-cancelar').addEventListener('click', () => listarPartidos());

  document.getElementById('form-partido').addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
      rival:         document.getElementById('p-rival').value.trim(),
      tipo:          document.getElementById('p-tipo').value,
      fecha:         document.getElementById('p-fecha').value,
      hora:          document.getElementById('p-hora').value,
      lugar:         document.getElementById('p-lugar').value.trim(),
      goles_favor:   document.getElementById('p-gf').value,
      goles_contra:  document.getElementById('p-gc').value,
    };
    try {
      const r = id ? await API.partidos.actualizar(id, datos) : await API.partidos.crear(datos);
      mostrarAviso(r.mensaje, 'ok');
      await listarPartidos();
    } catch (err) {
      mostrarAviso(err.message, 'error');
    }
  });
}

/**
 * Formulario de registro de goles de un partido.
 * Permite añadir filas dinámicamente (jugador, minuto, tipo).
 */
async function formularioGoles(idPartido) {
  let partido, jugadores, goles;
  try {
    partido   = await API.partidos.obtener(idPartido);
    jugadores = await API.jugadores.listar();
    goles     = await API.partidos.obtenerGoles(idPartido);
  } catch (e) {
    mostrarAviso(e.message, 'error');
    return;
  }

  // Opciones del desplegable de jugadores
  const opcionesJug = (sel) => '<option value="">— Jugador —</option>' + jugadores
    .map((j) => `<option value="${j.id_jugador}" ${j.id_jugador == sel ? 'selected' : ''}>${escapar(j.dorsal + ' · ' + j.nombre + ' ' + j.apellidos)}</option>`)
    .join('');

  const tiposGol = ['Normal','Penalti','Propia puerta'];

  // Crea una fila de gol (reutilizable)
  function filaGol(g = {}) {
    const opcTipo = tiposGol.map((t) => `<option value="${t}" ${t === g.tipo_gol ? 'selected' : ''}>${t}</option>`).join('');
    return `
      <div class="gol-row">
        <select class="form-input gol-jugador" style="flex:2">${opcionesJug(g.id_jugador)}</select>
        <input class="form-input gol-minuto" type="number" min="0" max="120" placeholder="Min" style="flex:1" value="${g.minuto ?? ''}">
        <select class="form-input gol-tipo" style="flex:1">${opcTipo}</select>
        <button type="button" class="btn btn-ghost gol-quitar" style="padding:8px 12px;color:var(--loss)">✕</button>
      </div>`;
  }

  App.vista.innerHTML = `
    <div class="form-card">
      <h2 class="form-title">Goles · ${escapar(partido.rival)}</h2>
      <div id="goles-cont">
        ${goles.length ? goles.map(filaGol).join('') : filaGol()}
      </div>
      <button type="button" class="btn btn-ghost" id="add-gol" style="margin:8px 0 16px">+ Añadir gol</button>
      <div style="display:flex;gap:12px">
        <button type="button" class="btn btn-primary" id="guardar-goles">Guardar goles</button>
        <button type="button" class="btn btn-ghost" id="goles-cancelar">Cancelar</button>
      </div>
    </div>`;

  const cont = document.getElementById('goles-cont');

  // Delegación: el botón ✕ quita su fila
  cont.addEventListener('click', (e) => {
    if (e.target.classList.contains('gol-quitar')) {
      e.target.closest('.gol-row').remove();
    }
  });

  document.getElementById('add-gol').addEventListener('click', () => {
    cont.insertAdjacentHTML('beforeend', filaGol());
  });

  document.getElementById('goles-cancelar').addEventListener('click', () => listarPartidos());

  document.getElementById('guardar-goles').addEventListener('click', async () => {
    // Recoger todas las filas en un array de objetos
    const filas = cont.querySelectorAll('.gol-row');
    const lista = [];
    filas.forEach((fila) => {
      const jid = fila.querySelector('.gol-jugador').value;
      if (jid) {
        lista.push({
          id_jugador: parseInt(jid, 10),
          minuto:     fila.querySelector('.gol-minuto').value,
          tipo_gol:   fila.querySelector('.gol-tipo').value,
        });
      }
    });
    try {
      const r = await API.partidos.guardarGoles(idPartido, lista);
      mostrarAviso(r.mensaje, 'ok');
      await listarPartidos();
    } catch (err) {
      mostrarAviso(err.message, 'error');
    }
  });
}

/**
 * Elimina un partido previa confirmación.
 */
async function eliminarPartido(id, rival) {
  if (!confirm(`¿Eliminar el partido contra ${rival}? Se borrarán también sus goles.`)) return;
  try {
    const r = await API.partidos.eliminar(id);
    mostrarAviso(r.mensaje, 'ok');
    await listarPartidos();
  } catch (e) {
    mostrarAviso(e.message, 'error');
  }
}
