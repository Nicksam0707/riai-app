// Frontend Dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || yarn || pnpm i
COPY . .
RUN npm run build || yarn build || pnpm build

# Use a lightweight Node server to serve static files and bind to Render's PORT
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/build ./build
EXPOSE 80
# Use sh -c so ${PORT} is expanded at runtime (Render provides PORT)
CMD ["sh", "-c", "serve -s build -l ${PORT:-80}"]
