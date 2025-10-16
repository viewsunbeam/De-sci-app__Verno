FROM golang:1.23-bullseye AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 go build -o /bin/chain-api ./cmd/server/main.go

FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /bin/chain-api /usr/local/bin/chain-api
COPY migrations ./migrations
COPY internal/contracts ./internal/contracts

ENV PORT=8088
EXPOSE 8088

VOLUME ["/data"]

ENV DATABASE_URL=sqlite:///data/chain-api.db
ENV CONTRACTS_CONFIG_PATH=/app/internal/contracts/contracts.json

CMD ["chain-api"]
