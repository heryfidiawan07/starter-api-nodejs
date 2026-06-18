# Starter API — Node.js

REST API starter template menggunakan **Node.js + Express + TypeScript + TypeORM**, mendukung MySQL, PostgreSQL, SQLite, dan SQL Server.

## Fitur

- JWT Authentication (access + refresh token, disimpan di DB)
- Google & Facebook OAuth (raw HTTP, tanpa SDK)
- Role & Permission (category → menu → action)
- `is_root` bypass semua permission
- Soft delete, UUID primary key
- Ganti password, lupa password (email link)
- Upload foto profil (max 2MB, JPEG/PNG/WebP)
- Multi-database: MySQL, PostgreSQL, SQLite, SQL Server

## Struktur Direktori

```
nodejs/
├── src/
│   ├── config/          # Konfigurasi env
│   ├── database/        # DataSource TypeORM + seeder
│   ├── entity/          # Entity TypeORM
│   ├── middleware/       # JWT & permission middleware
│   ├── router/          # Route Express
│   ├── service/         # Business logic
│   └── main.ts          # Entry point
├── storage/photos/      # Foto yang di-upload
├── .env.example
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Persyaratan

- Node.js 18+
- npm 9+
- Database: MySQL 8+ / PostgreSQL 14+ / SQLite / SQL Server

---

## Menjalankan Lokal (Development)

### 1. Clone & setup environment

```bash
cp .env.example .env
# Edit .env sesuai konfigurasi lokal Anda
```

### 2. Install dependensi

```bash
npm install
```

### 3. Jalankan server

```bash
# Development (hot reload)
npm run dev

# Build & jalankan production
npm run build
npm start
```

Server berjalan di `http://localhost:8000`

### Environment Variables

| Variable | Default | Keterangan |
|---|---|---|
| `APP_PORT` | `8000` | Port server |
| `APP_URL` | `http://localhost:8000` | Base URL |
| `DB_DRIVER` | `mysql` | `mysql` / `postgres` / `sqlite` / `mssql` |
| `DB_HOST` | `127.0.0.1` | Host database |
| `DB_PORT` | `3306` | Port database |
| `DB_USER` | `root` | Username database |
| `DB_PASS` | _(kosong)_ | Password database |
| `DB_NAME` | `starter_api` | Nama database |
| `JWT_SECRET` | `secret` | Secret key JWT |
| `JWT_ACCESS_EXPIRE` | `15` | Expire access token (menit) |
| `JWT_REFRESH_EXPIRE` | `10080` | Expire refresh token (menit) |
| `EMAIL_VERIFICATION_REQUIRED` | `false` | Wajib verifikasi email |
| `MAIL_HOST` | _(kosong)_ | SMTP host |
| `MAIL_PORT` | `587` | SMTP port |
| `MAIL_USER` | _(kosong)_ | SMTP username |
| `MAIL_PASS` | _(kosong)_ | SMTP password |
| `MAIL_FROM` | `no-reply@example.com` | Alamat pengirim email |
| `GOOGLE_CLIENT_ID` | _(kosong)_ | Google OAuth client ID |
| `FACEBOOK_CLIENT_ID` | _(kosong)_ | Facebook OAuth client ID |
| `STORAGE_PATH` | `./storage/photos` | Direktori penyimpanan foto |

### Akun Default (setelah seeder)

| Field | Value |
|---|---|
| Email | `root@example.com` |
| Password | `password` |

---

## Deploy ke VPS (Production)

### 1. Build di lokal / CI

```bash
npm run build
```

### 2. Kirim file ke VPS

```bash
# Kirim hasil build + package.json
rsync -avz dist/ package*.json .env.production user@your-vps:/opt/starter-api-nodejs/

ssh user@your-vps
cd /opt/starter-api-nodejs
cp .env.production .env
npm ci --omit=dev
mkdir -p storage/photos
```

### 3. Buat systemd service

```bash
sudo nano /etc/systemd/system/starter-api-nodejs.service
```

```ini
[Unit]
Description=Starter API Node.js
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/starter-api-nodejs
ExecStart=/usr/bin/node dist/main.js
EnvironmentFile=/opt/starter-api-nodejs/.env
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable starter-api-nodejs
sudo systemctl start starter-api-nodejs
sudo systemctl status starter-api-nodejs
```

### 4. Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name api.example.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /storage/photos/ {
        alias /opt/starter-api-nodejs/storage/photos/;
        expires 30d;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.example.com
```

---

## Deploy dengan Docker

### 1. Build image

```bash
docker build -t starter-api-nodejs .
```

### 2. Jalankan container

```bash
docker run -d \
  --name starter-api-nodejs \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/storage:/app/storage \
  --restart unless-stopped \
  starter-api-nodejs
```

### 3. Menggunakan Docker Compose

```yaml
version: "3.9"

services:
  api:
    build: .
    container_name: starter-api-nodejs
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./storage:/app/storage
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    container_name: starter-api-db
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: starter_api
    volumes:
      - db_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  db_data:
```

```bash
# Set DB_HOST=db di .env
docker compose up -d
docker compose logs -f api
```

---

## API Endpoints

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | Register |
| POST | `/api/v1/auth/login` | — | Login |
| POST | `/api/v1/auth/logout` | ✓ | Logout |
| POST | `/api/v1/auth/refresh` | — | Refresh token |
| POST | `/api/v1/auth/revoke` | — | Revoke token |
| POST | `/api/v1/auth/forgot-password` | — | Kirim link reset |
| POST | `/api/v1/auth/reset-password` | — | Reset password |
| GET | `/api/v1/auth/verify-email?token=` | — | Verifikasi email |
| POST | `/api/v1/auth/change-password` | ✓ | Ganti password |
| GET | `/api/v1/auth/me` | ✓ | Profil sendiri |
| PUT | `/api/v1/profile` | ✓ | Update profil |
| POST | `/api/v1/profile/photo` | ✓ | Upload foto |
| POST | `/api/v1/auth/oauth/google` | — | Login Google |
| POST | `/api/v1/auth/oauth/facebook` | — | Login Facebook |
| GET | `/api/v1/users` | ✓ `user:index` | Daftar user |
| POST | `/api/v1/users` | ✓ `user:create` | Buat user |
| GET | `/api/v1/users/:id` | ✓ `user:show` | Detail user |
| PUT | `/api/v1/users/:id` | ✓ `user:edit` | Update user |
| DELETE | `/api/v1/users/:id` | ✓ `user:delete` | Hapus user |
| POST | `/api/v1/users/:id/photo` | ✓ `user:edit` | Upload foto user |
| GET | `/api/v1/roles` | ✓ `role:index` | Daftar role |
| POST | `/api/v1/roles` | ✓ `role:create` | Buat role |
| GET | `/api/v1/roles/:id` | ✓ `role:show` | Detail role |
| PUT | `/api/v1/roles/:id` | ✓ `role:edit` | Update role |
| DELETE | `/api/v1/roles/:id` | ✓ `role:delete` | Hapus role |
| GET | `/api/v1/permissions` | ✓ `permission:index` | Daftar permission |
| GET | `/api/v1/permissions/tree` | ✓ `permission:index` | Tree permission |
| GET | `/api/v1/permissions/by-role/:id` | ✓ `permission:index` | Permission by role |

## Format Response

```json
{
  "success": true,
  "message": "Data retrieved",
  "data": {},
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 100,
    "total_page": 10
  }
}
```
