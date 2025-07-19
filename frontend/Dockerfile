# --- Stage 1: Build ---
    FROM node:22-alpine AS build
    WORKDIR /app
    
    RUN corepack enable  # enables pnpm/yarn
    
    # Copy only dependency files for caching
    COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
    
    # Install dependencies
    RUN pnpm install --frozen-lockfile || npm ci || yarn install --frozen-lockfile
    
    # Copy all frontend source
    COPY . .
    
    # Build Nuxt SSR → outputs to .output/
    RUN pnpm run build || npm run build || yarn build
    
    
    # --- Stage 2: Runtime ---
    FROM node:22-alpine
    WORKDIR /app
    
    # Copy only the final Nuxt build (SSR)
    COPY --from=build /app/.output ./.output
    
    # Expose Nuxt SSR on port 3000 inside container
    ENV NODE_ENV=production
    ENV PORT=3000
    ENV HOST=0.0.0.0
    
    EXPOSE 3000
    
    # Start Nuxt SSR server
    CMD ["node", ".output/server/index.mjs"]
    
    