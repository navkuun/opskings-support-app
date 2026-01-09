---
url: "https://zero.rocicorp.dev/docs/status"
title: "Project Status"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# Project Status  Copy markdown  \\# Project Status  \> 🚧 \*\*Zero is in Alpha\*\*: Zero is a new sync engine based on a novel streaming query engine. This is an ambitious project at an early stage. > \> You will encounter bugs. You may encounter pathologically slow queries. You are likely to encounter situations where ZQL is not powerful enough to express the query you want. > \> That said, we are building Zero live. It has been running \[our own bug tracker\](https://zbugs.rocicorp.dev) for months, and is used in production by a small set of customer applications that are an extremely good fit. > \> This page describes the current state of Zero at a high level. To understand whether Zero makes sense for you, please also see \[When to Use Zero\](https://zero.rocicorp.dev/docs/when-to-use).  \\#\# Platforms and Frameworks  \\* \[React\](https://zero.rocicorp.dev/docs/react), \[React Native\](https://zero.rocicorp.dev/docs/react-native), and \[SolidJS\](https://zero.rocicorp.dev/docs/solidjs) are fully supported. \\* \[Svelte and Vue\](https://zero.rocicorp.dev/docs/community) have community support. \\* We have strong support for \[TanStack\](https://x.com/aboodman/status/1941914143961071635).  \\#\# Databases  \\* Most Postgres providers \[are supported\](https://zero.rocicorp.dev/docs/connecting-to-postgres). \\* \[Drizzle and Prisma\](https://zero.rocicorp.dev/docs/schema) are fully supported.  \\#\# API  \\* The new APIs are still being refined and have some rough edges.  \\#\# Query Language  \\* Filters, sorts, limits, relationships, and \`exists\` \[are supported\](https://zero.rocicorp.dev/docs/reading-data). \\* Queries can have \[\`ttl\`\](https://zero.rocicorp.dev/docs/reading-data\#background-queries) to keep data synced across sessions. \\* \[Aggregates\](https://zero.rocicorp.dev/docs/roadmap) (count, min, max, group-by) are not yet supported. \\* \[Full-text search\](https://zero.rocicorp.dev/docs/roadmap) is not yet supported (you can sometimes simulate with \`ILIKE\`, though it scales linearly). \\* Infinite/virtual scroll is possible, but we do not yet have a library/API for it. See \[zbugs\](https://zero.rocicorp.dev/docs/samples\#zbugs) source for how to do this.  \\#\# Performance  \\* Zero plans single-table and multi-table queries. You can also manually plan queries using \[the \`flip\` parameter\](https://zero.rocicorp.dev/docs/reading-data\#join-flipping). \\* Zero has a basic \[console-based inspector\](https://zero.rocicorp.dev/docs/debug/inspector) that can help to understand query and sync performance. It does not yet have a GUI inspector. \\* We share queries within a "client group" (e.g. all tabs in a browser), but not across groups. This means that if you have many users doing the same query, they will duplicate all that work server-side.  \\#\# Miscellaneous  \\* Running Zero requires \[deploying it yourself\](https://zero.rocicorp.dev/docs/deployment) to AWS or similar. Running in a \[multinode\](https://zero.rocicorp.dev/docs/deployment\#guide-multi-node-on-sstaws), zero-downtime way is possible (we do it for zbugs), but significant effort. Running \[single node\](https://zero.rocicorp.dev/docs/deployment\#guide-single-node-on-flyio) is easier, but updating the server takes it down for a minute or so (we are working on a SaaS solution).      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

[🚧Zero is in Alpha](https://zero.rocicorp.dev/docs/status#zero-is-in-alpha)

## [Platforms and Frameworks](https://zero.rocicorp.dev/docs/status\#platforms-and-frameworks)

- [React](https://zero.rocicorp.dev/docs/react), [React Native](https://zero.rocicorp.dev/docs/react-native), and [SolidJS](https://zero.rocicorp.dev/docs/solidjs) are fully supported.
- [Svelte and Vue](https://zero.rocicorp.dev/docs/community) have community support.
- We have strong support for [TanStack](https://x.com/aboodman/status/1941914143961071635).

## [Databases](https://zero.rocicorp.dev/docs/status\#databases)

- Most Postgres providers [are supported](https://zero.rocicorp.dev/docs/connecting-to-postgres).
- [Drizzle and Prisma](https://zero.rocicorp.dev/docs/schema) are fully supported.

## [API](https://zero.rocicorp.dev/docs/status\#api)

- The new APIs are still being refined and have some rough edges.

## [Query Language](https://zero.rocicorp.dev/docs/status\#query-language)

- Filters, sorts, limits, relationships, and `exists` [are supported](https://zero.rocicorp.dev/docs/reading-data).
- Queries can have [`ttl`](https://zero.rocicorp.dev/docs/reading-data#background-queries) to keep data synced across sessions.
- [Aggregates](https://zero.rocicorp.dev/docs/roadmap) (count, min, max, group-by) are not yet supported.
- [Full-text search](https://zero.rocicorp.dev/docs/roadmap) is not yet supported (you can sometimes simulate with `ILIKE`, though it scales linearly).
- Infinite/virtual scroll is possible, but we do not yet have a library/API for it. See [zbugs](https://zero.rocicorp.dev/docs/samples#zbugs) source for how to do this.

## [Performance](https://zero.rocicorp.dev/docs/status\#performance)

- Zero plans single-table and multi-table queries. You can also manually plan queries using [the `flip` parameter](https://zero.rocicorp.dev/docs/reading-data#join-flipping).
- Zero has a basic [console-based inspector](https://zero.rocicorp.dev/docs/debug/inspector) that can help to understand query and sync performance. It does not yet have a GUI inspector.
- We share queries within a "client group" (e.g. all tabs in a browser), but not across groups. This means that if you have many users doing the same query, they will duplicate all that work server-side.

## [Miscellaneous](https://zero.rocicorp.dev/docs/status\#miscellaneous)

- Running Zero requires [deploying it yourself](https://zero.rocicorp.dev/docs/deployment) to AWS or similar. Running in a [multinode](https://zero.rocicorp.dev/docs/deployment#guide-multi-node-on-sstaws), zero-downtime way is possible (we do it for zbugs), but significant effort. Running [single node](https://zero.rocicorp.dev/docs/deployment#guide-single-node-on-flyio) is easier, but updating the server takes it down for a minute or so (we are working on a SaaS solution).

[PreviousWhen to Use](https://zero.rocicorp.dev/docs/when-to-use)

[NextSchema](https://zero.rocicorp.dev/docs/schema)

### On this page

[Platforms and Frameworks](https://zero.rocicorp.dev/docs/status#platforms-and-frameworks) [Databases](https://zero.rocicorp.dev/docs/status#databases) [API](https://zero.rocicorp.dev/docs/status#api) [Query Language](https://zero.rocicorp.dev/docs/status#query-language) [Performance](https://zero.rocicorp.dev/docs/status#performance) [Miscellaneous](https://zero.rocicorp.dev/docs/status#miscellaneous)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/status.mdx)