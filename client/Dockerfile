# Giai đoạn 1: build web
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Gọi API cùng địa chỉ trang web (Caddy chuyển /api sang server). Biến môi trường thắng file .env.
ENV VITE_API_URL=/api
RUN npm run build

# Giai đoạn 2: Caddy phục vụ web + chuyển /api sang server (tự cấp HTTPS khi có tên miền)
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
