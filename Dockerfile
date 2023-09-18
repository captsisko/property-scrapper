# Use the official Node.js image as a base image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to the container
COPY package*.json ./

# Install dependencies in the container
RUN npm install

# If you're using Puppeteer, you'll need some additional dependencies.
# Uncomment the line below for Puppeteer dependencies
# RUN apt-get update && apt-get install -y libx11-xcb1 libxcomposite1 libXdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libasound2 libpangocairo-1.0-0 
RUN apt-get update && apt-get install -y libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0

# Copy the rest of the application to the container
COPY . .

# Expose port 3000 (or whatever port your app runs on)
EXPOSE 3000

# Command to run the app
CMD ["npm", "start"]
