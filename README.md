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
- pnpm (recommended) or npm

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd school-erp-saas
```

### 2. Install Node.js 22
If you don't have Node.js 22 installed, install it using nvm:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 22
node --version  # Should show v22.x.x
```

### 3. Install pnpm (recommended)
```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### 4. Backend Setup
```bash
cd backend
cp .env.example .env  # Update the environment variables
pnpm install
pnpm run db:migrate
pnpm run dev
```

### 5. Frontend Setup
```bash
cd ../frontend
cp .env.example .env  # Update the environment variables
pnpm install
pnpm run dev
```

### 6. Access the Application
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/api-docs

## Development

### Running Tests
```bash
# Backend tests
cd backend
pnpm test

# Frontend tests
cd ../frontend
pnpm test
```

### Database Migrations
```bash
# Create a new migration
cd backend
pnpm run db:create-migration <migration-name>

# Run migrations
pnpm run db:migrate

# Rollback last migration
pnpm run db:rollback
```

## Project Structure

```
school-erp-saas/
├── frontend/           # Nuxt.js frontend
├── backend/            # Express.js backend
├── .gitignore
└── README.md
```
