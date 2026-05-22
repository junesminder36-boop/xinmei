FROM node:20-slim

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies without lock file to avoid mirror registry issues
COPY package.json ./
RUN npm config set registry https://registry.npmjs.org/ && \
    npm install && \
    npm rebuild better-sqlite3 --build-from-source

# Copy source and build
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Copy missing playwright-core files into standalone output
RUN mkdir -p .next/standalone/node_modules/playwright-core \
    && cp node_modules/playwright-core/browsers.json .next/standalone/node_modules/playwright-core/ \
    && cp -r node_modules/playwright-core/lib .next/standalone/node_modules/playwright-core/ \
    && cp -r node_modules/playwright-core/package.json .next/standalone/node_modules/playwright-core/

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/data/xinmei.db

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]
