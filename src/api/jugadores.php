<?php
/**
 * api/jugadores.php
 * API REST para la gestión de jugadores.
 *
 * Métodos HTTP:
 *   GET    ?id=N   → devuelve un jugador concreto
 *   GET            → devuelve el listado de jugadores activos (con sus goles)
 *   POST           → crea un jugador nuevo (datos en JSON)
 *   PUT    ?id=N   → actualiza un jugador existente (datos en JSON)
 *   DELETE ?id=N   → da de baja lógica al jugador (activo = 0)
 *
 * Todas las operaciones exigen sesión iniciada y usan sentencias preparadas.
 */

require_once __DIR__ . '/_core.php';

exigirLogin();              // Ningún acceso sin login
$db = getDB();
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

switch (metodo()) {

    // ── LEER ──────────────────────────────────────────────────
    case 'GET':
        if ($id > 0) {
            // Un jugador concreto (para precargar el formulario de edición)
            $stmt = $db->prepare('SELECT * FROM jugadores WHERE id_jugador = ?');
            $stmt->execute([$id]);
            $jugador = $stmt->fetch();
            if (!$jugador) {
                error_api('Jugador no encontrado.', 404);
            }
            responder($jugador);
        }

        // Listado completo de la plantilla activa, con el total de goles
        $jugadores = $db->query('
            SELECT j.*, COUNT(g.id_gol) AS total_goles
            FROM jugadores j
            LEFT JOIN goles g ON j.id_jugador = g.id_jugador
            WHERE j.activo = 1
            GROUP BY j.id_jugador
            ORDER BY j.dorsal ASC
        ')->fetchAll();
        responder($jugadores);
        break;

    // ── CREAR ─────────────────────────────────────────────────
    case 'POST':
        $d         = cuerpoJSON();
        $nombre    = trim($d['nombre']        ?? '');
        $apellidos = trim($d['apellidos']     ?? '');
        $dorsal    = intval($d['dorsal']      ?? 0);
        $posicion  = $d['posicion']           ?? 'Portero';
        $estado    = $d['estado_fisico']      ?? 'Disponible';
        $fecha     = $d['fecha_nac']          ?? null;

        // Validación en el servidor (nunca confiar solo en el cliente)
        if ($nombre === '' || $apellidos === '' || $dorsal <= 0) {
            error_api('Nombre, apellidos y dorsal son obligatorios.');
        }

        try {
            $stmt = $db->prepare('
                INSERT INTO jugadores (nombre, apellidos, dorsal, posicion, estado_fisico, fecha_nac)
                VALUES (?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([$nombre, $apellidos, $dorsal, $posicion, $estado, $fecha ?: null]);
        } catch (PDOException $e) {
            // El dorsal es único: si se repite, MySQL lanza el error 23000
            if ($e->getCode() === '23000') {
                error_api('Ya existe un jugador con ese dorsal.', 409);
            }
            error_api('No se pudo guardar el jugador.', 500);
        }

        responder(['ok' => true, 'mensaje' => 'Jugador añadido correctamente.', 'id' => $db->lastInsertId()], 201);
        break;

    // ── ACTUALIZAR ────────────────────────────────────────────
    case 'PUT':
        if ($id <= 0) {
            error_api('Falta el identificador del jugador.');
        }
        $d         = cuerpoJSON();
        $nombre    = trim($d['nombre']        ?? '');
        $apellidos = trim($d['apellidos']     ?? '');
        $dorsal    = intval($d['dorsal']      ?? 0);
        $posicion  = $d['posicion']           ?? 'Portero';
        $estado    = $d['estado_fisico']      ?? 'Disponible';
        $fecha     = $d['fecha_nac']          ?? null;

        if ($nombre === '' || $apellidos === '' || $dorsal <= 0) {
            error_api('Nombre, apellidos y dorsal son obligatorios.');
        }

        try {
            $stmt = $db->prepare('
                UPDATE jugadores
                SET nombre=?, apellidos=?, dorsal=?, posicion=?, estado_fisico=?, fecha_nac=?
                WHERE id_jugador=?
            ');
            $stmt->execute([$nombre, $apellidos, $dorsal, $posicion, $estado, $fecha ?: null, $id]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                error_api('Ya existe un jugador con ese dorsal.', 409);
            }
            error_api('No se pudo actualizar el jugador.', 500);
        }

        responder(['ok' => true, 'mensaje' => 'Jugador actualizado correctamente.']);
        break;

    // ── DAR DE BAJA (baja lógica) ─────────────────────────────
    case 'DELETE':
        if ($id <= 0) {
            error_api('Falta el identificador del jugador.');
        }
        // No se borra el registro: se marca como inactivo para preservar el histórico de goles
        $db->prepare('UPDATE jugadores SET activo = 0 WHERE id_jugador = ?')->execute([$id]);
        responder(['ok' => true, 'mensaje' => 'Jugador dado de baja.']);
        break;

    default:
        error_api('Método no permitido.', 405);
}
