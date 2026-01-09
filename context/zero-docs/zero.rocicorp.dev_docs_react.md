---
url: "https://zero.rocicorp.dev/docs/react"
title: "React"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# React  Copy markdown  \\# React  Zero has built-in support for React. Here's what basic usage looks like.  \\#\# Setup  Use the \`ZeroProvider\` component to setup Zero. It takes care of creating and destroying \`Zero\` instances reactively:  \`\`\`tsx import {createRoot} from 'react-dom/client' import {ZeroProvider} from '@rocicorp/zero/react' import {useSession} from 'my-session-provider' import App from './App.tsx' import {schema} from 'schema.ts' import {mutators} from 'mutators.ts'  const cacheURL = import.meta.env.VITE\_PUBLIC\_ZERO\_CACHE\_URL!  export default function Root() { const session = useSession() const {userID} = session const context = {userID}  return ( <ZeroProvider {...{userID, context, cacheURL, schema, mutators}} > <App /> </ZeroProvider> ) } \`\`\`  You can also pass a \`Zero\` instance to the \`ZeroProvider\` if you want to control the lifecycle of the \`Zero\` instance yourself:  \`\`\`tsx // ZeroProvider just sets up the context, it doesn't manage // the lifecycle of the Zero instance. <ZeroProvider zero={zero}> <App /> </ZeroProvider> \`\`\`  \\#\# Usage  Use \`useQuery\` to run queries:  \`\`\`tsx import {useQuery} from '@rocicorp/zero/react' import {queries} from 'queries.ts'  function Posts() { const \[posts\] = useQuery( queries.posts.byStatus({status: 'draft'}) )  return ( <> {posts.map(p => ( <div key={p.id}> {p.title} ({p.comments.length} comments) </div> ))} </> ) } \`\`\`  Use \`useZero\` to get access to the \`Zero\` instance, for example to run mutators:  \`\`\`tsx import {useZero} from '@rocicorp/zero/react' import {mutators} from 'mutators.ts'  function CompleteButton({issueID}: {issueID: string}) { const zero = useZero()  const onClick = () => { zero.mutate(mutators.issues.complete({id: issueID})) }  return <button onClick={onClick}>Complete Issue</button> } \`\`\`  \\#\# Suspense  The \`useSuspenseQuery\` hook is exactly like \`useQuery\`, except it supports React Suspense.  \`\`\`tsx const \[issues\] = useSuspenseQuery(issueQuery, { suspendUntil: 'complete' // 'partial' or 'complete' }) \`\`\`  Use the \`suspendUntil\` parameter to control how long to suspend for. The value \`complete\` suspends until authoritative results from the server are received. The \`partial\` value suspends until any non-empty data is received, or for a empty result that is \`complete\`.  \\#\# Examples  See \[the sample directory\](https://zero.rocicorp.dev/docs/samples) for more complete React examples.      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

Zero has built-in support for React. Here's what basic usage looks like.

## [Setup](https://zero.rocicorp.dev/docs/react\#setup)

Use the `ZeroProvider` component to setup Zero. It takes care of creating and destroying `Zero` instances reactively:

```
Copyimport {createRoot} from 'react-dom/client'
import {ZeroProvider} from '@rocicorp/zero/react'
import {useSession} from 'my-session-provider'
import App from './App.tsx'
import {schema} from 'schema.ts'
import {mutators} from 'mutators.ts'

const cacheURL = import.meta.env.VITE_PUBLIC_ZERO_CACHE_URL!

export default function Root() {
  const session = useSession()
  const {userID} = session
  const context = {userID}

  return (
    <ZeroProvider
      {...{userID, context, cacheURL, schema, mutators}}
    >
      <App />
    </ZeroProvider>
  )
}
```

You can also pass a `Zero` instance to the `ZeroProvider` if you want to control the lifecycle of the `Zero` instance yourself:

```
Copy// ZeroProvider just sets up the context, it doesn't manage
// the lifecycle of the Zero instance.
<ZeroProvider zero={zero}>
  <App />
</ZeroProvider>
```

## [Usage](https://zero.rocicorp.dev/docs/react\#usage)

Use `useQuery` to run queries:

```
Copyimport {useQuery} from '@rocicorp/zero/react'
import {queries} from 'queries.ts'

function Posts() {
  const [posts] = useQuery(
    queries.posts.byStatus({status: 'draft'})
  )

  return (
    <>
      {posts.map(p => (
        <div key={p.id}>
          {p.title} ({p.comments.length} comments)
        </div>
      ))}
    </>
  )
}
```

Use `useZero` to get access to the `Zero` instance, for example to run mutators:

```
Copyimport {useZero} from '@rocicorp/zero/react'
import {mutators} from 'mutators.ts'

function CompleteButton({issueID}: {issueID: string}) {
  const zero = useZero()

  const onClick = () => {
    zero.mutate(mutators.issues.complete({id: issueID}))
  }

  return <button onClick={onClick}>Complete Issue</button>
}
```

## [Suspense](https://zero.rocicorp.dev/docs/react\#suspense)

The `useSuspenseQuery` hook is exactly like `useQuery`, except it supports React Suspense.

```
Copyconst [issues] = useSuspenseQuery(issueQuery, {
  suspendUntil: 'complete' // 'partial' or 'complete'
})
```

Use the `suspendUntil` parameter to control how long to suspend for. The value `complete` suspends until authoritative results from the server are received. The `partial` value suspends until any non-empty data is received, or for a empty result that is `complete`.

## [Examples](https://zero.rocicorp.dev/docs/react\#examples)

See [the sample directory](https://zero.rocicorp.dev/docs/samples/) for more complete React examples.

[PreviousFeature Compatibility](https://zero.rocicorp.dev/docs/postgres-support)

[NextSolidJS](https://zero.rocicorp.dev/docs/solidjs)

### On this page

[Setup](https://zero.rocicorp.dev/docs/react#setup) [Usage](https://zero.rocicorp.dev/docs/react#usage) [Suspense](https://zero.rocicorp.dev/docs/react#suspense) [Examples](https://zero.rocicorp.dev/docs/react#examples)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/react.mdx)