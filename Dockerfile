FROM node:12.14.1-buster-slim as builder

WORKDIR /app

# Adding depedencies
COPY package.json .
COPY package-lock.json .
RUN npm install --unsafe-perm

# Building the app
COPY / /app

RUN npm run build

FROM node:12.14.1-buster-slim

WORKDIR /app
COPY --from=builder /app /app/

ENTRYPOINT ["npm", "run", "start"]