# Jawan Fitness App

React, Vite, TypeScript, Capacitor, and Vercel serverless APIs for the Jawan Fitness client, trainer, and admin portals.

## Portals

- Client app: `/`, `/client`, `/app`, or native Capacitor build
- Trainer app: `/trainer`
- Admin app: `/admin`
- Dev sync simulator: `/dev-sync`

Role routing also supports deployment-specific hostnames such as `jawan-fitness-admin.vercel.app`, `jawan-fitness-trainer.vercel.app`, and `jawan-fitness-app.vercel.app`.

## Local Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
npm audit --audit-level=moderate
```

## Required Environment Variables

Set these in Vercel and in your local shell before running the serverless auth/sync scripts:

```bash
SUPABASE_DB_HOST=aws-0-ap-south-1.pooler.supabase.com
SUPABASE_DB_PORT=6543
SUPABASE_DB_USER=postgres.<project-ref>
SUPABASE_DB_PASSWORD=<database-password>
SUPABASE_DB_NAME=postgres
ALLOWED_CORS_ORIGINS=http://localhost:5173,https://jawan-fitness-admin.vercel.app,https://jawan-fitness-trainer.vercel.app,https://jawan-fitness-app.vercel.app
```

For initial admin setup:

```bash
INITIAL_ADMIN_EMAIL=admin@jawan.fit
INITIAL_ADMIN_PASSWORD=<strong-password>
```

For resetting an admin account:

```bash
ADMIN_EMAIL=admin@jawan.fit
ADMIN_PASSWORD=<strong-password>
```

## Database Setup

```bash
node setup_auth_tables.cjs
node setup_permissions.cjs
```

The app expects all cloud sync traffic to go through authenticated API routes. Do not grant public write access to the sync table.

## Security Notes

- Do not commit database passwords or real user passwords.
- Rotate any database password that was previously committed or shared.
- Trainer and member login is verified through `/api/auth`.
- `/api/sync` requires a valid portal session token.
