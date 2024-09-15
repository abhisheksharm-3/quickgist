# Use official Golang image as base
FROM golang:1.22.3-alpine

# Set working directory
WORKDIR /app

# Copy the entire backend directory
COPY backend/web .

# Copy go mod and sum files (if they're in the root directory)
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy Firebase secrets
COPY firebase-secrets.json /app/firebase-secrets.json

# Build the application
RUN go build -o main .

# Expose port 3000
EXPOSE 3000

# Run the application
CMD ["./main"]