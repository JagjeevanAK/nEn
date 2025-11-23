# nEn

A workflow automation platform built with TypeScript and Turborepo. Create, manage, and execute automated workflows with triggers, actions, and integrations.

## Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        User[User Browser]
    end

    subgraph "Frontend Container"
        Frontend[React + Vite App<br/>Port: 80]
        Nginx[Nginx Server]
    end

    subgraph "Backend Services"
        Backend[Backend API<br/>Express.js<br/>Port: 3000]
        Engine[Workflow Engine<br/>Execution Service]
    end

    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL<br/>Database<br/>Port: 5432)]
        Redis[(Redis Cache<br/>Queue Manager<br/>Port: 6379)]
    end

    subgraph "External Services"
        Gmail[Gmail API<br/>Email Triggers]
        OAuth[Google OAuth<br/>Authentication]
        Webhooks[External Webhooks]
    end

    subgraph "Shared Packages"
        DB[@nen/db<br/>Prisma Client]
        ESLint[@nen/eslint-config]
        TSConfig[@nen/typescript-config]
    end

    User -->|HTTP/HTTPS| Nginx
    Nginx --> Frontend
    Frontend -->|REST API| Backend
    
    Backend -->|Queries| PostgreSQL
    Backend -->|Queue Jobs| Redis
    Backend -->|Auth| OAuth
    Backend -->|Fetch Emails| Gmail
    Backend -->|Receive| Webhooks
    
    Engine -->|Queries| PostgreSQL
    Engine -->|Process Jobs| Redis
    Engine -->|Execute Actions| Gmail
    
    Backend -.->|Uses| DB
    Engine -.->|Uses| DB
    Backend -.->|Config| ESLint
    Backend -.->|Config| TSConfig
    Engine -.->|Config| ESLint
    Engine -.->|Config| TSConfig
    Frontend -.->|Config| ESLint
    Frontend -.->|Config| TSConfig

    style User fill:#e1f5ff
    style Frontend fill:#bbdefb
    style Backend fill:#90caf9
    style Engine fill:#64b5f6
    style PostgreSQL fill:#ffccbc
    style Redis fill:#ffab91
    style Gmail fill:#c8e6c9
    style OAuth fill:#a5d6a7
    style Webhooks fill:#81c784
    style DB fill:#fff9c4
    style ESLint fill:#f0f4c3
    style TSConfig fill:#e6ee9c
```

### Monorepo Structure

This project uses Turborepo to manage a monorepo with three main applications:

- **backend** - Express.js REST API server handling authentication, workflow management, and webhook endpoints
- **engine** - Workflow execution engine that processes triggers and executes actions
- **frontend** - React application with Vite for building and managing workflows

### Shared Packages

- **@nen/db** - Prisma-based database client and schema shared across all applications
- **@nen/eslint-config** - Shared ESLint configurations
- **@nen/typescript-config** - Shared TypeScript configurations

### Technology Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Frontend**: React, Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Prisma ORM
- **Database**: PostgreSQL
- **Queue**: Redis with Bull
- **Deployment**: Docker, Docker Compose, Nginx


## Getting Started

### Local Development

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd nEn
bun install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database connection string (PostgreSQL)
- Redis connection URL
- JWT secrets (generate with `openssl rand -base64 32`)
- Google OAuth credentials for Gmail integration
- Frontend and backend URLs

3. Initialize the database:

```bash
bun run db:migrate
```

4. Start the development servers:

```bash
bun run dev
```

This will start all applications concurrently:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Engine: Running in background

### Individual Application Commands

Start specific applications:

```bash
bun run start:frontend
bun run start:backend
bun run start:engine
```

### Docker Deployment

The application provides a complete Docker Compose setup for production deployment. All services are containerized and orchestrated with health checks and automatic restarts.

#### Quick Start

Deploy the entire stack using Docker Compose:

```bash
docker-compose up -d
```

Access the application at http://localhost:80
#### Docker Compose Commands

```bash
# Start all services in detached mode
docker-compose up -d

# View logs for all services
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f backend

# Stop all services
docker-compose stop

# Stop and remove containers, networks
docker-compose down

# Stop and remove containers, networks, and volumes
docker-compose down -v

# Rebuild and restart services
docker-compose up -d --build

# Check service status
docker-compose ps

# Execute commands in a running container
docker-compose exec backend sh
```

#### Environment Configuration for Docker

When using Docker Compose, configure these environment variables in your `.env` file:

```env
# PostgreSQL Configuration
POSTGRES_USER=nen_user
POSTGRES_PASSWORD=nen_password
POSTGRES_DB=nen_db
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PORT=6379

# Application Ports
BACKEND_PORT=3000
FRONTEND_PORT=80

# Database URL (use service name 'postgres' for Docker network)
DATABASE_URL=postgresql://nen_user:nen_password@postgres:5432/nen_db

# Redis URL (use service name 'redis' for Docker network)
REDIS_URL=redis://redis:6379

# Backend URL for Frontend
VITE_BACKEND_URL=http://localhost:3000
```

#### Docker Networking

All services communicate through a custom bridge network (`nen-network`). Services can reference each other by their container name:
- Backend connects to database: `postgres:5432`
- Backend connects to Redis: `redis:6379`
- Frontend connects to backend: `backend:3000`

#### Persistent Data

Docker volumes ensure data persistence across container restarts:
- `postgres_data` - Database files
- `redis_data` - Redis persistence files

#### Health Checks

PostgreSQL and Redis include health checks that ensure dependent services only start when the database and cache are fully ready:
- PostgreSQL: Checks `pg_isready` every 10 seconds
- Redis: Checks `redis-cli ping` every 10 seconds

#### Building Custom Images

Build images individually:

```bash
# Build backend image
docker build -t nen/backend:latest -f docker/backend.Dockerfile .

# Build engine image
docker build -t nen/engine:latest -f docker/engine.Dockerfile .

# Build frontend image
docker build -t nen/frontend:latest -f docker/frontend.Dockerfile .
```

#### Production Deployment Notes

- All services configured with `restart: unless-stopped`
- Use strong passwords in production (override defaults)
- Configure proper `FRONTEND_URL` and `VITE_BACKEND_URL` for your domain
- Consider using reverse proxy for SSL/TLS termination
- Regular database backups recommended
- Monitor container logs and resource usage

## Available Scripts

### Development

- `bun run dev` - Start all apps in development mode
- `bun run build` - Build all apps and packages
- `bun run lint` - Run ESLint across all packages
- `bun run format` - Format code with Prettier
- `bun run check-types` - Type check all TypeScript code

### Database

- `bun run db:migrate` - Run Prisma migrations and generate client
- `bun run db:generate` - Generate Prisma client only

### Production

- `bun run start` - Start all apps in production mode
- `docker-compose up -d` - Deploy with Docker

## Features

- Workflow creation and management
- Trigger-based automation (Gmail, webhooks, scheduled tasks)
- Action execution with multiple integrations
- Real-time workflow monitoring
- Credential management with OAuth support
- Queue-based task processing
- RESTful API with authentication
- Responsive web interface

## Project Structure

```
nEn/
├── apps/
│   ├── backend/          # Express API server
│   ├── engine/           # Workflow execution engine
│   └── frontend/         # React web application
├── packages/
│   ├── db/              # Prisma schema and database client
│   ├── eslint-config/   # Shared ESLint configurations
│   └── typescript-config/ # Shared TypeScript configurations
├── docker/              # Dockerfiles for each service
├── conf/                # Nginx configuration files
└── scripts/             # Utility scripts

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/google` - Google OAuth flow

### Workflows
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow details
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

### Triggers
- `GET /api/triggers` - List available triggers
- `POST /api/triggers` - Configure trigger

### Webhooks
- `POST /api/webhook/:workflowId` - Execute workflow via webhook

### Credentials
- `GET /api/creds` - List user credentials
- `POST /api/creds` - Add new credential
- `DELETE /api/creds/:id` - Remove credential

## Environment Variables

Key environment variables required:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nen_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Application URLs
VITE_BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Server Ports
BACKEND_PORT=3000
FRONTEND_PORT=5173
```

## License

This project is private and proprietary.
