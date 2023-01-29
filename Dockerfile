FROM node:19-alpine

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
COPY ["src", "./src/"]

RUN mkdir /.npm \
    && npm install \
    && npm run build \
    && chown -R 1000660000:0 /.npm

EXPOSE 8080

CMD ["npm", "run", "server:prod"]
