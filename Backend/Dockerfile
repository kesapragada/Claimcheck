# Use a specific, stable Node.js version
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# --- INSTALL ALL REQUIRED SYSTEM DEPENDENCIES ---
# Ghostscript is needed for PDF processing by GraphicsMagick
RUN apt-get update && apt-get install -y --no-install-recommends \
    graphicsmagick \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 10000

# Run the app
CMD [ "node", "server.js" ]