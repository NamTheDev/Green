FROM oven/bun:1.1 AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install

FROM base AS release
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production

USER bun
ENTRYPOINT [ "bun", "start" ]
