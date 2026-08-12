# ---------- Job Portal Backend (Node.js + Express) ----------
FROM node:18-alpine

WORKDIR /app

# Install curl for the container healthcheck
RUN apk add --no-cache curl

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY src ./src

# Directory where resumes are stored (mounted as a named volume in compose)
RUN mkdir -p /app/uploads/resumes

ENV NODE_ENV=production
EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "src/index.js"]
