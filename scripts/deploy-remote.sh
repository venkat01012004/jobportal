#!/usr/bin/env bash

# =====================================================================
# Runs ON the EC2 host
#
# 1. Login to Amazon ECR
# 2. Pull Docker images for the current commit
# 3. Recreate application using Docker Compose
# 4. Wait for services to become healthy
# 5. Check local health endpoint
# 6. Remove old unused Docker images
# =====================================================================

set -euo pipefail


# =====================================================================
# Deployment directory
# =====================================================================

DEPLOY_DIR="${DEPLOY_DIR:-/opt/job-portal}"

cd "$DEPLOY_DIR"


# =====================================================================
# Check .env
# =====================================================================

if [ ! -f .env ]; then

    echo "ERROR: .env not found in $DEPLOY_DIR"

    exit 1

fi


# =====================================================================
# Load environment variables
# =====================================================================

set -a

source .env

set +a


# =====================================================================
# Required variables
# =====================================================================

: "${AWS_REGION:?AWS_REGION must be set}"

: "${ECR_REGISTRY:?ECR_REGISTRY must be set}"

: "${ECR_REPOSITORY_BACKEND:?ECR_REPOSITORY_BACKEND must be set}"

: "${ECR_REPOSITORY_FRONTEND:?ECR_REPOSITORY_FRONTEND must be set}"

: "${IMAGE_TAG:?IMAGE_TAG must be set}"


# =====================================================================
# Detect Docker Compose
# =====================================================================

echo ">>> Checking Docker Compose..."

if docker compose version >/dev/null 2>&1; then

    COMPOSE_CMD="docker compose"

    echo ">>> Using Docker Compose plugin"

elif command -v docker-compose >/dev/null 2>&1; then

    COMPOSE_CMD="docker-compose"

    echo ">>> Using docker-compose"

else

    echo "ERROR: Docker Compose is not installed on EC2."

    echo "Install Docker Compose plugin and run the deployment again."

    exit 1

fi


# =====================================================================
# Show versions
# =====================================================================

echo ">>> Docker version"

docker --version

echo ">>> Docker Compose version"

$COMPOSE_CMD version


# =====================================================================
# Login to Amazon ECR
# =====================================================================

echo ">>> Logging in to Amazon ECR ($ECR_REGISTRY)"

aws ecr get-login-password \
    --region "$AWS_REGION" |
    docker login \
    --username AWS \
    --password-stdin "$ECR_REGISTRY"


# =====================================================================
# Pull images
# =====================================================================

echo ">>> Pulling images for tag: $IMAGE_TAG"

$COMPOSE_CMD \
    -f docker-compose.prod.yml \
    pull


# =====================================================================
# Recreate application stack
# =====================================================================

echo ">>> Recreating stack"

$COMPOSE_CMD \
    -f docker-compose.prod.yml \
    up -d \
    --remove-orphans


# =====================================================================
# Wait for containers to become healthy
# =====================================================================

echo ">>> Waiting for containers to report healthy..."

HEALTHY=false

for i in $(seq 1 30); do

    echo ">>> Health check attempt $i/30"

    UNHEALTHY=$(
        $COMPOSE_CMD \
            -f docker-compose.prod.yml \
            ps \
            --format '{{.Health}}' \
            2>/dev/null |
            grep -vc "healthy" || true
    )

    if [ "$UNHEALTHY" -eq 0 ]; then

        echo ">>> All services healthy."

        HEALTHY=true

        break

    fi

    echo ">>> Waiting on $UNHEALTHY service(s)..."

    sleep 5

done


# =====================================================================
# Fail if containers are not healthy
# =====================================================================

if [ "$HEALTHY" != "true" ]; then

    echo "ERROR: Containers did not become healthy."

    echo ">>> Docker Compose status:"

    $COMPOSE_CMD \
        -f docker-compose.prod.yml \
        ps

    echo ">>> Docker Compose logs:"

    $COMPOSE_CMD \
        -f docker-compose.prod.yml \
        logs \
        --tail=100

    exit 1

fi


# =====================================================================
# Local endpoint health check
# =====================================================================

echo ">>> Local endpoint check"

if curl -f http://localhost/healthz; then

    echo
    echo ">>> Local health check successful."

else

    echo
    echo "ERROR: Local health check failed."

    $COMPOSE_CMD \
        -f docker-compose.prod.yml \
        ps

    exit 1

fi


# =====================================================================
# Prune old Docker images
# =====================================================================

echo ">>> Pruning old, unused images"

docker image prune \
    -af \
    --filter "until=48h" || true


# =====================================================================
# Deployment summary
# =====================================================================

echo
echo "=============================================================="

echo ">>> DEPLOYMENT COMPLETE"

echo "=============================================================="

echo "Backend image:"

echo "  $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG"

echo

echo "Frontend image:"

echo "  $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG"

echo

echo "Nginx image:"

echo "  nginx:1.27-alpine"

echo

echo "Deployment directory:"

echo "  $DEPLOY_DIR"

echo "=============================================================="
