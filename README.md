# Balonova — Versión con frontend en JavaScript

Gestor de equipo de balonmano (jugadores, partidos, goles y estadísticas).

Esta versión reestructura el proyecto separando claramente el **backend** y el
**frontend**:

- **PHP** actúa únicamente como **API REST**: recibe peticiones, habla con MySQL
  mediante PDO (sentencias preparadas) y devuelve datos en **JSON**. No genera
  HTML.
- **JavaScript** (vanilla, sin frameworks) construye toda la interfaz en el
  navegador y consume la API con `fetch()`, manipulando el DOM.

## Estructura de carpetas

```
balonova/
├── docker-compose.yml
├── Dockerfile
├── sql/
│   └── init.sql                # Esquema y datos de ejemplo
└── src/
    ├── index.php               # Redirige a public/
    ├── config/
    │   └── db.php              # Conexión PDO (Singleton)
    ├── api/                     # ── BACKEND: API REST (solo JSON) ──
    │   ├── _core.php           # Utilidades comunes (sesión, JSON, login)
    │   ├── auth.php            # login / logout / comprobar sesión
    │   ├── jugadores.php       # CRUD de jugadores (GET/POST/PUT/DELETE)
    │   ├── partidos.php        # CRUD de partidos + goles
    │   ├── stats.php           # Ranking, balance y goles por mes
    │   └── inicio.php          # Datos del panel principal
    └── public/                  # ── FRONTEND: HTML + JS + CSS ──
        ├── index.html          # Pantalla de login
        ├── app.html            # Aplicación principal (una sola página)
        ├── css/
        │   └── main.css        # Estilos (sin cambios respecto a la versión anterior)
        └── js/
            ├── api.js          # Cliente fetch centralizado
            ├── ui.js           # Utilidades (escapar texto, avisos, fechas)
            ├── login.js        # Lógica del login
            ├── app.js          # Arranque, sesión y menú
            ├── inicio.js       # Vista del dashboard
            ├── jugadores.js    # CRUD de jugadores en el cliente
            ├── partidos.js     # CRUD de partidos y goles
            └── stats.js        # Vista de estadísticas
```

## Cómo se comunican frontend y backend

1. El usuario interactúa con la interfaz (botones, formularios) en el navegador.
2. El JavaScript captura el evento y llama a una función de `api.js`.
3. `api.js` hace un `fetch()` al endpoint PHP correspondiente, enviando o
   recibiendo JSON.
4. El endpoint PHP consulta MySQL y devuelve un JSON.
5. El JavaScript recibe el JSON y actualiza la pantalla manipulando el DOM,
   **sin recargar la página**.

## API REST (resumen)

| Recurso     | Método | Ruta                              | Acción                       |
|-------------|--------|-----------------------------------|------------------------------|
| Auth        | POST   | `api/auth.php?accion=login`       | Iniciar sesión               |
| Auth        | POST   | `api/auth.php?accion=logout`      | Cerrar sesión                |
| Auth        | GET    | `api/auth.php?accion=sesion`      | Comprobar sesión activa      |
| Jugadores   | GET    | `api/jugadores.php`               | Listar plantilla             |
| Jugadores   | GET    | `api/jugadores.php?id=N`          | Obtener un jugador           |
| Jugadores   | POST   | `api/jugadores.php`               | Crear jugador                |
| Jugadores   | PUT    | `api/jugadores.php?id=N`          | Editar jugador               |
| Jugadores   | DELETE | `api/jugadores.php?id=N`          | Baja lógica                  |
| Partidos    | GET    | `api/partidos.php`                | Listar partidos              |
| Partidos    | POST   | `api/partidos.php`                | Crear partido                |
| Partidos    | PUT    | `api/partidos.php?id=N`           | Editar partido               |
| Partidos    | DELETE | `api/partidos.php?id=N`           | Eliminar partido             |
| Goles       | GET    | `api/partidos.php?goles=N`        | Goles de un partido          |
| Goles       | POST   | `api/partidos.php?goles=N`        | Guardar goles de un partido  |
| Estadísticas| GET    | `api/stats.php`                   | Ranking, balance, goles/mes  |
| Inicio      | GET    | `api/inicio.php`                  | Datos del dashboard          |

## Puesta en marcha

```bash
docker compose up -d        # Levanta web (PHP/Apache), db (MySQL) y phpMyAdmin
```

- Aplicación: http://localhost:8080  (redirige a `public/index.html`)
- phpMyAdmin: http://localhost:8081

Usuario de prueba: `admin@balonova.com` / `admin1234`

## Seguridad

- Contraseñas cifradas con **bcrypt** (nunca en texto plano).
- Todas las consultas usan **sentencias preparadas** (PDO) → sin inyección SQL.
- **Validación en el servidor** además de en el cliente.
- **Control de acceso** por sesión: los endpoints de datos exigen login.
- El frontend **escapa el HTML** antes de insertar texto en el DOM (anti-XSS).
