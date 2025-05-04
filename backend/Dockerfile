FROM node:18-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ sqlite

# Create app directory
WORKDIR /app

# Set npm cache to a location where node user has permissions
ENV NPM_CONFIG_CACHE=/tmp/.npm

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and config files
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-alpine

# Install sqlite3
RUN apk add --no-cache sqlite

# Create app directory
WORKDIR /app

# Set npm cache to a location where node user has permissions
ENV NPM_CONFIG_CACHE=/tmp/.npm

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy built files and configs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.sequelizerc ./
COPY --from=builder /app/ecosystem.config.js ./
COPY --from=builder /app/src/migrations ./migrations
COPY --from=builder /app/src/config ./config

# Copy public directory with assets
COPY --from=builder /app/public ./public

# Create directories and set permissions
RUN mkdir -p /app/data /app/logs /tmp/.npm && \
    chown -R node:node /app/data /app/logs /app/public /tmp/.npm && \
    chmod -R 777 /app/data /tmp/.npm

# Set environment variables
ENV DB_PATH=/app/data/hockey-pool.db
ENV NODE_ENV=development

# Switch to non-root user
USER node

# Expose port
EXPOSE 3300

# Start the application with migrations
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node dist/index.js"]