---
url: "https://zero.rocicorp.dev/docs/connection"
title: "Connection Status"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# Connection Status  Copy markdown  \\# Connection Status  \\#\# Overview  Zero manages a persistent connection to \`zero-cache\` with the following lifecycle:  !\[Zero's connection lifecycle\](https://zero.rocicorp.dev/images/connection-state/lifecycle.png)  \\#\# Usage  The current connection state is available in the \`zero.connection.state\` property. This is subscribable and also has reactive hooks for React and SolidJS:  \\#\# Details  \\#\#\# Connecting  Zero starts in the \`connecting\` state. Once the connection is established, it transitions to \`connected\`.  While \`connecting\`, Zero repeatedly tries to connect to \`zero-cache\` for 1 minute by default. This timeout can be configured with the \`disconnectTimeoutMs\` constructor parameter:  \`\`\`tsx const opts: ZeroOptions = { // ... disconnectTimeoutMs: 1000 \* 60 \* 10 // 10 minutes } \`\`\`  Reads and writes are allowed to Zero mutators while \`connecting\`. The writes are queued and will be sent when the connection succeeds.  This is intended to paper over short connectivity glitches, such as server restarts, walking into an elevator, etc.  \> 🦖 \*\*Zero is not designed for long periods offline\*\*: While you can increase the \`disconnectTimeoutMs\` to allow for longer periods of offline operation, this has caveats that you should understand carefully. Please see \[offline\](\#offline-support) for more information.  \\#\#\# Disconnecting  After the \`disconnectTimeoutMs\` elapses, Zero transitions to \`disconnected\`.  While \`disconnected\`, Zero continues to try to reconnect to \`zero-cache\` every 5 seconds.  Reads are allowed while \`disconnected\`, but writes are not.  \\#\#\# Errors  If \`zero-cache\` itself crashes, or if the \[mutate\](https://zero.rocicorp.dev/docs/mutators) or \[query\](https://zero.rocicorp.dev/docs/queries) endpoints return a network or HTTP error, Zero transitions to the \`error\` state.  This type of error is unlikely to resolve just by retrying, so Zero doesn't try. The app can retry the connection manually by calling \`zero.connection.connect()\`.  \\#\#\# Auth Required  If the \[mutate\](https://zero.rocicorp.dev/docs/mutators) or \[query\](https://zero.rocicorp.dev/docs/queries) endpoints return a 401 or 403 status code, Zero transitions to the \`needs-auth\` state.  The app should refresh the cookie or auth token and retry the connection manually by calling \`zero.connection.connect()\`.  See \[Authentication\](https://zero.rocicorp.dev/docs/auth\#auth-failure-and-refresh) for more information.  \\#\# Offline Support  While in the \`connecting\` state, Zero queues writes and replays them when the connection succeeds.  This works well for short periods offline, but not long periods for several reasons.  \\#\#\# Conflicts  Imagine two users are editing an article about cats. One goes offline and does a bunch of work on the article, while the other decides that the article should actually be about dogs and rewrites it. When the offline user reconnects, there is no way that any software algorithm can automatically resolve their conflict. One or the other of them is going to be upset.  While this example may sound extreme, you can construct similar situations with the majority of common applications.  Just take your own application and ask yourself what should really happen if one user takes their device offline for a week and makes arbitrarily complex changes while other users are working online.  If you want to build an application that supports offline writes, you have three options:  1\. Make the logical datamodel append-only (i.e., users can create and mark tasks done, but cannot edit or delete them). 2\. Support custom UX to allow users to fork and merge conflicts when they occur. 3\. Only support editing from a single device. Even a single-user application can experience conflicts as soon as there are multiple \*devices\*.  \\#\#\# Writes Can be Lost Across Schema Changes  Typically when a write happens while offline, it is written to local storage and replayed on next connection – even across app restarts.  However, if that app restart gets a new version of Zero, or a new schema version, Zero creates a new local storage area and the offline write is effectively lost.  In \[Replicache\](https://replicache.dev/), our prior sync engine on which Zero is based, this was solved with a system called "mutation recovery" that rescued these mutations from prior schema/Zero versions. This system has not yet been ported to Zero.  \\#\#\# Startup Can be Slow When Replaying Writes  When Zero starts, it sends all queued mutations to the server and simultaneously pulls updates from the server. When the server updates are applied, any queued mutations are "rebased" (re-run locally) to resolve conflicts.  If there are many locally queued changes, this process can be slow.  To effectively support long periods offline, Zero should probably have a mode where it first sends all queued mutations, then replays them after the server updates are applied. But this would conflict with the goal to startup and get server updates fast when there \*aren't\* many queued mutations, so some work would be needed to balance these two goals.  \\#\#\# Offline Mutations Must Never Be Rejected  When a mutator throws an error on the server, the \`handleMutateRequest\` function in \`@rocicorp/zero/server\` returns the error to the client but marks the mutation processed.  This is a good UX and DX when online because it mirrors the behavior of normal web apps.  When offline, mutations should never be rejected. Otherwise the user could lose arbitrarily large amounts of work. Mutations should be replayed until they can be accepted.  This would require a different implementation of the \`handleMutateRequest\`. Also the developer would have to be very careful to respond to any erroring mutations quickly, as those clients will be unable to save work until the error is resolved.      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

## [Overview](https://zero.rocicorp.dev/docs/connection\#overview)

Zero manages a persistent connection to `zero-cache` with the following lifecycle:

![Zero's connection lifecycle](https://zero.rocicorp.dev/images/connection-state/lifecycle.png)

Zero's connection lifecycle

## [Usage](https://zero.rocicorp.dev/docs/connection\#usage)

The current connection state is available in the `zero.connection.state` property. This is subscribable and also has reactive hooks for React and SolidJS:

ReactSolidJSTypeScript

```
Copyimport {useConnectionState} from '@rocicorp/zero/react'

function ConnectionStatus() {
  const state = useConnectionState()

  switch (state.name) {
    case 'connecting':
      return <div title={state.reason}>Connecting...</div>
    case 'connected':
      return <div>Connected</div>
    case 'disconnected':
      return <div title={state.reason}>Offline</div>
    case 'error':
      return <div title={state.reason}>Error</div>
    case 'needs-auth':
      return <div>Session expired</div>
    default:
      return null
  }
}
```

## [Details](https://zero.rocicorp.dev/docs/connection\#details)

### [Connecting](https://zero.rocicorp.dev/docs/connection\#connecting)

Zero starts in the `connecting` state. Once the connection is established, it transitions to `connected`.

While `connecting`, Zero repeatedly tries to connect to `zero-cache` for 1 minute by default. This timeout can be configured with the `disconnectTimeoutMs` constructor parameter:

```
Copyconst opts: ZeroOptions = {
  // ...
  disconnectTimeoutMs: 1000 * 60 * 10 // 10 minutes
}
```

Reads and writes are allowed to Zero mutators while `connecting`. The writes are queued and will be sent when the connection succeeds.

This is intended to paper over short connectivity glitches, such as server restarts, walking into an elevator, etc.

[🦖Zero is not designed for long periods offline](https://zero.rocicorp.dev/docs/connection#offline-warning)

### [Disconnecting](https://zero.rocicorp.dev/docs/connection\#disconnecting)

After the `disconnectTimeoutMs` elapses, Zero transitions to `disconnected`.

While `disconnected`, Zero continues to try to reconnect to `zero-cache` every 5 seconds.

Reads are allowed while `disconnected`, but writes are not.

### [Errors](https://zero.rocicorp.dev/docs/connection\#errors)

If `zero-cache` itself crashes, or if the [mutate](https://zero.rocicorp.dev/docs/mutators) or [query](https://zero.rocicorp.dev/docs/queries) endpoints return a network or HTTP error, Zero transitions to the `error` state.

This type of error is unlikely to resolve just by retrying, so Zero doesn't try. The app can retry the connection manually by calling `zero.connection.connect()`.

### [Auth Required](https://zero.rocicorp.dev/docs/connection\#auth-required)

If the [mutate](https://zero.rocicorp.dev/docs/mutators) or [query](https://zero.rocicorp.dev/docs/queries) endpoints return a 401 or 403 status code, Zero transitions to the `needs-auth` state.

The app should refresh the cookie or auth token and retry the connection manually by calling `zero.connection.connect()`.

See [Authentication](https://zero.rocicorp.dev/docs/auth#auth-failure-and-refresh) for more information.

## [Offline Support](https://zero.rocicorp.dev/docs/connection\#offline-support)

While in the `connecting` state, Zero queues writes and replays them when the connection succeeds.

This works well for short periods offline, but not long periods for several reasons.

### [Conflicts](https://zero.rocicorp.dev/docs/connection\#conflicts)

Imagine two users are editing an article about cats. One goes offline and does a bunch of work on the article, while the other decides that the article should actually be about dogs and rewrites it. When the offline user reconnects, there is no way that any software algorithm can automatically resolve their conflict. One or the other of them is going to be upset.

While this example may sound extreme, you can construct similar situations with the majority of common applications.

Just take your own application and ask yourself what should really happen if one user takes their device offline for a week and makes arbitrarily complex changes while other users are working online.

If you want to build an application that supports offline writes, you have three options:

1. Make the logical datamodel append-only (i.e., users can create and mark tasks done, but cannot edit or delete them).
2. Support custom UX to allow users to fork and merge conflicts when they occur.
3. Only support editing from a single device. Even a single-user application can experience conflicts as soon as there are multiple _devices_.

### [Writes Can be Lost Across Schema Changes](https://zero.rocicorp.dev/docs/connection\#writes-can-be-lost-across-schema-changes)

Typically when a write happens while offline, it is written to local storage and replayed on next connection – even across app restarts.

However, if that app restart gets a new version of Zero, or a new schema version, Zero creates a new local storage area and the offline write is effectively lost.

In [Replicache](https://replicache.dev/), our prior sync engine on which Zero is based, this was solved with a system called "mutation recovery" that rescued these mutations from prior schema/Zero versions. This system has not yet been ported to Zero.

### [Startup Can be Slow When Replaying Writes](https://zero.rocicorp.dev/docs/connection\#startup-can-be-slow-when-replaying-writes)

When Zero starts, it sends all queued mutations to the server and simultaneously pulls updates from the server. When the server updates are applied, any queued mutations are "rebased" (re-run locally) to resolve conflicts.

If there are many locally queued changes, this process can be slow.

To effectively support long periods offline, Zero should probably have a mode where it first sends all queued mutations, then replays them after the server updates are applied. But this would conflict with the goal to startup and get server updates fast when there _aren't_ many queued mutations, so some work would be needed to balance these two goals.

### [Offline Mutations Must Never Be Rejected](https://zero.rocicorp.dev/docs/connection\#offline-mutations-must-never-be-rejected)

When a mutator throws an error on the server, the `handleMutateRequest` function in `@rocicorp/zero/server` returns the error to the client but marks the mutation processed.

This is a good UX and DX when online because it mirrors the behavior of normal web apps.

When offline, mutations should never be rejected. Otherwise the user could lose arbitrarily large amounts of work. Mutations should be replayed until they can be accepted.

This would require a different implementation of the `handleMutateRequest`. Also the developer would have to be very careful to respond to any erroring mutations quickly, as those clients will be unable to save work until the error is resolved.

[PreviousZQL on the Server](https://zero.rocicorp.dev/docs/server-zql)

[NextProvider Support](https://zero.rocicorp.dev/docs/connecting-to-postgres)

### On this page

[Overview](https://zero.rocicorp.dev/docs/connection#overview) [Usage](https://zero.rocicorp.dev/docs/connection#usage) [Details](https://zero.rocicorp.dev/docs/connection#details) [Connecting](https://zero.rocicorp.dev/docs/connection#connecting) [Disconnecting](https://zero.rocicorp.dev/docs/connection#disconnecting) [Errors](https://zero.rocicorp.dev/docs/connection#errors) [Auth Required](https://zero.rocicorp.dev/docs/connection#auth-required) [Offline Support](https://zero.rocicorp.dev/docs/connection#offline-support) [Conflicts](https://zero.rocicorp.dev/docs/connection#conflicts) [Writes Can be Lost Across Schema Changes](https://zero.rocicorp.dev/docs/connection#writes-can-be-lost-across-schema-changes) [Startup Can be Slow When Replaying Writes](https://zero.rocicorp.dev/docs/connection#startup-can-be-slow-when-replaying-writes) [Offline Mutations Must Never Be Rejected](https://zero.rocicorp.dev/docs/connection#offline-mutations-must-never-be-rejected)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/connection.mdx)