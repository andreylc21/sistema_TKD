FROM node:22-alpine AS frontend-build
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
COPY docs/ /src/docs/
RUN npm run build

FROM golang:1.24-alpine AS build
WORKDIR /src/backend
COPY backend/go.mod backend/go.sum* ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -o /out/tkd-server ./cmd/server

FROM alpine:3.22
RUN addgroup -S tkd && adduser -S tkd -G tkd
WORKDIR /app
COPY --from=build /out/tkd-server /usr/local/bin/tkd-server
COPY backend/migrations ./backend/migrations
COPY backend/seed ./backend/seed
COPY --from=frontend-build /src/frontend/dist ./frontend/dist
USER tkd
EXPOSE 8080
CMD ["tkd-server"]
