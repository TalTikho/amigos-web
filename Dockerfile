FROM node:20-alpine
LABEL authors="Tal Kfir"
LABEL version="0.1"

WORKDIR /app

# Copy only package.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY ./src ./src
COPY ./public ./public

# Start the app
CMD ["npm", "start", "--", "--host", "0.0.0.0"]
