FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source
COPY . .

# Build React app
RUN cd client && npm run build

# Create directory for database
RUN mkdir -p server/data

EXPOSE 3001

# Force rebuild: v1
CMD ["node", "server/index.js"]
