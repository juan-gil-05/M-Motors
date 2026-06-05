# Use the official Node.js stable lightweight image
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package management files first to optimize layer caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Expose Vite's default development port
EXPOSE 5173

# Run Vite in dev mode, forcing it to listen on all network interfaces (--host)
CMD ["npm", "run", "dev", "--", "--host"]