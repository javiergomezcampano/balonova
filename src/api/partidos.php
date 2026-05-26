<?php
/**
 * api/partidos.php
 * API REST para la gestión de partidos y sus goles.
 *
 * Métodos HTTP:
 *   GET    ?id=N        → devuelve un partido concreto
 *   GET    ?goles=N     → devuelve los goles registrados de un partido
 *   GET                 → devuelve el listado de partidos (vista v_partidos)
 *   POST                → crea un partido (datos en JSON)
 *   POST   ?goles=N     → guarda los goles de un partido (array en JSON)
 *   PUT    ?id=N        → actualiza un partido
 *   DELETE ?id=N        → elimina un partido (y sus goles, por la FK en cascada)
 *
 * El resultado (Victoria/Empate/Derrota) se calcula en el servidor a partir
 * de los goles. Si la columna 'resultado' fuese generada en la base de datos,
 * se detecta y no se intenta escribir en ella.
 */

require_once __DIR__ . '/_core.php';

exigirLogin();
$db      = getDB();
$id      = isset($_GET['id'])    ? intval($_GET['id'])    : 0;
$idGoles = isset($_GET['goles']) ? intval($_GET['goles']) : 0;

/**
 * Calcula el resultado a partir de los goles a favor y en contra.
 * Devuelve null si el partido aún no se ha jugado.
 */
function calcularResultado(?int $gf, ?int $gc): ?string
{
    if ($gf === null || $gc === null) {
        return null;
    }
    if ($gf > $gc)  return 'Victoria';
    if ($gf === $gc) return 'Empate';
    return 'Derrota';
}

/**
 * Comprueba si la columna 'resultado' de la tabla 'partidos' es generada.
 * En ese caso, MySQL la calcula sola y no se le puede asignar valor.
 */
function resultadoEsGenerada(PDO $db): bool
{
    $sql = "SELECT EXTRA FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'partidos'
              AND COLUMN_NAME = 'resultado'";
    $extra = $db->query($sql)->fetchColumn();
    return $extra !== false && stripos((string)$extra, 'GENERATED') !== false;
}

switch (metodo()) {

    // ── LEER ──────────────────────────────────────────────────
    case 'GET':
        if ($idGoles > 0) {
            // Goles de un partido concreto
            $stmt = $db->prepare('SELECT * FROM goles WHERE id_partido = ? ORDER BY minuto');
            $stmt->execute([$idGoles]);
            responder($stmt->fetchAll());
        }
        if ($id > 0) {
            // Un partido concreto (para el formulario de edición)
            $stmt = $db->prepare('SELECT * FROM partidos WHERE id_partido = ?');
            $stmt->execute([$id]);
            $partido = $stmt->fetch();
            if (!$partido) {
                error_api('Partido no encontrado.', 404);
            }
            responder($partido);
        }
        // Listado completo de partidos (vista que ordena por fecha descendente)
        responder($db->query('SELECT * FROM v_partidos')->fetchAll());
        break;

    // ── CREAR PARTIDO o GUARDAR GOLES ─────────────────────────
    case 'POST':
        // Caso A: guardar los goles de un partido
        if ($idGoles > 0) {
            $d     = cuerpoJSON();
            $goles = $d['goles'] ?? [];

            // Estrategia: borrar los goles actuales y reinsertar los recibidos
            $db->prepare('DELETE FROM goles WHERE id_partido = ?')->execute([$idGoles]);

            $stmt = $db->prepare('INSERT INTO goles (id_jugador, id_partido, minuto, tipo_gol) VALUES (?,?,?,?)');
            foreach ($goles as $g) {
                $jid = intval($g['id_jugador'] ?? 0);
                if ($jid > 0) {
                    $minuto = ($g['minuto'] ?? '') !== '' ? intval($g['minuto']) : null;
                    $tipo   = $g['tipo_gol'] ?? 'Normal';
                    $stmt->execute([$jid, $idGoles, $minuto, $tipo]);
                }
            }
            responder(['ok' => true, 'mensaje' => 'Goles registrados correctamente.']);
        }

        // Caso B: crear un partido nuevo
        $d     = cuerpoJSON();
        $rival = trim($d['rival'] ?? '');
        $fecha = $d['fecha'] ?? '';
        $hora  = ($d['hora'] ?? '') !== '' ? $d['hora'] : null;
        $lugar = trim($d['lugar'] ?? '');
        $tipo  = $d['tipo'] ?? 'Liga';
        $gf    = ($d['goles_favor']  ?? '') !== '' ? intval($d['goles_favor'])  : null;
        $gc    = ($d['goles_contra'] ?? '') !== '' ? intval($d['goles_contra']) : null;
        $obs   = trim($d['observaciones'] ?? '');

        if ($rival === '' || $fecha === '') {
            error_api('El rival y la fecha son obligatorios.');
        }

        $resultado = calcularResultado($gf, $gc);

        if (resultadoEsGenerada($db)) {
            // La columna se calcula sola: no la incluimos en el INSERT
            $stmt = $db->prepare('
                INSERT INTO partidos (rival, fecha, hora, lugar, tipo, goles_favor, goles_contra, observaciones)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([$rival, $fecha, $hora, $lugar, $tipo, $gf, $gc, $obs]);
        } else {
            $stmt = $db->prepare('
                INSERT INTO partidos (rival, fecha, hora, lugar, tipo, goles_favor, goles_contra, resultado, observaciones)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([$rival, $fecha, $hora, $lugar, $tipo, $gf, $gc, $resultado, $obs]);
        }

        responder(['ok' => true, 'mensaje' => 'Partido registrado correctamente.', 'id' => $db->lastInsertId()], 201);
        break;

    // ── ACTUALIZAR PARTIDO ────────────────────────────────────
    case 'PUT':
        if ($id <= 0) {
            error_api('Falta el identificador del partido.');
        }
        $d     = cuerpoJSON();
        $rival = trim($d['rival'] ?? '');
        $fecha = $d['fecha'] ?? '';
        $hora  = ($d['hora'] ?? '') !== '' ? $d['hora'] : null;
        $lugar = trim($d['lugar'] ?? '');
        $tipo  = $d['tipo'] ?? 'Liga';
        $gf    = ($d['goles_favor']  ?? '') !== '' ? intval($d['goles_favor'])  : null;
        $gc    = ($d['goles_contra'] ?? '') !== '' ? intval($d['goles_contra']) : null;
        $obs   = trim($d['observaciones'] ?? '');

        if ($rival === '' || $fecha === '') {
            error_api('El rival y la fecha son obligatorios.');
        }

        $resultado = calcularResultado($gf, $gc);

        if (resultadoEsGenerada($db)) {
            $stmt = $db->prepare('
                UPDATE partidos SET rival=?, fecha=?, hora=?, lugar=?, tipo=?,
                    goles_favor=?, goles_contra=?, observaciones=?
                WHERE id_partido=?
            ');
            $stmt->execute([$rival, $fecha, $hora, $lugar, $tipo, $gf, $gc, $obs, $id]);
        } else {
            $stmt = $db->prepare('
                UPDATE partidos SET rival=?, fecha=?, hora=?, lugar=?, tipo=?,
                    goles_favor=?, goles_contra=?, resultado=?, observaciones=?
                WHERE id_partido=?
            ');
            $stmt->execute([$rival, $fecha, $hora, $lugar, $tipo, $gf, $gc, $resultado, $obs, $id]);
        }

        responder(['ok' => true, 'mensaje' => 'Partido actualizado correctamente.']);
        break;

    // ── ELIMINAR PARTIDO ──────────────────────────────────────
    case 'DELETE':
        if ($id <= 0) {
            error_api('Falta el identificador del partido.');
        }
        // Al borrar el partido, sus goles se eliminan por la clave foránea ON DELETE CASCADE
        $db->prepare('DELETE FROM partidos WHERE id_partido = ?')->execute([$id]);
        responder(['ok' => true, 'mensaje' => 'Partido eliminado.']);
        break;

    default:
        error_api('Método no permitido.', 405);
}
