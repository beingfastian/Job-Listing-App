@echo off
echo Starting optimized build process...

echo Setting Docker BuildKit (enables parallel building and better caching)...
set DOCKER_BUILDKIT=1
set COMPOSE_DOCKER_CLI_BUILD=1

echo Building all services in parallel...
docker compose build --parallel

echo Build completed! Starting services...
docker compose up -d

echo =====================================
echo Job Listings Portal is now running!
echo Frontend: http://localhost:3000
echo API: http://localhost:5000/api
echo =====================================