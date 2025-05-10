FROM node:18-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install dependencies with cache optimization
RUN npm ci --only=production && \
    # Create a .next directory with proper permissions
    mkdir -p .next && \
    # Add runtime dependencies globally to reduce layers
    npm install -g next@13 react@18 react-dom@18

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]