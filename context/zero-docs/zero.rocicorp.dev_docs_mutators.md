---
url: "https://zero.rocicorp.dev/docs/mutators"
title: "Mutators"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# Mutators  Copy markdown  Writing Data  \\# Mutators  Mutators are how you write data with Zero. Here's a simple example:  \`\`\`ts import {defineMutators, defineMutator} from '@rocicorp/zero' import {z} from 'zod'  export const mutators = defineMutators({ updateIssue: defineMutator( z.object({ id: z.string(), title: z.string() }), async ({tx, args: {id, title}}) => { if (title.length > 100) { throw new Error(\`Title is too long\`) } await tx.mutate.issue.update({ id, title }) } ) }) \`\`\`  \\#\# Architecture  A copy of each mutator exists on both the client and on your server:  !\[\](https://zero.rocicorp.dev/images/mutators/overview.png)  Often the implementations will be the same, and you can just share their code. This is easy with full-stack frameworks like TanStack Start or Next.js.  But the implementations don't have to be the same, or even compute the same result. For example, the server can add extra checks to enforce permissions, or send notifications or interact with other systems.  \\#\#\# Life of a Mutation  When a mutator is invoked, it initially runs on the client, against the client-side datastore. Any changes are immediately applied to open queries and the user sees the changes.  In the background, Zero sends a \*mutation\* (a record of the mutator having run with certain arguments) to your server's push endpoint. Your push endpoint runs the \[push protocol\](\#custom-push-implementation), executing the server-side mutator in a transaction against your database and recording the fact that the mutation ran. The \`@rocicorp/zero\` package contains utilities to make it easy to implement this endpoint in TypeScript.  The changes to the database are then replicated to \`zero-cache\` using logical replication. \`zero-cache\` calculates the updates to active queries and sends rows that have changed to each client. It also sends information about the mutations that have been applied to the database.  Clients receive row updates and apply them to their local cache. Any pending mutations which have been applied to the server have their local effects rolled back. Client-side queries are updated and the user sees the changes.  \\#\# Defining Mutators  \\#\#\# Basics  Create a mutator using \`defineMutator\`.  The only required argument is a \`MutatorFn\`, which must be \`async\`:  \`\`\`ts import {defineMutator} from '@rocicorp/zero'  const myMutator = defineMutator(async () => { // ... }) \`\`\`  \> 🤔 \*\*\`async\` !== slow\*\*: Mutators almost always complete in the same frame on the client, within milliseconds. The reason they are marked \`async\` is because on the server, reading from the \`tx\`object goes over the network to Postgres.  \\#\#\# Writing Data  The \`MutatorFn\` receives a \`tx\` parameter which can be used to write data with a CRUD-style API. Each table in your Zero schema has a corresponding field on \`tx.mutate\`:  \`\`\`ts const myMutator = defineMutator(async ({tx}) => { // This is here because there's a \`user\` table in your schema. await tx.mutate.user.insert(...) }) \`\`\`  \> ⚠️ \*\*Always await writes in mutators\*\*: Failing to do so allows the transaction to commit early, causing runtime errors when writes are attempted later.  \\#\#\#\# Insert  Create new records with \`insert\`:  \`\`\`tsx tx.mutate.user.insert({ id: 'user-123', username: 'sam', language: 'js' }) \`\`\`  Optional fields can be set to \`null\` to explicitly set the new field to \`null\`. They can also be set to \`undefined\` to take the default value (which is often \`null\` but can also be some generated value server-side):  \`\`\`tsx // Sets language to \`null\` specifically tx.mutate.user.insert({ id: 'user-123', username: 'sam', language: null })  // Sets language to the default server-side value. // Could be null, or some generated or constant default value too. tx.mutate.user.insert({ id: 'user-123', username: 'sam' })  // Same as above tx.mutate.user.insert({ id: 'user-123', username: 'sam', language: undefined }) \`\`\`  \\#\#\#\# Upsert  Create new records or update existing ones with \`upsert\`:  \`\`\`tsx tx.mutate.user.upsert({ id: samID, username: 'sam', language: 'ts' }) \`\`\`  \`upsert\` supports the same \`null\` / \`undefined\` semantics for optional fields that \`insert\` does (see above).  \\#\#\#\# Update  Update an existing record. Does nothing if the specified record (by PK) does not exist.  You can pass a partial object, leaving fields out that you don’t want to change. For example here we leave the username the same:  \`\`\`tsx // Leaves username field to previous value. tx.mutate.user.update({ id: samID, language: 'golang' })  // Same as above tx.mutate.user.update({ id: samID, username: undefined, language: 'haskell' })  // Reset language field to \`null\` tx.mutate.user.update({ id: samID, language: null }) \`\`\`  \\#\#\#\# Delete  Delete an existing record. Does nothing if specified record does not exist.  \`\`\`tsx tx.mutate.user.delete({ id: samID }) \`\`\`  \\#\#\# Arguments  The \`MutatorFn\` can take a single \`args\` parameter. To enable this, pass a \*validator\* to \`defineMutator\`:  \`\`\`ts import {defineMutator} from '@rocicorp/zero'  const initStats = defineMutator( async (z.object({issueCount: z.number()}), { tx, args: {issueCount} }) =\> { if (issueCount < 0) { throw new Error(\`issueCount cannot be negative\`) } await tx.mutate.stats.insert({ id: 'global', issueCount }) } ) \`\`\`  We use \[Zod\](https://zod.dev/) in these examples, but you can use any validation library that implements \[Standard Schema\](https://standardschema.dev/).  \> 😈 \*\*Mutators don't have to be pure\*\*: It's most common for mutators to be a \[pure function\](https://en.wikipedia.org/wiki/Pure\_function) of the database state plus arguments. But it's not \*required\*. > \> Impure mutators can be useful, e.g., to consult some external system on the server for authorization or validation.  \\#\#\# Reading Data  You can read data within a mutator by passing \[ZQL\](https://zero.rocicorp.dev/docs/zql) to \`tx.run\`:  \`\`\`ts const updateIssue = defineMutator( z.object({id: z.string(), title: z.string()}), async ({tx, args: {id, title}}) => { const issue = await tx.run( zql.issue.where('id', id).one() )  if (issue?.status === 'closed') { throw new Error(\`Cannot update closed issue\`) }  await tx.mutate.issue.update({ id, title }) } ) \`\`\`  You have the full power of ZQL at your disposal, including relationships, filters, ordering, and limits.  Reads and writes within a mutator are transactional, meaning that the datastore is guaranteed to not change while your mutator is running. And if the mutator throws, the entire mutation is rolled back.  \> \*\*Reading in mutators is always local\*\*: Unlike \[\`zero.run()\`\](https://zero.rocicorp.dev/docs/queries\#once), there is no \`type\` parameter that can be used to wait for server results inside mutators. > \> This is because waiting for server results in mutators makes no sense – it would defeat the purpose of running optimistically to begin with. > \> When a mutator runs on the client (\`tx.location === "client"\`), ZQL reads only return data already cached on the client. When mutators run on the server (\`tx.location === "server"\`), ZQL reads always return all data.  \\#\#\# Context  Mutator parameters are supplied by the client application and passed to the server automatically by Zero. This makes them unsuitable for credentials, since the user could modify them.  For this reason, Zero mutators also support the concept of a \[\`context\` object\](https://zero.rocicorp.dev/docs/auth\#context).  Access your context with the \`ctx\` parameter to your mutator:  \`\`\`ts const createIssue = defineMutator( z.object({id: z.string(), title: z.string()}), async ({tx, ctx: {userID}, args: {id, title}}) => { // Note: User cannot control ctx.userID, so this // enforces authorship of created issue. await tx.mutate.issue.insert({ id, title, authorID: userID }) } ) \`\`\`  \\#\#\# Mutator Registries  The result of \`defineMutator\` is a \`MutatorDefinition\`. By itself this isn't super useful. You need to register it using \`defineMutators\`:  \`\`\`ts export const mutators = defineMutators({ issue: { update: updateIssue } }) \`\`\`  Typically these are done together in one step:  \`\`\`ts export const mutators = defineMutators({ issue: { update: defineMutator( z.object({id: z.string(), title: z.string()}), async ({tx, args: {id, title}}) => { await tx.mutate.issue.update({ id, title }) } ) } }) \`\`\`  The result of \`defineMutators\` is called a \`MutatorRegistry\`. Each field in the registry is a callable \`Mutator\` that you can use to perform mutations:  \`\`\`ts import {mutators} from 'mutators.ts'  zero.mutate( mutators.issue.update({ id: 'issue-123', title: 'New title' }) ) \`\`\`  \\#\#\# Mutator Names  Each \`Mutator\` has a \`mutatorName\` which is computed by \`defineMutators\`. When you run a mutator, Zero sends this name along with the arguments to your server to execute the \[server-side\](\#server-setup) mutation.  \`\`\`ts console.log(mutators.issue.update.mutatorName) // "issue.update" \`\`\`  \\#\#\# mutators.ts  By convention, mutators are listed in a central \`mutators.ts\` file. This allows them to be easily used on both the client and server:  \`\`\`ts import {defineMutators, defineMutator} from '@rocicorp/zero' import {zql} from './schema.ts' import {z} from 'zod'  export const mutators = defineMutators({ posts: { create: defineMutator( z.object({ id: z.string(), title: z.string() }), async ({ tx, context: {userID}, args: {id, title} }) =\> { await tx.mutate.post.insert({ id, title, authorID: userID }) } ), update: defineMutator( z.object({ id: z.string(), title: z.string().optional() }), async ({ tx, context: {userID}, args: {id, title} }) =\> { const prev = await tx.run( zql.post.where('id', id).one() ) if (prev?.authorID !== userID) { throw new Error(\`Access denied\`) } await tx.mutate.post.update({ id, title, authorID: userID }) } ) } }) \`\`\`  You can use as many levels of nesting as you want to organize your mutators.  As your application grows, you can move mutators to different files to keep them organized:  \`\`\`ts // posts.ts export const postMutators = { create: defineMutator( z.object({ id: z.string(), title: z.string(), }), async ({tx, context: {userID}, args: {id, title}}) => { await tx.mutate.post.insert({ id, title, authorID: userID, }) }, ), }  // user.ts export const userMutators = { updateRole: defineMutator( z.object({ role: z.string(), }), async ({tx, ctx: {userID}, args: {role}}) => { await tx.mutate.user.update({ id: userID, role, }) }, ), }  // mutators.ts import {postMutators} from 'zero/mutators/posts.ts' import {userMutators} from 'zero/mutators/users.ts'  export const mutators = defineMutators{{ posts: postMutators, users: userMutators, }) \`\`\`  \> ⚠️ \*\*Use \`defineMutators\` at top level only\*\*: \`defineMutators\` establishes the full name for each mutator (i.e., \`posts.create\`, \`users.updateRole\`), which is later sent to the \[server\](\#server-setup). > \> So this should only be used once at the top level of your \`mutators.ts\` file.  \\#\# Registration  Before you can use your mutators, you need to register them with Zero:  \> 🪖 \*\*Knowing is half the battle\*\*: Mutators need to be registered with Zero because Zero calls them during sync for conflict resolution. > \> If you invoke a mutator that is not registered, Zero will throw an error.  \\#\# Server Setup  In order for mutations to sync, you must provide an implementation of the \`mutate\` endpoint on your server. \`zero-cache\` calls this endpoint to process each mutation.  \\#\#\# Registering the Endpoint  Use \[\`ZERO\_MUTATE\_URL\`\](https://zero.rocicorp.dev/docs/zero-cache-config\#mutate-url) to tell \`zero-cache\` where to find your \`mutate\` implementation:  \`\`\`bash export ZERO\_MUTATE\_URL="http://localhost:3000/api/zero/mutate" \\# run zero-cache, e.g. \`npx zero-cache-dev\` \`\`\`  \\#\#\# Implementing the Endpoint  The \`@rocicorp/zero\` package provides the \`handleMutateRequest\` and \`mustGetMutator\` functions to make it easy to implement the endpoint. Plug in whatever \`dbProvider\` you set up (see \[server-zql\](https://zero.rocicorp.dev/docs/server-zql) or the install guide).  \> \*\*Using a different bindings library\*\*: Zero includes several built-in database adapters. You can also easily create your own. See \[ZQL on the Server\](https://zero.rocicorp.dev/docs/server-zql) for more information.  \`handleMutateRequest\` accepts a standard \`Request\` and returns a JSON object which can be serialized and returned by your server framework of choice.  \`mustGetMutator\` looks up the mutator in the registry and throws an error if not found.  The \`mutator.fn\` function is your mutator implementation wrapped in the validator you provided.  \\#\#\# Handling Errors  The \`handleMutateRequest\` function skips any mutations that throw:  \`\`\`ts const result = await handleMutateRequest( dbProvider, transact => transact(async (tx, name, args) => { // The mutation is skipped and the next mutation runs as normal. // The optimistic mutation on the client will be reverted. throw new Error('bonk') }), c.req.raw ) \`\`\`  \`handleMutateRequest\` catches such errors and turns them into a structured response that gets sent back to the client. You can \[recover the errors\](\#waiting-for-mutator-result) and show UI if you want.  It is also of course possible for the entire push endpoint to return an HTTP error, or to not reply at all:  If Zero receives any response from the mutate endpoint other than HTTP 200, 401, or 403, it will disconnect and enter the \[error state\](https://zero.rocicorp.dev/docs/connection\#errors).  If Zero receives HTTP 401 or 403, the client will enter the needs auth state and require a manual reconnect with \`zero.connection.connect()\`, then it will retry all queued mutations.  If you want a different behavior, it is possible to \[implement the mutate endpoint\](\#custom-push-implementation) yourself and handle errors differently.  \\#\#\# Custom Mutate URL  By default, Zero sends mutations to the URL specified in the \`ZERO\_MUTATE\_URL\` parameter.  However you can customize this on a per-client basis. To do so, list multiple comma-separated URLs in the \`ZERO\_MUTATE\_URL\` parameter:  \`\`\`bash export ZERO\_MUTATE\_URL="https://api.example.com/mutate,https://api.staging.example.com/mutate" \`\`\`  Then choose one of those URLs by passing it to \`mutateURL\` on the \`Zero\` constructor:  \`\`\`ts const opts: ZeroOptions = { // ... mutateURL: 'https://api.staging.example.com/mutate' } \`\`\`  \\#\#\# URL Patterns  The strings listed in \`ZERO\_MUTATE\_URL\` can also be \[\`URLPatterns\`\](https://developer.mozilla.org/en-US/docs/Web/API/URL\_Pattern\_API):  \`\`\`bash export ZERO\_MUTATE\_URL="https://mybranch-\*.preview.myapp.com/mutate" \`\`\`  For more information, see the \[URLPattern section of the Queries docs\](https://zero.rocicorp.dev/docs/queries\#url-patterns). It works the same way for mutations.  \\#\#\# Server-Specific Code  To implement server-specific code, just run different mutators in your mutate endpoint. Server authority to the rescue!  \`defineMutators\` accepts a \*baseMutators\* parameter that makes this easy. The returned mutator registry will contain all the mutators from \*baseMutators\*, plus any new ones you define or override:  \`\`\`ts // server-mutators.ts import {defineMutators, defineMutator} from '@rocicorp/zero' import {z} from 'zod' import {zql} from 'schema.ts' import {mutators as sharedMutators} from 'mutators.ts'  export const serverMutators = defineMutators( sharedMutators, { posts: { // Overrides the shared mutator definition with same name. update: defineMutator( z.object({ id: z.string(), title: z.string().optional(), priority: z.number().optional() }), async ({ tx, ctx: {userID}, args: {id, title, priority} }) =\> { // Run the shared mutator first. await sharedMutators.posts.update.fn({ tx, ctx, args })  // Record a history of this operation happening in an audit log table. await tx.mutate.auditLog.insert({ issueId: id, action: 'update-title', timestamp: Date.getTime() }) } ) } } ) \`\`\`  For simple things, we also expose a \`location\` field on the transaction object that you can use to branch your code:  \`\`\`ts const myMutator = defineMutator(async ({tx}) => { if (tx.location === 'client') { // Client-side code } else { // Server-side code } }) \`\`\`  \\#\# Running Mutators  Once you have registered your mutators, you can invoke them with \`zero.mutate\`:  \`\`\`ts import {mutators} from 'mutators.ts' import {nanoid} from 'nanoid'  zero.mutate( mutators.issue.update({ id: nanoid(), title: 'New title' }) ) \`\`\`  \> 🎲 \*\*Client-generated random IDs recommended\*\*: Client-generated random IDs from libraries like \[uuid\](https://www.npmjs.com/package/uuid), \[ulid\](https://www.npmjs.com/package/ulid), or \[nanoid\](https://www.npmjs.com/package/nanoid) work much better with sync engines like Zero. See \[IDs\](https://zero.rocicorp.dev/docs/postgres-support\#ids) for more details.  \\#\#\# Waiting for Results  We typically recommend that you "fire and forget" mutators.  Optimistic mutations make sense when the common case is that a mutation succeeds. If a mutation frequently fails, then showing the user an optimistic result isn't very useful, because it will likely be wrong.  That said there are cases where it is nice to know when a write succeeded on either the client or server.  One example is if you need to read a row directly after writing it. Zero's local writes are very fast (almost always \\< 1 frame), but because Zero is backed by IndexedDB, writes are still \*technically\* asynchronous and reads directly after a write may not return the new data.  You can use the \`.client\` promise in this case to wait for a write to complete on the client side:  \`\`\`ts const write = zero.mutate( mutators.issue.insert({ id: nanoid(), title: 'New title' }) )  // issue-123 not guaranteed to be present here. read1 may be undefined. const read1 = await zero.run( queries.issue.byId('issue-123').one() )  // Await client write – almost always less than 1 frame, and same // macrotask, so no browser paint will occur here. const res = await write.client  if (res.type === 'error') { console.error('Mutator failed on client', res.error) }  // issue-123 definitely can be read now. const read2 = await zero.run( queries.issue.byId('issue-123').one() ) \`\`\`  You can also wait for the server write to succeed:  \`\`\`ts const write = zero.mutate( mutators.issue.insert({ id: nanoid(), title: 'New title' }) )  const clientRes = await write.client if (clientRes.type === 'error') { throw new Error( \`Mutator failed on client\`, clientRes.error ) }  // optimistic write guaranteed to be present here, but not // server write. const read1 = await zero.run( queries.issue.byId('issue-123').one() )  // Await server write – this involves a round-trip. const serverRes = await write.server if (serverRes.type === 'error') { throw new Error( \`Mutator failed on server\`, serverRes.error ) }  // issue-123 is written to server and any results are // synced to this client. // read2 could potentially be undefined here, for example if the // server mutator rejected the write. const read2 = await zero.run( queries.issue.byId('issue-123').one() ) \`\`\`  If the client-side mutator fails, the \`.server\` promise is also rejected with the same error. You don't have to listen to both promises, the server promise covers both cases.  \> \*\*Returning data from mutators\*\*: There is not yet a way to return data from mutators in the success case. \[Let us know\](https://discord.rocicorp.dev/)if you need this.  \\#\# Permissions  Because mutators are just normal TypeScript functions that run server-side, there is no need for a special permissions system. You can implement whatever permission checks you want using plain TypeScript code.  See \[Permissions\](https://zero.rocicorp.dev/docs/auth\#permissions) for more information.  \\#\# Dropping Down to Raw SQL  The \`ServerTransaction\` interface has a \`dbTransaction\` property that exposes the underlying database connection. This allows you to run raw SQL queries directly against the database.  This is useful for complex queries, or for using Postgres features that Zero doesn't support yet:  \`\`\`ts const markAllAsRead = defineMutator( z.object({ userId: z.string() }), async ({tx, args: {userId}}) => { // shared stuff ...  if (tx.location === 'server') { // \`tx\` is now narrowed to \`ServerTransaction\`. // Do special server-only stuff with raw SQL. await tx.dbTransaction.query( \` UPDATE notification SET read = true WHERE user\_id = $1 \`, \[userId\] ) } } ) \`\`\`  See \[ZQL on the Server\](https://zero.rocicorp.dev/docs/server-zql) for more information.  \\#\# Notifications and Async Work  The best way to handle notifications and async work is a \[transactional outbox\](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html). This ensures that notifications actually do eventually get sent, without holding open database transactions to talk over the network. This can be implemented very easily in Zero by writing notifications to an \`outbox\` table as part of your mutator, then processing that table periodically with a background job.  However sometimes it's still nice to do a quick and dirty async send as part of a mutation, for example early on in development, or to record metrics. For this, the \`createMutators\` pattern is useful:  \`\`\`ts // server-mutators.ts import {defineMutator} from '@rocicorp/zero' import z from 'zod' import {zql} from 'schema.ts' import {mutators as clientMutators} from 'mutators.ts'  // Instead of defining server mutators as a constant, // define them as a function of a list of async tasks. export function createMutators( asyncTasks: Array<() => Promise<void>> ) { return defineMutators(clientMutators, { issue: { update: defineMutator( z.object({ id: z.string(), title: z.string() }), async (tx, {id, title}) => { await tx.mutate.issue.update({id, title}) asyncTasks.push(() => sendEmailToSubscribers(id)) } ) } }) } \`\`\`  Then in your mutate handler:  \\#\# Custom Mutate Implementation  You can manually implement the mutate endpoint in any programming language.  This will be documented in the future, but you can refer to the \[handleMutateRequest\](https://github.com/rocicorp/mono/blob/main/packages/zero-server/src/process-mutations.ts) source code for an example for now.      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

Writing Data

Mutators are how you write data with Zero. Here's a simple example:

```
Copyimport {defineMutators, defineMutator} from '@rocicorp/zero'
import {z} from 'zod'

export const mutators = defineMutators({
  updateIssue: defineMutator(
    z.object({
      id: z.string(),
      title: z.string()
    }),
    async ({tx, args: {id, title}}) => {
      if (title.length > 100) {
        throw new Error(`Title is too long`)
      }
      await tx.mutate.issue.update({
        id,
        title
      })
    }
  )
})
```

## [Architecture](https://zero.rocicorp.dev/docs/mutators\#architecture)

A copy of each mutator exists on both the client and on your server:

![Image](https://zero.rocicorp.dev/images/mutators/overview.png)

Often the implementations will be the same, and you can just share their code. This is easy with full-stack frameworks like TanStack Start or Next.js.

But the implementations don't have to be the same, or even compute the same result. For example, the server can add extra checks to enforce permissions, or send notifications or interact with other systems.

### [Life of a Mutation](https://zero.rocicorp.dev/docs/mutators\#life-of-a-mutation)

When a mutator is invoked, it initially runs on the client, against the client-side datastore. Any changes are immediately applied to open queries and the user sees the changes.

In the background, Zero sends a _mutation_ (a record of the mutator having run with certain arguments) to your server's push endpoint. Your push endpoint runs the [push protocol](https://zero.rocicorp.dev/docs/mutators#custom-push-implementation), executing the server-side mutator in a transaction against your database and recording the fact that the mutation ran. The `@rocicorp/zero` package contains utilities to make it easy to implement this endpoint in TypeScript.

The changes to the database are then replicated to `zero-cache` using logical replication. `zero-cache` calculates the updates to active queries and sends rows that have changed to each client. It also sends information about the mutations that have been applied to the database.

Clients receive row updates and apply them to their local cache. Any pending mutations which have been applied to the server have their local effects rolled back. Client-side queries are updated and the user sees the changes.

## [Defining Mutators](https://zero.rocicorp.dev/docs/mutators\#defining-mutators)

### [Basics](https://zero.rocicorp.dev/docs/mutators\#basics)

Create a mutator using `defineMutator`.

The only required argument is a `MutatorFn`, which must be `async`:

```
Copyimport {defineMutator} from '@rocicorp/zero'

const myMutator = defineMutator(async () => {
  // ...
})
```

[🤔\`async\` !== slow](https://zero.rocicorp.dev/docs/mutators#async--slow)

### [Writing Data](https://zero.rocicorp.dev/docs/mutators\#writing-data)

The `MutatorFn` receives a `tx` parameter which can be used to write data with a CRUD-style API. Each table in your Zero schema has a corresponding field on `tx.mutate`:

```
Copyconst myMutator = defineMutator(async ({tx}) => {
  // This is here because there's a `user` table in your schema.
  await tx.mutate.user.insert(...)
})
```

[⚠️Always await writes in mutators](https://zero.rocicorp.dev/docs/mutators#always-await-writes-in-mutators)

#### [Insert](https://zero.rocicorp.dev/docs/mutators\#insert)

Create new records with `insert`:

```
Copytx.mutate.user.insert({
  id: 'user-123',
  username: 'sam',
  language: 'js'
})
```

Optional fields can be set to `null` to explicitly set the new field to `null`. They can also be set to `undefined` to take the default value (which is often `null` but can also be some generated value server-side):

```
Copy// Sets language to `null` specifically
tx.mutate.user.insert({
  id: 'user-123',
  username: 'sam',
  language: null
})

// Sets language to the default server-side value.
// Could be null, or some generated or constant default value too.
tx.mutate.user.insert({
  id: 'user-123',
  username: 'sam'
})

// Same as above
tx.mutate.user.insert({
  id: 'user-123',
  username: 'sam',
  language: undefined
})
```

#### [Upsert](https://zero.rocicorp.dev/docs/mutators\#upsert)

Create new records or update existing ones with `upsert`:

```
Copytx.mutate.user.upsert({
  id: samID,
  username: 'sam',
  language: 'ts'
})
```

`upsert` supports the same `null` / `undefined` semantics for optional fields that `insert` does (see above).

#### [Update](https://zero.rocicorp.dev/docs/mutators\#update)

Update an existing record. Does nothing if the specified record (by PK) does not exist.

You can pass a partial object, leaving fields out that you don’t want to change. For example here we leave the username the same:

```
Copy// Leaves username field to previous value.
tx.mutate.user.update({
  id: samID,
  language: 'golang'
})

// Same as above
tx.mutate.user.update({
  id: samID,
  username: undefined,
  language: 'haskell'
})

// Reset language field to `null`
tx.mutate.user.update({
  id: samID,
  language: null
})
```

#### [Delete](https://zero.rocicorp.dev/docs/mutators\#delete)

Delete an existing record. Does nothing if specified record does not exist.

```
Copytx.mutate.user.delete({
  id: samID
})
```

### [Arguments](https://zero.rocicorp.dev/docs/mutators\#arguments)

The `MutatorFn` can take a single `args` parameter. To enable this, pass a _validator_ to `defineMutator`:

```
Copyimport {defineMutator} from '@rocicorp/zero'

const initStats = defineMutator(
  async (z.object({issueCount: z.number()}), {
    tx,
    args: {issueCount}
  }) => {
    if (issueCount < 0) {
      throw new Error(`issueCount cannot be negative`)
    }
    await tx.mutate.stats.insert({
      id: 'global',
      issueCount
    })
  }
)
```

We use [Zod](https://zod.dev/) in these examples, but you can use any validation library that implements [Standard Schema](https://standardschema.dev/).

[😈Mutators don't have to be pure](https://zero.rocicorp.dev/docs/mutators#purity)

### [Reading Data](https://zero.rocicorp.dev/docs/mutators\#reading-data)

You can read data within a mutator by passing [ZQL](https://zero.rocicorp.dev/docs/zql) to `tx.run`:

```
Copyconst updateIssue = defineMutator(
  z.object({id: z.string(), title: z.string()}),
  async ({tx, args: {id, title}}) => {
    const issue = await tx.run(
      zql.issue.where('id', id).one()
    )

    if (issue?.status === 'closed') {
      throw new Error(`Cannot update closed issue`)
    }

    await tx.mutate.issue.update({
      id,
      title
    })
  }
)
```

You have the full power of ZQL at your disposal, including relationships, filters, ordering, and limits.

Reads and writes within a mutator are transactional, meaning that the datastore is guaranteed to not change while your mutator is running. And if the mutator throws, the entire mutation is rolled back.

[🤔Reading in mutators is always local](https://zero.rocicorp.dev/docs/mutators#reading-in-mutators-is-always-local)

### [Context](https://zero.rocicorp.dev/docs/mutators\#context)

Mutator parameters are supplied by the client application and passed to the server automatically by Zero. This makes them unsuitable for credentials, since the user could modify them.

For this reason, Zero mutators also support the concept of a [`context` object](https://zero.rocicorp.dev/docs/auth#context).

Access your context with the `ctx` parameter to your mutator:

```
Copyconst createIssue = defineMutator(
  z.object({id: z.string(), title: z.string()}),
  async ({tx, ctx: {userID}, args: {id, title}}) => {
    // Note: User cannot control ctx.userID, so this
    // enforces authorship of created issue.
    await tx.mutate.issue.insert({
      id,
      title,
      authorID: userID
    })
  }
)
```

### [Mutator Registries](https://zero.rocicorp.dev/docs/mutators\#mutator-registries)

The result of `defineMutator` is a `MutatorDefinition`. By itself this isn't super useful. You need to register it using `defineMutators`:

```
Copyexport const mutators = defineMutators({
  issue: {
    update: updateIssue
  }
})
```

Typically these are done together in one step:

```
Copyexport const mutators = defineMutators({
  issue: {
    update: defineMutator(
      z.object({id: z.string(), title: z.string()}),
      async ({tx, args: {id, title}}) => {
        await tx.mutate.issue.update({
          id,
          title
        })
      }
    )
  }
})
```

The result of `defineMutators` is called a `MutatorRegistry`. Each field in the registry is a callable `Mutator` that you can use to perform mutations:

```
Copyimport {mutators} from 'mutators.ts'

zero.mutate(
  mutators.issue.update({
    id: 'issue-123',
    title: 'New title'
  })
)
```

### [Mutator Names](https://zero.rocicorp.dev/docs/mutators\#mutator-names)

Each `Mutator` has a `mutatorName` which is computed by `defineMutators`. When you run a mutator, Zero sends this name along with the arguments to your server to execute the [server-side](https://zero.rocicorp.dev/docs/mutators#server-setup) mutation.

```
Copyconsole.log(mutators.issue.update.mutatorName)
// "issue.update"
```

### [mutators.ts](https://zero.rocicorp.dev/docs/mutators\#mutatorsts)

By convention, mutators are listed in a central `mutators.ts` file. This allows them to be easily used on both the client and server:

```
Copyimport {defineMutators, defineMutator} from '@rocicorp/zero'
import {zql} from './schema.ts'
import {z} from 'zod'

export const mutators = defineMutators({
  posts: {
    create: defineMutator(
      z.object({
        id: z.string(),
        title: z.string()
      }),
      async ({
        tx,
        context: {userID},
        args: {id, title}
      }) => {
        await tx.mutate.post.insert({
          id,
          title,
          authorID: userID
        })
      }
    ),
    update: defineMutator(
      z.object({
        id: z.string(),
        title: z.string().optional()
      }),
      async ({
        tx,
        context: {userID},
        args: {id, title}
      }) => {
        const prev = await tx.run(
          zql.post.where('id', id).one()
        )
        if (prev?.authorID !== userID) {
          throw new Error(`Access denied`)
        }
        await tx.mutate.post.update({
          id,
          title,
          authorID: userID
        })
      }
    )
  }
})
```

You can use as many levels of nesting as you want to organize your mutators.

As your application grows, you can move mutators to different files to keep them organized:

```
Copy// posts.ts
export const postMutators = {
  create: defineMutator(
    z.object({
      id: z.string(),
      title: z.string(),
    }),
    async ({tx, context: {userID}, args: {id, title}}) => {
      await tx.mutate.post.insert({
        id,
        title,
        authorID: userID,
      })
    },
  ),
}

// user.ts
export const userMutators = {
  updateRole: defineMutator(
    z.object({
      role: z.string(),
    }),
    async ({tx, ctx: {userID}, args: {role}}) => {
      await tx.mutate.user.update({
        id: userID,
        role,
      })
    },
  ),
}

// mutators.ts
import {postMutators} from 'zero/mutators/posts.ts'
import {userMutators} from 'zero/mutators/users.ts'

export const mutators = defineMutators{{
  posts: postMutators,
  users: userMutators,
})
```

[⚠️Use \`defineMutators\` at top level only](https://zero.rocicorp.dev/docs/mutators#use-definemutators-at-top-level-only)

## [Registration](https://zero.rocicorp.dev/docs/mutators\#registration)

Before you can use your mutators, you need to register them with Zero:

ReactSolidJSTypeScript

```
Copyimport {ZeroProvider} from '@rocicorp/zero/react'
import type {ZeroOptions} from '@rocicorp/zero'
import {mutators} from 'zero/mutators.ts'

const opts: ZeroOptions = {
  // ... cacheURL, schema, etc.
  mutators
}

return (
  <ZeroProvider {...opts}>
    <App />
  </ZeroProvider>
)
```

[🪖Knowing is half the battle](https://zero.rocicorp.dev/docs/mutators#why-register)

## [Server Setup](https://zero.rocicorp.dev/docs/mutators\#server-setup)

In order for mutations to sync, you must provide an implementation of the `mutate` endpoint on your server. `zero-cache` calls this endpoint to process each mutation.

### [Registering the Endpoint](https://zero.rocicorp.dev/docs/mutators\#registering-the-endpoint)

Use [`ZERO_MUTATE_URL`](https://zero.rocicorp.dev/docs/zero-cache-config#mutate-url) to tell `zero-cache` where to find your `mutate` implementation:

```
Copyexport ZERO_MUTATE_URL="http://localhost:3000/api/zero/mutate"
# run zero-cache, e.g. `npx zero-cache-dev`
```

### [Implementing the Endpoint](https://zero.rocicorp.dev/docs/mutators\#implementing-the-endpoint)

The `@rocicorp/zero` package provides the `handleMutateRequest` and `mustGetMutator` functions to make it easy to implement the endpoint. Plug in whatever `dbProvider` you set up (see [server-zql](https://zero.rocicorp.dev/docs/server-zql) or the install guide).

Tanstack StartNext.jsSolid StartHono

```
Copy// src/routes/api/zero/mutate.ts
import {createFileRoute} from '@tanstack/react-router'
import {json} from '@tanstack/react-start'
import {handleMutateRequest} from '@rocicorp/zero/server'
import {mustGetMutator} from '@rocicorp/zero'
import {mutators} from 'mutators.ts'
import {dbProvider} from 'db-provider.ts'

export const Route = createFileRoute('/api/zero/mutate')({
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

[🤔Using a different bindings library](https://zero.rocicorp.dev/docs/mutators#using-a-different-bindings-library)

`handleMutateRequest` accepts a standard `Request` and returns a JSON object which can be serialized and returned by your server framework of choice.

`mustGetMutator` looks up the mutator in the registry and throws an error if not found.

The `mutator.fn` function is your mutator implementation wrapped in the validator you provided.

### [Handling Errors](https://zero.rocicorp.dev/docs/mutators\#handling-errors)

The `handleMutateRequest` function skips any mutations that throw:

```
Copyconst result = await handleMutateRequest(
  dbProvider,
  transact =>
    transact(async (tx, name, args) => {
      // The mutation is skipped and the next mutation runs as normal.
      // The optimistic mutation on the client will be reverted.
      throw new Error('bonk')
    }),
  c.req.raw
)
```

`handleMutateRequest` catches such errors and turns them into a structured response that gets sent back to the client. You can [recover the errors](https://zero.rocicorp.dev/docs/mutators#waiting-for-mutator-result) and show UI if you want.

It is also of course possible for the entire push endpoint to return an HTTP error, or to not reply at all:

Tanstack StartNext.jsSolid StartHono

```
Copyexport const Route = createFileRoute('/api/zero/mutate')({
  server: {
    handlers: {
      POST: async () => {
        throw new Error('zonk') // will trigger resend
      }
    }
  }
})
```

If Zero receives any response from the mutate endpoint other than HTTP 200, 401, or 403, it will disconnect and enter the [error state](https://zero.rocicorp.dev/docs/connection#errors).

If Zero receives HTTP 401 or 403, the client will enter the needs auth state and require a manual reconnect with `zero.connection.connect()`, then it will retry all queued mutations.

If you want a different behavior, it is possible to [implement the mutate endpoint](https://zero.rocicorp.dev/docs/mutators#custom-push-implementation) yourself and handle errors differently.

### [Custom Mutate URL](https://zero.rocicorp.dev/docs/mutators\#custom-mutate-url)

By default, Zero sends mutations to the URL specified in the `ZERO_MUTATE_URL` parameter.

However you can customize this on a per-client basis. To do so, list multiple comma-separated URLs in the `ZERO_MUTATE_URL` parameter:

```
Copyexport ZERO_MUTATE_URL="https://api.example.com/mutate,https://api.staging.example.com/mutate"
```

Then choose one of those URLs by passing it to `mutateURL` on the `Zero` constructor:

```
Copyconst opts: ZeroOptions = {
  // ...
  mutateURL: 'https://api.staging.example.com/mutate'
}
```

### [URL Patterns](https://zero.rocicorp.dev/docs/mutators\#url-patterns)

The strings listed in `ZERO_MUTATE_URL` can also be [`URLPatterns`](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API):

```
Copyexport ZERO_MUTATE_URL="https://mybranch-*.preview.myapp.com/mutate"
```

For more information, see the [URLPattern section of the Queries docs](https://zero.rocicorp.dev/docs/queries#url-patterns). It works the same way for mutations.

### [Server-Specific Code](https://zero.rocicorp.dev/docs/mutators\#server-specific-code)

To implement server-specific code, just run different mutators in your mutate endpoint. Server authority to the rescue!

`defineMutators` accepts a _baseMutators_ parameter that makes this easy. The returned mutator registry will contain all the mutators from _baseMutators_, plus any new ones you define or override:

```
Copy// server-mutators.ts
import {defineMutators, defineMutator} from '@rocicorp/zero'
import {z} from 'zod'
import {zql} from 'schema.ts'
import {mutators as sharedMutators} from 'mutators.ts'

export const serverMutators = defineMutators(
  sharedMutators,
  {
    posts: {
      // Overrides the shared mutator definition with same name.
      update: defineMutator(
        z.object({
          id: z.string(),
          title: z.string().optional(),
          priority: z.number().optional()
        }),
        async ({
          tx,
          ctx: {userID},
          args: {id, title, priority}
        }) => {
          // Run the shared mutator first.
          await sharedMutators.posts.update.fn({
            tx,
            ctx,
            args
          })

          // Record a history of this operation happening in an audit log table.
          await tx.mutate.auditLog.insert({
            issueId: id,
            action: 'update-title',
            timestamp: Date.getTime()
          })
        }
      )
    }
  }
)
```

For simple things, we also expose a `location` field on the transaction object that you can use to branch your code:

```
Copyconst myMutator = defineMutator(async ({tx}) => {
  if (tx.location === 'client') {
    // Client-side code
  } else {
    // Server-side code
  }
})
```

## [Running Mutators](https://zero.rocicorp.dev/docs/mutators\#running-mutators)

Once you have registered your mutators, you can invoke them with `zero.mutate`:

```
Copyimport {mutators} from 'mutators.ts'
import {nanoid} from 'nanoid'

zero.mutate(
  mutators.issue.update({
    id: nanoid(),
    title: 'New title'
  })
)
```

[🎲Client-generated random IDs recommended](https://zero.rocicorp.dev/docs/mutators#client-generated-random-ids-recommended)

### [Waiting for Results](https://zero.rocicorp.dev/docs/mutators\#waiting-for-results)

We typically recommend that you "fire and forget" mutators.

Optimistic mutations make sense when the common case is that a mutation succeeds. If a mutation frequently fails, then showing the user an optimistic result isn't very useful, because it will likely be wrong.

That said there are cases where it is nice to know when a write succeeded on either the client or server.

One example is if you need to read a row directly after writing it. Zero's local writes are very fast (almost always < 1 frame), but because Zero is backed by IndexedDB, writes are still _technically_ asynchronous and reads directly after a write may not return the new data.

You can use the `.client` promise in this case to wait for a write to complete on the client side:

```
Copyconst write = zero.mutate(
  mutators.issue.insert({
    id: nanoid(),
    title: 'New title'
  })
)

// issue-123 not guaranteed to be present here. read1 may be undefined.
const read1 = await zero.run(
  queries.issue.byId('issue-123').one()
)

// Await client write – almost always less than 1 frame, and same
// macrotask, so no browser paint will occur here.
const res = await write.client

if (res.type === 'error') {
  console.error('Mutator failed on client', res.error)
}

// issue-123 definitely can be read now.
const read2 = await zero.run(
  queries.issue.byId('issue-123').one()
)
```

You can also wait for the server write to succeed:

```
Copyconst write = zero.mutate(
  mutators.issue.insert({
    id: nanoid(),
    title: 'New title'
  })
)

const clientRes = await write.client
if (clientRes.type === 'error') {
  throw new Error(
    `Mutator failed on client`,
    clientRes.error
  )
}

// optimistic write guaranteed to be present here, but not
// server write.
const read1 = await zero.run(
  queries.issue.byId('issue-123').one()
)

// Await server write – this involves a round-trip.
const serverRes = await write.server
if (serverRes.type === 'error') {
  throw new Error(
    `Mutator failed on server`,
    serverRes.error
  )
}

// issue-123 is written to server and any results are
// synced to this client.
// read2 could potentially be undefined here, for example if the
// server mutator rejected the write.
const read2 = await zero.run(
  queries.issue.byId('issue-123').one()
)
```

If the client-side mutator fails, the `.server` promise is also rejected with the same error. You don't have to listen to both promises, the server promise covers both cases.

[🤔Returning data from mutators](https://zero.rocicorp.dev/docs/mutators#returning-data)

## [Permissions](https://zero.rocicorp.dev/docs/mutators\#permissions)

Because mutators are just normal TypeScript functions that run server-side, there is no need for a special permissions system. You can implement whatever permission checks you want using plain TypeScript code.

See [Permissions](https://zero.rocicorp.dev/docs/auth#permissions) for more information.

## [Dropping Down to Raw SQL](https://zero.rocicorp.dev/docs/mutators\#dropping-down-to-raw-sql)

The `ServerTransaction` interface has a `dbTransaction` property that exposes the underlying database connection. This allows you to run raw SQL queries directly against the database.

This is useful for complex queries, or for using Postgres features that Zero doesn't support yet:

```
Copyconst markAllAsRead = defineMutator(
  z.object({
    userId: z.string()
  }),
  async ({tx, args: {userId}}) => {
    // shared stuff ...

    if (tx.location === 'server') {
      // `tx` is now narrowed to `ServerTransaction`.
      // Do special server-only stuff with raw SQL.
      await tx.dbTransaction.query(
        `
      UPDATE notification
      SET read = true
      WHERE user_id = $1
    `,
        [userId]
      )
    }
  }
)
```

See [ZQL on the Server](https://zero.rocicorp.dev/docs/server-zql) for more information.

## [Notifications and Async Work](https://zero.rocicorp.dev/docs/mutators\#notifications-and-async-work)

The best way to handle notifications and async work is a [transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html). This ensures that notifications actually do eventually get sent, without holding open database transactions to talk over the network. This can be implemented very easily in Zero by writing notifications to an `outbox` table as part of your mutator, then processing that table periodically with a background job.

However sometimes it's still nice to do a quick and dirty async send as part of a mutation, for example early on in development, or to record metrics. For this, the `createMutators` pattern is useful:

```
Copy// server-mutators.ts
import {defineMutator} from '@rocicorp/zero'
import z from 'zod'
import {zql} from 'schema.ts'
import {mutators as clientMutators} from 'mutators.ts'

// Instead of defining server mutators as a constant,
// define them as a function of a list of async tasks.
export function createMutators(
  asyncTasks: Array<() => Promise<void>>
) {
  return defineMutators(clientMutators, {
    issue: {
      update: defineMutator(
        z.object({
          id: z.string(),
          title: z.string()
        }),
        async (tx, {id, title}) => {
          await tx.mutate.issue.update({id, title})
          asyncTasks.push(() => sendEmailToSubscribers(id))
        }
      )
    }
  })
}
```

Then in your mutate handler:

Tanstack StartNext.jsSolid StartHono

```
Copyexport const Route = createFileRoute('/api/zero/mutate')({
  server: {
    handlers: {
      POST: async ({request}) => {
        const asyncTasks: Array<() => Promise<void>> = []
        const mutators = createMutators(asyncTasks)

        const result = await handleMutateRequest(
          dbProvider,
          transact =>
            transact((tx, name, args) => {
              const mutator = mustGetMutator(mutators, name)
              return mutator.fn({
                tx,
                ctx: {userId: 'anon'},
                args
              })
            }),
          request
        )

        // Run all async tasks
        // If any fail, do not block the response, since the
        // mutation result has already been written to the database.
        await Promise.allSettled(
          asyncTasks.map(task => task())
        )
        return json(result)
      }
    }
  }
})
```

## [Custom Mutate Implementation](https://zero.rocicorp.dev/docs/mutators\#custom-mutate-implementation)

You can manually implement the mutate endpoint in any programming language.

This will be documented in the future, but you can refer to the [handleMutateRequest](https://github.com/rocicorp/mono/blob/main/packages/zero-server/src/process-mutations.ts) source code for an example for now.

[PreviousReading Data](https://zero.rocicorp.dev/docs/queries)

[NextZQL Reference](https://zero.rocicorp.dev/docs/zql)

### On this page

[Architecture](https://zero.rocicorp.dev/docs/mutators#architecture) [Life of a Mutation](https://zero.rocicorp.dev/docs/mutators#life-of-a-mutation) [Defining Mutators](https://zero.rocicorp.dev/docs/mutators#defining-mutators) [Basics](https://zero.rocicorp.dev/docs/mutators#basics) [Writing Data](https://zero.rocicorp.dev/docs/mutators#writing-data) [Insert](https://zero.rocicorp.dev/docs/mutators#insert) [Upsert](https://zero.rocicorp.dev/docs/mutators#upsert) [Update](https://zero.rocicorp.dev/docs/mutators#update) [Delete](https://zero.rocicorp.dev/docs/mutators#delete) [Arguments](https://zero.rocicorp.dev/docs/mutators#arguments) [Reading Data](https://zero.rocicorp.dev/docs/mutators#reading-data) [Context](https://zero.rocicorp.dev/docs/mutators#context) [Mutator Registries](https://zero.rocicorp.dev/docs/mutators#mutator-registries) [Mutator Names](https://zero.rocicorp.dev/docs/mutators#mutator-names) [mutators.ts](https://zero.rocicorp.dev/docs/mutators#mutatorsts) [Registration](https://zero.rocicorp.dev/docs/mutators#registration) [Server Setup](https://zero.rocicorp.dev/docs/mutators#server-setup) [Registering the Endpoint](https://zero.rocicorp.dev/docs/mutators#registering-the-endpoint) [Implementing the Endpoint](https://zero.rocicorp.dev/docs/mutators#implementing-the-endpoint) [Handling Errors](https://zero.rocicorp.dev/docs/mutators#handling-errors) [Custom Mutate URL](https://zero.rocicorp.dev/docs/mutators#custom-mutate-url) [URL Patterns](https://zero.rocicorp.dev/docs/mutators#url-patterns) [Server-Specific Code](https://zero.rocicorp.dev/docs/mutators#server-specific-code) [Running Mutators](https://zero.rocicorp.dev/docs/mutators#running-mutators) [Waiting for Results](https://zero.rocicorp.dev/docs/mutators#waiting-for-results) [Permissions](https://zero.rocicorp.dev/docs/mutators#permissions) [Dropping Down to Raw SQL](https://zero.rocicorp.dev/docs/mutators#dropping-down-to-raw-sql) [Notifications and Async Work](https://zero.rocicorp.dev/docs/mutators#notifications-and-async-work) [Custom Mutate Implementation](https://zero.rocicorp.dev/docs/mutators#custom-mutate-implementation)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/mutators.mdx)