# 🐳 Docker Containerization Guide

This guide explains how to run the Crusher Backend application using Docker containers.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, for convenience commands)

## 🚀 Quick Start

### Development Environment

```bash
# Start development environment with hot reload
make dev

# Or using docker-compose directly
docker-compose -f docker-compose.dev.yml up --build -d
```

### Production Environment

```bash
# Start production environment
make prod

# Or using docker-compose directly
docker-compose up --build -d
```

## 📁 Docker Files Structure

```
├── Dockerfile              # Multi-stage production build
├── Dockerfile.dev          # Development build with hot reload
├── docker-compose.yml      # Production services
├── docker-compose.dev.yml  # Development services
├── .dockerignore           # Files excluded from Docker context
├── nginx.conf              # Nginx reverse proxy configuration
├── Makefile                # Convenience commands
└── src/healthcheck.js      # Health check script
```

## 🛠️ Available Services

### Production (`docker-compose.yml`)

- **crusher-backend**: Main application (Node.js/TypeScript)
- **postgres**: PostgreSQL 15 database
- **redis**: Redis cache (optional)
- **nginx**: Reverse proxy with rate limiting

### Development (`docker-compose.dev.yml`)

- **crusher-backend-dev**: Development app with hot reload
- **postgres**: PostgreSQL 15 database

## 🎛️ Make Commands

```bash
# Development
make dev              # Start development environment
make dev-logs         # View development logs
make dev-down         # Stop development environment
make setup-dev        # Complete development setup with DB migration

# Production
make prod             # Start production environment
make prod-logs        # View production logs
make setup-prod       # Complete production setup with DB migration

# Database Operations
make db-migrate       # Run database migrations (production)
make db-migrate-dev   # Run database migrations (development)
make db-seed          # Seed database (production)
make db-seed-dev      # Seed database (development)
make db-shell         # Connect to database shell
make db-reset         # Reset database (destructive!)

# Utilities
make logs             # View all logs
make shell            # Access application shell (production)
make shell-dev        # Access application shell (development)
make clean            # Clean up containers and volumes
make health           # Check service health
make test             # Run tests
```

## 🔧 Manual Docker Commands

### Development

```bash
# Build and start development
docker-compose -f docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f crusher-backend-dev

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production

```bash
# Build and start production
docker-compose up --build -d

# View logs
docker-compose logs -f crusher-backend

# Stop services
docker-compose down
```

## 🌍 Environment Variables

### Production Environment

- `NODE_ENV=production`
- `LOG_LEVEL=info`
- `DATABASE_URL=postgresql://postgres:password@postgres:5432/crusher_backend`

### Development Environment

- `NODE_ENV=development`
- `LOG_LEVEL=debug`
- `DATABASE_URL=postgresql://postgres:password@postgres:5432/crusher_backend`

## 🏥 Health Checks

All services include health checks:

- **Application**: `GET /api/health`
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`

## 📊 Service Ports

### Development

- Application: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

### Production

- Nginx (HTTP): `http://localhost:80`
- Application (direct): `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## 🔒 Security Features

### Nginx Configuration

- Rate limiting (10 req/sec general, 5 req/min for auth)
- Security headers (HSTS, XSS protection, etc.)
- SSL/TLS ready (uncomment HTTPS section)

### Docker Security

- Non-root user execution
- Multi-stage builds for smaller images
- Minimal attack surface with Alpine Linux

## 📈 Monitoring

### Logs

```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f crusher-backend

# View logs with timestamps
docker-compose logs -f -t crusher-backend
```

### Resource Usage

```bash
# View container stats
docker stats

# View service status
docker-compose ps
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Check what's using port 3000
   lsof -i :3000
   # Or change port in docker-compose.yml
   ```

2. **Database connection failed**

   ```bash
   # Check if PostgreSQL is healthy
   docker-compose exec postgres pg_isready -U postgres

   # View database logs
   docker-compose logs postgres
   ```

3. **Application won't start**

   ```bash
   # Check application logs
   docker-compose logs crusher-backend

   # Access container shell
   docker-compose exec crusher-backend sh
   ```

### Debug Mode

```bash
# Start with debug logging
LOG_LEVEL=debug docker-compose up

# Access application shell for debugging
docker-compose exec crusher-backend sh
```

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Rebuild and restart
docker-compose up --build -d

# Or force rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Database Migrations

```bash
# Run pending migrations
make db-migrate

# Create new migration
docker-compose exec crusher-backend npx prisma migrate dev --name your_migration_name
```

### Cleanup

```bash
# Remove containers and volumes
make clean

# Or manual cleanup
docker-compose down -v
docker system prune -f
```

## 📝 Best Practices

1. **Use specific image tags** in production
2. **Set resource limits** for containers
3. **Use secrets management** for sensitive data
4. **Regular backups** of database volumes
5. **Monitor container health** and logs
6. **Keep images updated** for security patches

## 🎯 Production Deployment

For production deployment:

1. **Update environment variables** in docker-compose.yml
2. **Configure SSL certificates** in nginx.conf
3. **Set up proper secrets management**
4. **Configure backup strategy** for PostgreSQL
5. **Set up log aggregation** (ELK stack, etc.)
6. **Configure monitoring** (Prometheus, Grafana, etc.)

## 📞 Support

If you encounter issues:

1. Check the logs: `make logs`
2. Verify service health: `make health`
3. Review this documentation
4. Check Docker and Docker Compose versions
