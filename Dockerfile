# Use the official Node.js image as a base image
FROM node:18

# Install puppeteer dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    # libxshmfence-dev \
    # libdbus-glib-1-2 \
    --no-install-recommends \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to the container
COPY package*.json ./

# Install dependencies in the container
RUN npm install

# If you're using Puppeteer, you'll need some additional dependencies.
# Uncomment the line below for Puppeteer dependencies
# RUN apt-get update && apt-get install -y libx11-xcb1 libxcomposite1 libXdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libasound2 libpangocairo-1.0-0 
# RUN apt-get update && apt-get install -y libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0
RUN apt-get update && apt-get install -y

# Copy the rest of the application to the container
COPY . .

# Expose port 3000 (or whatever port your app runs on)
EXPOSE 3000

# Command to run the app
CMD ["node", "index.js"]
