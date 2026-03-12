# Appointment Service Dockerfile
FROM node:18-alpine
WORKDIR /app

# copy package manifest
COPY package.json ./

# install dependencies
RUN npm install

# copy source code
COPY . .

# expose port used by service
EXPOSE 5001

CMD ["npm", "start"]
