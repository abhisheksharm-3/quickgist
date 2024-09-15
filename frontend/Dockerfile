# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY frontend/package*.json ./

# Copy all configuration files
COPY frontend/*.json ./
COPY frontend/*.js ./
COPY frontend/*.ts ./

# Install dependencies
RUN npm ci

# Copy source files and public assets
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/index.html ./

# Accept build arguments
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_SERVER_URI     
ARG VITE_FRONTEND_URI

# Set environment variables during build
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_SERVER_URI=$VITE_SERVER_URI     
ENV VITE_FRONTEND_URI=$VITE_FRONTEND_URI

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY ../nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
