<?php
/**
 * api/inicio.php
 * API REST del panel principal (solo lectura).
 *
 * GET → devuelve un objeto con:
 *   - stats:    contadores del resumen (jugadores, partidos, goles, victorias)
 *   - proximo:  próximo partido sin jugar
 *   - ultimos:  últimos 4 resultados
 *   - racha:    número de victorias consecutivas más recientes
 */

require_once __DIR__ . '/_core.php';

exigirLogin();
$db = getDB();

if (metodo() !== 'GET') {
    error_api('Método no permitido.', 405);
}

// ── Contadores del resumen ────────────────────────────────────
$stats = $db->query('
    SELECT
        (SELECT COUNT(*) FROM jugadores WHERE activo = 1)              AS total_jugadores,
        (SELECT COUNT(*) FROM partidos  WHERE goles_favor IS NOT NULL) AS partidos_jugados,
        (SELECT COUNT(*) FROM goles)                                   AS total_goles,
        (SELECT COUNT(*) FROM partidos  WHERE resultado = "Victoria")  AS victorias
')->fetch();

// ── Próximo partido (aún sin resultado) ───────────────────────
$proximo = $db->query('
    SELECT * FROM partidos
    WHERE goles_favor IS NULL
    ORDER BY fecha ASC
    LIMIT 1
')->fetch();

// ── Últimos 4 resultados ──────────────────────────────────────
$ultimos = $db->query('
    SELECT * FROM partidos
    WHERE goles_favor IS NOT NULL
    ORDER BY fecha DESC
    LIMIT 4
')->fetchAll();

// ── Racha actual de victorias ─────────────────────────────────
$racha   = 0;
$recents = $db->query('
    SELECT resultado FROM partidos
    WHERE goles_favor IS NOT NULL
    ORDER BY fecha DESC
')->fetchAll();

foreach ($recents as $r) {
    if ($r['resultado'] === 'Victoria') {
        $racha++;
    } else {
        break;
    }
}

responder([
    'stats'   => $stats,
    'proximo' => $proximo ?: null,
    'ultimos' => $ultimos,
    'racha'   => $racha,
]);
