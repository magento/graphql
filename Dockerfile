FROM node:12.14.1-buster-slim as builder

RUN apt-get update && apt-get install -y cargo openssl pkg-config librust-cargo+openssl-dev jq && cargo install pq

WORKDIR /app

RUN mkdir -p sites/grpc
RUN mkdir -p generated

# Adding depedencies
COPY package.json .
COPY package-lock.json .
RUN npm install --unsafe-perm

# Building the app
COPY / /app

#Put a list of proto file names in services.json. Three command should be repeated for each service
RUN /root/.cargo/bin/pq --msgtype google.protobuf.FileDescriptorSet --fdsetfile ./magento_assets/dp.fdset < ./magento_assets/fdsets/app.protoset  | jq '.file | map(.name)' > proto.json
RUN jq --arg service app --argfile protolist proto.json 'to_entries | select (.[].key == $service) | .[].value.protos = $protolist | from_entries' services.json > services2.json
RUN mv services2.json services.json

RUN npm run build

FROM node:12.14.1-buster-slim

WORKDIR /app
COPY --from=builder /app /app/

ENTRYPOINT ["npm", "run", "start"]