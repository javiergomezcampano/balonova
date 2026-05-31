/* ============================================================
   api.js — Cliente de la API REST de Balonova
   ------------------------------------------------------------
   Centraliza TODAS las llamadas al backend PHP mediante fetch().
   El resto de archivos JS usan estas funciones en lugar de
   escribir fetch() por su cuenta, evitando duplicar código.
   ============================================================ */

// Carpeta donde están los endpoints PHP (relativa a /public)
const API_BASE = '../api';

/**
 * Función interna que realiza la petición fetch y procesa la respuesta.
 * - Envía y recibe JSON.
 * - Incluye las cookies de sesión (credentials: 'include').
 * - Si el servidor responde con un error, lanza una excepción con el mensaje.
 *
 * @param {string} url     URL del endpoint.
 * @param {string} metodo  Método HTTP (GET, POST, PUT, DELETE).
 * @param {object} datos   Cuerpo de la petición (opcional).
 * @returns {Promise<any>} Datos devueltos por la API.
 */
async function peticion(url, metodo = 'GET', datos = null) {
  const opciones = {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',   // imprescindible para mantener la sesión PHP
  };

  if (datos !== null) {
    opciones.body = JSON.stringify(datos);
  }

  const respuesta = await fetch(url, opciones);

  // El 204 (sin contenido) no trae cuerpo JSON
  let cuerpo = null;
  try {
    cuerpo = await respuesta.json();
  } catch (e) {
    cuerpo = null;
  }

  if (!respuesta.ok) {
    const mensaje = (cuerpo && cuerpo.error) ? cuerpo.error : 'Error en la petición.';
    throw new Error(mensaje);
  }

  return cuerpo;
}

/* ── API agrupada por módulos ─────────────────────────────── */
const API = {

  // ── Autenticación ──
  auth: {
    login:    (email, password) => peticion(`${API_BASE}/auth.php?accion=login`, 'POST', { email, password }),
    logout:   ()                => peticion(`${API_BASE}/auth.php?accion=logout`, 'POST'),
    sesion:   ()                => peticion(`${API_BASE}/auth.php?accion=sesion`, 'GET'),
    registro: (datos)           => peticion(`${API_BASE}/auth.php?accion=registro`, 'POST', datos),
    usuarios: ()                => peticion(`${API_BASE}/auth.php?accion=usuarios`, 'GET'),
  },

  // ── Jugadores ──
  jugadores: {
    listar: ()        => peticion(`${API_BASE}/jugadores.php`, 'GET'),
    obtener: (id)     => peticion(`${API_BASE}/jugadores.php?id=${id}`, 'GET'),
    crear: (datos)    => peticion(`${API_BASE}/jugadores.php`, 'POST', datos),
    actualizar: (id, datos) => peticion(`${API_BASE}/jugadores.php?id=${id}`, 'PUT', datos),
    baja: (id)        => peticion(`${API_BASE}/jugadores.php?id=${id}`, 'DELETE'),
  },

  // ── Partidos ──
  partidos: {
    listar: ()        => peticion(`${API_BASE}/partidos.php`, 'GET'),
    obtener: (id)     => peticion(`${API_BASE}/partidos.php?id=${id}`, 'GET'),
    crear: (datos)    => peticion(`${API_BASE}/partidos.php`, 'POST', datos),
    actualizar: (id, datos) => peticion(`${API_BASE}/partidos.php?id=${id}`, 'PUT', datos),
    eliminar: (id)    => peticion(`${API_BASE}/partidos.php?id=${id}`, 'DELETE'),
    obtenerGoles: (id) => peticion(`${API_BASE}/partidos.php?goles=${id}`, 'GET'),
    guardarGoles: (id, goles) => peticion(`${API_BASE}/partidos.php?goles=${id}`, 'POST', { goles }),
  },

  // ── Estadísticas e inicio ──
  stats:  ()  => peticion(`${API_BASE}/stats.php`, 'GET'),
  inicio: ()  => peticion(`${API_BASE}/inicio.php`, 'GET'),
};
