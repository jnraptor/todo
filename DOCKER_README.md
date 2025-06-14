# Docker Setup for Todo App

This project includes Docker configuration for both production and development environments.

## Files Created

- [`Dockerfile`](./Dockerfile) - Multi-stage production build with nginx
- [`Dockerfile.dev`](./Dockerfile.dev) - Development environment with hot reloading
- [`.dockerignore`](./.dockerignore) - Excludes unnecessary files from Docker context
- [`docker-compose.yml`](./docker-compose.yml) - Orchestrates services

## Production Build

### Build and run with Docker

```bash
# Build the image
docker build -t todo-app .

# Run the container
docker run -p 3000:80 todo-app
```

### Using Docker Compose

```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d --build
```

The app will be available at http://localhost:3000

## Development Environment

### Using Docker Compose (Recommended)

```bash
# Run development environment
docker-compose --profile dev up --build

# Run in background
docker-compose --profile dev up -d --build
```

### Using Docker directly

```bash
# Build development image
docker build -f Dockerfile.dev -t todo-app-dev .

# Run with volume mounting for hot reloading
docker run -p 3001:3000 -v $(pwd):/app -v /app/node_modules todo-app-dev
```

The development server will be available at http://localhost:3001

## Environment Variables

Create a `.env` file in the project root for environment-specific variables:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Docker Commands Reference

```bash
# Stop all containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# View logs
docker-compose logs -f

# Rebuild without cache
docker-compose build --no-cache

# Remove unused images
docker image prune -f
```

## Production Deployment

For production deployment, you can:

1. Push the image to a container registry
2. Deploy to cloud platforms (AWS ECS, Google Cloud Run, etc.)
3. Use Kubernetes for orchestration

Example for pushing to Docker Hub:

```bash
# Tag the image
docker tag todo-app your-username/todo-app:latest

# Push to registry
docker push your-username/todo-app:latest