FROM node:12.14.1-buster-slim

WORKDIR /usr/src/app
COPY package*.json ./
COPY . ./
RUN npm ci
RUN npm run build
# Default port config in magento-graphql app
EXPOSE 8008
CMD ["./bin/magento-graphql", "start"]
