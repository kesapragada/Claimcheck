# Backend/Dockerfile - Updated to include GraphicsMagick
FROM node:20-slim
WORKDIR /usr/src/app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    graphicsmagick \     
    imagemagick \        
    ghostscript \
    tesseract-ocr \
    tesseract-ocr-eng \
 && rm -rf /var/lib/apt/lists/*

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy the rest of the app code
COPY . .

EXPOSE 10000
CMD [ "node", "server.js" ]
