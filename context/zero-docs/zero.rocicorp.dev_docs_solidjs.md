---
url: "https://zero.rocicorp.dev/docs/solidjs"
title: "SolidJS"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# SolidJS  Copy markdown  \\# SolidJS  Zero has built-in support for Solid. Here’s what basic usage looks like:  \\#\# Setup  Use the \`ZeroProvider\` component to setup Zero. It takes care of creating and destroying \`Zero\` instances reactively:  \`\`\`tsx import {ZeroProvider} from '@rocicorp/zero/solid' import {useSession} from 'my-auth-provider' import App from 'App.tsx' import {schema} from 'schema.ts' import {mutators} from 'mutators.ts'  const cacheURL = import.meta.env.VITE\_PUBLIC\_ZERO\_CACHE\_URL!  function Root() { const session = useSession() const {userID} = session const context = {userID}  return ( <ZeroProvider {...{userID, context, cacheURL, schema, mutators}} > <App /> </ZeroProvider> ) } \`\`\`  You can also pass a \`Zero\` instance to the \`ZeroProvider\` if you want to control the lifecycle of the \`Zero\` instance yourself:  \`\`\`tsx // ZeroProvider just sets up the context, it doesn't manage // the lifecycle of the Zero instance. <ZeroProvider zero={zero}> <App /> </ZeroProvider> \`\`\`  \\#\# Usage  Use \`useQuery\` to run queries:  \`\`\`tsx import {useQuery} from '@rocicorp/zero/solid' import {queries} from 'queries.ts'  function App() { const \[posts\] = useQuery(() => queries.posts.byStatus({status: 'draft'}) )  return ( <For each={posts()}> {post => ( <div key={post.id}> {post.title} - ({post.comments.length} comments) </div> )} </For> ) } \`\`\`  Use \`useZero\` to get access to the \`Zero\` instance, for example to run mutators:  \`\`\`tsx import {useZero} from '@rocicorp/zero/solid' import {mutators} from 'mutators.ts'  function CompleteButton({issueID}: {issueID: string}) { const zero = useZero()  const onClick = () => { zero().mutate(mutators.issues.complete({id: issueID})) }  return <button onClick={onClick}>Complete Issue</button> } \`\`\`  \\#\# Examples  See the complete quickstart here:  \[https://github.com/rocicorp/hello-zero-solid\](https://github.com/rocicorp/hello-zero-solid)      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

Zero has built-in support for Solid. Here’s what basic usage looks like:

## [Setup](https://zero.rocicorp.dev/docs/solidjs\#setup)

Use the `ZeroProvider` component to setup Zero. It takes care of creating and destroying `Zero` instances reactively:

```
Copyimport {ZeroProvider} from '@rocicorp/zero/solid'
import {useSession} from 'my-auth-provider'
import App from 'App.tsx'
import {schema} from 'schema.ts'
import {mutators} from 'mutators.ts'

const cacheURL = import.meta.env.VITE_PUBLIC_ZERO_CACHE_URL!

function Root() {
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

## [Usage](https://zero.rocicorp.dev/docs/solidjs\#usage)

Use `useQuery` to run queries:

```
Copyimport {useQuery} from '@rocicorp/zero/solid'
import {queries} from 'queries.ts'

function App() {
  const [posts] = useQuery(() =>
    queries.posts.byStatus({status: 'draft'})
  )

  return (
    <For each={posts()}>
      {post => (
        <div key={post.id}>
          {post.title} - ({post.comments.length} comments)
        </div>
      )}
    </For>
  )
}
```

Use `useZero` to get access to the `Zero` instance, for example to run mutators:

```
Copyimport {useZero} from '@rocicorp/zero/solid'
import {mutators} from 'mutators.ts'

function CompleteButton({issueID}: {issueID: string}) {
  const zero = useZero()

  const onClick = () => {
    zero().mutate(mutators.issues.complete({id: issueID}))
  }

  return <button onClick={onClick}>Complete Issue</button>
}
```

## [Examples](https://zero.rocicorp.dev/docs/solidjs\#examples)

See the complete quickstart here:

[https://github.com/rocicorp/hello-zero-solid](https://github.com/rocicorp/hello-zero-solid)

[PreviousReact](https://zero.rocicorp.dev/docs/react)

[NextReact Native](https://zero.rocicorp.dev/docs/react-native)

### On this page

[Setup](https://zero.rocicorp.dev/docs/solidjs#setup) [Usage](https://zero.rocicorp.dev/docs/solidjs#usage) [Examples](https://zero.rocicorp.dev/docs/solidjs#examples)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/solidjs.mdx)