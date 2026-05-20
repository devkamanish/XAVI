# Build stage for Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build stage for Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app/backend

# Copy package files and install only production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy compiled backend assets
COPY --from=backend-builder /app/backend/dist ./dist

# Copy compiled frontend assets
COPY --from=frontend-builder /app/frontend/dist ../frontend/dist

# Create empty uploads folder
RUN mkdir -p uploads

# Expose backend port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["npm", "start"]
