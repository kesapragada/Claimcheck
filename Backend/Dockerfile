# Use a specific, stable Node.js version as the base
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# --- INSTALL ALL REQUIRED SYSTEM DEPENDENCIES ---
# This installs ImageMagick (for pdf2pic), Ghostscript (for PDF reading),
# and Tesseract with its English language pack.
RUN apt-get update && apt-get install -y --no-install-recommends \
    imagemagick \
    ghostscript \
    tesseract-ocr \
    tesseract-ocr-eng \
 && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json first to leverage Docker's build cache
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Expose the port your app runs on
EXPOSE 10000

# The command to start your application
CMD [ "node", "server.js" ]