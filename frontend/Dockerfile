# --- Stage 1: Build ---
FROM node:20-alpine AS builder

# Set working dir
WORKDIR /app

# Copy package files & install deps
COPY package*.json ./
RUN npm install

# Copy all frontend source
COPY . .

# Build Nuxt for production
RUN npm run build

# --- Stage 2: Production Image ---
FROM node:20-alpine

WORKDIR /app

# Copy only the built output + minimal runtime deps
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose Nuxt SSR port
EXPOSE 3000

# Run Nuxt SSR
CMD ["node", ".output/server/index.mjs"]

