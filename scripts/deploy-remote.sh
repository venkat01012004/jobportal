#!/usr/bin/env bash
# =====================================================================
# Runs ON the EC2 host (invoked over SSH by the GitHub Actions workflow).
# 1. Logs Docker in to Amazon ECR
# 2. Pulls the images tagged for this commit (from .env: IMAGE_TAG)
# 3. Recreates the stack with docker compose, waiting for health checks
# 4. Prunes old images so disk doesn't fill up over time
# =====================================================================
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/job-portal}"
cd "$DEPLOY_DIR"

if [ ! -f .env ]; then
  echo "ERROR: .env not found in $DEPLOY_DIR. The pipeline should have copied one." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a && source .env && set +a

: "${AWS_REGION:?AWS_REGION must be set}"
: "${ECR_REGISTRY:?ECR_REGISTRY must be set}"
: "${ECR_REPOSITORY:?ECR_REPOSITORY must be set}"
: "${IMAGE_TAG:?IMAGE_TAG must be set}"

echo ">>> Logging in to Amazon ECR ($ECR_REGISTRY)"
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo ">>> Pulling images for tag: $IMAGE_TAG"
docker compose -f docker-compose.prod.yml pull

echo ">>> Recreating stack"
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo ">>> Waiting for containers to report healthy..."
for i in $(seq 1 30); do
  UNHEALTHY=$(docker compose -f docker-compose.prod.yml ps --format '{{.Health}}' 2>/dev/null | grep -vc "healthy" || true)
  if [ "$UNHEALTHY" -eq 0 ]; then
    echo "All services healthy."
    break
  fi
  echo "Waiting on $UNHEALTHY service(s)... ($i/30)"
  sleep 5
done

echo ">>> Local endpoint check"
curl -f http://localhost/healthz || (echo "Local health check failed" && exit 1)

echo ">>> Pruning old, unused images"
docker image prune -af --filter "until=48h" || true

echo ">>> Deploy complete: $ECR_REGISTRY/$ECR_REPOSITORY (tag: $IMAGE_TAG)"
