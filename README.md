# LipaBit

Buy and sell Bitcoin instantly with M-Pesa in Kenya.

## Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: NestJS, Prisma, PostgreSQL, Redis
- **Payments**: Safaricom Daraja API (STK Push + B2C)
- **Infrastructure**: Docker, Nginx, GitHub Actions

## Getting started

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- PostgreSQL 16
- Redis 7

### Local development

```bash
# Clone
git clone https://github.com/pinsql/lipabit.git
cd lipabit

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Start services
docker compose up postgres redis -d

# Run migrations
npm run db:migrate

# Start dev servers
npm run dev
```

The API runs on `http://localhost:4000` and the web app on `http://localhost:3000`.

### API docs

Swagger UI available at `http://localhost:4000/api/docs` in development.

## Project structure

```
lipabit/
├── apps/
│   ├── api/         # NestJS backend
│   └── web/         # Next.js frontend
├── docker/
│   └── nginx/       # Nginx config
├── .github/
│   └── workflows/   # CI/CD pipelines
└── docker-compose.yml
```

## Deployment

See the deployment guide in [docs/deployment.md](docs/deployment.md).

## License

Private — LipaBit Technologies Ltd.
