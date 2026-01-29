# Visitor Kiosk (Graves Foods)

A lightweight visitor check-in kiosk + admin dashboard.

- **Kiosk flow:** Check In → Take Photo → Print Badge → (optional) Check Out by badge code  
- **Admin:** Manage Hosts (directory) + view Visitor Logs (with photo) + manually check visitors out  
- **Backend:** NestJS + TypeORM + PostgreSQL + SMTP/Resend notifications  
- **Frontend:** Vite + React + Tailwind + shadcn/ui  
- **Deploy:** GitHub Actions → rsync to Linode → build FE + BE → systemd + nginx

---

## Repository structure

```text
visitor-kiosk/
  be/                 # NestJS API (port 4000)
  fe/                 # Vite React frontend (static build)
  visitorkiosk.conf   # nginx site config (FE + /api proxy)
  visitorkiosk-be.service  # systemd unit for backend
  .github/workflows/main.yml
```

---

## Features

### Kiosk
- Visitor enters **First Name**, **Last Name**, **Reason for Visit**
- Visitor selects **Who are you visiting?** (required dropdown populated from active hosts)
- Photo capture from device camera
- Badge preview + print flow (printer integration pending)
- Check out by badge code

### Admin
- Host directory management:
  - name / email / department
  - activate/deactivate hosts
- Visitor logs:
  - view full details including photo
  - delete logs
  - **manual check-out** (admin can check a visitor out)

### Notifications
- On check-in, the system notifies the selected host by email
- Email includes visitor details and photo (inline image)

---

## Tech stack

### Backend (`/be`)
- NestJS
- TypeORM
- PostgreSQL
- Nodemailer (SMTP) or Resend (fallback)
- Auth: JWT for admin endpoints, X-Kiosk-Key for kiosk endpoints

### Frontend (`/fe`)
- Vite + React + TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react icons
- sonner toasts

---

## Local development

### Prereqs
- Node.js 18+ (recommended)
- PostgreSQL database accessible from your machine

### Backend
```bash
cd be
npm ci
npm run start:dev
```

Backend defaults to: `http://localhost:4000`

### Frontend
```bash
cd fe
npm ci
npm run dev
```

Frontend defaults to: `http://localhost:5173` (or your configured port)

---

## Environment variables

### Frontend: `fe/.env` (local)
```env
VITE_API_BASE_URL="http://localhost:4000"
VITE_KIOSK_KEY="CHRISTIAN"
```

### Frontend: `fe/.env.production` (server/build)
```env
VITE_API_BASE_URL=/api
VITE_KIOSK_KEY=CHRISTIAN
```

### Backend: `be/.env`
```env
NODE_ENV=production
PORT=4000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME

JWT_SECRET=CHRISTIAN
JWT_EXPIRES_IN=12h

KIOSK_KEY=CHRISTIAN

# Resend (optional)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=Graves Foods - Visitor Kiosk <noreply@gravesfoods.com>

# SMTP (recommended)
EMAIL_USERNAME=XXXXXXXX
EMAIL_PASSWORD=XXXXXXXX
SMTP_SERVER=email-smtp.us-west-2.amazonaws.com
SMTP_PORT=587
FROM_EMAIL=noreply@gravesfoods.com
```

> **Important:** On the server, keep `be/.env` out of git and stored only on the server.

---

## API overview

### Kiosk (X-Kiosk-Key required)
- `GET /kiosk/hosts` → list active hosts for dropdown
- `POST /kiosk/print-badge` → creates visitor log, sends notification, returns badge code
- `PATCH /kiosk/check-out` → checks out visitor by `badge_code`

### Admin (JWT required)
- `GET /admin/stats`
- `GET /admin/hosts`
- `POST /admin/hosts`
- `PUT /admin/hosts/:id`
- `PATCH /admin/hosts/:id/active`
- `DELETE /admin/hosts/:id`
- `GET /admin/visitor-logs`
- `GET /admin/visitor-logs/:id`
- `DELETE /admin/visitor-logs/:id`
- *(plus manual check-out endpoint if enabled in your build)*

---

## Production deployment (Linode)

This app deploys the same way as your other server apps:
- GitHub Actions copies repo to server via `rsync`
- Server builds BE + FE
- BE runs via `systemd`
- FE is served as static files via `nginx`
- `nginx` reverse-proxies `/api/*` to the BE on `127.0.0.1:4000`

### Systemd service

`visitorkiosk-be.service` runs the compiled Nest app:

```ini
[Unit]
Description=Visitor Kiosk Backend (NestJS)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/VisitorKiosk/be
EnvironmentFile=/root/VisitorKiosk/be/.env
ExecStart=/usr/bin/node /root/VisitorKiosk/be/dist/main.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### Nginx config

`visitorkiosk.conf`:
- serves FE from `/var/www/visitorkiosk`
- proxies `/api/*` → `http://127.0.0.1:4000`

### One-time server setup
1. Create backend env file:
   ```bash
   nano /root/VisitorKiosk/be/.env
   ```
2. Ensure nginx + certs exist for:
   - `visitorkiosk.cloud.gravesfoods.com`
3. Confirm nginx can read FE build output:
   - FE build is copied to `/var/www/visitorkiosk` during deploy

### Useful commands (server)
```bash
systemctl status visitorkiosk-be.service -l
journalctl -u visitorkiosk-be.service -n 200 --no-pager

nginx -t
systemctl reload nginx

curl -I http://127.0.0.1:4000
curl -I https://visitorkiosk.cloud.gravesfoods.com/
curl -I https://visitorkiosk.cloud.gravesfoods.com/api/kiosk/hosts
```

---

## Badge printing (DYMO) – next step
Planned integration:
- connect FE “Print Badge” action to DYMO service/endpoint
- provide printer discovery + error handling
- ensure kiosk machine can access DYMO locally (or via a small local print agent)

---

## Troubleshooting

### FE loads but API calls fail
- Confirm FE production env uses: `VITE_API_BASE_URL=/api`
- Confirm nginx proxies `/api/*` to `127.0.0.1:4000`
- Confirm BE is running: `systemctl status visitorkiosk-be.service`

### Emails not sending
- Verify correct `FROM_EMAIL` / `RESEND_FROM`
- Ensure SMTP credentials are valid
- Check logs:
  ```bash
  journalctl -u visitorkiosk-be.service -n 200 --no-pager
  ```

### Nginx returns 403/404 for FE assets
- Ensure FE build is copied to: `/var/www/visitorkiosk`
- Ensure permissions allow nginx (www-data) to read:
  ```bash
  chown -R www-data:www-data /var/www/visitorkiosk
  ```

---

## License
Internal use (Graves Foods). Replace as needed.
