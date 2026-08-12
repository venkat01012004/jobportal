# ---------- Stage 1: Build the React app ----------
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY public ./public
COPY src ./src

# REACT_APP_API_URL is baked into the JS bundle at build time.
# We point it at /api since the top-level Nginx reverse proxy
# forwards /api/* to the backend container.
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# ---------- Stage 2: Serve the static build with Nginx ----------
FROM nginx:1.27-alpine

RUN apk add --no-cache curl

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD curl -f http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
