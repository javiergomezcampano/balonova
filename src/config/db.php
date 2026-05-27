<?php
/**
 * config/db.php
 * En Railway las credenciales vienen como variables de entorno.
 * En local usa los valores por defecto del docker-compose.
 */

define('DB_HOST',    getenv('MYSQLHOST')     ?: 'db');
define('DB_PORT',    getenv('MYSQLPORT')     ?: '3306');
define('DB_NAME',    getenv('MYSQLDATABASE') ?: 'balonova');
define('DB_USER',    getenv('MYSQLUSER')     ?: 'balonova_user');
define('DB_PASS',    getenv('MYSQLPASSWORD') ?: 'balonova_pass');
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
        );

        $opciones = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $opciones);
        } catch (PDOException $e) {
            error_log('[Balonova] Error de conexión: ' . $e->getMessage());
            http_response_code(500);
            die(json_encode(['error' => 'No se pudo conectar con la base de datos.']));
        }
    }

    return $pdo;
}