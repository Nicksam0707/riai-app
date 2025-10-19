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
# Generate runtime env.js and start server; both PORT and REACT_APP_API_BASE_URL come from Render env vars
ENV PORT=80
CMD ["sh", "-c", "echo 'window.__ENV = { REACT_APP_API_BASE_URL: \"'${REACT_APP_API_BASE_URL:-http://127.0.0.1:8000}'\" };' > build/env.js && serve -s build -l ${PORT}"]
