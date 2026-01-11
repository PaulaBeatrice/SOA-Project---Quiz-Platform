FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3002

CMD ["npx", "webpack", "serve", "--mode", "development", "--host", "0.0.0.0", "--port", "3002"]
