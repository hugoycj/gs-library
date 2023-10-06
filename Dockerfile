FROM oven/bun

WORKDIR /app
COPY viewer/package.json package.json
RUN bun install

COPY viewer/ /app
RUN bun run build

EXPOSE 3000
CMD ["bun", "./build"]