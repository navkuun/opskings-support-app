---
url: "https://zero.rocicorp.dev/docs/when-to-use"
title: "When To Use Zero"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# When To Use Zero  Copy markdown  And When Not To – A Quick Guide  \\# When To Use Zero  We are trying to make Zero a great choice for a wide variety of applications. But every tool has tradeoffs, and Zero especially so \[while in alpha\](https://zero.rocicorp.dev/docs/status).  This page will help you understand if Zero is a good fit for you today.  \\#\# Zero Might be a Good Fit  \\#\#\# You want to sync only a small subset of data to client  Zero's query-driven sync is a powerful solution for partial sync. You can define the data you want to sync with a set of Zero queries. By using partial sync, Zero apps can commonly load in \\< 1s, yet still maintain the interaction perf of sync.  \\#\#\# You need fine-grained read or write permissions  Zero's \[mutators\](https://zero.rocicorp.dev/docs/mutators) allow you to run arbitrary authorization, validation, or business logic on the write path. You can enforce that a write depends on what group a user is in, what has been shared with them, their role, etc. \[Read permissions\](https://zero.rocicorp.dev/docs/permissions) are very expressive, allowing similar control over what data is synced to the client.  \\#\#\# You are building a traditional client-server web app  Zero was designed from the ground up to be as close to a classic web app as a sync engine can be. If you have a traditional web app, you can try Zero side-by-side with your existing REST or GraphQL API, and incrementally migrate over time.  \\#\#\# You use PostgreSQL  Some tools in our space require you to use a non-standard backend database or data model. Zero works with PostgreSQL, and uses your existing schema.  \\#\#\# Your app is broadly "like Linear"  Zero is currently best suited for productivity apps with lots of interactivity.  \\#\#\# Interaction performance is very important to you  Zero was built by people obsessed with interaction performance. If you share this goal you'll be going with the grain of Zero's design choices.  \\#\# Zero Might Not be a Good Fit  \\#\#\# You need the privacy or data ownership benefits of local-first  Zero is not \[local-first\](https://www.inkandswitch.com/essay/local-first/). It's a client-server system with an authoritative server.  \\#\#\# You need to support offline writes or long periods offline  Zero doesn't support \[offline writes\](https://zero.rocicorp.dev/docs/offline) yet.  \\#\#\# You are building a native mobile app  Zero is written in TypeScript and only supports TypeScript clients.  \\#\#\# The total backend dataset is > \\~100GB  Zero stores a replica of your database (at least the subset you want to be syncable to clients) in a SQLite database owned by zero-cache.  Zero's query engine is built assuming very fast local access to this replica (i.e., attached NVMe). But other setups are technically supported and work for smaller data.  The ultimate size limit on the database that Zero can work with is the size limit of this SQLite database. So \[up to 45TB on EC2\](https://aws.amazon.com/ec2/instance-types/) at time of writing.  However, most of our experience with Zero so far is with much smaller workloads. We currently recommend Zero for use with datasets smaller than 100GB, but are working to improve this in the beta timeframe.  \\#\# Zero Might Not be a Good Fit \*\*Yet\*\*  While Zero is in alpha, there are additional reasons not to choose it:  \\#\#\# You don't want to run server-side infra  Zero is a Docker container that you currently have to \[self-host\](https://zero.rocicorp.dev/docs/deployment). We're working on a SaaS solution but it's not ready yet.  \\#\#\# You can't tolerate occasional downtime  The easiest way to run Zero today is \[single-node\](https://zero.rocicorp.dev/docs/deployment\#guide-single-node-on-flyio), which requires downtime for updates. Also there are occasional regressions.  \\#\#\# You need support for SSR  Zero doesn't support \[SSR\](https://zero.rocicorp.dev/docs/roadmap\#beyond) yet, but it is planned.  \\#\# Alternatives  If Zero isn't right for you, here are some good alternatives to consider:  \\* \[Automerge\](https://automerge.org/): Local-first, CRDT-based solution. Pioneering branch-based offline support. \\* \[Convex\](https://www.convex.dev/): Not a sync engine (reads and writes are server-first), but a very nice reactive database that is in GA. \\* \[Ditto\](https://www.ditto.com/): CRDT-based, with high quality offline support. \\* \[Electric\](https://electric-sql.com/): Postgres-based sync engine with a SaaS cloud. \\* \[LiveStore\](https://livestore.dev/): Interesting event sourced design from one of the founders of Prisma. \\* \[Jazz\](https://jazz.tools/): Batteries-included local-first. \\* \[PowerSync\](https://powersync.com/): Sync engine that works with Postgres, MySQL, and MongoDB.      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

And When Not To – A Quick Guide

We are trying to make Zero a great choice for a wide variety of applications. But every tool has tradeoffs, and Zero especially so [while in alpha](https://zero.rocicorp.dev/docs/status).

This page will help you understand if Zero is a good fit for you today.

## [Zero Might be a Good Fit](https://zero.rocicorp.dev/docs/when-to-use\#zero-might-be-a-good-fit)

### [You want to sync only a small subset of data to client](https://zero.rocicorp.dev/docs/when-to-use\#you-want-to-sync-only-a-small-subset-of-data-to-client)

Zero's query-driven sync is a powerful solution for partial sync. You can define the data you want to sync with a set of Zero queries. By using partial sync, Zero apps can commonly load in < 1s, yet still maintain the interaction perf of sync.

### [You need fine-grained read or write permissions](https://zero.rocicorp.dev/docs/when-to-use\#you-need-fine-grained-read-or-write-permissions)

Zero's [mutators](https://zero.rocicorp.dev/docs/mutators) allow you to run arbitrary authorization, validation, or business logic on the write path. You can enforce that a write depends on what group a user is in, what has been shared with them, their role, etc. [Read permissions](https://zero.rocicorp.dev/docs/permissions) are very expressive, allowing similar control over what data is synced to the client.

### [You are building a traditional client-server web app](https://zero.rocicorp.dev/docs/when-to-use\#you-are-building-a-traditional-client-server-web-app)

Zero was designed from the ground up to be as close to a classic web app as a sync engine can be. If you have a traditional web app, you can try Zero side-by-side with your existing REST or GraphQL API, and incrementally migrate over time.

### [You use PostgreSQL](https://zero.rocicorp.dev/docs/when-to-use\#you-use-postgresql)

Some tools in our space require you to use a non-standard backend database or data model. Zero works with PostgreSQL, and uses your existing schema.

### [Your app is broadly "like Linear"](https://zero.rocicorp.dev/docs/when-to-use\#your-app-is-broadly-like-linear)

Zero is currently best suited for productivity apps with lots of interactivity.

### [Interaction performance is very important to you](https://zero.rocicorp.dev/docs/when-to-use\#interaction-performance-is-very-important-to-you)

Zero was built by people obsessed with interaction performance. If you share this goal you'll be going with the grain of Zero's design choices.

## [Zero Might Not be a Good Fit](https://zero.rocicorp.dev/docs/when-to-use\#zero-might-not-be-a-good-fit)

### [You need the privacy or data ownership benefits of local-first](https://zero.rocicorp.dev/docs/when-to-use\#you-need-the-privacy-or-data-ownership-benefits-of-local-first)

Zero is not [local-first](https://www.inkandswitch.com/essay/local-first/). It's a client-server system with an authoritative server.

### [You need to support offline writes or long periods offline](https://zero.rocicorp.dev/docs/when-to-use\#you-need-to-support-offline-writes-or-long-periods-offline)

Zero doesn't support [offline writes](https://zero.rocicorp.dev/docs/offline) yet.

### [You are building a native mobile app](https://zero.rocicorp.dev/docs/when-to-use\#you-are-building-a-native-mobile-app)

Zero is written in TypeScript and only supports TypeScript clients.

### [The total backend dataset is > ~100GB](https://zero.rocicorp.dev/docs/when-to-use\#the-total-backend-dataset-is--100gb)

Zero stores a replica of your database (at least the subset you want to be syncable to clients) in a SQLite database owned by zero-cache.

Zero's query engine is built assuming very fast local access to this replica (i.e., attached NVMe). But other setups are technically supported and work for smaller data.

The ultimate size limit on the database that Zero can work with is the size limit of this SQLite database. So [up to 45TB on EC2](https://aws.amazon.com/ec2/instance-types/) at time of writing.

However, most of our experience with Zero so far is with much smaller workloads. We currently recommend Zero for use with datasets smaller than 100GB, but are working to improve this in the beta timeframe.

## [Zero Might Not be a Good Fit **Yet**](https://zero.rocicorp.dev/docs/when-to-use\#zero-might-not-be-a-good-fit-yet)

While Zero is in alpha, there are additional reasons not to choose it:

### [You don't want to run server-side infra](https://zero.rocicorp.dev/docs/when-to-use\#you-dont-want-to-run-server-side-infra)

Zero is a Docker container that you currently have to [self-host](https://zero.rocicorp.dev/docs/deployment). We're working on a SaaS solution but it's not ready yet.

### [You can't tolerate occasional downtime](https://zero.rocicorp.dev/docs/when-to-use\#you-cant-tolerate-occasional-downtime)

The easiest way to run Zero today is [single-node](https://zero.rocicorp.dev/docs/deployment#guide-single-node-on-flyio), which requires downtime for updates. Also there are occasional regressions.

### [You need support for SSR](https://zero.rocicorp.dev/docs/when-to-use\#you-need-support-for-ssr)

Zero doesn't support [SSR](https://zero.rocicorp.dev/docs/roadmap#beyond) yet, but it is planned.

## [Alternatives](https://zero.rocicorp.dev/docs/when-to-use\#alternatives)

If Zero isn't right for you, here are some good alternatives to consider:

- [Automerge](https://automerge.org/): Local-first, CRDT-based solution. Pioneering branch-based offline support.
- [Convex](https://www.convex.dev/): Not a sync engine (reads and writes are server-first), but a very nice reactive database that is in GA.
- [Ditto](https://www.ditto.com/): CRDT-based, with high quality offline support.
- [Electric](https://electric-sql.com/): Postgres-based sync engine with a SaaS cloud.
- [LiveStore](https://livestore.dev/): Interesting event sourced design from one of the founders of Prisma.
- [Jazz](https://jazz.tools/): Batteries-included local-first.
- [PowerSync](https://powersync.com/): Sync engine that works with Postgres, MySQL, and MongoDB.

[PreviousWhat is Sync?](https://zero.rocicorp.dev/docs/sync)

[NextStatus](https://zero.rocicorp.dev/docs/status)

### On this page

[Zero Might be a Good Fit](https://zero.rocicorp.dev/docs/when-to-use#zero-might-be-a-good-fit) [You want to sync only a small subset of data to client](https://zero.rocicorp.dev/docs/when-to-use#you-want-to-sync-only-a-small-subset-of-data-to-client) [You need fine-grained read or write permissions](https://zero.rocicorp.dev/docs/when-to-use#you-need-fine-grained-read-or-write-permissions) [You are building a traditional client-server web app](https://zero.rocicorp.dev/docs/when-to-use#you-are-building-a-traditional-client-server-web-app) [You use PostgreSQL](https://zero.rocicorp.dev/docs/when-to-use#you-use-postgresql) [Your app is broadly "like Linear"](https://zero.rocicorp.dev/docs/when-to-use#your-app-is-broadly-like-linear) [Interaction performance is very important to you](https://zero.rocicorp.dev/docs/when-to-use#interaction-performance-is-very-important-to-you) [Zero Might Not be a Good Fit](https://zero.rocicorp.dev/docs/when-to-use#zero-might-not-be-a-good-fit) [You need the privacy or data ownership benefits of local-first](https://zero.rocicorp.dev/docs/when-to-use#you-need-the-privacy-or-data-ownership-benefits-of-local-first) [You need to support offline writes or long periods offline](https://zero.rocicorp.dev/docs/when-to-use#you-need-to-support-offline-writes-or-long-periods-offline) [You are building a native mobile app](https://zero.rocicorp.dev/docs/when-to-use#you-are-building-a-native-mobile-app) [The total backend dataset is > ~100GB](https://zero.rocicorp.dev/docs/when-to-use#the-total-backend-dataset-is--100gb) [Zero Might Not be a Good Fit \*\*Yet\*\*](https://zero.rocicorp.dev/docs/when-to-use#zero-might-not-be-a-good-fit-yet) [You don't want to run server-side infra](https://zero.rocicorp.dev/docs/when-to-use#you-dont-want-to-run-server-side-infra) [You can't tolerate occasional downtime](https://zero.rocicorp.dev/docs/when-to-use#you-cant-tolerate-occasional-downtime) [You need support for SSR](https://zero.rocicorp.dev/docs/when-to-use#you-need-support-for-ssr) [Alternatives](https://zero.rocicorp.dev/docs/when-to-use#alternatives)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/when-to-use.mdx)