---
url: "https://zero.rocicorp.dev/docs/auth"
title: "Authentication"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# Authentication  Copy markdown  \\# Authentication  Setting up auth in Zero apps has a few steps:  1\. Setting the \`userID\` on the client 2\. Sending credentials to the \[mutate\](https://zero.rocicorp.dev/docs/mutators) and \[queries\](https://zero.rocicorp.dev/docs/queries) endpoints 3\. Setting the \`Context\` type to implement permissions 4\. Logging out if desired  \\#\# Setting userID  Because multiple users can share the same browser, Zero requires that you provide a \`userID\` parameter on construction:  If the user is not logged in, just pass empty string or some other constant value:  \`\`\`ts const opts: ZeroOptions = { // ... userID: 'anon' } \`\`\`  Zero segregates the client-side storage for each user. This allows users to quickly switch between multiple users and accounts without resyncing.  \> 🧑‍🏫 \*\*\`userID\` is not a security boundary\*\*: All users that have access to a browser profile have access to the same IndexedDB instances. There is nothing that Zero can do about this – users can just open the folder where the data is stored and look inside it.  If you have more than one set of Zero data per-user (i.e., for different apps in the same domain), you can additionally use the \`storageKey\` parameter:  \`\`\`ts const opts: ZeroOptions = { // ... userID: 'user-123', storageKey: 'my-app' } \`\`\`  If specified, \`storageKey\` is concatenated along with \`userID\` and other internal Zero information to form a unique IndexedDB database name.  !\[Zero's IndexedDB databases are prefixed with 'rep' or 'replicache' because reasons.\](https://zero.rocicorp.dev/images/auth/indexeddb.png)  \\#\# Sending Credentials  You can send credentials using either cookies or tokens.  \\#\#\# Cookies  The most common way to authenticate Zero is with cookies.  To enable it, set the \[\`ZERO\_QUERY\_FORWARD\_COOKIES\`\](https://zero.rocicorp.dev/docs/zero-cache-config\#query-forward-cookies) and \[\`ZERO\_MUTATE\_FORWARD\_COOKIES\`\](https://zero.rocicorp.dev/docs/zero-cache-config\#mutate-forward-cookies) options to \`true\`:  \`\`\`bash export ZERO\_QUERY\_FORWARD\_COOKIES="true" export ZERO\_MUTATE\_FORWARD\_COOKIES="true" \\# run zero-cache, e.g. \`npx zero-cache-dev\` \`\`\`  Zero-cache will then forward all cookies sent to \`cacheURL\` to your \[mutate\](https://zero.rocicorp.dev/docs/mutators) and \[queries\](https://zero.rocicorp.dev/docs/queries) endpoints:  \`\`\`tsx const opts: ZeroOptions = { schema, // Cookies sent to zero.example.com will be forwarded to // api.example.com/mutate and api.example.com/queries. cacheURL: 'https://zero.example.com', mutateURL: 'https://api.example.com/mutate', queryURL: 'https://api.example.com/queries' } \`\`\`  Cookies will show up in the normal HTTP \`Cookie\` header and you can authenticate these endpoints just like you would any API request.  \\#\#\#\# Deployment  In order for cookie auth to work, the browser must send your frontend's cookies to \`zero-cache\`, so that \`zero-cache\` can forward them to your API.  During development, this works automatically as long as your frontend and \`zero-cache\` are both running on \`localhost\` with different ports. Browsers send cookies based on domain name, not port number, so cookies set by \`localhost:3000\` are also sent to \`localhost:4848\`.  For production you'll need to do two things:  1\. Run \`zero-cache\` on a subdomain of your main site (e.g., \`zero.example.com\` if your main site is \`example.com\`). Consult your hosting provider's docs, or your favorite LLM for how to configure this. 2\. Set cookies from your main site with the \`Domain\` attribute set to your root domain (e.g., \`.example.com\`). If you use a third-party auth provider, consult their docs on how to do this. For example, for Better Auth, this is done with the \[\`crossSubDomainCookies\`\](https://www.better-auth.com/docs/concepts/cookies\#cross-subdomain-cookies) feature.  \\#\#\# Tokens  Zero also supports token-based authentication.  If you have an opaque auth token, such as a JWT or a token from your auth provider, you can pass it to Zero's \`auth\` parameter:  \`\`\`ts const opts: ZeroOptions = { // ... auth: token } \`\`\`  Zero will forward this token to your \[mutate\](https://zero.rocicorp.dev/docs/mutators) and \[queries\](https://zero.rocicorp.dev/docs/queries) endpoints in an \`Authorization: Bearer <token>\` header, which you can use to authenticate the request as normal:  \`\`\`ts export async function handleMutate(request: Request) { const session = await authenticate( request.headers.get('Authorization') )  // handle mutate request ... } \`\`\`  \\#\# Auth Failure and Refresh  To mark a request as unauthorized, return a \`401\` or \`403\` status code from your \[queries\](https://zero.rocicorp.dev/docs/queries) or \[mutate\](https://zero.rocicorp.dev/docs/mutators) endpoint.  \`\`\`ts export async function handleMutate(request: Request) { const session = await authenticate( request.headers.get('Authorization') )  if (!session) { // can be 401 or 403 return json({error: 'Unauthorized'}, {status: 401}) }  // handle mutate request ... } \`\`\`  This will cause Zero to disconnect from \`zero-cache\` and the \[connection status\](https://zero.rocicorp.dev/docs/connection) will change to \`needs-auth\`. You can then re-authenticate the user and call \`zero.connection.connect()\` to reconnect to \`zero-cache\`:  \`\`\`tsx function NeedsAuthDialog() { const connectionState = useConnectionState()  const refreshCookie = async () => { await login() // no token needed since we use cookie auth zero.connection.connect() }  if (connectionState.name === 'needs-auth') { return ( <div> <h1>Authentication Required</h1> <button onClick={refreshCookie}>Login</button> </div> ) }  return null } \`\`\`  Or, if you aren't using cookie auth:  \`\`\`tsx function NeedsAuthDialog() { const connectionState = useConnectionState()  const refreshAuthToken = async () => { const token = await fetchNewToken() // pass a new token to reconnect to zero-cache zero.connection.connect({auth: token}) }  if (connectionState.name === 'needs-auth') { return ( <div> <h1>Authentication Required</h1> <button onClick={refreshAuthToken}>Login</button> </div> ) }  return null } \`\`\`  \\#\# Context  When a user is authenticated, you will want to know who they are in your \[queries\](https://zero.rocicorp.dev/docs/queries) and \[mutators\](https://zero.rocicorp.dev/docs/mutators) to enforce permissions.  To do this, define a \`Context\` type that includes the user's ID and any other relevant information, then register that type with Zero:  \`\`\`ts export type ZeroContext = { userID: string role: 'admin' \| 'user' }  declare module '@rocicorp/zero' { interface DefaultTypes { context: ZeroContext } } \`\`\`  Then pass an instance of this context when instantiating Zero:  \`\`\`tsx const opts: ZeroOptions = { // ... context: { userID: 'user-123', role: 'admin' } } \`\`\`  On the server-side, you will also pass an instance of this context when invoking your \[queries\](https://zero.rocicorp.dev/docs/queries\#implementing-the-endpoint) and \[mutators\](https://zero.rocicorp.dev/docs/mutators\#implementing-the-endpoint):  \`\`\`ts const query = mustGetQuery(queries, name) query.fn({args, ctx})  // or  const mutator = mustGetMutator(mutators, name) mutator.fn({tx, args, ctx}) \`\`\`  You can then access the context within your \[queries\](https://zero.rocicorp.dev/docs/queries\#context) and \[mutators\](https://zero.rocicorp.dev/docs/mutators\#context) to implement permissions.  \\#\# Permission Patterns  Zero does not have (or need) a first-class permission system like \[RLS\](https://supabase.com/docs/guides/database/postgres/row-level-security).  Instead, you implement permissions by authenticating the user in your \[queries\](https://zero.rocicorp.dev/docs/queries) and \[mutators\](https://zero.rocicorp.dev/docs/mutators) endpoints, and creating a \[Context\](\#context) object that contains the user's ID and other information. This context is passed to your queries and mutators and used to control what data the user can access.  Here are a collection of common permissions patterns and how to implement them in Zero.  \\#\#\# Read Permissions  \\#\#\#\# Only Owned Rows  \`\`\`ts // Use the context's \`userID\` to filter the rows to only the // ones owned by the user. const myPosts = defineQuery(({ctx: {userID}}) => { return zql.post.where('authorID', userID) }) \`\`\`  \\#\#\#\# Owned or Shared Rows  \`\`\`ts // Use the context's \`userID\` to filter the rows to only the // ones owned by the user or shared with the user. const allowedPosts = defineQuery(({ctx: {userID}}) => { return zql.post.where(({cmp, exists, or}) => or( cmp('authorID', userID), exists('sharedWith', q => q.where('userID', userID)) ) ) }) \`\`\`  \\#\#\#\# Owned Rows or All if Admin  \`\`\`ts const allowedPosts = defineQuery( ({ctx: {userID, role}}) => { if (role === 'admin') { return zql.post } return zql.post.where('authorID', userID) } ) \`\`\`  \\#\#\# Write Permissions  \\#\#\#\# Enforce Ownership  \`\`\`ts // All created items are owned by the user who created them. const createPost = defineMutator( z.object({ id: z.string(), title: z.string(), content: z.string() }), (tx, {ctx: {userID}, args: {id, title, content}}) => { return zql.post.insert({ id, title, content, authorID: userID }) } ) \`\`\`  \\#\#\#\# Edit Owned Rows  \`\`\`ts const updatePost = defineMutator( z.object({ id: z.string(), content: z.string().optional() }), (tx, {ctx: {userID}, args: {id, content}}) => { const prev = await tx.run( zql.post.where('id', id).one() ) if (!prev) { return } if (prev.authorID !== userID) { throw new Error('Access denied') } return zql.post.update({ id, content }) } ) \`\`\`  \\#\#\#\# Edit Owned or Shared Rows  \`\`\`ts const updatePost = defineMutator( z.object({ id: z.string(), content: z.string().optional() }), (tx, {ctx: {userID}, args: {id, content}}) => { const prev = await tx.run( zql.post .where('id', id) .related('sharedWith', q => q.where('userID', userID) ) .one() ) if (!prev) { return } if ( prev.authorID !== userID && prev.sharedWith.length === 0 ) { throw new Error('Access denied') } return zql.post.update({ id, content }) } ) \`\`\`  \\#\#\#\# Edit Owned or All if Admin  \`\`\`ts const updatePost = defineMutator( z.object({ id: z.string(), content: z.string().optional() }), (tx, {ctx: {role, userID}, args: {id, content}}) => { const prev = await tx.run( zql.post.where('id', id).one() ) if (!prev) { return } if (role !== 'admin' && prev.authorID !== userID) { throw new Error('Access denied') } return zql.post.update({ id, content }) } ) \`\`\`  \\#\# Logging Out  When a user logs out, you should consider what should happen to the synced data.  If you do nothing, the synced data will be left on the device. The next login will be a little faster because Zero doesn't have to resync that data from scratch. But also, the data will be left on the device indefinitely which could be undesirable for privacy and security.  If you instead want to clear data on logout, Zero provides the \`dropAllDatabases\` function:  \`\`\`ts import {dropAllDatabases} from '@rocicorp/zero'  // Returns an object with: // \- The names of the successfully dropped databases // \- Any errors encountered while dropping const {dropped, errors} = await dropAllDatabases() \`\`\`      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

Setting up auth in Zero apps has a few steps:

1. Setting the `userID` on the client
2. Sending credentials to the [mutate](https://zero.rocicorp.dev/docs/mutators) and [queries](https://zero.rocicorp.dev/docs/queries) endpoints
3. Setting the `Context` type to implement permissions
4. Logging out if desired

## [Setting userID](https://zero.rocicorp.dev/docs/auth\#setting-userid)

Because multiple users can share the same browser, Zero requires that you provide a `userID` parameter on construction:

ReactSolidJSTypeScript

```
Copyimport {ZeroProvider} from '@rocicorp/zero/react'
import type {ZeroOptions} from '@rocicorp/zero'

const opts: ZeroOptions = {
  // ...
  userID: 'user-123'
}

return (
  <ZeroProvider {...opts}>
    <App />
  </ZeroProvider>
)
```

If the user is not logged in, just pass empty string or some other constant value:

```
Copyconst opts: ZeroOptions = {
  // ...
  userID: 'anon'
}
```

Zero segregates the client-side storage for each user. This allows users to quickly switch between multiple users and accounts without resyncing.

[🧑‍🏫\`userID\` is not a security boundary](https://zero.rocicorp.dev/docs/auth#user-id-is-not-a-security-boundary)

If you have more than one set of Zero data per-user (i.e., for different apps in the same domain), you can additionally use the `storageKey` parameter:

```
Copyconst opts: ZeroOptions = {
  // ...
  userID: 'user-123',
  storageKey: 'my-app'
}
```

If specified, `storageKey` is concatenated along with `userID` and other internal Zero information to form a unique IndexedDB database name.

![Zero's IndexedDB databases are prefixed with 'rep' or 'replicache' because reasons.](https://zero.rocicorp.dev/images/auth/indexeddb.png)

Zero's IndexedDB databases are prefixed with 'rep' or 'replicache' because reasons.

## [Sending Credentials](https://zero.rocicorp.dev/docs/auth\#sending-credentials)

You can send credentials using either cookies or tokens.

### [Cookies](https://zero.rocicorp.dev/docs/auth\#cookies)

The most common way to authenticate Zero is with cookies.

To enable it, set the [`ZERO_QUERY_FORWARD_COOKIES`](https://zero.rocicorp.dev/docs/zero-cache-config#query-forward-cookies) and [`ZERO_MUTATE_FORWARD_COOKIES`](https://zero.rocicorp.dev/docs/zero-cache-config#mutate-forward-cookies) options to `true`:

```
Copyexport ZERO_QUERY_FORWARD_COOKIES="true"
export ZERO_MUTATE_FORWARD_COOKIES="true"
# run zero-cache, e.g. `npx zero-cache-dev`
```

Zero-cache will then forward all cookies sent to `cacheURL` to your [mutate](https://zero.rocicorp.dev/docs/mutators) and [queries](https://zero.rocicorp.dev/docs/queries) endpoints:

```
Copyconst opts: ZeroOptions = {
  schema,
  // Cookies sent to zero.example.com will be forwarded to
  // api.example.com/mutate and api.example.com/queries.
  cacheURL: 'https://zero.example.com',
  mutateURL: 'https://api.example.com/mutate',
  queryURL: 'https://api.example.com/queries'
}
```

Cookies will show up in the normal HTTP `Cookie` header and you can authenticate these endpoints just like you would any API request.

#### [Deployment](https://zero.rocicorp.dev/docs/auth\#deployment)

In order for cookie auth to work, the browser must send your frontend's cookies to `zero-cache`, so that `zero-cache` can forward them to your API.

During development, this works automatically as long as your frontend and `zero-cache` are both running on `localhost` with different ports. Browsers send cookies based on domain name, not port number, so cookies set by `localhost:3000` are also sent to `localhost:4848`.

For production you'll need to do two things:

1. Run `zero-cache` on a subdomain of your main site (e.g., `zero.example.com` if your main site is `example.com`). Consult your hosting provider's docs, or your favorite LLM for how to configure this.
2. Set cookies from your main site with the `Domain` attribute set to your root domain (e.g., `.example.com`). If you use a third-party auth provider, consult their docs on how to do this. For example, for Better Auth, this is done with the [`crossSubDomainCookies`](https://www.better-auth.com/docs/concepts/cookies#cross-subdomain-cookies) feature.

### [Tokens](https://zero.rocicorp.dev/docs/auth\#tokens)

Zero also supports token-based authentication.

If you have an opaque auth token, such as a JWT or a token from your auth provider, you can pass it to Zero's `auth` parameter:

```
Copyconst opts: ZeroOptions = {
  // ...
  auth: token
}
```

Zero will forward this token to your [mutate](https://zero.rocicorp.dev/docs/mutators) and [queries](https://zero.rocicorp.dev/docs/queries) endpoints in an `Authorization: Bearer <token>` header, which you can use to authenticate the request as normal:

```
Copyexport async function handleMutate(request: Request) {
  const session = await authenticate(
    request.headers.get('Authorization')
  )

  // handle mutate request ...
}
```

## [Auth Failure and Refresh](https://zero.rocicorp.dev/docs/auth\#auth-failure-and-refresh)

To mark a request as unauthorized, return a `401` or `403` status code from your [queries](https://zero.rocicorp.dev/docs/queries) or [mutate](https://zero.rocicorp.dev/docs/mutators) endpoint.

```
Copyexport async function handleMutate(request: Request) {
  const session = await authenticate(
    request.headers.get('Authorization')
  )

  if (!session) {
    // can be 401 or 403
    return json({error: 'Unauthorized'}, {status: 401})
  }

  // handle mutate request ...
}
```

This will cause Zero to disconnect from `zero-cache` and the [connection status](https://zero.rocicorp.dev/docs/connection) will change to `needs-auth`. You can then re-authenticate the user and call `zero.connection.connect()` to reconnect to `zero-cache`:

```
Copyfunction NeedsAuthDialog() {
  const connectionState = useConnectionState()

  const refreshCookie = async () => {
    await login()
    // no token needed since we use cookie auth
    zero.connection.connect()
  }

  if (connectionState.name === 'needs-auth') {
    return (
      <div>
        <h1>Authentication Required</h1>
        <button onClick={refreshCookie}>Login</button>
      </div>
    )
  }

  return null
}
```

Or, if you aren't using cookie auth:

```
Copyfunction NeedsAuthDialog() {
  const connectionState = useConnectionState()

  const refreshAuthToken = async () => {
    const token = await fetchNewToken()
    // pass a new token to reconnect to zero-cache
    zero.connection.connect({auth: token})
  }

  if (connectionState.name === 'needs-auth') {
    return (
      <div>
        <h1>Authentication Required</h1>
        <button onClick={refreshAuthToken}>Login</button>
      </div>
    )
  }

  return null
}
```

## [Context](https://zero.rocicorp.dev/docs/auth\#context)

When a user is authenticated, you will want to know who they are in your [queries](https://zero.rocicorp.dev/docs/queries) and [mutators](https://zero.rocicorp.dev/docs/mutators) to enforce permissions.

To do this, define a `Context` type that includes the user's ID and any other relevant information, then register that type with Zero:

```
Copyexport type ZeroContext = {
  userID: string
  role: 'admin' | 'user'
}

declare module '@rocicorp/zero' {
  interface DefaultTypes {
    context: ZeroContext
  }
}
```

Then pass an instance of this context when instantiating Zero:

```
Copyconst opts: ZeroOptions = {
  // ...
  context: {
    userID: 'user-123',
    role: 'admin'
  }
}
```

On the server-side, you will also pass an instance of this context when invoking your [queries](https://zero.rocicorp.dev/docs/queries#implementing-the-endpoint) and [mutators](https://zero.rocicorp.dev/docs/mutators#implementing-the-endpoint):

```
Copyconst query = mustGetQuery(queries, name)
query.fn({args, ctx})

// or

const mutator = mustGetMutator(mutators, name)
mutator.fn({tx, args, ctx})
```

You can then access the context within your [queries](https://zero.rocicorp.dev/docs/queries#context) and [mutators](https://zero.rocicorp.dev/docs/mutators#context) to implement permissions.

## [Permission Patterns](https://zero.rocicorp.dev/docs/auth\#permission-patterns)

Zero does not have (or need) a first-class permission system like [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

Instead, you implement permissions by authenticating the user in your [queries](https://zero.rocicorp.dev/docs/queries) and [mutators](https://zero.rocicorp.dev/docs/mutators) endpoints, and creating a [Context](https://zero.rocicorp.dev/docs/auth#context) object that contains the user's ID and other information. This context is passed to your queries and mutators and used to control what data the user can access.

Here are a collection of common permissions patterns and how to implement them in Zero.

### [Read Permissions](https://zero.rocicorp.dev/docs/auth\#read-permissions)

#### [Only Owned Rows](https://zero.rocicorp.dev/docs/auth\#only-owned-rows)

```
Copy// Use the context's `userID` to filter the rows to only the
// ones owned by the user.
const myPosts = defineQuery(({ctx: {userID}}) => {
  return zql.post.where('authorID', userID)
})
```

#### [Owned or Shared Rows](https://zero.rocicorp.dev/docs/auth\#owned-or-shared-rows)

```
Copy// Use the context's `userID` to filter the rows to only the
// ones owned by the user or shared with the user.
const allowedPosts = defineQuery(({ctx: {userID}}) => {
  return zql.post.where(({cmp, exists, or}) =>
    or(
      cmp('authorID', userID),
      exists('sharedWith', q => q.where('userID', userID))
    )
  )
})
```

#### [Owned Rows or All if Admin](https://zero.rocicorp.dev/docs/auth\#owned-rows-or-all-if-admin)

```
Copyconst allowedPosts = defineQuery(
  ({ctx: {userID, role}}) => {
    if (role === 'admin') {
      return zql.post
    }
    return zql.post.where('authorID', userID)
  }
)
```

### [Write Permissions](https://zero.rocicorp.dev/docs/auth\#write-permissions)

#### [Enforce Ownership](https://zero.rocicorp.dev/docs/auth\#enforce-ownership)

```
Copy// All created items are owned by the user who created them.
const createPost = defineMutator(
  z.object({
    id: z.string(),
    title: z.string(),
    content: z.string()
  }),
  (tx, {ctx: {userID}, args: {id, title, content}}) => {
    return zql.post.insert({
      id,
      title,
      content,
      authorID: userID
    })
  }
)
```

#### [Edit Owned Rows](https://zero.rocicorp.dev/docs/auth\#edit-owned-rows)

```
Copyconst updatePost = defineMutator(
  z.object({
    id: z.string(),
    content: z.string().optional()
  }),
  (tx, {ctx: {userID}, args: {id, content}}) => {
    const prev = await tx.run(
      zql.post.where('id', id).one()
    )
    if (!prev) {
      return
    }
    if (prev.authorID !== userID) {
      throw new Error('Access denied')
    }
    return zql.post.update({
      id,
      content
    })
  }
)
```

#### [Edit Owned or Shared Rows](https://zero.rocicorp.dev/docs/auth\#edit-owned-or-shared-rows)

```
Copyconst updatePost = defineMutator(
  z.object({
    id: z.string(),
    content: z.string().optional()
  }),
  (tx, {ctx: {userID}, args: {id, content}}) => {
    const prev = await tx.run(
      zql.post
        .where('id', id)
        .related('sharedWith', q =>
          q.where('userID', userID)
        )
        .one()
    )
    if (!prev) {
      return
    }
    if (
      prev.authorID !== userID &&
      prev.sharedWith.length === 0
    ) {
      throw new Error('Access denied')
    }
    return zql.post.update({
      id,
      content
    })
  }
)
```

#### [Edit Owned or All if Admin](https://zero.rocicorp.dev/docs/auth\#edit-owned-or-all-if-admin)

```
Copyconst updatePost = defineMutator(
  z.object({
    id: z.string(),
    content: z.string().optional()
  }),
  (tx, {ctx: {role, userID}, args: {id, content}}) => {
    const prev = await tx.run(
      zql.post.where('id', id).one()
    )
    if (!prev) {
      return
    }
    if (role !== 'admin' && prev.authorID !== userID) {
      throw new Error('Access denied')
    }
    return zql.post.update({
      id,
      content
    })
  }
)
```

## [Logging Out](https://zero.rocicorp.dev/docs/auth\#logging-out)

When a user logs out, you should consider what should happen to the synced data.

If you do nothing, the synced data will be left on the device. The next login will be a little faster because Zero doesn't have to resync that data from scratch. But also, the data will be left on the device indefinitely which could be undesirable for privacy and security.

If you instead want to clear data on logout, Zero provides the `dropAllDatabases` function:

```
Copyimport {dropAllDatabases} from '@rocicorp/zero'

// Returns an object with:
// - The names of the successfully dropped databases
// - Any errors encountered while dropping
const {dropped, errors} = await dropAllDatabases()
```

[PreviousSchema](https://zero.rocicorp.dev/docs/schema)

[NextReading Data](https://zero.rocicorp.dev/docs/queries)

### On this page

[Setting userID](https://zero.rocicorp.dev/docs/auth#setting-userid) [Sending Credentials](https://zero.rocicorp.dev/docs/auth#sending-credentials) [Cookies](https://zero.rocicorp.dev/docs/auth#cookies) [Deployment](https://zero.rocicorp.dev/docs/auth#deployment) [Tokens](https://zero.rocicorp.dev/docs/auth#tokens) [Auth Failure and Refresh](https://zero.rocicorp.dev/docs/auth#auth-failure-and-refresh) [Context](https://zero.rocicorp.dev/docs/auth#context) [Permission Patterns](https://zero.rocicorp.dev/docs/auth#permission-patterns) [Read Permissions](https://zero.rocicorp.dev/docs/auth#read-permissions) [Only Owned Rows](https://zero.rocicorp.dev/docs/auth#only-owned-rows) [Owned or Shared Rows](https://zero.rocicorp.dev/docs/auth#owned-or-shared-rows) [Owned Rows or All if Admin](https://zero.rocicorp.dev/docs/auth#owned-rows-or-all-if-admin) [Write Permissions](https://zero.rocicorp.dev/docs/auth#write-permissions) [Enforce Ownership](https://zero.rocicorp.dev/docs/auth#enforce-ownership) [Edit Owned Rows](https://zero.rocicorp.dev/docs/auth#edit-owned-rows) [Edit Owned or Shared Rows](https://zero.rocicorp.dev/docs/auth#edit-owned-or-shared-rows) [Edit Owned or All if Admin](https://zero.rocicorp.dev/docs/auth#edit-owned-or-all-if-admin) [Logging Out](https://zero.rocicorp.dev/docs/auth#logging-out)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/auth.mdx)