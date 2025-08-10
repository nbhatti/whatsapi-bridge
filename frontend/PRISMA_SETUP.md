# PostgreSQL with Prisma ORM Setup

This document summarizes the PostgreSQL and Prisma ORM setup completed for the WhatsApp API project.

## ✅ Completed Setup

### 1. Prisma Installation and Initialization
- Installed Prisma CLI as dev dependency: `npm i -D prisma`
- Installed Prisma Client as runtime dependency: `npm i @prisma/client`
- Initialized Prisma with `npx prisma init`

### 2. Database Schema Definition
Created the following models in `prisma/schema.prisma`:

#### User Model
- `id`: String (CUID, Primary Key)
- `email`: String (Unique)
- `passwordHash`: String
- `role`: String (Default: "user")
- `createdAt`: DateTime (Auto-generated)

#### Session Model
- `id`: String (CUID, Primary Key)
- `userId`: String (Foreign Key to User)
- `jwtId`: String (Unique)
- `refreshToken`: String
- `expiresAt`: DateTime

#### Device Model
- `id`: String (CUID, Primary Key)
- `userId`: String (Foreign Key to User)
- `name`: String
- `waDeviceId`: String (Unique - WhatsApp Device ID)
- `status`: String (Default: "inactive")
- `createdAt`: DateTime (Auto-generated)

#### MessageLog Model
- `id`: String (CUID, Primary Key)
- `deviceId`: String (Foreign Key to Device)
- `direction`: String ("inbound" or "outbound")
- `type`: String ("text", "image", "document", etc.)
- `to`: String (Optional)
- `body`: String (Optional)
- `timestamp`: DateTime (Auto-generated)

#### ActivityLog Model
- `id`: String (CUID, Primary Key)
- `userId`: String (Foreign Key to User)
- `action`: String
- `meta`: JSON (Optional metadata)
- `createdAt`: DateTime (Auto-generated)

### 3. Database Migration
- Successfully ran initial migration: `npx prisma migrate dev --name init`
- Generated Prisma client: `npx prisma generate`
- Client generated to: `./src/generated/prisma`

### 4. Database Configuration

#### Development Environment
- PostgreSQL running via Docker Compose (`docker-compose.dev.yml`)
- Database: `whatsapi`
- User: `whatsapi_user`
- Password: `whatsapi_password`
- Connection string: `postgresql://whatsapi_user:whatsapi_password@localhost:5432/whatsapi`

#### Production Environment
- Added PostgreSQL service to `docker-compose.yml`
- Configured Docker secrets for secure credential management
- Secrets stored in `secrets/` directory (git-ignored)

### 5. Security Setup
- Docker secrets configuration for production:
  - `db_password.txt`
  - `db_user.txt`
  - `db_name.txt`
- Added `secrets/` to `.gitignore`
- Created `secrets.example/` with templates

### 6. Utility Files Created
- `src/lib/prisma.ts`: Prisma client singleton with development optimization
- `src/lib/test-db.ts`: Database connection testing utility

## 🚀 Usage

### Importing Prisma Client
```typescript
import { prisma } from './lib/prisma'

// Example: Create a user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: 'hashed_password',
    role: 'user'
  }
})
```

### Available Types
```typescript
import type { User, Session, Device, MessageLog, ActivityLog } from './generated/prisma'
```

## 🐳 Docker Commands

### Development
```bash
# Start PostgreSQL for development
docker-compose -f docker-compose.dev.yml up -d postgres

# Run migrations
npx prisma migrate dev
```

### Production
```bash
# Set up secrets first
cp -r secrets.example secrets
# Edit files in secrets/ with actual values

# Start all services
docker-compose up -d
```

## 📁 File Structure
```
frontend/
├── prisma/
│   ├── migrations/
│   │   └── 20250807235206_init/
│   │       └── migration.sql
│   └── schema.prisma
├── src/
│   ├── generated/
│   │   └── prisma/           # Generated Prisma client
│   └── lib/
│       ├── prisma.ts         # Prisma singleton
│       └── test-db.ts        # Testing utilities
├── .env                      # Environment variables
└── PRISMA_SETUP.md          # This file

secrets.example/              # Template secrets
├── db_password.txt
├── db_user.txt
├── db_name.txt
└── README.md

secrets/                      # Actual secrets (git-ignored)
├── db_password.txt
├── db_user.txt
└── db_name.txt
```

## 🔄 Next Steps

The database setup is complete and ready for:
1. Authentication system implementation
2. WhatsApp device management
3. Message logging
4. User activity tracking
5. Session management

All models include proper relationships and cascade deletes to maintain data integrity.
