FROM node:22-alpine AS frontend-builder

ENV NODE_ENV=production
# RUN apk add --no-cache python3 make g++
WORKDIR /app/dashboard/frontend
COPY dashboard/frontend/package*.json ./
RUN npm ci
COPY dashboard/frontend/ ./
RUN npm run build

# ---

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Feito por último para não ser sobrescrito pelo COPY . .
RUN mkdir -p public
COPY --from=frontend-builder /app/dashboard/frontend/dist/ ./public/

EXPOSE 8001
CMD ["node", "src/core/index.js"]