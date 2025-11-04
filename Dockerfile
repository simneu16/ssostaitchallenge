FROM php:8.1-cli

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libonig-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install mysqli

WORKDIR /app
COPY . /app

EXPOSE 10000
CMD ["php", "-S", "0.0.0.0:10000"]
