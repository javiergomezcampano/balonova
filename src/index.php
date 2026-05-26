<?php
/**
 * index.php (raíz)
 * Redirige la raíz del sitio a la carpeta public/, donde reside el frontend.
 * Así, al entrar en http://localhost:8080/ el usuario llega directamente
 * a la pantalla de acceso.
 */
header('Location: public/index.html');
exit;
