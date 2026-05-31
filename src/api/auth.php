<?php
/**
 * api/auth.php
 * Endpoint de autenticación.
 *
 * Acciones (parámetro ?accion=):
 *   - login   (POST): recibe email y password en JSON, verifica con bcrypt
 *                     y crea la sesión. Devuelve los datos del usuario.
 *   - logout  (POST): destruye la sesión.
 *   - sesion  (GET) : informa de si hay sesión activa y de quién es.
 *
 * El login se mantiene en PHP con sesiones por seguridad: las contraseñas
 * y la identidad del usuario nunca se gestionan en el lado del cliente.
 */

require_once __DIR__ . '/_core.php';

$accion = $_GET['accion'] ?? '';
$db     = getDB();

switch ($accion) {

    // ── COMPROBAR SESIÓN ──────────────────────────────────────
    case 'sesion':
        if (!empty($_SESSION['usuario_id'])) {
            responder([
                'autenticado' => true,
                'usuario' => [
                    'id'     => $_SESSION['usuario_id'],
                    'nombre' => $_SESSION['usuario_nombre'],
                    'email'  => $_SESSION['usuario_email'],
                    'rol'    => $_SESSION['usuario_rol'],
                ],
            ]);
        }
        responder(['autenticado' => false]);
        break;

    // ── LOGIN ─────────────────────────────────────────────────
    case 'login':
        if (metodo() !== 'POST') {
            error_api('Método no permitido.', 405);
        }

        $datos    = cuerpoJSON();
        $email    = trim($datos['email']    ?? '');
        $password = trim($datos['password'] ?? '');

        if ($email === '' || $password === '') {
            error_api('Por favor, rellena todos los campos.');
        }

        $stmt = $db->prepare('SELECT * FROM usuarios WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $usuario = $stmt->fetch();

        // Verificar la contraseña frente al hash bcrypt almacenado
        if ($usuario && password_verify($password, $usuario['password_hash'])) {
            $_SESSION['usuario_id']     = $usuario['id_usuario'];
            $_SESSION['usuario_nombre'] = $usuario['nombre'];
            $_SESSION['usuario_email']  = $usuario['email'];
            $_SESSION['usuario_rol']    = $usuario['rol'];

            // Registrar el último acceso
            $db->prepare('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?')
               ->execute([$usuario['id_usuario']]);

            responder([
                'ok' => true,
                'usuario' => [
                    'nombre' => $usuario['nombre'],
                    'email'  => $usuario['email'],
                    'rol'    => $usuario['rol'],
                ],
            ]);
        }

        
        error_api('Email o contraseña incorrectos.', 401);
        break;

    // ── LISTAR USUARIOS (solo admin) ──────────────────────────
    case 'usuarios':
        exigirAdmin();
        // no se duelve el hash al cliente
        $usuarios = $db->query('
            SELECT id_usuario, nombre, email, rol, ultimo_acceso, created_at
            FROM usuarios
            ORDER BY created_at ASC
        ')->fetchAll();
        responder($usuarios);
        break;

    // ── REGISTRAR NUEVO USUARIO (solo admin) ──────────────────
    case 'registro':
        if (metodo() !== 'POST') {
            error_api('Método no permitido.', 405);
        }
        exigirAdmin();

        $datos    = cuerpoJSON();
        $nombre   = trim($datos['nombre']   ?? '');
        $email    = trim($datos['email']    ?? '');
        $password = (string)($datos['password'] ?? '');
        $rol      = ($datos['rol'] ?? 'editor') === 'admin' ? 'admin' : 'editor';

        if ($nombre === '' || $email === '' || $password === '') {
            error_api('Por favor, rellena todos los campos.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            error_api('El email no tiene un formato válido.');
        }
        if (strlen($password) < 8) {
            error_api('La contraseña debe tener al menos 8 caracteres.');
        }

        // La contraseña nunca se guarda en texto plano: se almacena su hash bcrypt
        $hash = password_hash($password, PASSWORD_BCRYPT);

        try {
            $stmt = $db->prepare('
                INSERT INTO usuarios (nombre, email, password_hash, rol)
                VALUES (?, ?, ?, ?)
            ');
            $stmt->execute([$nombre, $email, $hash, $rol]);
        } catch (PDOException $e) {
            // El email es único: si ya existe, MySQL lanza eeror
            if ($e->getCode() === '23000') {
                error_api('Ya existe un usuario con ese email.', 409);
            }
            error_api('No se pudo registrar el usuario.', 500);
        }

        responder([
            'ok'      => true,
            'mensaje' => 'Usuario registrado correctamente.',
            'id'      => $db->lastInsertId(),
        ], 201);
        break;

    // ── LOGOUT ────────────────────────────────────────────────
    case 'logout':
        session_unset();
        session_destroy();
        responder(['ok' => true]);
        break;

    default:
        error_api('Acción no reconocida.', 404);
}
