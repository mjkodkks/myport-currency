FROM denoland/deno:alpine-1.24.1 as base

WORKDIR /app

COPY . ./

RUN deno cache server.ts

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "server.ts"]