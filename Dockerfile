# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files for both client and server
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies (using --production for faster builds if applicable, 
# but we need devDependencies for vite build)
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built frontend assets
COPY --from=build /app/dist ./dist

# Copy server code and dependencies
COPY --from=build /app/server ./server
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/node_modules ./server/node_modules

# Ensure upload directory exists
RUN mkdir -p server/public/uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "server/index.js"]
