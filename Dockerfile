# Use the official nginx alpine as the base image for a lightweight container
# Alpine-based images are smaller in size and more secure
FROM nginx:alpine

# Set the working directory in the container
# This is where our application files will be placed
WORKDIR /usr/share/nginx/html

# Copy all files from the current directory (.) to the working directory in the container (.)
# This includes HTML, CSS, JavaScript, and other static files
COPY . .

# Create custom Nginx configuration to listen on port 5000
RUN echo 'server { \
    listen 5000; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 5000 for the Nginx web server
# This matches the port mapping in the docker run command (-p 5000:5000)
EXPOSE 5000

# Start the Nginx server in the foreground
# The 'daemon off' directive is required to run nginx in the foreground
# This is important for Docker containers as they should run in the foreground
CMD ["nginx", "-g", "daemon off;"] 