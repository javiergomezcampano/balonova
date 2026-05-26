/* ============================================================
   login.js — Lógica de la pantalla de acceso
   ------------------------------------------------------------
   Gestiona el envío del formulario de login sin recargar la
   página: captura el evento submit, llama a la API y, si el
   acceso es correcto, redirige al panel principal.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const cajaError = document.getElementById('login-error');

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();          // evita que el formulario recargue la página
    cajaError.innerHTML = '';

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      await API.auth.login(email, password);
      // Acceso correcto: ir al panel principal
      window.location.href = 'app.html';
    } catch (e) {
      // Mostrar el mensaje de error devuelto por la API
      cajaError.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
    }
  });
});
