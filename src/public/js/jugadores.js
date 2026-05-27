
// Paleta para los avatares (misma idea que la versión original)
const COLORES_JUG = ['#00e676','#1de9b6','#64ffda','#40c4ff','#80d8ff','#b2ff59','#ffd740','#ffab40','#ff6d00','#ff5252'];

/**
 * Punto de entrada de la vista: muestra el botón "+ Nuevo jugador"
 * en el topbar y dibuja el listado.
 */
async function VistaJugadores() {
  // Botón de acción en el topbar
  App.acciones.innerHTML = '<button class="btn btn-primary" id="btn-nuevo-jug">+ Nuevo jugador</button>';
  document.getElementById('btn-nuevo-jug').addEventListener('click', () => formularioJugador());

  await listarJugadores();
}

/**
 * Pide los jugadores a la API y los pinta en una tabla.
 */
async function listarJugadores() {
  App.vista.innerHTML = '<p style="color:var(--muted)">Cargando…</p>';

  let jugadores;
  try {
    jugadores = await API.jugadores.listar();
  } catch (e) {
    App.vista.innerHTML = `<div class="alert alert-error">${escapar(e.message)}</div>`;
    return;
  }

  if (jugadores.length === 0) {
    App.vista.innerHTML = '<div class="table-card" style="padding:24px;color:var(--muted)">No hay jugadores en la plantilla. Pulsa «+ Nuevo jugador» para añadir el primero.</div>';
    return;
  }

  const filas = jugadores.map((j, i) => {
    const ini = (j.nombre[0] + j.apellidos[0]).toUpperCase();
    let estadoCls = 'lesion';
    if (j.estado_fisico === 'Disponible') estadoCls = 'ok';
    else if (j.estado_fisico === 'Duda')  estadoCls = 'duda';

    return `
      <tr>
        <td><span class="dorsal">${j.dorsal}</span></td>
        <td>
          <div class="player-cell">
            <div class="player-avatar" style="background:${COLORES_JUG[i % COLORES_JUG.length]}">${ini}</div>
            <span style="font-weight:500">${escapar(j.nombre + ' ' + j.apellidos)}</span>
          </div>
        </td>
        <td><span class="pos-badge pos-${escapar(j.posicion.substring(0,2))}">${escapar(j.posicion)}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:7px">
            <div class="status-dot ${estadoCls}"></div>
            <span style="color:var(--muted2);font-size:12px">${escapar(j.estado_fisico)}</span>
          </div>
        </td>
        <td style="font-family:var(--font-display);font-weight:700;color:var(--accent)">${j.total_goles}</td>
        <td>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost" style="padding:5px 12px;font-size:12px" data-editar="${j.id_jugador}">Editar</button>
            <button class="btn btn-ghost" style="padding:5px 12px;font-size:12px;color:var(--loss)" data-baja="${j.id_jugador}" data-nombre="${escapar(j.nombre)}">Baja</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  App.vista.innerHTML = `
    <div class="table-card">
      <table>
        <thead>
          <tr><th>#</th><th>Jugador</th><th>Posición</th><th>Estado</th><th>Goles</th><th>Acciones</th></tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;

  // Conectar botones de editar y baja
  App.vista.querySelectorAll('[data-editar]').forEach((btn) => {
    btn.addEventListener('click', () => formularioJugador(parseInt(btn.dataset.editar, 10)));
  });
  App.vista.querySelectorAll('[data-baja]').forEach((btn) => {
    btn.addEventListener('click', () => darDeBaja(parseInt(btn.dataset.baja, 10), btn.dataset.nombre));
  });
}

/**
 * Muestra el formulario de alta o edición.
 * Si recibe un id, precarga los datos del jugador (modo edición).
 *
 * @param {number|null} id
 */
async function formularioJugador(id = null) {
  let jug = {};
  if (id) {
    try {
      jug = await API.jugadores.obtener(id);
    } catch (e) {
      mostrarAviso(e.message, 'error');
      return;
    }
  }

  const posiciones = ['Portero','Extremo','Lateral','Pivote','Central'];
  const estados    = ['Disponible','Lesionado','Duda','Baja'];

  const opciones = (lista, sel) => lista
    .map((v) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${v}</option>`)
    .join('');

  App.vista.innerHTML = `
    <div class="form-card">
      <h2 class="form-title">${id ? 'Editar jugador' : 'Nuevo jugador'}</h2>
      <form id="form-jugador">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nombre *</label>
            <input class="form-input" type="text" id="j-nombre" required value="${escapar(jug.nombre || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Apellidos *</label>
            <input class="form-input" type="text" id="j-apellidos" required value="${escapar(jug.apellidos || '')}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Dorsal *</label>
            <input class="form-input" type="number" id="j-dorsal" min="1" max="99" required value="${jug.dorsal || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Posición</label>
            <select class="form-input" id="j-posicion">${opciones(posiciones, jug.posicion)}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Estado físico</label>
            <select class="form-input" id="j-estado">${opciones(estados, jug.estado_fisico || 'Disponible')}</select>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:8px">
          <label class="form-label">Fecha de nacimiento</label>
          <input class="form-input" type="date" id="j-fecha" value="${jug.fecha_nac || ''}">
        </div>
        <div style="display:flex;gap:12px;margin-top:16px">
          <button type="submit" class="btn btn-primary">Guardar</button>
          <button type="button" class="btn btn-ghost" id="j-cancelar">Cancelar</button>
        </div>
      </form>
    </div>`;

  document.getElementById('j-cancelar').addEventListener('click', () => listarJugadores());

  document.getElementById('form-jugador').addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
      nombre:        document.getElementById('j-nombre').value.trim(),
      apellidos:     document.getElementById('j-apellidos').value.trim(),
      dorsal:        parseInt(document.getElementById('j-dorsal').value, 10),
      posicion:      document.getElementById('j-posicion').value,
      estado_fisico: document.getElementById('j-estado').value,
      fecha_nac:     document.getElementById('j-fecha').value || null,
    };

    try {
      if (id) {
        const r = await API.jugadores.actualizar(id, datos);
        mostrarAviso(r.mensaje, 'ok');
      } else {
        const r = await API.jugadores.crear(datos);
        mostrarAviso(r.mensaje, 'ok');
      }
      await listarJugadores();
    } catch (err) {
      mostrarAviso(err.message, 'error');
    }
  });
}

/**
 * Da de baja a un jugador previa confirmación.
 */
async function darDeBaja(id, nombre) {
  if (!confirm(`¿Dar de baja a ${nombre}?`)) return;
  try {
    const r = await API.jugadores.baja(id);
    mostrarAviso(r.mensaje, 'ok');
    await listarJugadores();
  } catch (e) {
    mostrarAviso(e.message, 'error');
  }
}
