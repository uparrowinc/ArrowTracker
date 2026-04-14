FROM node:22-bookworm-slim

WORKDIR /app

# Install build tools needed for native modules (bcrypt, better-sqlite3, sharp)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy ALL source files first (cache bust: forces fresh COPY every time)
COPY . .

# Install all dependencies (including dev for build)
RUN npm install --legacy-peer-deps

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
