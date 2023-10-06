FROM oven/bun

WORKDIR /app
COPY viewer/package.json package.json
RUN bun install

COPY viewer/ /app
RUN bun run build

EXPOSE 7860
ENTRYPOINT ["bun", "./build"]