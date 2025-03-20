# In your frontend Dockerfile
FROM node:14

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install the serve package globally
RUN npm install -g serve

# Copy the rest of the app
COPY . .

# Expose port 3000
EXPOSE 3000

# Run the app using the 'serve' command
CMD ["serve", "-s", "build", "-l", "3000"]
