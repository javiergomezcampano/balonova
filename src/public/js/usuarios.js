/* ============================================================
   usuarios.js — Gestión de usuarios (solo administradores)
   ------------------------------------------------------------
   Permite dar de alta nuevos usuarios que podrán acceder a la
   aplicación, y listar los ya existentes. El registro envía la
   contraseña al backend, que la guarda cifrada (bcrypt).
   ============================================================ */

/**
 * Punto de entrada de la vista: botón "+ Nuevo usuario" en el
 * topbar y listado de usuarios.
 */
async function VistaUsuarios() {
  App.acciones.innerHTML = '<button class="btn btn-primary" id="btn-nuevo-usr">+ Nuevo usuario</button>';
  document.getElementById('btn-nuevo-usr').addEventListener('click', () => formularioUsuario());

  await listarUsuarios();
}

/**
 * Pide los usuarios a la API y los pinta en una tabla.
 */
async function listarUsuarios() {
  App.vista.innerHTML = '<p style="color:var(--muted)">Cargando…</p>';

  let usuarios;
  try {
    usuarios = await API.auth.usuarios();
  } catch (e) {
    App.vista.innerHTML = `<div class="alert alert-error">${escapar(e.message)}</div>`;
    return;
  }

  const filas = usuarios.map((u) => {
    const ini = (u.nombre || 'U').substring(0, 2).toUpperCase();
    return `
      <tr>
        <td>
          <div class="player-cell">
            <div class="player-avatar" style="background:var(--accent)">${escapar(ini)}</div>
            <span style="font-weight:500">${escapar(u.nombre)}</span>
          </div>
        </td>
        <td style="color:var(--muted2)">${escapar(u.email)}</td>
        <td><span class="pos-badge">${escapar(u.rol)}</span></td>
        <td style="color:var(--muted2);font-size:12px">${u.ultimo_acceso ? escapar(u.ultimo_acceso) : 'Nunca'}</td>
      </tr>`;
  }).join('');

  App.vista.innerHTML = `
    <div class="table-card">
      <table>
        <thead>
          <tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Último acceso</th></tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;
}

/**
 * Muestra el formulario de alta de un nuevo usuario.
 */
function formularioUsuario() {
  App.vista.innerHTML = `
    <div class="form-card">
      <h2 class="form-title">Nuevo usuario</h2>
      <form id="form-usuario">
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label">Nombre *</label>
          <input class="form-input" type="text" id="u-nombre" required>
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label">Email *</label>
          <input class="form-input" type="email" id="u-email" placeholder="persona@balonova.com" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Contraseña *</label>
            <input class="form-input" type="password" id="u-password" minlength="8" placeholder="Mínimo 8 caracteres" required>
          </div>
          <div class="form-group">
            <label class="form-label">Rol</label>
            <select class="form-input" id="u-rol">
              <option value="editor" selected>Editor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:16px">
          <button type="submit" class="btn btn-primary">Registrar</button>
          <button type="button" class="btn btn-ghost" id="u-cancelar">Cancelar</button>
        </div>
      </form>
    </div>`;

  document.getElementById('u-cancelar').addEventListener('click', () => listarUsuarios());

  document.getElementById('form-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
      nombre:   document.getElementById('u-nombre').value.trim(),
      email:    document.getElementById('u-email').value.trim(),
      password: document.getElementById('u-password').value,
      rol:      document.getElementById('u-rol').value,
    };

    try {
      const r = await API.auth.registro(datos);
      mostrarAviso(r.mensaje, 'ok');
      await listarUsuarios();
    } catch (err) {
      mostrarAviso(err.message, 'error');
    }
  });
}
