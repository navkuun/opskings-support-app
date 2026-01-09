---
url: "https://zero.rocicorp.dev/docs/react-native"
title: "React Native"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# React Native  Copy markdown  \\# React Native  Zero has built-in support for React Native and Expo.  Usage is identical to \[React on the web\](https://zero.rocicorp.dev/docs/react), except you must provide a \`kvStore\` implementation. Choose the storage adapter you prefer:  For a complete example, see \[zslack\](https://zero.rocicorp.dev/docs/samples\#zslack).  \> 🤓 \*\*If you like speed…\*\*: \`op-sqlite\` is much faster than \`expo-sqlite\` but does not work with \[Expo Go\](https://expo.dev/go). However, it is supported with \`expo prebuild\` and development builds.      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

Zero has built-in support for React Native and Expo.

Usage is identical to [React on the web](https://zero.rocicorp.dev/docs/react), except you must provide a `kvStore` implementation.
Choose the storage adapter you prefer:

expo-sqliteop-sqlite

```
Copyimport {ZeroProvider} from '@rocicorp/zero/react'
import {expoSQLiteStoreProvider} from '@rocicorp/zero/expo-sqlite'

export function RootLayout() {
  return (
    <ZeroProvider
      // ...
      kvStore={
        // On native, use expo-sqlite; on web, use IndexedDB
        Platform.OS !== 'web'
          ? expoSQLiteStoreProvider()
          : 'idb'
      }
    >
      <App />
    </ZeroProvider>
  )
}
```

For a complete example, see [zslack](https://zero.rocicorp.dev/docs/samples#zslack).

[🤓If you like speed…](https://zero.rocicorp.dev/docs/react-native#if-you-like-speed)

[PreviousSolidJS](https://zero.rocicorp.dev/docs/solidjs)

[NextCommunity](https://zero.rocicorp.dev/docs/community)