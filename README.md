## RUN
```sh
docker-compose down && docker-compose build --no-cache && docker-compose up -d

```
## Dockerfile
```sh
FROM denoland/deno:alpine-1.24.1 as base

WORKDIR /app

COPY . ./

RUN deno cache server.ts

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "server.ts"]
```

## docker-compose
```sh
version: "3.9"

services:
    deno:
        container_name: deno
        image: deno
        restart: always
        build:
            context: .
            dockerfile: Dockerfile
            target: base
        ports:
            - "${PORT}:${PORT}"
```

### .env 
```sh
PORT=8080
```