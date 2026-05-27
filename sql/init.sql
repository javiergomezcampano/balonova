-- ============================================================
-- init.sql — Esquema de base de datos Balonova
-- Se ejecuta automáticamente al crear el contenedor MySQL
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

USE balonova;

-- ── Tabla USUARIOS ───────────────────────────────────────────
-- Gestiona el acceso al sistema (login/sesión)
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario   INT          NOT NULL AUTO_INCREMENT,
    nombre       VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,        -- bcrypt, nunca texto plano
    rol          ENUM('admin','editor') NOT NULL DEFAULT 'editor',
    ultimo_acceso DATETIME    DEFAULT NULL,
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tabla JUGADORES ──────────────────────────────────────────
-- Un jugador pertenece al equipo y puede marcar goles
CREATE TABLE IF NOT EXISTS jugadores (
    id_jugador   INT          NOT NULL AUTO_INCREMENT,
    nombre       VARCHAR(100) NOT NULL,
    apellidos    VARCHAR(150) NOT NULL,
    dorsal       TINYINT UNSIGNED NOT NULL,
    posicion     ENUM('Portero','Extremo','Lateral','Pivote','Central') NOT NULL,
    estado_fisico ENUM('Disponible','Lesionado','Duda','Baja') NOT NULL DEFAULT 'Disponible',
    fecha_nac    DATE         DEFAULT NULL,
    foto         VARCHAR(255) DEFAULT NULL,     -- ruta relativa: assets/img/jugadores/
    activo       TINYINT(1)  NOT NULL DEFAULT 1, -- 0 = dado de baja
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_jugador),
    UNIQUE KEY uq_dorsal (dorsal)               -- no puede haber dos con el mismo número
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tabla PARTIDOS ───────────────────────────────────────────
-- Un partido puede tener muchos goles (relación 1:N con GOLES)
CREATE TABLE IF NOT EXISTS partidos (
    id_partido   INT          NOT NULL AUTO_INCREMENT,
    rival        VARCHAR(150) NOT NULL,
    fecha        DATE         NOT NULL,
    hora         TIME         DEFAULT NULL,
    lugar        VARCHAR(200) DEFAULT NULL,
    tipo         ENUM('Liga','Copa','Amistoso') NOT NULL DEFAULT 'Liga',
    goles_favor  TINYINT UNSIGNED DEFAULT NULL, -- NULL = partido no jugado aún
    goles_contra TINYINT UNSIGNED DEFAULT NULL,
    resultado    ENUM('Victoria','Empate','Derrota') GENERATED ALWAYS AS (
                    CASE
                        WHEN goles_favor IS NULL THEN NULL
                        WHEN goles_favor > goles_contra THEN 'Victoria'
                        WHEN goles_favor = goles_contra THEN 'Empate'
                        ELSE 'Derrota'
                    END
                 ) STORED,                      -- columna calculada automáticamente
    observaciones TEXT DEFAULT NULL,
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_partido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tabla GOLES ──────────────────────────────────────────────
-- Tabla intermedia entre JUGADORES y PARTIDOS (N:M → 1:N + 1:N)
-- Un gol pertenece a un jugador y a un partido
CREATE TABLE IF NOT EXISTS goles (
    id_gol       INT          NOT NULL AUTO_INCREMENT,
    id_jugador   INT          NOT NULL,
    id_partido   INT          NOT NULL,
    minuto       TINYINT UNSIGNED DEFAULT NULL,
    tipo_gol     ENUM('Normal','Penalti','Propia puerta') NOT NULL DEFAULT 'Normal',
    PRIMARY KEY (id_gol),
    -- Claves foráneas: si se borra un jugador/partido, sus goles se borran también
    CONSTRAINT fk_gol_jugador FOREIGN KEY (id_jugador)
        REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
    CONSTRAINT fk_gol_partido FOREIGN KEY (id_partido)
        REFERENCES partidos(id_partido)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- DATOS DE EJEMPLO (para desarrollo y pruebas)
-- ============================================================

-- Usuario administrador (password: admin1234 — hash bcrypt verificado)
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Javier Gómez', 'admin@balonova.com',
 '$2b$10$jV.6ACbcH932WCvXupH60e8jggjktmiBhcm8vSLy5DKMVA3uB77bO', 'admin');

-- Plantilla de jugadores
INSERT INTO jugadores (nombre, apellidos, dorsal, posicion, estado_fisico, fecha_nac) VALUES
('Carlos',  'López Martínez',   1,  'Portero',  'Disponible', '1998-03-12'),
('Marcos',  'Díaz Ruiz',        5,  'Extremo',  'Disponible', '2000-07-22'),
('Adrián',  'Ruiz García',      7,  'Lateral',  'Lesionado',  '1999-11-05'),
('Pablo',   'García Sánchez',   9,  'Extremo',  'Disponible', '2001-02-18'),
('Sergio',  'Martín Torres',    11, 'Pivote',   'Duda',       '1997-09-30'),
('Javier',  'Torres Fernández', 14, 'Lateral',  'Disponible', '2002-04-14'),
('David',   'Sánchez Moreno',   17, 'Extremo',  'Disponible', '2000-12-01'),
('Raúl',    'Fernández Jiménez',20, 'Pivote',   'Lesionado',  '1996-06-25'),
('Óscar',   'Moreno López',     23, 'Lateral',  'Disponible', '2001-08-09'),
('Iván',    'Jiménez Díaz',     26, 'Extremo',  'Disponible', '1999-01-17');

-- Partidos de la temporada
INSERT INTO partidos (rival, fecha, hora, lugar, tipo, goles_favor, goles_contra) VALUES
('CD Valladolid',  '2026-04-05', '18:00', 'Pabellón Municipal', 'Liga',     32, 28),
('BM Salamanca',   '2026-03-31', '19:30', 'Pabellón Heliodoro', 'Copa',     30, 30),
('BM Ávila',       '2026-03-24', '18:00', 'Pabellón Municipal', 'Liga',     35, 31),
('CD Segovia',     '2026-03-17', '17:00', 'Pabellón Segovia',   'Liga',     29, 24),
('Club Burgos',    '2026-03-10', '18:00', 'Pabellón Municipal', 'Amistoso', 27, 31),
('CB Palencia',    '2026-03-03', '19:00', 'Pabellón Palencia',  'Liga',     33, 27),
('BM Zamora',      '2026-04-12', '18:00', 'Pabellón Municipal', 'Liga',     NULL, NULL);

-- Goles del partido 1 (Balonova 32 - CD Valladolid 28)
INSERT INTO goles (id_jugador, id_partido, minuto, tipo_gol) VALUES
(2,1, 3,  'Normal'), (4,1, 7,  'Normal'), (6,1, 12, 'Normal'),
(7,1, 15, 'Normal'), (9,1, 19, 'Normal'), (10,1,23, 'Normal'),
(2,1, 28, 'Penalti'),(4,1, 33, 'Normal'), (6,1, 38, 'Normal'),
(7,1, 42, 'Normal'), (9,1, 47, 'Normal'), (10,1,51, 'Normal'),
(2,1, 55, 'Normal'), (4,1, 59, 'Normal'), (6,1, 63, 'Normal');

-- Goles del partido 2 (Balonova 30 - BM Salamanca 30)
INSERT INTO goles (id_jugador, id_partido, minuto, tipo_gol) VALUES
(2,2, 5,  'Normal'), (4,2, 10, 'Normal'), (7,2, 18, 'Normal'),
(9,2, 25, 'Penalti'),(10,2,31, 'Normal'), (2,2, 38, 'Normal'),
(4,2, 44, 'Normal'), (6,2, 49, 'Normal'), (7,2, 55, 'Normal'),
(9,2, 58, 'Normal');

-- ============================================================
-- VISTAS ÚTILES (consultas frecuentes pre-calculadas)
-- ============================================================

-- Vista: ranking de goleadores de la temporada
CREATE OR REPLACE VIEW v_goleadores AS
    SELECT
        j.id_jugador,
        CONCAT(j.nombre, ' ', j.apellidos) AS jugador,
        j.dorsal,
        j.posicion,
        COUNT(g.id_gol)  AS total_goles,
        COUNT(DISTINCT g.id_partido) AS partidos_con_gol
    FROM jugadores j
    LEFT JOIN goles g ON j.id_jugador = g.id_jugador
    WHERE j.activo = 1
    GROUP BY j.id_jugador
    ORDER BY total_goles DESC;

-- Vista: resumen de partidos con resultado legible
CREATE OR REPLACE VIEW v_partidos AS
    SELECT
        p.id_partido,
        p.rival,
        p.fecha,
        p.hora,
        p.lugar,
        p.tipo,
        p.goles_favor,
        p.goles_contra,
        p.resultado,
        COUNT(g.id_gol) AS goles_registrados
    FROM partidos p
    LEFT JOIN goles g ON p.id_partido = g.id_partido
    GROUP BY p.id_partido
    ORDER BY p.fecha DESC;