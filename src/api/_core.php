<?php
/**
 * api/_core.php
 * Utilidades comunes a todos los endpoints de la API.
 *
 * Cada endpoint (jugadores.php, partidos.php, etc.) incluye este fichero al
 * principio. Aquí se centraliza:
 *   - El arranque de la sesión (para el control de acceso).
 *   - La cabecera de respuesta JSON.
 *   - Las funciones de ayuda para leer la petición y enviar la respuesta.
 *   - La comprobación de que el usuario ha iniciado sesión.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

// Arrancar la sesión para poder comprobar el login
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Todas las respuestas de la API son JSON con codificación UTF-8
header('Content-Type: application/json; charset=utf-8');

/**
 * Devuelve el método HTTP de la petición (GET, POST, PUT, DELETE...).
 */
function metodo(): string
{
    return $_SERVER['REQUEST_METHOD'];
}

/**
 * Lee el cuerpo de la petición en formato JSON y lo convierte en array.
 * Lo usan las peticiones POST y PUT que envían datos desde fetch().
 *
 * @return array
 */
function cuerpoJSON(): array
{
    $crudo = file_get_contents('php://input');
    if ($crudo === '' || $crudo === false) {
        return [];
    }
    $datos = json_decode($crudo, true);
    return is_array($datos) ? $datos : [];
}

/**
 * Envía una respuesta JSON con el código de estado indicado y termina.
 *
 * @param mixed $datos   Contenido a enviar (array u objeto).
 * @param int   $codigo  Código HTTP (200 por defecto).
 */
function responder($datos, int $codigo = 200): void
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Envía un error en formato JSON y termina.
 *
 * @param string $mensaje  Texto del error (genérico, sin detalles técnicos).
 * @param int    $codigo   Código HTTP (400 por defecto).
 */
function error_api(string $mensaje, int $codigo = 400): void
{
    responder(['error' => $mensaje], $codigo);
}

/**
 * Comprueba que el usuario ha iniciado sesión.
 * Si no, corta la ejecución con un 401 (no autorizado).
 * Protege los endpoints que modifican o exponen datos sensibles.
 */
function exigirLogin(): void
{
    if (empty($_SESSION['usuario_id'])) {
        error_api('No autorizado. Inicia sesión.', 401);
    }
}
