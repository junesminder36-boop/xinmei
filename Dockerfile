FROM node:20-slim

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies and rebuild native modules
COPY package*.json ./
RUN npm install && npm rebuild better-sqlite3 --build-from-source

# Copy source and build
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/data/xinmei.db

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]
