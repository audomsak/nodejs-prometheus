FROM node:19-alpine

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
COPY ["src", "./src/"]

RUN npm install && npm run build

EXPOSE 8080

CMD ["npm", "run", "server:prod"]
