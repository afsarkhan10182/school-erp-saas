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

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd school-erp-saas
```

### 3. Run Backend:
```bash
cd backend
npm install
cp .env.example .env  # Update the environment variables
npm run db:reset
npm run dev
```

### 4. Run frontend: open a new terminal: school-erp-saas/frontend
```bash
cd frontend
npm install
npm run dev
```

### 6. Access the Application
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/api-docs

### 7. Postgres Command:
```bash
psql -U <USERNAME> -d <DATABASE-NAME> -h localhost
Password for user <USERNAME>: Enter the Password 

<DATABASE-NAME>=> \dt (it will list the tables)
<DATABASE-NAME>=> SELECT * FROM <TABLENAME>
```



