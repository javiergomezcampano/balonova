/* ============================================================
   app.js — Controlador principal de la aplicación (SPA)
   ------------------------------------------------------------
   - Comprueba que hay sesión activa al cargar (si no, va al login).
   - Gestiona el menú lateral: al pulsar un ítem, muestra su vista.
   - Gestiona el botón de cerrar sesión.
   Cada vista (inicio, jugadores, partidos, stats) está en su
   propio archivo y expone una función Vista<Nombre>().
   ============================================================ */

// Mapa de vistas: nombre → función que la dibuja y su título
const VISTAS = {
  inicio:    { fn: () => VistaInicio(),    titulo: 'Bienvenido' },
  jugadores: { fn: () => VistaJugadores(), titulo: 'Jugadores' },
  partidos:  { fn: () => VistaPartidos(),  titulo: 'Partidos' },
  stats:     { fn: () => VistaStats(),     titulo: 'Estadísticas' },
};

// Referencias a elementos del DOM reutilizadas en toda la app
const App = {
  vista:    null,   // contenedor donde se dibuja cada pantalla
  titulo:   null,   // título del topbar
  acciones: null,   // botones de acción del topbar (ej. "+ Nuevo")
};

/**
 * Cambia la vista activa: actualiza el menú, el título y llama
 * a la función que dibuja esa pantalla.
 *
 * @param {string} nombre  Clave de VISTAS.
 */
async function navegar(nombre) {
  const vista = VISTAS[nombre];
  if (!vista) return;

  // Marcar el ítem activo en el menú lateral
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.vista === nombre);
  });

  // Actualizar título y limpiar acciones/avisos
  App.titulo.textContent = vista.titulo;
  App.acciones.innerHTML = '';
  document.getElementById('avisos').innerHTML = '';

  // Dibujar la vista (cada módulo se encarga de pedir sus datos)
  await vista.fn();
}

/**
 * Arranque de la aplicación.
 */
document.addEventListener('DOMContentLoaded', async () => {
  App.vista    = document.getElementById('vista');
  App.titulo   = document.getElementById('topbar-title');
  App.acciones = document.getElementById('topbar-actions');

  // 1. Comprobar sesión: si no hay, redirigir al login
  try {
    const sesion = await API.auth.sesion();
    if (!sesion.autenticado) {
      window.location.href = 'index.html';
      return;
    }
    // Rellenar los datos del usuario en el sidebar
    const u = sesion.usuario;
    document.getElementById('user-name').textContent   = u.nombre;
    document.getElementById('user-role').textContent   = u.rol;
    document.getElementById('user-avatar').textContent = (u.nombre || 'U').substring(0, 2).toUpperCase();
  } catch (e) {
    window.location.href = 'index.html';
    return;
  }

  // 2. Conectar los ítems del menú lateral
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => navegar(btn.dataset.vista));
  });

  // 3. Conectar el botón de cerrar sesión
  document.getElementById('btn-logout').addEventListener('click', async () => {
    await API.auth.logout();
    window.location.href = 'index.html';
  });

  // 4. Mostrar la vista inicial
  navegar('inicio');
});
