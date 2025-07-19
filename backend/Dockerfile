FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json & lock file first (for better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm install -g wait-port

# Copy rest of the backend code
COPY . .

# Expose the backend port
EXPOSE 4000

# Run the backend
CMD ["sh", "-c", "wait-port postgres:5432 && npm start"]
