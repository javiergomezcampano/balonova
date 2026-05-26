<?php
/**
 * config/db.php
 * Conexión a la base de datos mediante PDO.
 * Patrón Singleton: una sola instancia por petición HTTP.
 *
 * NOTA SOBRE LA ARQUITECTURA:
 * En esta versión del proyecto, PHP actúa exclusivamente como API REST.
 * Su única responsabilidad es hablar con MySQL y devolver datos en JSON.
 * Toda la interfaz y la lógica de interacción se construyen en el navegador
 * con JavaScript (fetch + DOM).
 */

// Credenciales — en Docker, el host es el nombre del servicio
define('DB_HOST',    'db');
define('DB_NAME',    'balonova');
define('DB_USER',    'balonova_user');
define('DB_PASS',    'balonova_pass');
define('DB_CHARSET', 'utf8mb4');

/**
 * Devuelve la instancia PDO activa.
 * Si aún no existe, la crea con las opciones recomendadas.
 *
 * @return PDO
 */
function getDB(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );

        $opciones = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,  // Lanza excepciones
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,        // Arrays asociativos
            PDO::ATTR_EMULATE_PREPARES   => false,                   // Preparadas nativas
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $opciones);
        } catch (PDOException $e) {
            // Nunca mostrar el error real al usuario: se devuelve JSON genérico
            error_log('[Balonova] Error de conexión: ' . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'No se pudo conectar con la base de datos.']);
            exit;
        }
    }

    return $pdo;
}
