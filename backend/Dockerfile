# Use Node.js LTS
FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend source
COPY . .

# Expose backend port
EXPOSE 5000

# Start the app
CMD ["npm", "start"]
