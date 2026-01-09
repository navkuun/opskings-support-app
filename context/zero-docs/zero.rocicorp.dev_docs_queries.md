---
url: "https://zero.rocicorp.dev/docs/queries"
title: "Queries"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# Queries  Copy markdown  Reading and Syncing Data  \\# Queries  Queries are how you read and sync data with Zero. Here's a simple example:  \`\`\`ts import {defineQueries, defineQuery} from '@rocicorp/zero' import {z} from 'zod' import {zql} from 'schema.ts'  export const queries = defineQueries({ postsByAuthor: defineQuery( z.object({authorID: z.string()}), ({args: {authorID}}) => zql.post.where('authorID', authorID) ) }) \`\`\`  \\#\# Architecture  A copy of each query exists on both the client and on your server:  !\[\](https://zero.rocicorp.dev/images/custom-queries/queries1.svg)  Often the implementations will be the same, and you can just share their code. This is easy with full-stack frameworks like TanStack Start or Next.js.  But the implementations don't have to be the same, or even compute the same result. For example, the server can add extra filters to enforce permissions that the client query does not.  \\#\#\# Life of a Query  When a query is invoked, it initially runs on the client, against the client-side datastore. Any matching data is returned immediately and the user sees instant results.  !\[Client hydration\](https://zero.rocicorp.dev/images/custom-queries/queries2.svg)  In the background, the name and arguments for the query are sent to zero-cache. Zero-cache calls the \`queries\` endpoint on your server to get the ZQL for the query. Your server looks up its implementation of the query, invokes it, and returns the resulting ZQL expression to zero-cache.  Zero-cache then runs this ZQL against the server-side data. The initial server result is sent back to the client and the client query updates in response.  !\[Server hydration\](https://zero.rocicorp.dev/images/custom-queries/queries4.svg)  zero-cache receives updates from Postgres via logical replication. It updates affected queries and sends row changes back to the client, which updates the client query, and the user sees the changes.  !\[Incremental update\](https://zero.rocicorp.dev/images/custom-queries/queries6.svg)  \\#\# Defining Queries  \\#\#\# Basics  Create a query using \`defineQuery\`.  The only required argument is a \`QueryFn\`, which must return a \[ZQL\](https://zero.rocicorp.dev/docs/zql) expression:  \`\`\`ts import {zql} from 'schema.ts'  const allPostsQueryDef = defineQuery(() => zql.post) \`\`\`  \\#\#\# Arguments  The \`QueryFn\` can take a single \`args\` parameter. To enable this, pass a \*validator\* to \`defineQuery\`:  \`\`\`ts import {zql} from 'schema.ts'  const postsByAuthor = defineQuery( z.object({authorID: z.string().optional()}), ({args: {authorID}}) => { let q = zql.post if (authorID !== undefined) { q = q.where('authorID', authorID) } return q } ) \`\`\`  We use \[Zod\](https://zod.dev/) in these examples, but you can use any validation library that implements \[Standard Schema\](https://standardschema.dev/).  \> \*\*Why validators are required\*\*: Zero queries run on both the client and \[on your server\](\#server-setup). In the server case, the parameters come from the client and are untrusted. The validator ensures the data passed to your query is of the expected type.  \\#\#\# Query Registries  The result of \`defineQuery\` is a \`QueryDefinition\`. By itself this isn't super useful. You need to register it using \`defineQueries\`:  \`\`\`ts export const queries = defineQueries({ posts: { all: allPostsQueryDef } }) \`\`\`  Typically these are done together in one step:  \`\`\`ts export const queries = defineQueries({ posts: { all: defineQuery(() => zql.post) } }) \`\`\`  The result of \`defineQueries\` is called a \`QueryRegistry\`. Each field in the registry is a callable \`Query\` that you can use to read data:  \`\`\`ts import {zero} from 'zero.ts' import {queries} from 'queries.ts'  const allPosts = await zero.run(queries.posts.all()) \`\`\`  \\#\#\# Query Names  Each \`Query\` has a \`queryName\` which is computed by \`defineQueries\`. This name is later sent to your server to identify the query to run:  \`\`\`ts console.log(queries.posts.all.queryName) // "posts.all" \`\`\`  \\#\#\# Context  Query parameters are supplied by the client application and passed to the server automatically by Zero. This makes them unsuitable for credentials, since the user could modify them.  For this reason, Zero queries also support the concept of a \[\`context\` object\](https://zero.rocicorp.dev/docs/auth\#context).  Access your context with the \`ctx\` parameter to your query:  \`\`\`ts const myPostsQuery = defineQuery(({ctx: {userID}}) => { // User cannot control context.userID, so this safely // restricts the query to the user's own posts. return zql.post.where('authorID', userID) }) \`\`\`  \\#\#\# queries.ts  By convention, all queries for an application are listed in a central \`queries.ts\` file. This allows them to be easily used on both the client and server:  \`\`\`ts import {defineQueries, defineQuery} from '@rocicorp/zero' import {z} from 'zod' import {zql} from './schema.ts'  export const queries = defineQueries({ posts: { get: defineQuery(z.string(), id => zql.post.where('id', id) ), byAuthor: defineQuery( z.object({ authorID: z.string(), includeDrafts: z.boolean().optional() }), ({args: {authorID, includeDrafts}}) => { let q = zql.post.where('authorID', authorID) if (!includeDrafts) { q = q.where('isDraft', false) } return q } ) } }) \`\`\`  You can use as many levels of nesting as you want to organize your queries.  As your application grows, you can move queries to different files to keep them organized:  \`\`\`ts // posts.ts export const postQueries = { get: defineQuery(z.string(), id => zql.post.where('id', id) ) // ... }  // users.ts export const userQueries = { byRole: defineQuery(z.string(), role => zql.user.where('role', role) ) // ... }  // queries.ts import {postQueries} from './posts.ts' import {userQueries} from './users.ts'  export const queries = defineQueries({ posts: postQueries, users: userQueries }) \`\`\`  \> ⚠️ \*\*Use \`defineQueries\` at top level only\*\*: Because \`defineQueries\` establishes the full name for each query (i.e., \`posts.get\`, \`users.byRole\`), it should only be used once at the top level of your \`queries.ts\` file.  \\#\# Server Setup  In order for queries to sync, you must provide an implementation of the \`query\` endpoint on your server. \`zero-cache\` calls this endpoint to resolve each query to \[ZQL\](https://zero.rocicorp.dev/docs/zql) that it can run.  \\#\#\# Registering the Endpoint  Use \[\`ZERO\_QUERY\_URL\`\](https://zero.rocicorp.dev/docs/zero-cache-config\#query-url) to tell \`zero-cache\` where to find your \`query\` implementation:  \`\`\`bash export ZERO\_QUERY\_URL="http://localhost:3000/api/zero/query" \\# run zero-cache, e.g. \`npx zero-cache-dev\` \`\`\`  \\#\#\# Implementing the Endpoint  The \`@rocicorp/zero\` package provides the \`handleQueryRequest\` and \`mustGetQuery\` functions to make it easy to implement the endpoint.  \`handleQueryRequest\` accepts a standard \`Request\` and returns a JSON object which can be serialized and returned by your server framework of choice.  \`mustGetQuery\` looks up the query in the registry and throws an error if not found.  The \`query.fn\` function is your query implementation wrapped in the validator you provided.  \\#\#\# Custom Query URL  By default, Zero sends queries to the URL specified in the \`ZERO\_QUERY\_URL\` parameter in the zero-cache config.  However you can customize this on a per-client basis. To do so, list multiple comma-separated URLs in \`ZERO\_QUERY\_URL\`:  \`\`\`bash ZERO\_QUERY\_URL='https://api.example.com/query,https://api.staging.example.com/query' \`\`\`  Then choose one of those URLs by passing it to \`queryURL\` on the \`Zero\` constructor:  \`\`\`ts const zero = new Zero({ schema, queries, queryURL: 'https://api.staging.example.com/query' }) \`\`\`  \\#\#\# URL Patterns  The strings listed in \`ZERO\_QUERY\_URL\` can also be \[\`URLPatterns\`\](https://developer.mozilla.org/en-US/docs/Web/API/URL\_Pattern\_API):  \`\`\`bash ZERO\_QUERY\_URL="https://mybranch-\*.preview.myapp.com/query" \`\`\`  This queries URL will allow clients to choose URLs like:  \\* \`https://mybranch-aaa.preview.myapp.com/query\` ✅ \\* \`https://mybranch-bbb.preview.myapp.com/query\` ✅  But rejects URLs like:  \\* \`https://preview.myapp.com/query\` ❌ (missing subdomain) \\* \`https://malicious.com/query\` ❌ (different domain) \\* \`https://mybranch-123.preview.myapp.com/query/extra\` ❌ (extra path) \\* \`https://mybranch-123.preview.myapp.com/other\` ❌ (different path)  \> 🥇 \*\*Pro Tip (tm)\*\*: Because URLPattern is a web standard, you can test them right in your browser: > \> !\[URL Pattern\](https://zero.rocicorp.dev/images/mutators/url-pattern.png)  For more information, see the \[URLPattern docs\](https://developer.mozilla.org/en-US/docs/Web/API/URL\_Pattern\_API).  \\#\# Running Queries  \\#\#\# Reactively  The most common way to use queries is with the \`useQuery\` reactive hooks from the \[React\](https://zero.rocicorp.dev/docs/react) or \[SolidJS\](https://zero.rocicorp.dev/docs/solid) bindings (or the equivalent low-level API):  These functions allow you to automatically re-render UI when a query changes.  \\#\#\# Once  You usually want to subscribe to a query in a reactive UI, but every so often you'll need to run a query just once. To do this, use \`zero.run()\`:  \`\`\`tsx const results = await zero.run( queries.issues.byPriority('high') ) \`\`\`  By default, \`run()\` only returns results that are currently available on the client. That is, it returns the data that would be given for \[\`result.type === 'unknown'\`\](\#partial-data).  If you want to wait for the server to return results, pass \`{type: 'complete'}\` to \`run\`:  \`\`\`tsx const results = await zero.run( queries.issues.byPriority('high'), {type: 'complete'} ) \`\`\`  \\#\#\# For Preloading  Almost all Zero apps will want to preload some data in order to maximize the feel of instantaneous UI transitions.  Because preload queries are often much larger than a screenful of UI, Zero provides a special \`zero.preload()\` method to avoid the overhead of materializing the result into JS objects:  \`\`\`tsx // Preload a large number of the inbox query results. zero.preload( queries.issues.inbox({ sort: 'created', sortDirection: 'desc', limit: 1000 }) ) \`\`\`  \\#\# Missing Data  Because Zero returns local results immediately and server results asynchronously, displaying "not found" / 404 UI can be slightly tricky.  If you just use a simple existence check, you will often see the 404 UI flicker while the server result loads:  To do this correctly, only display the "not found" UI when the result type is \`complete\`. This way the 404 page is slow but pages with data are still just as fast:  \\#\# Partial Data  Zero immediately returns the data for a query it has on the client, then falls back to the server for any missing data.  Sometimes it's useful to know the difference between these two types of results. To do so, use the \`result\` from \`useQuery\`:  The possible values of \`result.type\` are currently \`complete\` and \`unknown\`.  The \`complete\` value is currently only returned when Zero has received the server result. In the future, Zero will be able to return this result type when it \*knows\* that all possible data for this query is already available locally. Additionally, we plan to add a \`prefix\` result for when the data is known to be a prefix of the complete result. See \[Consistency\](\#consistency) for more information.  \\#\# Handling Errors  If the queries endpoint throws an application or parse error, \`zero-cache\` will report it to the client using the \`type\` and \`error\` fields on the query details object:  \> 🤔 \*\*Query endpoint failures are not shown here\*\*: See \[Connection Status\](https://zero.rocicorp.dev/docs/connection) for how HTTP or network errors from the queries endpoint are handled.  \\#\# Granular Updates  You can use the \[\`materialize()\`\](\#manually) method to create a view that you can listen to for changes.  However, this will only tell you when the view has changed and give you the complete new result. It won't tell you \*what\* changed.  To know what changed, you can create your own custom \`View\` implementation:  \`\`\`ts // Inside the View class // Instead of storing the change, we invoke some callback push(change: Change): void { switch (change.type) { case 'add': this.\#onAdd?.(change) break case 'remove': this.\#onRemove?.(change) break case 'edit': this.\#onEdit?.(change) break case 'child': this.\#onChild?.(change) break default: throw new Error(\`Unknown change type: ${change\['type'\]}\`) } } \`\`\`  For examples, see the \`View\` implementations in \[\`zero-vue\`\](https://github.com/danielroe/zero-vue/blob/f25808d4b7d1ef0b8e01a5670d7e3050d6a64bbf/src/view.ts\#L77-L89) or \[\`zero-solid\`\](https://github.com/rocicorp/mono/blob/51995101d0657519207f1c4695a8765b9016e07c/packages/zero-solid/src/solid-view.ts\#L119-L131).  \\#\# Query Caching  Queries can be either \*active\* or \*cached\*. An active query is one that is currently being used by the application. Cached queries are not currently in use, but continue syncing in case they are needed again soon.  !\[\](https://zero.rocicorp.dev/images/reading-data/query-lifecycle.svg)  Queries are \*deactivated\* according to how they were created:  1\. For \`useQuery()\`, the UI unmounts the component (which calls \`destroy()\` under the covers). 2\. For \`preload()\`, the UI calls \`cleanup()\` on the return value of \`preload()\`. 3\. For \`run()\`, queries are automatically deactivated immediately after the result is returned. 4\. For \`materialize()\` queries, the UI calls \`destroy()\` on the view.  Additionally when a Zero instance closes, all active queries are automatically deactivated. This also happens when the containing page or script is unloaded.  \\#\#\# TTLs  Each query has a \`ttl\` that controls how long it stays cached.  \> 💡 \*\*The TTL clock only ticks while Zero is running\*\*: If the user closes all tabs for your app, Zero stops running and the time that elapses doesn't count toward any TTLs. > \> You do not need to account for such time when choosing a TTL – you only need to account for time your app is running \*without\* a query.  \\#\#\# TTL Defaults  In most cases, the default TTL should work well:  \\* \`preload()\` queries default to \`ttl:'none'\`, meaning they are not cached at all, and will stop syncing immediately when deactivated. But because \`preload()\` queries are typically registered at app startup and never shutdown, and \[because the ttl clock only ticks while Zero is running\](\#the-ttl-clock-only-ticks-while-zero-is-running), this means that preload queries never get unregistered. \\* Other queries have a default \`ttl\` of \`5m\` (five minutes).  \\#\#\# Setting Different TTLs  You can override the default TTL with the \`ttl\` parameter:  TTLs up to \`10m\` (ten minutes) are currently supported. The following formats are allowed:  \| Format \| Meaning \| \| \-\-\-\-\-\- \| \-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\- \| \| \`none\` \| No caching. Query will immediately stop when deactivated. \| \| \`%ds\` \| Number of seconds. \| \| \`%dm\` \| Number of minutes. \|  \\#\#\# Why Zero TTLs are Short  Zero queries are not free.  Just as in any database, queries consume resources on both the client and server. Memory is used to keep metadata about the query, and disk storage is used to keep the query's current state.  We do drop this state after we haven't heard from a client for awhile, but this is only a partial improvement. If the client returns, we have to re-run the query to get the latest data.  This means that we do not actually \*want\* to keep queries active unless there is a good chance they will be needed again soon.  The default Zero TTL values might initially seem too short, but they are designed to work well with the way Zero's TTL clock works and strike a good balance between keeping queries alive long enough to be useful, while not keeping them alive so long that they consume resources unnecessarily.  \\#\# Local-Only Queries  It can sometimes be useful to run queries only on the client. For example, to implement typeahead search, it really doesn't make sense to register a query with the server for every single keystroke.  Zero doesn't yet have a way to run named queries local-only, but you can run ZQL expressions locally by passing them anywhere a query is supported.  For example, to subscribe to a local-only query:  \\#\# Custom Server Implementation  It is possible to implement the \`ZERO\_QUERY\_URL\` endpoint without using Zero's TypeScript libraries, or even in a different language entirely.  The endpoint receives a \`POST\` request with a JSON body of the form:  \`\`\`ts type QueriesRequestBody = { id: string name: string args: readonly ReadonlyJSONValue\[\] }\[\] \`\`\`  And responds with:  \`\`\`ts type QueriesResponseBody = ( \| { id: string name: string // See https://github.com/rocicorp/mono/blob/main/packages/zero-protocol/src/ast.ts ast: AST } \| { error: 'app' id: string name: string details: ReadonlyJSONValue } \| { error: 'zero' id: string name: string details: ReadonlyJSONValue } \| { error: 'http' id: string name: string status: number details: ReadonlyJSONValue } )\[\] \`\`\`  \\#\# Consistency  Zero always syncs a consistent partial replica of the backend database to the client. This avoids many common consistency issues that come up in classic web applications. But there are still some consistency issues to be aware of when using Zero.  For example, imagine that you have a bug database w/ 10k issues. You preload the first 1k issues sorted by created.  The user then does a query of issues assigned to themselves, sorted by created. Among the 1k issues that were preloaded imagine 100 are found that match the query. Since the data we preloaded is in the same order as this query, we are guaranteed that any local results found will be a \*prefix\* of the server results.  The UX that result is nice: the user will see initial results to the query instantly. If more results are found server-side, those results are guaranteed to sort below the local results. There's no shuffling of results when the server response comes in.  Now imagine that the user switches the sort to ‘sort by modified’. This new query will run locally, and will again find some local matches. But it is now unlikely that the local results found are a prefix of the server results. When the server result comes in, the user will probably see the results shuffle around.  To avoid this annoying effect, what you should do in this example is also preload the first 1k issues sorted by modified desc. In general for any query shape you intend to do, you should preload the first \`n\` results for that query shape with no filters, in each sort you intend to use.  \> \*\*Zero does not sync duplicate rows\*\*: Zero syncs the \*union\* of all active queries' results. You don't have to worry about syncing many sorts of the same query when it's likely the results will overlap heavily.  In the future, we will be implementing a consistency model that fixes these issues automatically. We will prevent Zero from returning local data when that data is not known to be a prefix of the server result. Once the consistency model is implemented, preloading can be thought of as purely a performance thing, and not required to avoid unsightly flickering.      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

Reading and Syncing Data

Queries are how you read and sync data with Zero. Here's a simple example:

```
Copyimport {defineQueries, defineQuery} from '@rocicorp/zero'
import {z} from 'zod'
import {zql} from 'schema.ts'

export const queries = defineQueries({
  postsByAuthor: defineQuery(
    z.object({authorID: z.string()}),
    ({args: {authorID}}) =>
      zql.post.where('authorID', authorID)
  )
})
```

## [Architecture](https://zero.rocicorp.dev/docs/queries\#architecture)

A copy of each query exists on both the client and on your server:

![Image](https://zero.rocicorp.dev/images/custom-queries/queries1.svg)

Often the implementations will be the same, and you can just share their code. This is easy with full-stack frameworks like TanStack Start or Next.js.

But the implementations don't have to be the same, or even compute the same result. For example, the server can add extra filters to enforce permissions that the client query does not.

### [Life of a Query](https://zero.rocicorp.dev/docs/queries\#life-of-a-query)

When a query is invoked, it initially runs on the client, against the client-side datastore. Any matching data is returned immediately and the user sees instant results.

![Client hydration](https://zero.rocicorp.dev/images/custom-queries/queries2.svg)

Client hydration

In the background, the name and arguments for the query are sent to zero-cache. Zero-cache calls the `queries` endpoint on your server to get the ZQL for the query. Your server looks up its implementation of the query, invokes it, and returns the resulting ZQL expression to zero-cache.

Zero-cache then runs this ZQL against the server-side data. The initial server result is sent back to the client and the client query updates in response.

![Server hydration](https://zero.rocicorp.dev/images/custom-queries/queries4.svg)

Server hydration

zero-cache receives updates from Postgres via logical replication. It updates affected queries and sends row changes back to the client, which updates the client query, and the user sees the changes.

![Incremental update](https://zero.rocicorp.dev/images/custom-queries/queries6.svg)

Incremental update

## [Defining Queries](https://zero.rocicorp.dev/docs/queries\#defining-queries)

### [Basics](https://zero.rocicorp.dev/docs/queries\#basics)

Create a query using `defineQuery`.

The only required argument is a `QueryFn`, which must return a [ZQL](https://zero.rocicorp.dev/docs/zql) expression:

```
Copyimport {zql} from 'schema.ts'

const allPostsQueryDef = defineQuery(() => zql.post)
```

### [Arguments](https://zero.rocicorp.dev/docs/queries\#arguments)

The `QueryFn` can take a single `args` parameter. To enable this, pass a _validator_ to `defineQuery`:

```
Copyimport {zql} from 'schema.ts'

const postsByAuthor = defineQuery(
  z.object({authorID: z.string().optional()}),
  ({args: {authorID}}) => {
    let q = zql.post
    if (authorID !== undefined) {
      q = q.where('authorID', authorID)
    }
    return q
  }
)
```

We use [Zod](https://zod.dev/) in these examples, but you can use any validation library that implements [Standard Schema](https://standardschema.dev/).

[🤔Why validators are required](https://zero.rocicorp.dev/docs/queries#validators-required)

### [Query Registries](https://zero.rocicorp.dev/docs/queries\#query-registries)

The result of `defineQuery` is a `QueryDefinition`. By itself this isn't super useful. You need to register it using `defineQueries`:

```
Copyexport const queries = defineQueries({
  posts: {
    all: allPostsQueryDef
  }
})
```

Typically these are done together in one step:

```
Copyexport const queries = defineQueries({
  posts: {
    all: defineQuery(() => zql.post)
  }
})
```

The result of `defineQueries` is called a `QueryRegistry`. Each field in the registry is a callable `Query` that you can use to read data:

```
Copyimport {zero} from 'zero.ts'
import {queries} from 'queries.ts'

const allPosts = await zero.run(queries.posts.all())
```

### [Query Names](https://zero.rocicorp.dev/docs/queries\#query-names)

Each `Query` has a `queryName` which is computed by `defineQueries`. This name is later sent to your server to identify the query to run:

```
Copyconsole.log(queries.posts.all.queryName)
// "posts.all"
```

### [Context](https://zero.rocicorp.dev/docs/queries\#context)

Query parameters are supplied by the client application and passed to the server automatically by Zero. This makes them unsuitable for credentials, since the user could modify them.

For this reason, Zero queries also support the concept of a [`context` object](https://zero.rocicorp.dev/docs/auth#context).

Access your context with the `ctx` parameter to your query:

```
Copyconst myPostsQuery = defineQuery(({ctx: {userID}}) => {
  // User cannot control context.userID, so this safely
  // restricts the query to the user's own posts.
  return zql.post.where('authorID', userID)
})
```

### [queries.ts](https://zero.rocicorp.dev/docs/queries\#queriests)

By convention, all queries for an application are listed in a central `queries.ts` file. This allows them to be easily used on both the client and server:

```
Copyimport {defineQueries, defineQuery} from '@rocicorp/zero'
import {z} from 'zod'
import {zql} from './schema.ts'

export const queries = defineQueries({
  posts: {
    get: defineQuery(z.string(), id =>
      zql.post.where('id', id)
    ),
    byAuthor: defineQuery(
      z.object({
        authorID: z.string(),
        includeDrafts: z.boolean().optional()
      }),
      ({args: {authorID, includeDrafts}}) => {
        let q = zql.post.where('authorID', authorID)
        if (!includeDrafts) {
          q = q.where('isDraft', false)
        }
        return q
      }
    )
  }
})
```

You can use as many levels of nesting as you want to organize your queries.

As your application grows, you can move queries to different files to keep them organized:

```
Copy// posts.ts
export const postQueries = {
  get: defineQuery(z.string(), id =>
    zql.post.where('id', id)
  )
  // ...
}

// users.ts
export const userQueries = {
  byRole: defineQuery(z.string(), role =>
    zql.user.where('role', role)
  )
  // ...
}

// queries.ts
import {postQueries} from './posts.ts'
import {userQueries} from './users.ts'

export const queries = defineQueries({
  posts: postQueries,
  users: userQueries
})
```

[⚠️Use \`defineQueries\` at top level only](https://zero.rocicorp.dev/docs/queries#use-definequeries-at-top-level-only)

## [Server Setup](https://zero.rocicorp.dev/docs/queries\#server-setup)

In order for queries to sync, you must provide an implementation of the `query` endpoint on your server. `zero-cache` calls this endpoint to resolve each query to [ZQL](https://zero.rocicorp.dev/docs/zql) that it can run.

### [Registering the Endpoint](https://zero.rocicorp.dev/docs/queries\#registering-the-endpoint)

Use [`ZERO_QUERY_URL`](https://zero.rocicorp.dev/docs/zero-cache-config#query-url) to tell `zero-cache` where to find your `query` implementation:

```
Copyexport ZERO_QUERY_URL="http://localhost:3000/api/zero/query"
# run zero-cache, e.g. `npx zero-cache-dev`
```

### [Implementing the Endpoint](https://zero.rocicorp.dev/docs/queries\#implementing-the-endpoint)

The `@rocicorp/zero` package provides the `handleQueryRequest` and `mustGetQuery` functions to make it easy to implement the endpoint.

Tanstack StartNext.jsSolid StartHono

```
Copy// src/routes/api/zero/query.ts
import {createFileRoute} from '@tanstack/react-router'
import {json} from '@tanstack/react-start'
import {handleQueryRequest} from '@rocicorp/zero/server'
import {mustGetQuery} from '@rocicorp/zero'
import {queries} from 'queries.ts'
import {schema} from 'schema.ts'

export const Route = createFileRoute('/api/zero/query')({
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

`handleQueryRequest` accepts a standard `Request` and returns a JSON object which can be serialized and returned by your server framework of choice.

`mustGetQuery` looks up the query in the registry and throws an error if not found.

The `query.fn` function is your query implementation wrapped in the validator you provided.

### [Custom Query URL](https://zero.rocicorp.dev/docs/queries\#custom-query-url)

By default, Zero sends queries to the URL specified in the `ZERO_QUERY_URL` parameter in the zero-cache config.

However you can customize this on a per-client basis. To do so, list multiple comma-separated URLs in `ZERO_QUERY_URL`:

```
CopyZERO_QUERY_URL='https://api.example.com/query,https://api.staging.example.com/query'
```

Then choose one of those URLs by passing it to `queryURL` on the `Zero` constructor:

```
Copyconst zero = new Zero({
  schema,
  queries,
  queryURL: 'https://api.staging.example.com/query'
})
```

### [URL Patterns](https://zero.rocicorp.dev/docs/queries\#url-patterns)

The strings listed in `ZERO_QUERY_URL` can also be [`URLPatterns`](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API):

```
CopyZERO_QUERY_URL="https://mybranch-*.preview.myapp.com/query"
```

This queries URL will allow clients to choose URLs like:

- `https://mybranch-aaa.preview.myapp.com/query` ✅
- `https://mybranch-bbb.preview.myapp.com/query` ✅

But rejects URLs like:

- `https://preview.myapp.com/query` ❌ (missing subdomain)
- `https://malicious.com/query` ❌ (different domain)
- `https://mybranch-123.preview.myapp.com/query/extra` ❌ (extra path)
- `https://mybranch-123.preview.myapp.com/other` ❌ (different path)

[🥇Pro Tip (tm)](https://zero.rocicorp.dev/docs/queries#pro-tip-tm)

For more information, see the [URLPattern docs](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API).

## [Running Queries](https://zero.rocicorp.dev/docs/queries\#running-queries)

### [Reactively](https://zero.rocicorp.dev/docs/queries\#reactively)

The most common way to use queries is with the `useQuery` reactive hooks from the [React](https://zero.rocicorp.dev/docs/react) or [SolidJS](https://zero.rocicorp.dev/docs/solid) bindings (or the equivalent low-level API):

ReactSolidJSTypeScript

```
Copyimport {useQuery} from '@rocicorp/zero/react'
import {queries} from 'zero/queries.ts'

function App() {
  const [posts] = useQuery(queries.posts.get('user123'))
  return posts.map(post => (
    <div key={post.id}>{post.title}</div>
  ))
}
```

These functions allow you to automatically re-render UI when a query changes.

### [Once](https://zero.rocicorp.dev/docs/queries\#once)

You usually want to subscribe to a query in a reactive UI, but every so often you'll need to run a query just once. To do this, use `zero.run()`:

```
Copyconst results = await zero.run(
  queries.issues.byPriority('high')
)
```

By default, `run()` only returns results that are currently available on the client. That is, it returns the data that would be given for [`result.type === 'unknown'`](https://zero.rocicorp.dev/docs/queries#partial-data).

If you want to wait for the server to return results, pass `{type: 'complete'}` to `run`:

```
Copyconst results = await zero.run(
  queries.issues.byPriority('high'),
  {type: 'complete'}
)
```

### [For Preloading](https://zero.rocicorp.dev/docs/queries\#for-preloading)

Almost all Zero apps will want to preload some data in order to maximize the feel of instantaneous UI transitions.

Because preload queries are often much larger than a screenful of UI, Zero provides a special `zero.preload()` method to avoid the overhead of materializing the result into JS objects:

```
Copy// Preload a large number of the inbox query results.
zero.preload(
  queries.issues.inbox({
    sort: 'created',
    sortDirection: 'desc',
    limit: 1000
  })
)
```

## [Missing Data](https://zero.rocicorp.dev/docs/queries\#missing-data)

Because Zero returns local results immediately and server results asynchronously, displaying "not found" / 404 UI can be slightly tricky.

If you just use a simple existence check, you will often see the 404 UI flicker while the server result loads:

ReactSolidJSTypeScript

```
Copyconst [issue] = useQuery(queries.issues.get('some-id'))

// ❌ This causes flickering of the UI
if (!issue) {
  return <div>404 Not Found</div>
} else {
  return <div>{issue.title}</div>
}
```

To do this correctly, only display the "not found" UI when the result type is `complete`. This way the 404 page is slow but pages with data are still just as fast:

ReactSolidJSTypeScript

```
Copyconst [issue, issueResult] = useQuery(
  queries.issues.get('some-id')
)

if (!issue && issueResult.type === 'complete') {
  return <div>404 Not Found</div>
}

if (!issue) {
  return null
}

return <div>{issue.title}</div>
```

## [Partial Data](https://zero.rocicorp.dev/docs/queries\#partial-data)

Zero immediately returns the data for a query it has on the client, then falls back to the server for any missing data.

Sometimes it's useful to know the difference between these two types of results. To do so, use the `result` from `useQuery`:

ReactSolidJSTypeScript

```
Copyconst [issues, issuesResult] = useQuery(
  queries.issues.inbox()
)
if (issuesResult.type === 'complete') {
  console.log('All data is present')
} else {
  console.log('Some data is missing')
}
```

The possible values of `result.type` are currently `complete` and `unknown`.

The `complete` value is currently only returned when Zero has received the server result. In the future, Zero will be able to return this result type when it _knows_ that all possible data for this query is already available locally. Additionally, we plan to add a `prefix` result for when the data is known to be a prefix of the complete result. See [Consistency](https://zero.rocicorp.dev/docs/queries#consistency) for more information.

## [Handling Errors](https://zero.rocicorp.dev/docs/queries\#handling-errors)

If the queries endpoint throws an application or parse error, `zero-cache` will report it to the client using the `type` and `error` fields on the query details object:

ReactSolidJSTypeScript

```
Copyconst [posts, postsResult] = useQuery(
  queries.posts.byAuthorID('user123')
)

if (postsResult.type === 'error') {
  return (
    <div>
      Error loading posts: {postsResult.error.message}
    </div>
  )
}
```

[🤔Query endpoint failures are not shown here](https://zero.rocicorp.dev/docs/queries#query-endpoint-failures-are-not-shown-here)

## [Granular Updates](https://zero.rocicorp.dev/docs/queries\#granular-updates)

You can use the [`materialize()`](https://zero.rocicorp.dev/docs/queries#manually) method to create a view that you can listen to for changes.

However, this will only tell you when the view has changed and give you the complete new result. It won't tell you _what_ changed.

To know what changed, you can create your own custom `View` implementation:

```
Copy// Inside the View class
// Instead of storing the change, we invoke some callback
push(change: Change): void {
  switch (change.type) {
    case 'add':
      this.#onAdd?.(change)
      break
    case 'remove':
      this.#onRemove?.(change)
      break
    case 'edit':
      this.#onEdit?.(change)
      break
    case 'child':
      this.#onChild?.(change)
      break
    default:
      throw new Error(`Unknown change type: ${change['type']}`)
  }
}
```

For examples, see the `View` implementations in [`zero-vue`](https://github.com/danielroe/zero-vue/blob/f25808d4b7d1ef0b8e01a5670d7e3050d6a64bbf/src/view.ts#L77-L89) or [`zero-solid`](https://github.com/rocicorp/mono/blob/51995101d0657519207f1c4695a8765b9016e07c/packages/zero-solid/src/solid-view.ts#L119-L131).

## [Query Caching](https://zero.rocicorp.dev/docs/queries\#query-caching)

Queries can be either _active_ or _cached_. An active query is one that is currently being used by the application. Cached queries are not currently in use, but continue syncing in case they are needed again soon.

![Image](https://zero.rocicorp.dev/images/reading-data/query-lifecycle.svg)

Queries are _deactivated_ according to how they were created:

1. For `useQuery()`, the UI unmounts the component (which calls `destroy()` under the covers).
2. For `preload()`, the UI calls `cleanup()` on the return value of `preload()`.
3. For `run()`, queries are automatically deactivated immediately after the result is returned.
4. For `materialize()` queries, the UI calls `destroy()` on the view.

Additionally when a Zero instance closes, all active queries are automatically deactivated. This also happens when the containing page or script is unloaded.

### [TTLs](https://zero.rocicorp.dev/docs/queries\#ttls)

Each query has a `ttl` that controls how long it stays cached.

[💡The TTL clock only ticks while Zero is running](https://zero.rocicorp.dev/docs/queries#the-ttl-clock-only-ticks-while-zero-is-running)

### [TTL Defaults](https://zero.rocicorp.dev/docs/queries\#ttl-defaults)

In most cases, the default TTL should work well:

- `preload()` queries default to `ttl:'none'`, meaning they are not cached at all, and will stop syncing immediately when deactivated. But because `preload()` queries are typically registered at app startup and never shutdown, and [because the ttl clock only ticks while Zero is running](https://zero.rocicorp.dev/docs/queries#the-ttl-clock-only-ticks-while-zero-is-running), this means that preload queries never get unregistered.
- Other queries have a default `ttl` of `5m` (five minutes).

### [Setting Different TTLs](https://zero.rocicorp.dev/docs/queries\#setting-different-ttls)

You can override the default TTL with the `ttl` parameter:

ReactSolidJSTypeScript

```
Copyconst [user] = useQuery(
  queries.posts.byAuthorID('user123'),
  {ttl: '5m'}
)

// preload()
zero.preload(queries.posts.byAuthorID('user123'), {
  ttl: '5m'
})
```

TTLs up to `10m` (ten minutes) are currently supported. The following formats are allowed:

| Format | Meaning |
| --- | --- |
| `none` | No caching. Query will immediately stop when deactivated. |
| `%ds` | Number of seconds. |
| `%dm` | Number of minutes. |

### [Why Zero TTLs are Short](https://zero.rocicorp.dev/docs/queries\#why-zero-ttls-are-short)

Zero queries are not free.

Just as in any database, queries consume resources on both the client and server. Memory is used to keep metadata about the query, and disk storage is used to keep the query's current state.

We do drop this state after we haven't heard from a client for awhile, but this is only a partial improvement. If the client returns, we have to re-run the query to get the latest data.

This means that we do not actually _want_ to keep queries active unless there is a good chance they will be needed again soon.

The default Zero TTL values might initially seem too short, but they are designed to work well with the way Zero's TTL clock works and strike a good balance between keeping queries alive long enough to be useful, while not keeping them alive so long that they consume resources unnecessarily.

## [Local-Only Queries](https://zero.rocicorp.dev/docs/queries\#local-only-queries)

It can sometimes be useful to run queries only on the client. For example, to implement typeahead search, it really doesn't make sense to register a query with the server for every single keystroke.

Zero doesn't yet have a way to run named queries local-only, but you can run ZQL expressions locally by passing them anywhere a query is supported.

For example, to subscribe to a local-only query:

ReactSolidJSTypescript

```
Copy// Queries the already synced data for issues,
// without syncing more data.
const [issues] = useQuery(
  zql.issue.orderBy('created', 'desc').limit(10)
)
```

## [Custom Server Implementation](https://zero.rocicorp.dev/docs/queries\#custom-server-implementation)

It is possible to implement the `ZERO_QUERY_URL` endpoint without using Zero's TypeScript libraries, or even in a different language entirely.

The endpoint receives a `POST` request with a JSON body of the form:

```
Copytype QueriesRequestBody = {
  id: string
  name: string
  args: readonly ReadonlyJSONValue[]
}[]
```

And responds with:

```
Copytype QueriesResponseBody = (
  | {
      id: string
      name: string
      // See https://github.com/rocicorp/mono/blob/main/packages/zero-protocol/src/ast.ts
      ast: AST
    }
  | {
      error: 'app'
      id: string
      name: string
      details: ReadonlyJSONValue
    }
  | {
      error: 'zero'
      id: string
      name: string
      details: ReadonlyJSONValue
    }
  | {
      error: 'http'
      id: string
      name: string
      status: number
      details: ReadonlyJSONValue
    }
)[]
```

## [Consistency](https://zero.rocicorp.dev/docs/queries\#consistency)

Zero always syncs a consistent partial replica of the backend database to the client. This avoids many common consistency issues that come up in classic web applications. But there are still some consistency issues to be aware of when using Zero.

For example, imagine that you have a bug database w/ 10k issues. You preload the first 1k issues sorted by created.

The user then does a query of issues assigned to themselves, sorted by created. Among the 1k issues that were preloaded imagine 100 are found that match the query. Since the data we preloaded is in the same order as this query, we are guaranteed that any local results found will be a _prefix_ of the server results.

The UX that result is nice: the user will see initial results to the query instantly. If more results are found server-side, those results are guaranteed to sort below the local results. There's no shuffling of results when the server response comes in.

Now imagine that the user switches the sort to ‘sort by modified’. This new query will run locally, and will again find some local matches. But it is now unlikely that the local results found are a prefix of the server results. When the server result comes in, the user will probably see the results shuffle around.

To avoid this annoying effect, what you should do in this example is also preload the first 1k issues sorted by modified desc. In general for any query shape you intend to do, you should preload the first `n` results for that query shape with no filters, in each sort you intend to use.

[🤔Zero does not sync duplicate rows](https://zero.rocicorp.dev/docs/queries#no-duplicate-rows)

In the future, we will be implementing a consistency model that fixes these issues automatically. We will prevent Zero from returning local data when that data is not known to be a prefix of the server result. Once the consistency model is implemented, preloading can be thought of as purely a performance thing, and not required to avoid unsightly flickering.

[PreviousAuthentication](https://zero.rocicorp.dev/docs/auth)

[NextWriting Data](https://zero.rocicorp.dev/docs/mutators)

### On this page

[Architecture](https://zero.rocicorp.dev/docs/queries#architecture) [Life of a Query](https://zero.rocicorp.dev/docs/queries#life-of-a-query) [Defining Queries](https://zero.rocicorp.dev/docs/queries#defining-queries) [Basics](https://zero.rocicorp.dev/docs/queries#basics) [Arguments](https://zero.rocicorp.dev/docs/queries#arguments) [Query Registries](https://zero.rocicorp.dev/docs/queries#query-registries) [Query Names](https://zero.rocicorp.dev/docs/queries#query-names) [Context](https://zero.rocicorp.dev/docs/queries#context) [queries.ts](https://zero.rocicorp.dev/docs/queries#queriests) [Server Setup](https://zero.rocicorp.dev/docs/queries#server-setup) [Registering the Endpoint](https://zero.rocicorp.dev/docs/queries#registering-the-endpoint) [Implementing the Endpoint](https://zero.rocicorp.dev/docs/queries#implementing-the-endpoint) [Custom Query URL](https://zero.rocicorp.dev/docs/queries#custom-query-url) [URL Patterns](https://zero.rocicorp.dev/docs/queries#url-patterns) [Running Queries](https://zero.rocicorp.dev/docs/queries#running-queries) [Reactively](https://zero.rocicorp.dev/docs/queries#reactively) [Once](https://zero.rocicorp.dev/docs/queries#once) [For Preloading](https://zero.rocicorp.dev/docs/queries#for-preloading) [Missing Data](https://zero.rocicorp.dev/docs/queries#missing-data) [Partial Data](https://zero.rocicorp.dev/docs/queries#partial-data) [Handling Errors](https://zero.rocicorp.dev/docs/queries#handling-errors) [Granular Updates](https://zero.rocicorp.dev/docs/queries#granular-updates) [Query Caching](https://zero.rocicorp.dev/docs/queries#query-caching) [TTLs](https://zero.rocicorp.dev/docs/queries#ttls) [TTL Defaults](https://zero.rocicorp.dev/docs/queries#ttl-defaults) [Setting Different TTLs](https://zero.rocicorp.dev/docs/queries#setting-different-ttls) [Why Zero TTLs are Short](https://zero.rocicorp.dev/docs/queries#why-zero-ttls-are-short) [Local-Only Queries](https://zero.rocicorp.dev/docs/queries#local-only-queries) [Custom Server Implementation](https://zero.rocicorp.dev/docs/queries#custom-server-implementation) [Consistency](https://zero.rocicorp.dev/docs/queries#consistency)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/queries.mdx)