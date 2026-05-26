<?php
/**
 * api/stats.php
 * API REST de estadísticas (solo lectura).
 *
 * GET → devuelve un objeto con:
 *   - goleadores: ranking de goleadores (vista v_goleadores)
 *   - balance:    victorias, empates, derrotas y total
 *   - goles_mes:  goles agrupados por mes (para el gráfico de barras)
 */

require_once __DIR__ . '/_core.php';

exigirLogin();
$db = getDB();

if (metodo() !== 'GET') {
    error_api('Método no permitido.', 405);
}

// ── Ranking de goleadores (vista SQL) ─────────────────────────
$goleadores = $db->query('SELECT * FROM v_goleadores')->fetchAll();

// ── Balance de resultados ─────────────────────────────────────
$balance = $db->query('
    SELECT
        SUM(resultado = "Victoria") AS victorias,
        SUM(resultado = "Empate")   AS empates,
        SUM(resultado = "Derrota")  AS derrotas,
        COUNT(*)                    AS total
    FROM partidos
    WHERE goles_favor IS NOT NULL
')->fetch();

// ── Goles por mes (para el gráfico de barras) ─────────────────
// IMPORTANTE: con sql_mode = only_full_group_by, la expresión del SELECT,
// del GROUP BY y del ORDER BY debe ser la misma. Por eso se usa "%Y-%m"
// en los tres sitios y se ordena por el alias 'mes'.
$goles_mes = $db->query('
    SELECT
        DATE_FORMAT(p.fecha, "%Y-%m") AS mes,
        COUNT(g.id_gol)               AS total_goles
    FROM partidos p
    LEFT JOIN goles g ON p.id_partido = g.id_partido
    WHERE p.goles_favor IS NOT NULL
    GROUP BY DATE_FORMAT(p.fecha, "%Y-%m")
    ORDER BY mes ASC
    LIMIT 8
')->fetchAll();

responder([
    'goleadores' => $goleadores,
    'balance'    => $balance,
    'goles_mes'  => $goles_mes,
]);
