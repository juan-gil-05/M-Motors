# 1 : React app Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./

# npm install all dependencies 
RUN npm ci

# Copy the rest of the frontend code
COPY . .

# React app compilation and creation of 'dist' folder with the HTML, CSS and JS from the app
RUN npm run build


# 2 : Nginx server
FROM nginx:alpine

# Copy of 'dist' folder in the nginx server
COPY --from=build /app/dist /usr/share/nginx/html

# Configuration Nginx for React Router
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Run of nginx server
CMD ["nginx", "-g", "daemon off;"]