# Catch and Trade — Local Development

## Prerequisites
- Node.js 20+
- Docker Desktop
- Stripe CLI (`brew install stripe/stripe-cli/stripe` on Mac, or download from stripe.com)

## First-time setup
```bash
git clone <repo>
cd catchandtrade
npm install
cp .env.development .env
# Add your Stripe test keys to .env (get from dashboard.stripe.com)
docker-compose up -d
npm run db:migrate
npm run db:seed
```

## Daily development
```bash
docker-compose up -d          # start postgres + redis + mailhog
npm run dev                   # start all apps (web, mobile, api)
npm run stripe:listen        # separate terminal — required for payments
```

## URLs

| Service         | URL                          |
|----------------|------------------------------|
| Web app         | http://localhost:3000        |
| API             | http://localhost:3001        |
| Expo mobile     | http://localhost:8081        |
| API health check| http://localhost:3001/health |
| Mailhog (email) | http://localhost:8025        |
| PostgreSQL      | localhost:5432               |
| Redis           | localhost:6379               |

## Test accounts (after db:seed)

| Email              | Password         | Role   |
|-------------------|------------------|--------|
| buyer@test.com    | TestPassword123! | Buyer  |
| seller@test.com   | TestPassword123! | Seller |

## Running tests
```bash
npm test              # all packages
npm test --filter=api # single package
```

## Project Structure
```
catchandtrade/
├── apps/
│   ├── web/           # Next.js web app
│   └── mobile/        # Expo React Native app
├── packages/
│   ├── api/           # Express API server
│   ├── db/            # Prisma ORM
│   ├── scanning/      # Card scanning pipeline
│   └── shared/        # Shared types & constants
├── docker-compose.yml
└── turbo.json
```
