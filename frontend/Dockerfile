FROM node:22-alpine

WORKDIR /app

# Use the existing 'node' user (UID 1000 in node:alpine)
# No need to create a custom user

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create directories for Nuxt builds (owned by node user)
RUN mkdir -p .nuxt .output && chown -R node:node .nuxt .output /app

# Switch to non-root node user
USER node

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
