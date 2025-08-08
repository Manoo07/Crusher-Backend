# Crusher Backend

A comprehensive backend API for Crusher (Stone/Sand Trading) management system built with Express.js, TypeScript, and Prisma ORM with PostgreSQL.

## Features

- 🚀 Express.js server with TypeScript
- 🔧 TypeScript configuration with strict mode
- 🗄️ Prisma ORM with PostgreSQL database
- 👥 Multi-tenant organization management
- � Truck entry management (Sales & Raw Stone)
- 💰 Material rate management
- 📊 Other expenses tracking
- 🔐 User authentication and role-based access
- 🔄 Hot reload with nodemon and ts-node
- 🛡️ CORS configuration
- 📝 Environment variable management
- 🎯 Health check endpoint

## Database Schema Overview

### Core Models

- **Organization**: Multi-tenant organization management
- **User**: User management with roles (owner/user)
- **MaterialRate**: Material pricing per organization
- **TruckEntry**: Truck transactions (Sales/Raw Stone)
- **OtherExpense**: Additional expense tracking

## Prerequisites

- Node.js (version 16 or higher)
- PostgreSQL (version 12 or higher)
- npm or yarn

## Installation

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up PostgreSQL database:**

   **Option A: Using Docker (Recommended for development)**

   ```bash
   # Run PostgreSQL in Docker
   docker run --name crusher-postgres \
     -e POSTGRES_DB=crusher_backend \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 \
     -d postgres:15
   ```

   **Option B: Local PostgreSQL installation**

   ```bash
   # Create database (after installing PostgreSQL)
   createdb crusher_backend
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your PostgreSQL database credentials:

   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/crusher_backend"
   ```

4. **Generate Prisma client:**

   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations:**

   ```bash
   npm run prisma:migrate
   ```

6. **Seed the database (optional):**
   ```bash
   npm run prisma:seed
   ```

## Development

Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev:watch` - Start with nodemon file watching
- `npm run build` - Build the TypeScript code
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (Database GUI)
- `npm run prisma:seed` - Seed the database with sample data

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/test` - Test API and database connection

### Future API Structure (to be implemented)

- `POST /api/auth/login` - User authentication
- `GET /api/organizations` - Get organizations
- `GET /api/truck-entries` - Get truck entries
- `POST /api/truck-entries` - Create truck entry
- `GET /api/material-rates` - Get material rates
- `GET /api/expenses` - Get other expenses

## Project Structure

```
src/
├── index.ts          # Main application file
├── routes/           # API route handlers (to be added)
├── controllers/      # Business logic controllers (to be added)
├── middleware/       # Custom middleware (to be added)
├── utils/            # Utility functions (to be added)
prisma/
├── schema.prisma     # Database schema
├── seed.ts          # Database seeding script
├── migrations/      # Database migrations
```

## Database Models

### Organization

- Multi-tenant organization management
- Each organization has an owner and multiple users
- Isolates data between different organizations

### User

- User authentication and management
- Role-based access (owner, user)
- Belongs to an organization

### MaterialRate

- Material pricing configuration per organization
- Supports different unit types (Load, Ton, etc.)
- Can be activated/deactivated

### TruckEntry

- Core transaction model for truck entries
- Supports Sales and Raw Stone entry types
- Tracks truck details, materials, rates, and amounts
- Includes date/time tracking and status management

### OtherExpense

- Additional expense tracking
- Categorized expense management
- Date-based expense tracking

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection URL
- `JWT_SECRET` - Secret key for JWT tokens
- `CORS_ORIGIN` - CORS origin URL (frontend URL)

## Database Migration

When you make changes to the schema:

1. Update `prisma/schema.prisma`
2. Run migration: `npm run prisma:migrate`
3. Regenerate client: `npm run prisma:generate`

## Seeded Data

The seed script creates:

- Sample organization: "Sample Crusher Organization"
- Admin user (username: admin) with owner role
- Regular user (username: user1)
- Material rates for Sand and Stone
- Sample truck entries
- Sample expenses

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run migrations if schema changed
5. Test your changes
6. Commit and push
7. Create a Pull Request

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a secure `JWT_SECRET`
3. Configure production database URL
4. Run `npm run build`
5. Run `npm start`
6. Ensure PostgreSQL is properly configured with backups
