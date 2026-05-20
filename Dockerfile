# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend package files first for caching layers
COPY backend/package*.json ./backend/

WORKDIR /app/backend
RUN npm ci

# Copy backend source code and tsconfig
COPY backend/tsconfig.json ./
COPY backend/src ./src

# Build the TypeScript project
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app/backend

# Copy package files and install only production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy compiled assets from builder
COPY --from=builder /app/backend/dist ./dist

# Create empty uploads folder
RUN mkdir -p uploads

# Expose backend port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["npm", "start"]
