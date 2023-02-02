FROM registry.redhat.io/rhel9/nodejs-18:1-26

WORKDIR /usr/app

COPY ["package.json", "package-lock.json*", "./"]
COPY ["src", "./src/"]

USER 0

RUN chown -R 1001:1001 /usr/app

USER 1001

RUN npm install \
    && npm run build

EXPOSE 8080

CMD ["npm", "run", "server:prod"]
