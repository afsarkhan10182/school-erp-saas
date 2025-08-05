# School ERP SaaS

A comprehensive School Management System with multi-tenant SaaS architecture.

## Tech Stack

- **Frontend**: Nuxt.js 3
- **Backend**: Express.js
- **Database**: PostgreSQL
- **Caching**: Redis
- **Authentication**: JWT

## Prerequisites

- Node.js 22.x
- PostgreSQL 15+
- Redis 7+

## Project Structure

```
school-erp-saas/
├── frontend/           # Nuxt.js frontend
├── backend/            # Express.js backend
└── README.md
```

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed and running

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd school-erp-saas
```

2. **Start all services**
```bash
docker compose up -d (Docker CLI v20.10+)
docker-compose up -d(Legacy)
```

3. **Wait for services to start** (30-60 seconds)

**Place your dump file** in the project root (e.g., `school_erp_backup_empty.dump`)

4. **Import database dump**
```bash
# Import the provided database dump
docker compose cp school_erp_backup_empty.dump postgres:/tmp/school_erp_backup_empty.dump

1. Copy the dump file to container:
   docker compose cp ./school_erp_backup_empty.dump postgres:/tmp/school_erp_backup_empty.dump

2. Drop the old DB (if exists):
   docker compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS school_erp;"

3. Create a fresh DB:
   docker compose exec postgres psql -U postgres -c "CREATE DATABASE school_erp;"

4. Restore the dump:
   docker compose exec -T postgres pg_restore -U postgres -d school_erp --no-owner /tmp/school_erp_backup_empty.dump
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart services
docker-compose restart
```

### Database Management with Docker

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d school_erp

# Check tables
docker-compose exec postgres psql -U postgres -d school_erp -c "\dt"

# Check data in specific table
docker-compose exec postgres psql -U postgres -d school_erp -c "SELECT COUNT(*) FROM users;"
```

### Import PostgreSQL Dump

If you have a PostgreSQL dump file:

1. **Place your dump file** in the project root (e.g., `school_erp_backup_empty.dump`)

2. **Import the dump**
```bash
# Stop services first
docker-compose down

# Start only PostgreSQL
docker-compose up -d postgres

# Wait for PostgreSQL to start, then import
docker-compose exec -T postgres pg_restore -U postgres -d school_erp school_erp_backup_empty.dump

# Start all services
docker-compose up -d
```

3. **Verify import**
```bash
# Check tables
docker-compose exec postgres psql -U postgres -d school_erp -c "\dt"

# Check data
docker-compose exec postgres psql -U postgres -d school_erp -c "SELECT COUNT(*) FROM users;"
```

**Note:** If you get permission errors with `pg_restore`, try this alternative method:
```bash
# Alternative import method
docker-compose exec -T postgres pg_restore --clean --if-exists --no-owner --no-privileges -U postgres -d school_erp < school_erp_backup_empty.dump
```

## Manual Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd school-erp-saas
```

### 2. Run Backend:
```bash
cd backend
npm install
cp .env.example .env  # Update the environment variables
npm run db:reset
npm run dev
```

### 3. Run frontend: open a new terminal: school-erp-saas/frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/api-docs

### 5. Postgres Command:
```bash
psql -U <USERNAME> -d <DATABASE-NAME> -h localhost
Password for user <USERNAME>: Enter the Password 

<DATABASE-NAME>=> \dt (it will list the tables)
<DATABASE-NAME>=> SELECT * FROM <TABLENAME>
```

## Troubleshooting

### Docker Issues

**Services not starting:**
```bash
# Check logs
docker-compose logs

# Check if ports are available
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000
```

**Database connection issues:**
```bash
# Restart database
docker-compose restart postgres

# Wait 30 seconds, then try migrations
docker-compose exec backend npm run db:migrate
```

**Reset everything:**
```bash
# Stop and remove everything
docker-compose down -v

# Start fresh
docker-compose up -d
docker-compose exec -T postgres pg_restore -U postgres -d school_erp school_erp_backup_empty.dump
```

### Development Features

- **Hot Reload**: Code changes auto-reload
- **Volume Mounting**: Local code syncs with containers
- **Database Persistence**: Data saved between restarts
- **Live Logs**: Real-time service monitoring



