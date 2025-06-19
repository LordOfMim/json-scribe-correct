FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g serve

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["serve", "-s", "dist", "-l", "8080"]
