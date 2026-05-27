FROM php:8.2-apache

RUN docker-php-ext-install pdo pdo_mysql

RUN a2enmod rewrite

RUN sed -i 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# AÑADE ESTA LÍNEA (desactiva conflictos de MPM):
RUN a2dismod mpm_prefork && a2enmod mpm_worker