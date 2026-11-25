# SIAK Kelurahan — Laravel 11.57.0 & Filament v5.10.1

Sistem Informasi Administrasi Kependudukan berbasis **NIK sebagai Primary Key** dengan pembagian hak akses bertingkat:

- **ADMIN**: All Access (Manajemen User, RW, RT, dan seluruh Data Warga)
- **RT**: CRUD seluruh data warga
- **RW**: Melihat data 1 RT dalam wilayah RW-nya (Read-Only)
- **LURAH**: Melihat data per RW di tingkat kelurahan (Read-Only)

## Instalasi Lokal (PHP 8.2+ & Composer)

```bash
composer create-project laravel/laravel:^11.57.0 siak-kelurahan
cd siak-kelurahan
composer require filament/filament:^5.10.1
php artisan filament:install --panels
```

Salin seluruh file dari arsip ini ke direktori proyek Laravel Anda, lalu jalankan:

```bash
php artisan migrate --seed
php artisan serve
```

Buka `http://127.0.0.1:8000/admin` dan login menggunakan salah satu akun seeder (kata sandi default: `password123`):
- Admin: `admin@kelurahan.go.id`
- RT: `rt01.rw01@kelurahan.go.id`
- RW: `rw01@kelurahan.go.id`
- Lurah: `lurah@kelurahan.go.id`
