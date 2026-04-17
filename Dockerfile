FROM node:20-alpine

RUN apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev librsvg-dev python3

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
