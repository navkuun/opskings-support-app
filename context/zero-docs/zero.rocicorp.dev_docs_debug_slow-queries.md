---
url: "https://zero.rocicorp.dev/docs/debug/slow-queries"
title: "Slow Queries"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# Slow Queries  Copy markdown  \\# Slow Queries  In the \`zero-cache\` logs, you may see statements indicating a query is slow:  \`\`\`shell { "level": "DEBUG", "worker": "syncer", "component": "view-syncer", "hydrationTimeMs": 1339, "message": "Total rows considered: 146" }, \`\`\`  or:  \`\`\`shell hash=3rhuw19xt9vry transformationHash=1nv7ot74gxfl7 Slow query materialization 325.46865100000286 \`\`\`  Or, you may just notice queries taking longer than expected in the UI.  Here are some tips to help debug such slow queries.  \\#\# Check \`ttl\`  If you are seeing unexpected UI flicker when moving between views, it is possible that the queries backing these views have a \`ttl\` of \`never\`. Set the \`ttl\` to something like \`5m\` to \[keep data cached across navigations\](https://zero.rocicorp.dev/docs/reading-data\#query-lifecycle).  You may alternately want to \[preload some data\](https://zero.rocicorp.dev/docs/reading-data\#preloading) at app startup.  Conversely, if you are setting \`ttl\` to long values, then it can happen that you have many backgrounded queries still running that the app is not using. You can see which queries are running using the \[inspector\](https://zero.rocicorp.dev/docs/debug/inspector). Ensure that only expected queries are running. See \[long TTLs\](https://zero.rocicorp.dev/docs/reading-data\#long-ttl-warning) for more information.  \\#\# Check Storage  \`zero-cache\` is effectively a database. It requires fast (low latency and high bandwidth) disk access to perform well. If you're running on network attached storage with high latency, or on AWS with low IOPS, then this is the most likely culprit.  The default deployment of Zero currently uses Fargate which scales IOPS with vCPU. Increasing the vCPU will increase storage throughput and likely resolve the issue.  Fly.io provides physically attached SSDs, even for their smallest VMs. Deploying zero-cache there (or any other provider that offers physically attached SSDs) is another option.  \\#\# Locality  If you see log lines like:  \`\`\`shell flushed cvr ... (124ms) \`\`\`  this indicates that \`zero-cache\` is likely deployed too far away from your \[CVR database\](https://zero.rocicorp.dev/docs/deployment\#architecture). If you did not configure a CVR database URL then this will be your product's Postgres DB. A slow CVR flush can slow down Zero, since it must complete the flush before sending query result(s) to clients.  Try moving \`zero-cache\` to be deployed as close as possible to the CVR database.  \\#\# Query Plan  If neither (1) nor (2) is a problem, then the query itself is the most likely culprit. The \`@rocicorp/zero\` package ships with a query analyzer to help debug this.  The analyzer should be run in the directory that contains the \`.env\` file for \`zero-cache\` as it will use the \`.env\` file to find your replica.  Example:  \`\`\`shell npx analyze-query \  --schema-path=./shared/schema.ts \  --query='issue.related("comments")' \`\`\`  This will output the query plan and time to execute each phase of that plan.  Note that query performance can also be affected by read permissions. See \[Debugging Permissions\](https://zero.rocicorp.dev/docs/debug/permissions) for information on how to analyze queries with read permissions applied.  \\#\# /statz  \`zero-cache\` makes some internal health statistics available via the \`/statz\` endpoint of \`zero-cache\`. In order to access this, you must configure an \[admin password\](https://zero.rocicorp.dev/docs/zero-cache-config\#admin-password).      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

In the `zero-cache` logs, you may see statements indicating a query is slow:

```
Copy{
    "level": "DEBUG",
    "worker": "syncer",
    "component": "view-syncer",
    "hydrationTimeMs": 1339,
    "message": "Total rows considered: 146"
  },
```

or:

```
Copyhash=3rhuw19xt9vry transformationHash=1nv7ot74gxfl7
Slow query materialization 325.46865100000286
```

Or, you may just notice queries taking longer than expected in the UI.

Here are some tips to help debug such slow queries.

## [Check `ttl`](https://zero.rocicorp.dev/docs/debug/slow-queries\#check-ttl)

If you are seeing unexpected UI flicker when moving between views, it is possible that the queries backing these views have a `ttl` of `never`. Set the `ttl` to something like `5m` to [keep data cached across navigations](https://zero.rocicorp.dev/docs/reading-data#query-lifecycle).

You may alternately want to [preload some data](https://zero.rocicorp.dev/docs/reading-data#preloading) at app startup.

Conversely, if you are setting `ttl` to long values, then it can happen that you have many backgrounded queries still running that the app is not using. You can see which queries are running using the [inspector](https://zero.rocicorp.dev/docs/debug/inspector). Ensure that only expected queries are running. See [long TTLs](https://zero.rocicorp.dev/docs/reading-data#long-ttl-warning) for more information.

## [Check Storage](https://zero.rocicorp.dev/docs/debug/slow-queries\#check-storage)

`zero-cache` is effectively a database. It requires fast (low latency and high bandwidth) disk access to perform well. If you're running on network attached storage with high latency, or on AWS with low IOPS, then this is the most likely culprit.

The default deployment of Zero currently uses Fargate which scales IOPS with vCPU. Increasing the vCPU will increase storage throughput and likely resolve the issue.

Fly.io provides physically attached SSDs, even for their smallest VMs. Deploying zero-cache there (or any other provider that offers physically attached SSDs) is another option.

## [Locality](https://zero.rocicorp.dev/docs/debug/slow-queries\#locality)

If you see log lines like:

```
Copyflushed cvr ... (124ms)
```

this indicates that `zero-cache` is likely deployed too far away from your [CVR database](https://zero.rocicorp.dev/docs/deployment#architecture). If you did not configure a CVR database URL then this will be your product's Postgres DB. A slow CVR flush can slow down Zero, since it must complete the flush before sending query result(s) to clients.

Try moving `zero-cache` to be deployed as close as possible to the CVR database.

## [Query Plan](https://zero.rocicorp.dev/docs/debug/slow-queries\#query-plan)

If neither (1) nor (2) is a problem, then the query itself is the most likely culprit. The `@rocicorp/zero` package ships with a query analyzer to help debug this.

The analyzer should be run in the directory that contains the `.env` file for `zero-cache` as it will use the `.env` file to find your replica.

Example:

```
Copynpx analyze-query \
  --schema-path=./shared/schema.ts \
  --query='issue.related("comments")'
```

This will output the query plan and time to execute each phase of that plan.

Note that query performance can also be affected by read permissions. See [Debugging Permissions](https://zero.rocicorp.dev/docs/debug/permissions) for information on how to analyze queries with read permissions applied.

## [/statz](https://zero.rocicorp.dev/docs/debug/slow-queries\#statz)

`zero-cache` makes some internal health statistics available via the `/statz` endpoint of `zero-cache`. In order to access this, you must configure an [admin password](https://zero.rocicorp.dev/docs/zero-cache-config#admin-password).

[PreviousInspector](https://zero.rocicorp.dev/docs/debug/inspector)

[NextReplication](https://zero.rocicorp.dev/docs/debug/replication)

### On this page

[Check \`ttl\`](https://zero.rocicorp.dev/docs/debug/slow-queries#check-ttl) [Check Storage](https://zero.rocicorp.dev/docs/debug/slow-queries#check-storage) [Locality](https://zero.rocicorp.dev/docs/debug/slow-queries#locality) [Query Plan](https://zero.rocicorp.dev/docs/debug/slow-queries#query-plan) [/statz](https://zero.rocicorp.dev/docs/debug/slow-queries#statz)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/debug/slow-queries.mdx)