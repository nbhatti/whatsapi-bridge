
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

# Stage 2: Development runtime
FROM node:24-alpine AS development

WORKDIR /usr/src/app

# Install dumb-init, wget, and Chromium dependencies for WhatsApp Web.js
RUN apk add --no-cache \
    dumb-init \
    wget \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files and install all dependencies (including dev)
COPY package*.json tsconfig.json ./
RUN npm ci && npm cache clean --force

# Copy source code
COPY src ./src
COPY config.json ./

# Change ownership to nodejs user and add to chromium group
RUN chown -R nextjs:nodejs /usr/src/app && \
    addgroup nextjs audio && \
    addgroup nextjs video

USER nextjs

# Expose the application port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# Stage 3: Production runtime
FROM node:24-alpine AS production

WORKDIR /usr/src/app

# Install dumb-init, wget, and Chromium dependencies for WhatsApp Web.js
RUN apk add --no-cache \
    dumb-init \
    wget \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy configuration file
COPY config.json ./

# Change ownership to nodejs user and add to chromium group
RUN chown -R nextjs:nodejs /usr/src/app && \
    addgroup nextjs audio && \
    addgroup nextjs video

USER nextjs

# Expose the application port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

