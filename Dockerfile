# Multi-stage build for React TypeScript application
# Stage 1: Install dependencies and run tests
FROM node:25-alpine AS test

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for testing)
RUN npm ci

# Copy source code
COPY . .

# Set test environment variables
ENV REACT_APP_SUPABASE_URL=https://test.supabase.co
ENV REACT_APP_SUPABASE_ANON_KEY=test-anon-key
ENV REACT_APP_REDIRECT_URL=http://localhost:3000
ENV CI=true

# Run tests with coverage
RUN npm test -- --coverage --watchAll=false --passWithNoTests

# Stage 2: Build the application
FROM node:25-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ARG REACT_APP_REDIRECT_URL

# Set environment variables for the build
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_ANON_KEY=$REACT_APP_SUPABASE_ANON_KEY
ENV REACT_APP_REDIRECT_URL=$REACT_APP_REDIRECT_URL

# Build the application
RUN npm run build

# Stage 3: Serve the application with nginx
FROM nginx:alpine AS production

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]