FROM node:22-alpine
WORKDIR /app

# Copy & install only prod deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy rest of backend code
COPY . .

EXPOSE 4000
CMD ["npm", "start"]
