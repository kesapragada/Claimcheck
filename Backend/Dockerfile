# Use an official Node.js runtime as a parent image.
# Using a specific version like 20 is good practice.
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# --- INSTALL SYSTEM DEPENDENCIES ---
# First, update the package lists, then install graphicsmagick and any other tools.
# The '&& rm -rf /var/lib/apt/lists/*' cleans up to keep the image small.
RUN apt-get update && apt-get install -y graphicsmagick && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of your application code into the container
COPY . .

# Your app binds to port 10000, so we expose it.
# Render will automatically use the PORT environment variable regardless.
EXPOSE 10000

# Define the command to run your app
CMD [ "node", "server.js" ]