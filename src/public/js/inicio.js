/* ============================================================
   inicio.js — Vista del panel principal (dashboard)
   ------------------------------------------------------------
   Pide los datos del resumen a la API y los pinta: contadores,
   próximo partido, últimos resultados y acciones rápidas.
   ============================================================ */

async function VistaInicio() {
  App.vista.innerHTML = '<p style="color:var(--muted)">Cargando…</p>';

  let datos;
  try {
    datos = await API.inicio();
  } catch (e) {
    App.vista.innerHTML = `<div class="alert alert-error">${escapar(e.message)}</div>`;
    return;
  }

  const s = datos.stats;
  const p = datos.proximo;

  // ── Tarjetas de contadores ──
  const tarjetas = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Jugadores activos</div>
        <div class="stat-value">${s.total_jugadores}</div>
        <div class="stat-delta up">Plantilla activa</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Partidos jugados</div>
        <div class="stat-value">${s.partidos_jugados}</div>
        <div class="stat-delta up">${s.victorias} victorias</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Goles totales</div>
        <div class="stat-value">${s.total_goles}</div>
        <div class="stat-delta up">${s.partidos_jugados > 0 ? (s.total_goles / s.partidos_jugados).toFixed(1) : 0} por partido</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Racha actual</div>
        <div class="stat-value">${datos.racha}</div>
        <div class="stat-delta up">Victorias seguidas</div>
      </div>
    </div>`;

  // ── Próximo partido ──
  let proximoHTML = '';
  if (p) {
    proximoHTML = `
      <div class="match-card">
        <div class="next-match-badge">Próximo partido</div>
        <div class="match-vs">
          <div class="match-team">
            <div class="match-team-name">Balonova</div>
            <div class="match-team-sub">Local</div>
          </div>
          <div class="match-vs-badge">VS</div>
          <div class="match-team">
            <div class="match-team-name">${escapar(p.rival)}</div>
            <div class="match-team-sub">Visitante</div>
          </div>
        </div>
        <div class="match-details">
          <div class="match-detail">
            <div class="match-detail-label">Fecha</div>
            <div class="match-detail-value">${escapar(p.fecha)}</div>
          </div>
          <div class="match-detail">
            <div class="match-detail-label">Hora</div>
            <div class="match-detail-value">${escapar(p.hora || '--')}</div>
          </div>
          <div class="match-detail">
            <div class="match-detail-label">Lugar</div>
            <div class="match-detail-value">${escapar(p.lugar || '--')}</div>
          </div>
        </div>
      </div>`;
  } else {
    proximoHTML = `<div class="match-card"><div class="next-match-badge">Próximo partido</div><p style="color:var(--muted)">No hay próximos partidos programados.</p></div>`;
  }

  // ── Últimos resultados ──
  const resultados = datos.ultimos.map((r) => {
    const letra = letraResultado(r.resultado);
    const fecha = partirFecha(r.fecha);
    return `
      <div class="result-item">
        <div class="result-outcome ${letra}"></div>
        <div class="result-info">
          <div class="result-opponent">${escapar(r.rival)}</div>
          <div class="result-date">${fecha.dia} ${fecha.mes} · ${escapar(r.tipo)}</div>
        </div>
        <div class="result-score">${r.goles_favor}–${r.goles_contra}</div>
        <div class="result-badge ${letra}">${escapar(r.resultado)}</div>
      </div>`;
  }).join('');

  const dosColumnas = `
    <div class="two-col">
      ${proximoHTML}
      <div class="results-card">
        <div class="section-header">
          <div class="section-title">Últimos resultados</div>
        </div>
        ${resultados || '<p style="color:var(--muted)">Sin resultados todavía.</p>'}
      </div>
    </div>`;

  // ── Acciones rápidas ──
  const acciones = `
    <div class="section-header"><div class="section-title">Acciones rápidas</div></div>
    <div class="quick-actions">
      <div class="action-card" data-ir="jugadores">
        <div class="action-icon"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>
        <div><div class="action-label">Añadir jugador</div><div class="action-sub">Registra un nuevo miembro</div></div>
      </div>
      <div class="action-card" data-ir="partidos">
        <div class="action-icon"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg></div>
        <div><div class="action-label">Programar partido</div><div class="action-sub">Añade al calendario</div></div>
      </div>
      <div class="action-card" data-ir="stats">
        <div class="action-icon"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg></div>
        <div><div class="action-label">Ver estadísticas</div><div class="action-sub">Ranking y análisis</div></div>
      </div>
    </div>`;

  App.vista.innerHTML = tarjetas + dosColumnas + acciones;

  // Las acciones rápidas y resultados navegan a su sección
  App.vista.querySelectorAll('[data-ir]').forEach((card) => {
    card.addEventListener('click', () => navegar(card.dataset.ir));
  });
}
