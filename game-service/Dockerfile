FROM node:18-alpine

WORKDIR /app

# Copy only package.json and package-lock.json
COPY package*.json ./

# Install dependencies fresh
RUN rm -rf node_modules && npm install --production

# Copy source files (after dependencies)
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
