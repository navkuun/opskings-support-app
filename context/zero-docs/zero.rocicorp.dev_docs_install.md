---
url: "https://zero.rocicorp.dev/docs/install"
title: "Install Zero"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# Install Zero  Copy markdown  \\# Install Zero  This guide walks you through adding Zero to any TypeScript-based web app.  It should take about 15-20 minutes to complete. When you're done, you'll have Zero up and running and understand its core ideas.  \\#\# Integrate Zero  \\#\#\# Set Up Your Database  You'll need a local Postgres database for development. If you don't have a preferred method, we recommend using \[Docker\](https://www.docker.com/):  \`\`\`bash docker run -d --name zero-postgres \  -e POSTGRES\_PASSWORD="password" \  -p 5432:5432 \ postgres:16-alpine \ \# IMPORTANT: logical WAL level is required for Zero \# to sync data to its SQLite replica postgres -c wal\_level=logical \`\`\`  This will start a Postgres database running in the background.  \> \*\*More Information\*\*: See \[Connecting to Postgres\](https://zero.rocicorp.dev/docs/connecting-to-postgres)for more details on what Postgres features are required for Zero to work.  \\#\#\# Install and Run Zero-Cache  Add Zero to your project:  Start the development \`zero-cache\` by running the following command:  Zero works by continuously replicating your upstream database into a SQLite \*replica\*.  Zero-cache runs client queries against the replica. If there are tables or columns that will \*\*not\*\* be queried by Zero clients ever, you can exclude them.  You can use the \[\`zero-sqlite3\`\](https://zero.rocicorp.dev/docs/debug/replication\#inspecting) tool to explore \`zero.db\`. Try it out by connecting to Postgres and the Zero replica in two different terminals. If you change something in Postgres, you'll see it immediately show up in the replica:  \[Zero-cache syncing between Postgres and SQLite\](https://zero.rocicorp.dev/video/onboarding/zero-cache-sync.mp4)  \\#\#\# Set Up Your Zero Schema  Zero uses a file called \`schema.ts\` to provide a type-safe query API.  If you use Drizzle or Prisma, you can generate \`schema.ts\` automatically. Otherwise, you can create it manually.  \> \*\*Having trouble using your own schema?\*\*: Zero has some restrictions on the \[Postgres features it supports\](https://zero.rocicorp.dev/docs/postgres-support). You can continue this tutorial with \[a sample schema and seed data\](https://github.com/rocicorp/onboarding) to evaluate it.  \\#\#\# Set Up the Zero Client  Zero has first-class support for React and SolidJS, and community support for Svelte and Vue.  There is also a low-level API you can use in any TypeScript-based project.  \\#\# Sync Data  \\#\#\# Define Query  Alright, let's sync some data!  In Zero, we do this with \*queries\*. Queries are conventionally found in a \`queries.ts\` file. Here is an example of how queries are defined - you can adapt this to your own schema:  \`\`\`tsx // zero/queries.ts import {defineQueries, defineQuery} from '@rocicorp/zero' import {z} from 'zod' import {zql} from './schema.ts'  export const queries = defineQueries({ albums: { byArtist: defineQuery( z.object({artistID: z.string()}), ({args: {artistID}}) => zql.albums .where('artistId', artistID) .orderBy('createdAt', 'asc') .limit(10) .related('artist', q => q.one()) ) } }) \`\`\`  Use \`zql\` from \`schema.ts\` to construct and return a ZQL query. ZQL is quite powerful and allows you to build queries with filters, sorts, relationships, and more:  \[Code editor with ZQL autocomplete\](https://zero.rocicorp.dev/video/onboarding/onboarding-zql-autocomplete.mp4)  See \[queries\](https://zero.rocicorp.dev/doc/queries) for more information on defining queries.  \\#\#\# Invoke Query  Querying for data is framework-specific. Most of the time, you will use a helper like \`useQuery\` that integrates into your framework's rendering model:  If you run your app now, you should see an error like:  Let's fix that.  \\#\#\# Implement Query Backend  Zero doesn't allow clients to run any arbitrary ZQL against zero-cache, for both security and performance reasons.  Instead, Zero sends the name and arguments of the query to a \*queries endpoint\* on your server that is responsible for transforming the named query into ZQL.  Zero provides utilities to make it easy to implement the queries endpoint in any full-stack framework:  Stop and re-run zero-cache with the URL of the queries endpoint:  If you reload the page, you will see data! Zero queries update live, so if you edit data in Postgres directly, you will see it update in the Zero replica AND the UI:  \[Zero-cache syncing between Postgres and SQLite and UI\](https://zero.rocicorp.dev/video/onboarding/zero-cache-ui-sync.mp4)  \\#\#\# More about Queries  You now know the basics, but there are a few more important pieces you'll need to learn for your first real app:  \\* \[How authentication and permissions work\](https://zero.rocicorp.dev/docs/auth). \\* \[Preloading queries to create instantly responsive UI\](https://zero.rocicorp.dev/docs/queries\#for-preloading).  For these details and more, see \[Reading Data\](https://zero.rocicorp.dev/docs/queries).  But for now, let's move on to writes!  \\#\# Mutate Data  \\#\#\# Define Mutators  Data is written in Zero apps using \*mutators\*. Similar to queries, we use a shared \`mutators.ts\` file:  \`\`\`tsx // zero/mutators.ts import {defineMutators, defineMutator} from '@rocicorp/zero' import {z} from 'zod'  export const mutators = defineMutators({ albums: { create: defineMutator( z.object({ id: z.string(), artistID: z.string(), title: z.string(), year: z.number(), createdAt: z.number() }), async ({args, tx}) => { await tx.mutate.albums.insert({ id: args.id, artistId: args.artistID, title: args.title, releaseYear: args.year, createdAt: args.createdAt }) } ) } }) \`\`\`  You can use the \[CRUD-style API\](https://zero.rocicorp.dev/docs/mutators\#writing-data) with \`tx.mutate.<table>.<method>()\`to write data within your mutator. You can also use \`tx.run(zql.<table>.<method>)\` to run ZQL expressions.  \> \*\*Always await operations in mutators\*\*: Mutators almost always run in the same frame on the client, against local data. The reason mutators are marked \`async\` is because on the server, reading from the \`tx\`object goes over the network to Postgres. Also, in edge cases on the client, reads and writes can go to local storage (IndexedDB or SQLite).  Once you've defined your mutators, you must register them with Zero before you can use them:  \`\`\`tsx import {mutators} from './zero/mutators.ts'  const opts: ZeroOptions = { // ... cacheURL, schema, etc. // add mutators mutators } \`\`\`  \\#\#\# Invoke Mutators  You can now call mutators via \`zero.mutate\`:  \> ⚠️ \*\*Client-generated IDs are recommended\*\*: Client-generated random IDs (from libraries like \[uuid\](https://www.npmjs.com/package/uuid), \[ulid\](https://www.npmjs.com/package/ulid), or \[nanoid\](https://www.npmjs.com/package/nanoid)) work much better than auto-incrementing integers in sync engines like Zero. \[Learn more\](https://zero.rocicorp.dev/docs/postgres-support\#ids).  If you run this app now, you should be able to see the UI update optimistically, but you'll also see an error in zero-cache:  This is because, like queries, we need to implement an endpoint in our API. Let's fix it!  \\#\#\# Implement Mutate Endpoint  Zero requires a \*mutate endpoint\* which runs on your server and connects directly to your Postgres database. Zero provides helpers to implement this easily.  Use the Zero Postgres adapters to create a \`dbProvider\` instance:  Then, use the \`dbProvider\` to handle the mutate request:  Restart zero-cache to tell it about this new endpoint:  If you refresh the page, your mutation should commit to the database and sync to other clients:  \[Zero syncing data between multiple clients\](https://zero.rocicorp.dev/video/onboarding/zero-cache-multiple-clients.mp4)  \\#\#\# More about Mutators  Just as with queries, the separate server implementation of mutators extends elegantly to enable write permissions. Zero also has built-in helpers to do work after a mutator runs on the server, like send notifications.  For these details and more, see \[Writing Data\](https://zero.rocicorp.dev/docs/mutators).  \\#\# That's It!  Congratulations! You now know the basics for building with Zero 🤯.  Possible next steps:  \\* \[Learn about authentication and permissions\](https://zero.rocicorp.dev/docs/auth) \\* \[See some samples of built-out Zero apps\](https://zero.rocicorp.dev/docs/samples) \\* \[Learn how to deploy your app to production\](https://zero.rocicorp.dev/docs/deployment)      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

This guide walks you through adding Zero to any TypeScript-based web app.

It should take about 15-20 minutes to complete. When you're done, you'll have Zero up and running and understand its core ideas.

## [Integrate Zero](https://zero.rocicorp.dev/docs/install\#integrate-zero)

### [Set Up Your Database](https://zero.rocicorp.dev/docs/install\#set-up-your-database)

You'll need a local Postgres database for development. If you don't have a preferred method, we recommend using [Docker](https://www.docker.com/):

```
Copydocker run -d --name zero-postgres \
  -e POSTGRES_PASSWORD="password" \
  -p 5432:5432 \
  postgres:16-alpine \
  # IMPORTANT: logical WAL level is required for Zero
  # to sync data to its SQLite replica
  postgres -c wal_level=logical
```

This will start a Postgres database running in the background.

[🤔More Information](https://zero.rocicorp.dev/docs/install#more-information)

### [Install and Run Zero-Cache](https://zero.rocicorp.dev/docs/install\#install-and-run-zero-cache)

Add Zero to your project:

npmpnpmbunyarn

```
Copynpm install @rocicorp/zero
```

Start the development `zero-cache` by running the following command:

npmpnpmbunyarn

```
Copyexport ZERO_UPSTREAM_DB="postgres://postgres:password@localhost:5432/postgres"
npx zero-cache-dev
```

Zero works by continuously replicating your upstream database into a SQLite _replica_.

Zero-cache runs client queries against the replica. If there are tables or columns that will **not** be queried by Zero clients ever, you can exclude them.

You can use the [`zero-sqlite3`](https://zero.rocicorp.dev/docs/debug/replication#inspecting) tool to explore `zero.db`. Try it out by connecting to Postgres and the Zero replica in two different terminals.
If you change something in Postgres, you'll see it immediately show up in the replica:

Your browser does not support the video tag.

### [Set Up Your Zero Schema](https://zero.rocicorp.dev/docs/install\#set-up-your-zero-schema)

Zero uses a file called `schema.ts` to provide a type-safe query API.

If you use Drizzle or Prisma, you can generate `schema.ts` automatically. Otherwise, you can create it manually.

DrizzlePrismaManual

```
Copynpm install -D drizzle-zero
npx drizzle-zero generate
```

[🤔Having trouble using your own schema?](https://zero.rocicorp.dev/docs/install#having-trouble-using-your-own-schema)

### [Set Up the Zero Client](https://zero.rocicorp.dev/docs/install\#set-up-the-zero-client)

Zero has first-class support for React and SolidJS, and community support for Svelte and Vue.

There is also a low-level API you can use in any TypeScript-based project.

ReactSolidJSTypeScript

```
Copy// root.tsx
import {ZeroProvider} from '@rocicorp/zero/react'
import type {ZeroOptions} from '@rocicorp/zero'
import {schema} from './zero/schema.ts'

const opts: ZeroOptions = {
  cacheURL: 'http://localhost:4848',
  schema
}

function Root() {
  return (
    <ZeroProvider {...opts}>
      <App />
    </ZeroProvider>
  )
}

// mycomponent.tsx
import {useZero} from '@rocicorp/zero/react'

function MyComponent() {
  const zero = useZero()
  console.log('clientID', zero.clientID)
}
```

## [Sync Data](https://zero.rocicorp.dev/docs/install\#sync-data)

### [Define Query](https://zero.rocicorp.dev/docs/install\#define-query)

Alright, let's sync some data!

In Zero, we do this with _queries_. Queries are conventionally found in a `queries.ts` file.
Here is an example of how queries are defined - you can adapt this to your own schema:

```
Copy// zero/queries.ts
import {defineQueries, defineQuery} from '@rocicorp/zero'
import {z} from 'zod'
import {zql} from './schema.ts'

export const queries = defineQueries({
  albums: {
    byArtist: defineQuery(
      z.object({artistID: z.string()}),
      ({args: {artistID}}) =>
        zql.albums
          .where('artistId', artistID)
          .orderBy('createdAt', 'asc')
          .limit(10)
          .related('artist', q => q.one())
    )
  }
})
```

Use `zql` from `schema.ts` to construct and return a ZQL query. ZQL is quite powerful and allows you to build
queries with filters, sorts, relationships, and more:

Your browser does not support the video tag.

See [queries](https://zero.rocicorp.dev/doc/queries) for more information on defining queries.

### [Invoke Query](https://zero.rocicorp.dev/docs/install\#invoke-query)

Querying for data is framework-specific. Most of the time, you will use a helper like `useQuery` that integrates into your framework's rendering model:

ReactSolidJSTypeScript

```
Copy// mycomponent.tsx
import {useQuery} from '@rocicorp/zero/react'
import {queries} from './zero/queries.ts'

function MyComponent() {
  const [albums] = useQuery(
    queries.albums.byArtist({artistID: 'artist_1'})
  )
  return albums.map(a => <div key={a.id}>{a.title}</div>)
}
```

If you run your app now, you should see an error like:

npmpnpmbunyarn

```
Copy> npx zero-cache-dev
...
Uncaught exception. Could not get ZQL for query `albumsByArtist` because no query endpoint is specified.
```

Let's fix that.

### [Implement Query Backend](https://zero.rocicorp.dev/docs/install\#implement-query-backend)

Zero doesn't allow clients to run any arbitrary ZQL against zero-cache, for both security and performance reasons.

Instead, Zero sends the name and arguments of the query to a _queries endpoint_ on your server that is responsible for transforming the named query into ZQL.

Zero provides utilities to make it easy to implement the queries endpoint in any full-stack framework:

Tanstack StartNext.jsSolid StartHono

```
Copy// src/routes/api/query.ts
import {createFileRoute} from '@tanstack/react-router'
import {json} from '@tanstack/react-start'
import {handleQueryRequest} from '@rocicorp/zero/server'
import {mustGetQuery} from '@rocicorp/zero'
import {queries} from '../../zero/queries.ts'
import {schema} from '../../zero/schema.ts'

export const Route = createFileRoute('/api/query')({
  server: {
    handlers: {
      POST: async ({request}) => {
        const result = await handleQueryRequest(
          (name, args) => {
            const query = mustGetQuery(queries, name)
            return query.fn({args, ctx: {userId: 'anon'}})
          },
          schema,
          request
        )

        return json(result)
      }
    }
  }
})
```

Stop and re-run zero-cache with the URL of the queries endpoint:

npmpnpmbunyarn

```
Copyexport ZERO_UPSTREAM_DB="postgres://postgres:password@localhost:5432/postgres"
export ZERO_QUERY_URL="http://localhost:3000/api/query"
npx zero-cache-dev
```

If you reload the page, you will see data!
Zero queries update live, so if you edit data in Postgres directly, you will see it update in the Zero replica AND the UI:

Your browser does not support the video tag.

### [More about Queries](https://zero.rocicorp.dev/docs/install\#more-about-queries)

You now know the basics, but there are a few more important pieces you'll need to learn for your first real app:

- [How authentication and permissions work](https://zero.rocicorp.dev/docs/auth).
- [Preloading queries to create instantly responsive UI](https://zero.rocicorp.dev/docs/queries#for-preloading).

For these details and more, see [Reading Data](https://zero.rocicorp.dev/docs/queries).

But for now, let's move on to writes!

## [Mutate Data](https://zero.rocicorp.dev/docs/install\#mutate-data)

### [Define Mutators](https://zero.rocicorp.dev/docs/install\#define-mutators)

Data is written in Zero apps using _mutators_.
Similar to queries, we use a shared `mutators.ts` file:

```
Copy// zero/mutators.ts
import {defineMutators, defineMutator} from '@rocicorp/zero'
import {z} from 'zod'

export const mutators = defineMutators({
  albums: {
    create: defineMutator(
      z.object({
        id: z.string(),
        artistID: z.string(),
        title: z.string(),
        year: z.number(),
        createdAt: z.number()
      }),
      async ({args, tx}) => {
        await tx.mutate.albums.insert({
          id: args.id,
          artistId: args.artistID,
          title: args.title,
          releaseYear: args.year,
          createdAt: args.createdAt
        })
      }
    )
  }
})
```

You can use the [CRUD-style API](https://zero.rocicorp.dev/docs/mutators#writing-data) with `tx.mutate.<table>.<method>()`
to write data within your mutator.
You can also use `tx.run(zql.<table>.<method>)` to run ZQL expressions.

[😬Always await operations in mutators](https://zero.rocicorp.dev/docs/install#always-await-operations-in-mutators)

Once you've defined your mutators, you must register them with Zero before you can use them:

```
Copyimport {mutators} from './zero/mutators.ts'

const opts: ZeroOptions = {
  // ... cacheURL, schema, etc.
  // add mutators
  mutators
}
```

### [Invoke Mutators](https://zero.rocicorp.dev/docs/install\#invoke-mutators)

You can now call mutators via `zero.mutate`:

ReactSolidJSTypeScript

```
Copy// mycomponent.tsx
import {useZero} from '@rocicorp/zero/react'
import {mutators} from './zero/mutators.ts'
import {nanoid} from 'nanoid'

function MyComponent() {
  const zero = useZero()

  const onClick = async () => {
    const result = zero.mutate(
      mutators.albums.create({
        id: nanoid(),
        artistID: 'artist_1',
        title: 'Please Please Me',
        year: 1963,
        createdAt: Date.now()
      })
    )

    const clientResult = await result.client

    if (clientResult.type === 'error') {
      console.error(
        'Failed to create album',
        clientResult.error.message
      )
    } else {
      console.log('Album created!')
    }
  }

  return <button onClick={onClick}>Create Album</button>
}
```

[⚠️Client-generated IDs are recommended](https://zero.rocicorp.dev/docs/install#client-generated-ids-are-recommended)

If you run this app now, you should be able to see the UI update optimistically, but you'll also see an error in zero-cache:

npmpnpmbunyarn

```
Copy> npx zero-cache-dev
...
Uncaught exception. Could not execution mutation `albums.create` because no mutate endpoint is specified.
```

This is because, like queries, we need to implement an endpoint in our API. Let's fix it!

### [Implement Mutate Endpoint](https://zero.rocicorp.dev/docs/install\#implement-mutate-endpoint)

Zero requires a _mutate endpoint_ which runs on your server and connects directly to your Postgres database.
Zero provides helpers to implement this easily.

Use the Zero Postgres adapters to create a `dbProvider` instance:

Drizzlenode-postgrespostgres.js

```
Copy// app/api/mutate/db-provider.ts
import {zeroDrizzle} from '@rocicorp/zero/server/adapters/drizzle'
import {drizzle} from 'drizzle-orm/node-postgres'
import {Pool} from 'pg'
import {schema} from '../../zero/schema.ts'
import {drizzleSchema} from '../../drizzle/schema.ts'

// pass a drizzle client instance. for example:
const pool = new Pool({
  connectionString: process.env.ZERO_UPSTREAM_DB!
})
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

Then, use the `dbProvider` to handle the mutate request:

Tanstack StartNext.jsSolid StartHono

```
Copy// src/routes/api/mutate.ts
import {createFileRoute} from '@tanstack/react-router'
import {json} from '@tanstack/react-start'
import {handleMutateRequest} from '@rocicorp/zero/server'
import {mustGetMutator} from '@rocicorp/zero'
import {mutators} from '../../zero/mutators.ts'
import {dbProvider} from '../../db-provider.ts'

export const Route = createFileRoute('/api/mutate')({
  server: {
    handlers: {
      POST: async ({request}) => {
        const result = await handleMutateRequest(
          dbProvider,
          transact =>
            transact((tx, name, args) => {
              const mutator = mustGetMutator(mutators, name)
              return mutator.fn({
                args,
                tx,
                ctx: {userId: 'anon'}
              })
            }),
          request
        )

        return json(result)
      }
    }
  }
})
```

Restart zero-cache to tell it about this new endpoint:

npmpnpmbunyarn

```
Copyexport ZERO_UPSTREAM_DB="postgres://postgres:password@localhost:5432/postgres"
export ZERO_QUERY_URL="http://localhost:3000/api/query"
export ZERO_MUTATE_URL="http://localhost:3000/api/mutate"
npx zero-cache-dev
```

If you refresh the page, your mutation should commit to the database and sync to other clients:

Your browser does not support the video tag.

### [More about Mutators](https://zero.rocicorp.dev/docs/install\#more-about-mutators)

Just as with queries, the separate server implementation of mutators extends elegantly to enable write permissions.
Zero also has built-in helpers to do work after a mutator runs on the server, like send notifications.

For these details and more, see [Writing Data](https://zero.rocicorp.dev/docs/mutators).

## [That's It!](https://zero.rocicorp.dev/docs/install\#thats-it)

Congratulations! You now know the basics for building with Zero 🤯.

Possible next steps:

- [Learn about authentication and permissions](https://zero.rocicorp.dev/docs/auth)
- [See some samples of built-out Zero apps](https://zero.rocicorp.dev/docs/samples)
- [Learn how to deploy your app to production](https://zero.rocicorp.dev/docs/deployment)

[PreviousIntroduction](https://zero.rocicorp.dev/docs/introduction)

[NextQuickstart](https://zero.rocicorp.dev/docs/quickstart)

### On this page

[Integrate Zero](https://zero.rocicorp.dev/docs/install#integrate-zero) [Set Up Your Database](https://zero.rocicorp.dev/docs/install#set-up-your-database) [Install and Run Zero-Cache](https://zero.rocicorp.dev/docs/install#install-and-run-zero-cache) [Set Up Your Zero Schema](https://zero.rocicorp.dev/docs/install#set-up-your-zero-schema) [Set Up the Zero Client](https://zero.rocicorp.dev/docs/install#set-up-the-zero-client) [Sync Data](https://zero.rocicorp.dev/docs/install#sync-data) [Define Query](https://zero.rocicorp.dev/docs/install#define-query) [Invoke Query](https://zero.rocicorp.dev/docs/install#invoke-query) [Implement Query Backend](https://zero.rocicorp.dev/docs/install#implement-query-backend) [More about Queries](https://zero.rocicorp.dev/docs/install#more-about-queries) [Mutate Data](https://zero.rocicorp.dev/docs/install#mutate-data) [Define Mutators](https://zero.rocicorp.dev/docs/install#define-mutators) [Invoke Mutators](https://zero.rocicorp.dev/docs/install#invoke-mutators) [Implement Mutate Endpoint](https://zero.rocicorp.dev/docs/install#implement-mutate-endpoint) [More about Mutators](https://zero.rocicorp.dev/docs/install#more-about-mutators) [That's It!](https://zero.rocicorp.dev/docs/install#thats-it)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/install.mdx)