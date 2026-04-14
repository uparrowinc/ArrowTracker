# Railway Deployment Guide — ai.uparrowinc.com

## How It Works (Same as Replit)

Railway gives you a generated URL like `https://new-site-production.up.railway.app` automatically on every deploy. You then add `ai.uparrowinc.com` as a custom domain on top of that — exactly like Replit's workflow.

---

## Step 1 — Push to GitHub

Make sure your latest code is in `uparrowinc/new-site`:

```bash
git add .
git commit -m "Railway-ready: SQLite auto-init, PORT env, volume support"
git push origin main
```

---

## Step 2 — Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `uparrowinc/new-site`
4. Railway will auto-detect the `railway.toml` and start building

---

## Step 3 — Set Environment Variables

In Railway dashboard → your service → **Variables** tab, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `ADMIN_PASSWORD` | your admin password |
| `SESSION_SECRET` | any long random string (32+ chars) |
| `DATABASE_URL` | `/data/sqlite.db` *(if using volume — see Step 4)* |
| `BASE_URL` | `https://ai.uparrowinc.com` |

**Optional** (for email/MFA/contact form):

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASS` | your Gmail app password |
| `FROM_EMAIL` | `noreply@uparrowinc.com` |
| `CONTACT_NOTIFICATION_EMAIL` | `contact@uparrowinc.com` |

---

## Step 4 — Add a Persistent Volume (Recommended)

Railway's filesystem resets on every deploy. To keep your SQLite database across deploys:

1. In Railway dashboard → your service → **Volumes** tab
2. Click **Add Volume**
3. Set **Mount Path** to `/data`
4. Set `DATABASE_URL` environment variable to `/data/sqlite.db`

The app will auto-create all tables on first boot — no manual SQL needed.

---

## Step 5 — Add Custom Domain

1. In Railway dashboard → your service → **Settings** → **Networking**
2. Click **Add Custom Domain**
3. Enter `ai.uparrowinc.com`
4. Railway will show you a **CNAME record** to add in your DNS

**DNS Setup** (in your DNS provider):
```
Type:  CNAME
Name:  ai
Value: <the value Railway gives you>.railway.app
```

Railway handles SSL automatically via Let's Encrypt — no certbot needed.

---

## Step 6 — Verify

Once DNS propagates (usually 1–5 minutes):
- Visit `https://ai.uparrowinc.com` — homepage loads
- Visit `https://ai.uparrowinc.com/health` — should return `{"status":"healthy"}`
- Visit `https://ai.uparrowinc.com/login` — admin login
- Visit `https://ai.uparrowinc.com/kanban` — ArrowTracker board

---

## Auto-Deploy on Push

Railway automatically redeploys every time you push to `main` on GitHub — same as Replit.

---

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Main homepage |
| `/login` | Admin login |
| `/member-login` | Member portal login |
| `/member-portal` | Member dashboard |
| `/kanban` | ArrowTracker Kanban board |
| `/blog` | Blog |
| `/blog-admin` | Blog admin |
| `/health` | Health check |
| `/sitemap.xml` | SEO sitemap |
| `/rss.xml` | RSS feed |
