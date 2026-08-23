# etikbulmuyorum.com — Deployment Guide

## Stack
- **Frontend**: React 18 + Vite (served by Nginx in Docker)
- **Backend**: Node.js + Express (REST API)
- **Database**: PostgreSQL 16
- **Auth**: Google OAuth 2.0 (one-tap sign-in) + JWT
- **Infra**: Docker Compose + Nginx reverse proxy + Let's Encrypt SSL

---

## 1. Server Requirements
- Ubuntu 22.04 VPS (minimum 2 GB RAM, 20 GB disk)
- Domain: etikbulmuyorum.com → point A record to your server IP

---

## 2. Install Dependencies on Server

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose plugin
sudo apt-get install docker-compose-plugin

# Certbot for SSL
sudo apt install certbot -y
```

---

## 3. Get SSL Certificate

```bash
sudo certbot certonly --standalone -d etikbulmuyorum.com -d www.etikbulmuyorum.com
```

---

## 4. Google OAuth Setup

1. Go to https://console.cloud.google.com/apis/credentials
2. Create an **OAuth 2.0 Client ID** (Web application type)
3. Add authorized origins:
   - `https://etikbulmuyorum.com`
4. Add authorized redirect URIs:
   - `https://etikbulmuyorum.com`
5. Copy the **Client ID** and **Client Secret**

---

## 5. Configure Environment

```bash
# Clone or copy your project to the server
git clone <your-repo> /opt/etikbulmuyorum
cd /opt/etikbulmuyorum

# Create .env file (never commit this file!)
cat > .env << 'EOF'
POSTGRES_PASSWORD=REPLACE_WITH_STRONG_PASSWORD
JWT_SECRET=REPLACE_WITH_64_CHAR_RANDOM_STRING
REFRESH_TOKEN_SECRET=REPLACE_WITH_ANOTHER_64_CHAR_RANDOM_STRING
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
EOF

# Generate strong secrets (run locally, paste into .env)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 6. Build and Start

```bash
cd /opt/etikbulmuyorum
docker compose up -d --build
docker compose logs -f   # watch logs
```

---

## 7. Set First Admin User

```bash
# Find your user ID after first login, then:
docker compose exec postgres psql -U etikuser -d etikbulmuyorum \
  -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"

# Or make a moderator:
docker compose exec postgres psql -U etikuser -d etikbulmuyorum \
  -c "UPDATE users SET role = 'moderator' WHERE email = 'mod@email.com';"
```

---

## 8. SSL Auto-Renewal

```bash
# Add to crontab
crontab -e

# Add this line:
0 3 * * * certbot renew --quiet && docker compose -f /opt/etikbulmuyorum/docker-compose.yml restart nginx
```

---

## 9. Backup Database

```bash
# Manual backup
docker compose exec postgres pg_dump -U etikuser etikbulmuyorum > backup_$(date +%Y%m%d).sql

# Automated daily backup (add to crontab)
0 2 * * * docker compose -f /opt/etikbulmuyorum/docker-compose.yml exec -T postgres \
  pg_dump -U etikuser etikbulmuyorum > /backups/etik_$(date +\%Y\%m\%d).sql
```

---

## 10. Useful Commands

```bash
# View logs
docker compose logs api -f
docker compose logs postgres -f

# Restart a service
docker compose restart api

# Access database directly
docker compose exec postgres psql -U etikuser -d etikbulmuyorum

# Rebuild after code changes
docker compose up -d --build api
docker compose up -d --build frontend

# Stop everything
docker compose down
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/google | — | Login with Google idToken |
| POST | /api/auth/refresh | — | Refresh access token |
| POST | /api/auth/logout | ✅ | Logout |
| GET  | /api/auth/me | ✅ | Current user info |
| GET  | /api/incidents | — | List incidents (paginated, filterable) |
| GET  | /api/incidents/:id | — | Get single incident |
| POST | /api/incidents | ✅ | Submit new incident |
| DELETE | /api/incidents/:id | ✅ | Remove incident (owner/admin) |
| POST | /api/votes/:incidentId | ✅ | Cast or change vote |
| DELETE | /api/votes/:incidentId | ✅ | Retract vote |
| GET  | /api/comments | — | List comments for an incident |
| POST | /api/comments | ✅ | Post a comment |
| DELETE | /api/comments/:id | ✅ | Remove comment |
| GET  | /api/categories | — | List all categories |
| GET  | /api/users/me/incidents | ✅ | My submitted incidents |
| POST | /api/users/report | ✅ | Report incident or comment |
| GET  | /api/moderation/pending | 🔑 | Pending incidents (mod only) |
| POST | /api/moderation/incidents/:id/approve | 🔑 | Approve incident |
| POST | /api/moderation/incidents/:id/reject | 🔑 | Reject incident |
| GET  | /api/moderation/reports | 🔑 | View open reports |
| POST | /api/moderation/reports/:id/resolve | 🔑 | Mark report resolved |
| POST | /api/moderation/users/:id/ban | 👑 | Ban user (admin only) |

✅ = requires login | 🔑 = moderator/admin | 👑 = admin only
