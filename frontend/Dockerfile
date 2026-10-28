
#frontend/Dockerfile
# ===== Stage 1: build =====
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# Ensure devDependencies (vite) are installed during the build stage
ENV NODE_ENV=development
RUN npm ci --include=dev

COPY . .

RUN npm run build


# ===== Stage 2: production =====
FROM nginx:1.27-alpine

# hapus default config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

# hanya copy hasil build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]