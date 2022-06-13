FROM node:lts-alpine@sha256:c785e617c8d7015190c0d41af52cc69be8a16e3d9eb7cb21f0bb58bcfca14d6b as build-container

WORKDIR "/app"

COPY package*.json "/app/"
RUN npm ci

COPY . "/app/"
RUN npm run build && \
    rm -rf ./.github ./src ./test ./node_modules


FROM node:lts-alpine@sha256:c785e617c8d7015190c0d41af52cc69be8a16e3d9eb7cb21f0bb58bcfca14d6b
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
WORKDIR "/app"

RUN apk add --no-cache --update dumb-init && \
    ln -s /app/dist/bin/start.js /usr/local/bin/start && \
    ln -s /app/dist/bin/cli.js /usr/local/bin/cli

COPY --from=build-container /app/package*.json "/app/"
RUN npm ci --only-production

COPY --from=build-container "/app" "/app"
USER node

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/usr/local/bin/start"]
