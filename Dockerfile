# Creating multi-stage build for production
FROM node:21-alpine AS build
LABEL org.opencontainers.image.source=https://github.com/mrofisr/strapi

RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git > /dev/null 2>&1
ENV NODE_ENV=production

WORKDIR /opt/
COPY package.json ./
RUN npm install -g bun
ENV PATH="/root/.bun/bin:$PATH"
RUN bun install --production
ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . .
RUN bun run build

# Creating final production images
FROM node:21-alpine
LABEL org.opencontainers.image.source=https://github.com/mrofisr/strapi

RUN apk add --no-cache vips-dev tzdata
RUN ln -s /usr/share/zoneinfo/Asia/Jakarta /etc/localtime
RUN npm install -g bun
ENV NODE_ENV=production

WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules
WORKDIR /opt/app
COPY --from=build /opt/app ./
ENV PATH=/opt/node_modules/.bin:$PATH

RUN chown -R node:node /opt/app
USER node

HEALTHCHECK --interval=1m30s --timeout=30s --start-period=30s --retries=5 CMD curl --fail http://localhost:1337/_health || exit 1

EXPOSE 1337
CMD ["bun", "start"]