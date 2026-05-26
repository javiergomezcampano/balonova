/* ============================================================
   stats.js — Vista de estadísticas
   ------------------------------------------------------------
   Dibuja el ranking de goleadores, el balance de resultados y
   un gráfico de barras de goles por mes, con datos de la API.
   ============================================================ */

async function VistaStats() {
  App.vista.innerHTML = '<p style="color:var(--muted)">Cargando…</p>';

  let datos;
  try {
    datos = await API.stats();
  } catch (e) {
    App.vista.innerHTML = `<div class="alert alert-error">${escapar(e.message)}</div>`;
    return;
  }

  const { goleadores, balance, goles_mes } = datos;

  // ── Gráfico de barras: goles por mes ──
  const maxGoles = Math.max(1, ...goles_mes.map((m) => parseInt(m.total_goles, 10)));
  const barras = goles_mes.map((m) => {
    const altura = Math.round((parseInt(m.total_goles, 10) / maxGoles) * 90);
    // Mostrar el mes en formato corto a partir de "YYYY-MM"
    const etiqueta = m.mes.split('-')[1] || m.mes;
    return `
      <div class="bar-col">
        <div class="bar-val">${m.total_goles}</div>
        <div class="bar" style="height:${altura}px"></div>
        <div class="bar-label">${escapar(etiqueta)}</div>
      </div>`;
  }).join('');

  // ── Balance: barras de victorias/empates/derrotas ──
  const total = Math.max(1, parseInt(balance.total, 10) || 0);
  const filaBalance = (label, num, color) => {
    const ancho = Math.round((parseInt(num, 10) / total) * 100);
    return `
      <div class="balance-row">
        <div class="balance-label">${label}</div>
        <div class="balance-track"><div class="balance-fill" style="width:${ancho}%;background:${color}"></div></div>
        <div class="balance-num">${num || 0}</div>
      </div>`;
  };

  const bloqueGraficos = `
    <div class="stats-grid">
      <div class="chart-card">
        <div class="section-header"><div class="section-title">Goles por mes</div></div>
        <div class="mini-bar">${barras || '<p style="color:var(--muted)">Sin datos.</p>'}</div>
      </div>
      <div class="chart-card">
        <div class="section-header"><div class="section-title">Balance de resultados</div></div>
        <div class="balance-list">
          ${filaBalance('Victorias', balance.victorias, 'var(--win)')}
          ${filaBalance('Empates',   balance.empates,   'var(--draw)')}
          ${filaBalance('Derrotas',  balance.derrotas,  'var(--loss)')}
        </div>
      </div>
    </div>`;

  // ── Ranking de goleadores ──
  const filas = goleadores.map((g, i) => `
      <tr>
        <td style="font-family:var(--font-display);font-weight:700;color:${i === 0 ? 'var(--accent)' : 'var(--muted2)'}">${i + 1}</td>
        <td><span style="font-weight:500">${escapar(g.jugador)}</span></td>
        <td><span class="dorsal">${g.dorsal}</span></td>
        <td><span class="pos-badge pos-${escapar(g.posicion.substring(0,2))}">${escapar(g.posicion)}</span></td>
        <td style="font-family:var(--font-display);font-weight:700;color:var(--accent)">${g.total_goles}</td>
      </tr>`).join('');

  const ranking = `
    <div class="section-header"><div class="section-title">Ranking de goleadores</div></div>
    <div class="table-card">
      <table>
        <thead><tr><th>#</th><th>Jugador</th><th>Dorsal</th><th>Posición</th><th>Goles</th></tr></thead>
        <tbody>${filas || '<tr><td colspan="5" style="color:var(--muted)">Sin datos.</td></tr>'}</tbody>
      </table>
    </div>`;

  App.vista.innerHTML = bloqueGraficos + ranking;
}
