
# Stage 1: Build the application
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Stage 2: Production runtime
FROM node:24-alpine AS production

WORKDIR /usr/src/app

# Install dumb-init and wget for proper signal handling and healthcheck
RUN apk add --no-cache dumb-init wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Change ownership to nodejs user
RUN chown -R nextjs:nodejs /usr/src/app
USER nextjs

# Expose the application port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

