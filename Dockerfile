# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies (including dev dependencies)
RUN npm install

# Copy the rest of the code
COPY . .

# Expose your app port
EXPOSE 8000

# Run with nodemon for development
CMD ["npm", "run", "start"]
