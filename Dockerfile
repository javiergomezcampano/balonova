FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Instalar Apache, PHP y extensiones en un solo paso limpio
RUN apt-get update && apt-get install -y \
    apache2 \
    php8.1 \
    php8.1-mysql \
    php8.1-pdo \
    libapache2-mod-php8.1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Activar solo lo necesario
RUN a2enmod rewrite php8.1

# Configurar Apache
RUN echo '<Directory /var/www/html>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/balonova.conf \
    && a2enconf balonova

# Copiar código fuente
COPY src/ /var/www/html/

# Permisos
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

CMD ["apachectl", "-D", "FOREGROUND"]