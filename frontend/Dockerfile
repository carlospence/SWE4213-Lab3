# Frontend Dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# build app
# RUN npm run build

EXPOSE 5000
# CMD ["npm", "dev"]
CMD npm run dev
