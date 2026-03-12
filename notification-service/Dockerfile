# Notification Service Dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package.json  ./
RUN npm install --production

COPY . .

# No ports exposed; service runs in background consuming messages

CMD ["npm", "start"]
