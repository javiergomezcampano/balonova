FROM php:8.2-apache

# Instalar extensión MySQL para PDO
RUN docker-php-ext-install pdo pdo_mysql

# Desactivar todos los MPM y activar solo prefork (el más compatible)
RUN apt-get update && apt-get install -y apache2 && \
    a2dismod mpm_event mpm_worker 2>/dev/null || true && \
    a2enmod mpm_prefork && \
    a2enmod rewrite

# Configurar Apache
RUN echo '<Directory /var/www/html>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

# Copiar código fuente
COPY src/ /var/www/html/

# Permisos
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]