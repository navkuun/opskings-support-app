---
url: "https://zero.rocicorp.dev/docs/server-zql"
title: "ZQL on the Server"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# ZQL on the Server  Copy markdown  \\# ZQL on the Server  The Zero package includes utilities to run ZQL on the server directly against your upstream Postgres database.  This is useful for many reasons:  \\* It allows \[mutators\](https://zero.rocicorp.dev/docs/mutators) to read data using ZQL to check permissions or invariants. \\* You can use ZQL to implement standard REST endpoints, allowing you to share code with mutators. \\* In the future (\[but not yet implemented\](\#ssr)), this can support server-side rendering.  \> \`ZQLDatabase\` currently does a read of your postgres schema before every transaction. This is fine for most usages, but for high scale it may become a problem. \[Let us know\](https://bugs.rocicorp.dev/issue/3799) if you need a fix for this.  \\#\# Creating a Database  To run ZQL on the database, you will create a \`ZQLDatabase\` instance. Zero ships with several built-in factories for popular Postgres bindings libraries.  Within your mutators, you can access the underlying transaction via \`tx.dbTransaction.wrappedTransaction\`:  \\#\#\# Custom Database  To implement support for some other Postgres bindings library, you will implement the \`DBConnection\` interface.  See the implementations for the \[existing adapters\](https://github.com/rocicorp/mono/tree/main/packages/zero-server/src/adapters) for examples.  \\#\# Running ZQL  Once you have an instance of \`ZQLDatabase\`, use the \`transaction()\` method to run ZQL:  \`\`\`ts await dbProvider.transaction(async tx => { // await tx.mutate... // await tx.query... // await myMutator.fn({tx, ctx, args}) }) \`\`\`  \\#\# SSR  Zero doesn't yet have the wiring setup in its bindings layers to really nicely support server-side rendering (\[patches welcome though!\](https://bugs.rocicorp.dev/issue/3491)).  For now, we don't recommend using Zero with SSR. Use your framework's recommended pattern to prevent SSR execution:      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

The Zero package includes utilities to run ZQL on the server directly against your upstream Postgres database.

This is useful for many reasons:

- It allows [mutators](https://zero.rocicorp.dev/docs/mutators) to read data using ZQL to check permissions or invariants.
- You can use ZQL to implement standard REST endpoints, allowing you to share code with mutators.
- In the future ( [but not yet implemented](https://zero.rocicorp.dev/docs/server-zql#ssr)), this can support server-side rendering.

[😬Warning](https://zero.rocicorp.dev/docs/server-zql#schema-read)

## [Creating a Database](https://zero.rocicorp.dev/docs/server-zql\#creating-a-database)

To run ZQL on the database, you will create a `ZQLDatabase` instance. Zero ships with
several built-in factories for popular Postgres bindings libraries.

Drizzlenode-postgrespostgres.js

```
Copy// app/api/mutate/db-provider.ts
import {zeroDrizzle} from '@rocicorp/zero/server/adapters/drizzle'
import {schema} from '../../zero/schema.ts'

// pass a drizzle client instance. for example:
export const drizzleClient = drizzle(pool, {
  schema: drizzleSchema
})
export const dbProvider = zeroDrizzle(schema, drizzleClient)

// Register the database provider for type safety
declare module '@rocicorp/zero' {
  interface DefaultTypes {
    dbProvider: typeof dbProvider
  }
}
```

Within your mutators, you can access the underlying transaction via `tx.dbTransaction.wrappedTransaction`:

Drizzlenode-postgrespostgres.js

```
Copy// mutators.ts
export const mutators = defineMutators({
  createUser: defineMutator(
    z.object({id: z.string(), name: z.string()}),
    async ({tx, args: {id, name}}) => {
      if (tx.location === 'server') {
        await tx.dbTransaction.wrappedTransaction
          .insert(drizzleSchema.user)
          .values({id, name})
      }
    }
  )
})
```

### [Custom Database](https://zero.rocicorp.dev/docs/server-zql\#custom-database)

To implement support for some other Postgres bindings library, you will implement the `DBConnection` interface.

See the implementations for the [existing adapters](https://github.com/rocicorp/mono/tree/main/packages/zero-server/src/adapters) for examples.

## [Running ZQL](https://zero.rocicorp.dev/docs/server-zql\#running-zql)

Once you have an instance of `ZQLDatabase`, use the `transaction()` method to run ZQL:

```
Copyawait dbProvider.transaction(async tx => {
  // await tx.mutate...
  // await tx.query...
  // await myMutator.fn({tx, ctx, args})
})
```

## [SSR](https://zero.rocicorp.dev/docs/server-zql\#ssr)

Zero doesn't yet have the wiring setup in its bindings layers to really nicely support server-side rendering ( [patches welcome though!](https://bugs.rocicorp.dev/issue/3491)).

For now, we don't recommend using Zero with SSR. Use your framework's recommended pattern to prevent SSR execution:

TanStack StartNext.jsSolidStart

```
Copyimport {lazy} from 'react'

// Use React lazy to defer loading the ZeroProvider
const ZeroProvider = lazy(() =>
  import('@rocicorp/zero/react').then(mod => ({
    default: mod.ZeroProvider
  }))
)

function Root() {
  return (
    <ZeroProvider>
      <App />
    </ZeroProvider>
  )
}
```

[PreviousZQL Reference](https://zero.rocicorp.dev/docs/zql)

[NextConnection Status](https://zero.rocicorp.dev/docs/connection)

### On this page

[Creating a Database](https://zero.rocicorp.dev/docs/server-zql#creating-a-database) [Custom Database](https://zero.rocicorp.dev/docs/server-zql#custom-database) [Running ZQL](https://zero.rocicorp.dev/docs/server-zql#running-zql) [SSR](https://zero.rocicorp.dev/docs/server-zql#ssr)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/server-zql.mdx)