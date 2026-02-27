# Catch and Trade

A monorepo for the Catch and Trade trading card marketplace — web app, REST API, and shared packages.

## Production

| Service | URL |
|---------|-----|
| Web app | https://catchandtrade.com |
| API | https://api.catchandtrade.com |
| API health | https://api.catchandtrade.com/health |

## Prerequisites

- Node.js 20+
- Docker Desktop
- Stripe CLI (`brew install stripe/stripe-cli/stripe` on Mac, or download from stripe.com)

## First-time setup

```bash
git clone <repo>
cd catchandtrade
npm install                   # installs all workspace packages
docker-compose up -d          # starts postgres + redis + mailhog
npm run db:migrate
npm run db:seed
```

Copy and configure env files:
```bash
cp packages/api/.env.example packages/api/.env    # add your keys
cp apps/web/.env.local.example apps/web/.env.local
```

## Daily development

```bash
docker-compose up -d          # start postgres + redis + mailhog
npm run dev                   # start all apps in parallel (web, api)
npm run stripe:listen         # separate terminal — required for payments
```

## Local URLs

| Service          | URL                           |
|------------------|-------------------------------|
| Web app          | http://localhost:3002         |
| API              | http://localhost:3003         |
| API health check | http://localhost:3003/health  |
| Mailhog (email)  | http://localhost:8025         |
| PostgreSQL       | localhost:5435                |
| Redis            | localhost:6379                |

## Test accounts (after db:seed)

| Email           | Password         | Role   |
|-----------------|------------------|--------|
| buyer@test.com  | TestPassword123! | Buyer  |
| seller@test.com | TestPassword123! | Seller |

## Running tests

```bash
npm test                        # all packages
npm test --filter=@catchandtrade/api  # single package
```

## Project structure

```
catchandtrade/
├── apps/
│   ├── web/           # Next.js web app (port 3002)
│   └── mobile/        # Expo React Native app
├── packages/
│   ├── api/           # Express REST API (port 3003)
│   ├── db/            # Prisma ORM + database client
│   └── shared/        # Shared types & constants
├── docker-compose.yml
└── turbo.json
```

## Deployment (Render)

Both services are deployed on Render from the same repo. Each is configured with its own root directory.

### API service (`packages/api`)

| Setting | Value |
|---------|-------|
| Root directory | `packages/api` |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |

Required env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY`, `ADMIN_SECRET`, `API_URL`, `WEB_URL`, `PORT`

### Web service (`apps/web`)

| Setting | Value |
|---------|-------|
| Root directory | `apps/web` |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |

Required env vars: `NEXT_PUBLIC_API_URL`

Optional env vars: `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG`, `NEXT_PUBLIC_EBAY_CAMPAIGN_ID`

> `NEXT_PUBLIC_*` variables are baked into the bundle at build time — they must be set before the build runs.
