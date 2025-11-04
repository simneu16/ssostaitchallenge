FROM php:8.2-apache


WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pgsql pdo pdo_pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*


RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf


RUN a2enmod rewrite

ENV PORT=8080
RUN sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf

COPY . /var/www/html/


RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html


RUN echo "upload_max_filesize=20M" > /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size=20M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit=256M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_execution_time=60" >> /usr/local/etc/php/conf.d/uploads.ini


EXPOSE ${PORT}


CMD ["apache2-foreground"]
