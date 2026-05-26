/* ============================================================
   ui.js — Utilidades compartidas de la interfaz
   ------------------------------------------------------------
   Funciones de ayuda usadas por los distintos módulos del
   frontend: escapar texto, mostrar avisos, formatear fechas,
   etc. Se cargan antes que el resto de scripts de la app.
   ============================================================ */

/**
 * Escapa caracteres HTML para evitar inyección de código (XSS)
 * al insertar texto que proviene de la base de datos en el DOM.
 *
 * @param {*} texto
 * @returns {string}
 */
function escapar(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Muestra un aviso temporal (éxito o error) en la zona de alertas.
 *
 * @param {string} mensaje
 * @param {'ok'|'error'} tipo
 */
function mostrarAviso(mensaje, tipo = 'ok') {
  const zona = document.getElementById('avisos');
  if (!zona) return;
  zona.innerHTML = `<div class="alert alert-${tipo}">${escapar(mensaje)}</div>`;
  // El aviso desaparece solo a los 3 segundos
  setTimeout(() => { zona.innerHTML = ''; }, 3000);
}

/**
 * Formatea una fecha 'YYYY-MM-DD' al día y mes abreviado en español
 * (devuelve un objeto con día y mes por separado, para las tarjetas).
 *
 * @param {string} fechaISO
 * @returns {{dia: string, mes: string}}
 */
function partirFecha(fechaISO) {
  if (!fechaISO) return { dia: '--', mes: '' };
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const f = new Date(fechaISO + 'T00:00:00');
  return {
    dia: String(f.getDate()).padStart(2, '0'),
    mes: meses[f.getMonth()] || '',
  };
}

/**
 * Convierte el nombre del resultado en la letra usada por el CSS.
 *  Victoria → W, Empate → D, Derrota → L
 */
function letraResultado(resultado) {
  if (resultado === 'Victoria') return 'W';
  if (resultado === 'Empate')   return 'D';
  if (resultado === 'Derrota')  return 'L';
  return '';
}
