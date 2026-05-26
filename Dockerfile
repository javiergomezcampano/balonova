# Imagen base: PHP 8.2 con Apache incluido
FROM php:8.2-apache

# Instalar extensión de MySQL para PHP (necesaria para PDO)
RUN docker-php-ext-install pdo pdo_mysql

# Habilitar mod_rewrite de Apache (necesario para URLs limpias en el futuro)
RUN a2enmod rewrite

# Configurar Apache para permitir .htaccess en /var/www/html
RUN sed -i 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# El código fuente se monta como volumen desde docker-compose,
# no se copia aquí para que los cambios en src/ se reflejen en tiempo real.
