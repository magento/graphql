# Services

All outbound requests made within GraphQL resolvers should be abstracted away via services.

Services should:

1. Manage caching/batching
2. Not expose their backing transport/format (grpc + protobufs, HTTP + json, etc)

No work related to caching has been done yet.
