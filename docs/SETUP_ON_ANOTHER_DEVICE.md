# CampusGo Web – Setup on Another Computer

Use this guide to get the CampusGo Laravel + Inertia (React) app running on a new machine.

---

## 1. Prerequisites

Install these on the other computer:

| Requirement | Version | Notes |
|-------------|---------|--------|
| **PHP** | 8.2 or higher | With extensions: `ctype`, `curl`, `dom`, `fileinfo`, `json`, `mbstring`, `openssl`, `pdo`, `tokenizer`, `xml`, `sqlite3` (or `pdo_mysql` if using MySQL) |
| **Composer** | 2.x | [getcomposer.org](https://getcomposer.org/) |
| **Node.js** | 18+ (LTS recommended) | [nodejs.org](https://nodejs.org/) – includes npm |
| **Database** | SQLite (default) or MySQL/MariaDB | SQLite needs no extra install; for MySQL use XAMPP, Laravel Herd, or a local MySQL server |

Check versions:

```bash
php -v
composer -V
node -v
npm -v
```

---

## 2. Get the Code

**Option A – Clone (if using Git)**

```bash
git clone <repository-url> CampusGoWeb
cd CampusGoWeb
```

**Option B – Copy the project folder**

Copy the entire project folder (e.g. `CampusGoWeb`) to the new computer, then open a terminal in that folder:

```bash
cd path/to/CampusGoWeb
```

---

## 3. Install Dependencies & Environment

### 3.1 PHP dependencies (Composer)

```bash
composer install
```

### 3.2 Environment file

Create `.env` from the example (if it doesn’t exist):

**Windows (PowerShell):**

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Generate the application key:

```bash
php artisan key:generate
```

### 3.3 Database (SQLite – default)

The default `.env` uses SQLite. Create the database file:

**Windows (PowerShell):**

```powershell
New-Item -ItemType File -Path database\database.sqlite -Force
```

**macOS / Linux:**

```bash
touch database/database.sqlite
```

Run migrations:

```bash
php artisan migrate
```

**Using MySQL instead**

1. Create a database (e.g. `campusgo_db`).
2. In `.env` set:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=campusgo_db
   DB_USERNAME=root
   DB_PASSWORD=your_password
   ```
3. Run:
   ```bash
   php artisan migrate
   ```

### 3.4 Node dependencies and frontend build

```bash
npm install
npm run build
```

### 3.5 Generate route helpers (Wayfinder)

So the frontend has correct route helpers (e.g. `login()`, `register()`):

```bash
php artisan wayfinder:generate
```

---

## 4. Run the Application

### Option A – One command (recommended for development)

Starts PHP server, queue worker, and Vite dev server together:

```bash
composer dev
```

Then open: **http://localhost:8000** (or the URL shown in the terminal).  
Vite usually runs on port 5173; the Laravel app will load assets from it automatically.

### Option B – Manual (separate terminals)

**Terminal 1 – Laravel:**

```bash
php artisan serve
```

**Terminal 2 – Vite (frontend):**

```bash
npm run dev
```

**Terminal 3 – Queue (for jobs):**

```bash
php artisan queue:listen --tries=1
```

Then open **http://localhost:8000**.

---

## 5. Optional: Run Tests

```bash
composer test
```

Or with Pest directly:

```bash
./vendor/bin/pest
```

---

## 6. Quick reference – all setup commands (fresh clone)

Run these in order on a **new machine** after cloning or copying the project:

```bash
composer install
cp -n .env.example .env
php artisan key:generate
# If SQLite: create database/database.sqlite (see step 3.3)
php artisan migrate
npm install
npm run build
php artisan wayfinder:generate
```

Then start the app:

```bash
composer dev
```

---

## 7. Optional: SSR (server-side rendering)

If you use Inertia SSR:

1. Build SSR assets once:
   ```bash
   npm run build:ssr
   ```
2. Start the full dev stack including SSR:
   ```bash
   composer dev:ssr
   ```
3. Ensure `config/inertia.php` has the correct `ssr.url` for your environment.

---

## 8. API (for mobile / other clients)

- Base URL (local): `http://localhost:8000/api` (or `http://YOUR_IP:8000/api` from another device).
- From Android emulator use `http://10.0.2.2:8000/api` to reach the host machine’s Laravel server.

---

## 9. Troubleshooting

| Issue | What to try |
|-------|---------------------|
| `composer install` fails | Check PHP version (`php -v` ≥ 8.2) and required PHP extensions. |
| `npm install` / `npm run build` fails | Use Node 18+ and run again; delete `node_modules` and `package-lock.json` then `npm install` if needed. |
| “Permission denied” on storage or cache | Fix permissions: `storage` and `bootstrap/cache` must be writable (e.g. `chmod -R 775 storage bootstrap/cache` on Linux/macOS). |
| “No application encryption key” | Run `php artisan key:generate`. |
| Database errors | For SQLite, ensure `database/database.sqlite` exists. For MySQL, check `.env` and that the DB server is running. |
| Blank or broken frontend | Run `npm run build` and/or `npm run dev`, and `php artisan wayfinder:generate`. |
| API returns 500 “Rate limiter [api] is not defined” | Already fixed in this codebase (API rate limiter registered in `AppServiceProvider`). If you see it, pull latest or re-apply that change. |

---

## 10. Summary

- **PHP 8.2+**, **Composer**, **Node 18+**, and a **database** (SQLite or MySQL) are required.
- After getting the code: `composer install` → copy `.env` and `key:generate` → create DB file (SQLite) or configure MySQL → `php artisan migrate` → `npm install` → `npm run build` → `php artisan wayfinder:generate`.
- Run the app with `composer dev` and open http://localhost:8000.
