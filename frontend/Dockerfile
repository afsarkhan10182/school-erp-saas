# --- Stage 1: Build ---
    FROM node:22-alpine AS build
    WORKDIR /app
    
    # Enable pnpm/yarn if present
    RUN corepack enable
    
    # Copy dependency files only (better cache)
    COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
    
    # Install dependencies (try pnpm → npm → yarn)
    RUN pnpm install --frozen-lockfile || npm ci || yarn install --frozen-lockfile
    
    # Copy entire frontend source
    COPY . .
    
    # Build Nuxt SSR → outputs to .output/
    RUN pnpm run build || npm run build || yarn build
    
    # --- Stage 2: Runtime ---
    FROM node:22-alpine
    WORKDIR /app
    
    # Copy only the final Nuxt SSR build output
    COPY --from=build /app/.output ./.output
    
    # Env vars for Nuxt SSR
    ENV NODE_ENV=production
    ENV PORT=3000
    ENV HOST=0.0.0.0
    
    EXPOSE 3000
    
    # Start Nuxt SSR
    CMD ["node", ".output/server/index.mjs"]
    