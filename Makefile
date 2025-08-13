# Makefile for Docker operations
.PHONY: help build dev prod down clean logs shell db-shell db-migrate db-seed test

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up --build -d
	@echo "🚀 Development environment started at http://localhost:3000"

dev-logs: ## View development logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-down: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

# Production commands
prod: ## Start production environment
	docker-compose up --build -d
	@echo "🚀 Production environment started at http://localhost:3000"

prod-logs: ## View production logs
	docker-compose logs -f

down: ## Stop all services
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# Build commands
build: ## Build production image
	docker-compose build

build-dev: ## Build development image
	docker-compose -f docker-compose.dev.yml build

# Database commands
db-migrate: ## Run database migrations
	docker-compose exec crusher-backend npx prisma migrate deploy

db-migrate-dev: ## Run database migrations in development
	docker-compose -f docker-compose.dev.yml exec crusher-backend-dev npx prisma migrate dev

db-seed: ## Seed the database
	docker-compose exec crusher-backend npx prisma db seed

db-seed-dev: ## Seed the database in development
	docker-compose -f docker-compose.dev.yml exec crusher-backend-dev npm run prisma:seed

db-shell: ## Connect to database shell
	docker-compose exec postgres psql -U postgres -d crusher_backend

db-reset: ## Reset database (destructive!)
	docker-compose exec crusher-backend npx prisma migrate reset --force

# Utility commands
logs: ## View all logs
	docker-compose logs -f

shell: ## Access application shell
	docker-compose exec crusher-backend sh

shell-dev: ## Access development application shell
	docker-compose -f docker-compose.dev.yml exec crusher-backend-dev sh

clean: ## Clean up containers, images, and volumes
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f
	docker volume prune -f

restart: ## Restart all services
	docker-compose restart

restart-dev: ## Restart development services
	docker-compose -f docker-compose.dev.yml restart

# Health and monitoring
health: ## Check service health
	docker-compose ps
	@echo "\n🏥 Health Status:"
	@curl -s http://localhost:3000/api/health | jq . || echo "Health check failed"

# Testing
test: ## Run tests in container
	docker-compose exec crusher-backend npm test

test-dev: ## Run tests in development container
	docker-compose -f docker-compose.dev.yml exec crusher-backend-dev npm test

# Environment setup
setup-dev: ## Setup development environment
	@echo "🔧 Setting up development environment..."
	docker-compose -f docker-compose.dev.yml up -d postgres
	@echo "⏳ Waiting for database to be ready..."
	sleep 10
	docker-compose -f docker-compose.dev.yml up -d crusher-backend-dev
	@echo "⏳ Waiting for application to start..."
	sleep 15
	make db-migrate-dev
	make db-seed-dev
	@echo "✅ Development environment is ready!"

setup-prod: ## Setup production environment
	@echo "🔧 Setting up production environment..."
	docker-compose up -d postgres
	@echo "⏳ Waiting for database to be ready..."
	sleep 10
	docker-compose up -d crusher-backend
	@echo "⏳ Waiting for application to start..."
	sleep 15
	make db-migrate
	make db-seed
	@echo "✅ Production environment is ready!"
