<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';


if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

//  respuestas de la API son JSON con UTF-8
header('Content-Type: application/json; charset=utf-8');

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
 * @param mixed $datos   Contenido a enviar
 * @param int   $codigo  Código HTTP
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
 * @param string $mensaje  Texto del error
 * @param int    $codigo   Código HTTP 
 */
function error_api(string $mensaje, int $codigo = 400): void
{
    responder(['error' => $mensaje], $codigo);
}

/**
  * Comprueba que el usuario ha iniciado sesion
 */
function exigirLogin(): void
{
    if (empty($_SESSION['usuario_id'])) {
        error_api('No autorizado. Inicia sesión.', 401);
    }
}

function exigirAdmin(): void
{
    exigirLogin();
    if (($_SESSION['usuario_rol'] ?? '') !== 'admin') {
        error_api('No autorizado. Se requiere rol de administrador.', 403);
    }
}
