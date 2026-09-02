# Use official Node.js LTS image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV TARGET_APP_URL="https://cerulean-marshmallow-003d16.netlify.app/"

# Run continuous 24/7 cloud background worker
CMD ["npx", "tsx", "src/cloud-worker.ts"]
