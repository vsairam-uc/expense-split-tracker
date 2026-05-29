# Split Expense Tracker

A Splitwise-style web app for tracking and splitting shared expenses between friends and groups.

## Features

- **Authentication** — email/password registration and login
- **Friends** — search users, send/accept friend requests
- **Groups** — create groups with multiple members (auto-creates personal groups for new friends)
- **Expenses** — add expenses with equal or exact-amount splits, select payer and participants
- **Balances** — per-group net balances with debt simplification
- **Settlements** — record payments between group members
- **Dashboard** — overview of what you owe and are owed across all groups

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/)
- [Auth.js](https://authjs.dev/) (NextAuth v5)
- [Vitest](https://vitest.dev/) for unit tests

## Getting started

### Prerequisites

- Node.js 20+
- [Podman](https://podman.io/) (recommended for local PostgreSQL) or Docker

### Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment variables**

   ```bash
   cp .env.example .env
   ```

   Update `.env`:
   - `DATABASE_URL` — PostgreSQL connection string
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `AUTH_URL` — `http://localhost:3000` for local dev

3. **Install Podman (macOS, if not installed)**

   ```bash
   brew install podman
   ```

   If `podman` fails with a `~/.config` permission error, either fix ownership (`sudo chown -R "$(whoami)" ~/.config`) or use the project helper (scripts set `XDG_CONFIG_HOME` automatically).

4. **Start PostgreSQL**

   ```bash
   npm run db:up
   npm run db:migrate
   ```

   This uses Podman with the existing `docker-compose.yml` (Compose format is compatible). Docker also works: `docker compose up -d` then `npm run db:migrate`.

5. **Start dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Database commands

| Command | Description |
|---------|-------------|
| `npm run db:up` | Start Podman VM (if needed) and PostgreSQL container |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run db:migrate` | Apply Prisma migrations |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |
| `npm run db:up` | Start local Postgres (Podman) |
| `npm run db:down` | Stop local Postgres |
| `npx prisma studio` | Open Prisma database GUI |

## Deployment

### Vercel + Neon

1. Push to GitHub
2. Create a [Neon](https://neon.tech/) PostgreSQL database
3. Import the repo in [Vercel](https://vercel.com/)
4. Set environment variables:
   - `DATABASE_URL` — Neon connection string (use pooled URL for serverless)
   - `AUTH_SECRET` — random secret
   - `AUTH_URL` — your production URL (e.g. `https://your-app.vercel.app`)
5. Deploy — Vercel runs `prisma generate` and `next build` automatically

Run migrations against production:

```bash
DATABASE_URL="your-neon-url" npx prisma migrate deploy
```

## Project structure

```
app/
  (auth)/          Login, register
  (app)/           Protected pages (dashboard, friends, groups, expenses, profile)
components/        UI components
lib/
  actions/         Server actions
  balances.ts      Split & debt simplification logic
  generated/prisma Prisma client (generated)
prisma/            Schema and migrations
tests/             Unit tests
```

## License

MIT
