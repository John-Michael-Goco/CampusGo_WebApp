# CampusGo Web – Setup on Another Computer

/ php artisan migrate:fresh --seed
/ php artisan schedule:run
/ php artisan serve --host=0.0.0.0


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

Create `.env` from the example (if it doesn't exist):

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

Run migrations with seed data (recommended for a fresh setup):

```bash
php artisan migrate:fresh --seed
```

> `migrate:fresh` drops all tables and re-runs every migration, then `--seed` fills the database with default/demo data.
> If you just want to migrate without wiping existing data use `php artisan migrate` instead.

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
   php artisan migrate:fresh --seed
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

### Option A – Local only (same machine)

Starts PHP server, queue worker, and Vite dev server together:

```bash
composer dev
```

Then open: **http://localhost:8000**
Vite usually runs on port 5173; the Laravel app will load assets from it automatically.

---

### Option B – Accessible from other devices on the network (recommended for cross-device testing)

Use `--host=0.0.0.0` so the server listens on all network interfaces, making it reachable from phones, tablets, or other computers on the same Wi-Fi/LAN.

First, find this machine's local IP address:

**Windows (PowerShell):**
```powershell
ipconfig
# Look for "IPv4 Address" under your active adapter, e.g. 192.168.1.x
```

**macOS / Linux:**
```bash
hostname -I
```

Then update your `.env` so Reverb is reachable from those devices too:

```env
REVERB_HOST=0.0.0.0
VITE_REVERB_HOST=192.168.1.x   # replace with your actual local IP
```

Now open **5 separate terminals** and run each command:

**Terminal 1 – Laravel server (network-accessible):**

```bash
php artisan serve --host=0.0.0.0
```

**Terminal 2 – Vite (frontend assets):**

```bash
npm run dev
```

**Terminal 3 – Queue worker (broadcasting & jobs):**

```bash
php artisan queue:work
```

**Terminal 4 – Reverb WebSocket server (real-time broadcasting):**

```bash
php artisan reverb:start --debug
```

**Terminal 5 – Scheduler (runs periodic tasks):**

```bash
php artisan schedule:run
```

> `schedule:run` executes any due scheduled tasks once. For continuous scheduling during development keep running it every minute, or use `php artisan schedule:work` to run it automatically in a loop.

Other devices on the same network can now access the app at:

```
http://192.168.1.x:8000
```

And the API at:

```
http://192.168.1.x:8000/api
```

> Android emulator specifically: use `http://10.0.2.2:8000` to reach the host machine.

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
# 1. Install PHP dependencies
composer install

# 2. Set up environment
cp -n .env.example .env
php artisan key:generate

# 3. Create SQLite DB file (skip if using MySQL -- configure .env instead)
#    Windows PowerShell:
New-Item -ItemType File -Path database\database.sqlite -Force
#    macOS / Linux:
touch database/database.sqlite

# 4. Migrate and seed the database
php artisan migrate:fresh --seed

# 5. Install and build frontend
npm install
npm run build

# 6. Generate route helpers
php artisan wayfinder:generate
```

Then start the app (local only):

```bash
composer dev
```

Or for **network access from other devices** open 5 terminals and run:

```bash
# Terminal 1
php artisan serve --host=0.0.0.0

# Terminal 2
npm run dev

# Terminal 3
php artisan queue:work

# Terminal 4
php artisan reverb:start --debug

# Terminal 5
php artisan schedule:run
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

- Base URL (local): `http://localhost:8000/api`
- Base URL (from another device on the same network): `http://YOUR_LOCAL_IP:8000/api`
- Android emulator: `http://10.0.2.2:8000/api` to reach the host machine's Laravel server.

Make sure the server was started with `php artisan serve --host=0.0.0.0` and that `VITE_REVERB_HOST` in `.env` is set to your machine's local IP (not `localhost`) so WebSocket connections work from other devices.

---

## 9. Troubleshooting

| Issue | What to try |
|-------|---------------------|
| `composer install` fails | Check PHP version (`php -v` >= 8.2) and required PHP extensions. |
| `npm install` / `npm run build` fails | Use Node 18+ and run again; delete `node_modules` and `package-lock.json` then `npm install` if needed. |
| "Permission denied" on storage or cache | Fix permissions: `storage` and `bootstrap/cache` must be writable (e.g. `chmod -R 775 storage bootstrap/cache` on Linux/macOS). |
| "No application encryption key" | Run `php artisan key:generate`. |
| Database errors | For SQLite, ensure `database/database.sqlite` exists. For MySQL, check `.env` and that the DB server is running. |
| Blank or broken frontend | Run `npm run build` and/or `npm run dev`, and `php artisan wayfinder:generate`. |
| API returns 500 "Rate limiter [api] is not defined" | Already fixed in this codebase (API rate limiter registered in `AppServiceProvider`). If you see it, pull latest or re-apply that change. |
| Can't connect from another device on the network | Ensure `php artisan serve --host=0.0.0.0` is used and your firewall allows ports 8000 (Laravel) and 8080 (Reverb). |
| WebSockets not working from another device | Set `VITE_REVERB_HOST` to your machine's local IP in `.env`, rebuild Vite assets (`npm run build`), and restart Reverb. |
| Scheduled tasks not running | Run `php artisan schedule:run` manually, or use `php artisan schedule:work` to auto-run every minute in development. |

---

## 10. Summary

- **PHP 8.2+**, **Composer**, **Node 18+**, and a **database** (SQLite or MySQL) are required.
- After getting the code: `composer install` → copy `.env` and `key:generate` → create DB file (SQLite) or configure MySQL → `php artisan migrate:fresh --seed` → `npm install` → `npm run build` → `php artisan wayfinder:generate`.
- For local-only use, run `composer dev` and open http://localhost:8000.
- For network access from other devices, start 5 services in separate terminals: `serve --host=0.0.0.0`, `npm run dev`, `queue:work`, `reverb:start --debug`, and `schedule:run`.
