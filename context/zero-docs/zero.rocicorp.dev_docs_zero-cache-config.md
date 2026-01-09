---
url: "https://zero.rocicorp.dev/docs/zero-cache-config"
title: "zero-cache Config"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# zero-cache Config  Copy markdown  \\# zero-cache Config  \`zero-cache\` is configured either via CLI flag or environment variable. There is no separate \`zero.config\` file.  You can also see all available flags by running \`zero-cache --help\`.  \\#\# Required Flags  \\#\#\# Upstream DB  The "upstream" authoritative postgres database. In the future we will support other types of upstream besides PG.  flag: \`--upstream-db\`env: \`ZERO\_UPSTREAM\_DB\`required: \`true\`  \\#\#\# Admin Password  A password used to administer zero-cache server, for example to access the \`/statz\` endpoint and the \[inspector\](https://zero.rocicorp.dev/docs/debug/inspector).  This is required in production (when \`NODE\_ENV=production\`) because we want all Zero servers to be debuggable using admin tools by default, without needing a restart. But we also don't want to expose sensitive data using them.  flag: \`--admin-password\`env: \`ZERO\_ADMIN\_PASSWORD\`required: in production (when \`NODE\_ENV=production\`)  \\#\# Optional Flags  \\#\#\# App ID  Unique identifier for the app.  Multiple zero-cache apps can run on a single upstream database, each of which is isolated from the others, with its own permissions, sharding (future feature), and change/cvr databases.  The metadata of an app is stored in an upstream schema with the same name, e.g. \`zero\`, and the metadata for each app shard, e.g. client and mutation ids, is stored in the \`{app-id}\_{\#}\` schema. (Currently there is only a single "0" shard, but this will change with sharding).  The CVR and Change data are managed in schemas named \`{app-id}\_{shard-num}/cvr\` and \`{app-id}\_{shard-num}/cdc\`, respectively, allowing multiple apps and shards to share the same database instance (e.g. a Postgres "cluster") for CVR and Change management.  Due to constraints on replication slot names, an App ID may only consist of lower-case letters, numbers, and the underscore character.  Note that this option is used by both \`zero-cache\` and \`zero-deploy-permissions\`.  flag: \`--app-id\`env: \`ZERO\_APP\_ID\`default: \`zero\`  \\#\#\# App Publications  Postgres PUBLICATIONs that define the tables and columns to replicate. Publication names may not begin with an underscore, as zero reserves that prefix for internal use.  If unspecified, zero-cache will create and use an internal publication that publishes all tables in the public schema, i.e.:  \`\`\` CREATE PUBLICATION \_{app-id}\_public\_0 FOR TABLES IN SCHEMA public; \`\`\`  Note that changing the set of publications will result in resyncing the replica, which may involve downtime (replication lag) while the new replica is initializing. To change the set of publications without disrupting an existing app, a new app should be created.  flag: \`--app-publications\`env: \`ZERO\_APP\_PUBLICATIONS\`default: \`\[\]\`  \\#\#\# Auto Reset  Automatically wipe and resync the replica when replication is halted. This situation can occur for configurations in which the upstream database provider prohibits event trigger creation, preventing the zero-cache from being able to correctly replicate schema changes. For such configurations, an upstream schema change will instead result in halting replication with an error indicating that the replica needs to be reset. When auto-reset is enabled, zero-cache will respond to such situations by shutting down, and when restarted, resetting the replica and all synced clients. This is a heavy-weight operation and can result in user-visible slowness or downtime if compute resources are scarce.  flag: \`--auto-reset\`env: \`ZERO\_AUTO\_RESET\`default: \`true\`  \\#\#\# Change DB  The Postgres database used to store recent replication log entries, in order to sync multiple view-syncers without requiring multiple replication slots on the upstream database. If unspecified, the upstream-db will be used.  flag: \`--change-db\`env: \`ZERO\_CHANGE\_DB\`  \\#\#\# Change Max Connections  The maximum number of connections to open to the change database. This is used by the change-streamer for catching up zero-cache replication subscriptions.  flag: \`--change-max-conns\`env: \`ZERO\_CHANGE\_MAX\_CONNS\`default: \`5\`  \\#\#\# Change Streamer Mode  The mode for running or connecting to the change-streamer:  \\* \`dedicated\`: runs the change-streamer and shuts down when another change-streamer takes over the replication slot. This is appropriate in a single-node configuration, or for the replication-manager in a multi-node configuration. \\* \`discover\`: connects to the change-streamer as internally advertised in the change-db. This is appropriate for the view-syncers in a multi-node setup. This may not work in all networking configurations (e.g., some private networking or port forwarding setups). Using \`ZERO\_CHANGE\_STREAMER\_URI\` with an explicit routable hostname is recommended instead.  This option is ignored if \`ZERO\_CHANGE\_STREAMER\_URI\` is set.  flag: \`--change-streamer-mode\`env: \`ZERO\_CHANGE\_STREAMER\_MODE\`default: \`dedicated\`  \\#\#\# Change Streamer Port  The port on which the change-streamer runs. This is an internal protocol between the replication-manager and view-syncers, which runs in the same process tree in local development or a single-node configuration. If unspecified, defaults to \`--port + 1\`.  flag: \`--change-streamer-port\`env: \`ZERO\_CHANGE\_STREAMER\_PORT\`default: \`--port + 1\`  \\#\#\# Change Streamer Startup Delay (ms)  The delay to wait before the change-streamer takes over the replication stream (i.e. the handoff during replication-manager updates), to allow load balancers to register the task as healthy based on healthcheck parameters. If a change stream request is received during this interval, the delay will be canceled and the takeover will happen immediately, since the incoming request indicates that the task is registered as a target.  flag: \`--change-streamer-startup-delay-ms\`env: \`ZERO\_CHANGE\_STREAMER\_STARTUP\_DELAY\_MS\`default: \`15000\`  \\#\#\# Change Streamer URI  When set, connects to the change-streamer at the given URI. In a multi-node setup, this should be specified in view-syncer options, pointing to the replication-manager URI, which runs a change-streamer on port 4849.  flag: \`--change-streamer-uri\`env: \`ZERO\_CHANGE\_STREAMER\_URI\`  \\#\#\# CVR DB  The Postgres database used to store CVRs. CVRs (client view records) keep track of the data synced to clients in order to determine the diff to send on reconnect. If unspecified, the upstream-db will be used.  flag: \`--cvr-db\`env: \`ZERO\_CVR\_DB\`  \\#\#\# CVR Garbage Collection Inactivity Threshold Hours  The duration after which an inactive CVR is eligible for garbage collection. Garbage collection is incremental and periodic, so eligible CVRs are not necessarily purged immediately.  flag: \`--cvr-garbage-collection-inactivity-threshold-hours\`env: \`ZERO\_CVR\_GARBAGE\_COLLECTION\_INACTIVITY\_THRESHOLD\_HOURS\`default: \`48\`  \\#\#\# CVR Garbage Collection Initial Batch Size  The initial number of CVRs to purge per garbage collection interval. This number is increased linearly if the rate of new CVRs exceeds the rate of purged CVRs, in order to reach a steady state. Setting this to 0 effectively disables CVR garbage collection.  flag: \`--cvr-garbage-collection-initial-batch-size\`env: \`ZERO\_CVR\_GARBAGE\_COLLECTION\_INITIAL\_BATCH\_SIZE\`default: \`25\`  \\#\#\# CVR Garbage Collection Initial Interval Seconds  The initial interval at which to check and garbage collect inactive CVRs. This interval is increased exponentially (up to 16 minutes) when there is nothing to purge.  flag: \`--cvr-garbage-collection-initial-interval-seconds\`env: \`ZERO\_CVR\_GARBAGE\_COLLECTION\_INITIAL\_INTERVAL\_SECONDS\`default: \`60\`  \\#\#\# CVR Max Connections  The maximum number of connections to open to the CVR database. This is divided evenly amongst sync workers.  Note that this number must allow for at least one connection per sync worker, or zero-cache will fail to start. See num-sync-workers.  flag: \`--cvr-max-conns\`env: \`ZERO\_CVR\_MAX\_CONNS\`default: \`30\`  \\#\#\# Enable Query Planner  Enable the query planner for optimizing ZQL queries.  The query planner analyzes and optimizes query execution by determining the most efficient join strategies.  You can disable the planner if it is picking bad strategies.  flag: \`--enable-query-planner\`env: \`ZERO\_ENABLE\_QUERY\_PLANNER\`default: \`true\`  \\#\#\# Enable Telemetry  Zero collects anonymous telemetry data to help us understand usage. We collect:  \\* Zero version \\* Uptime \\* General machine information, like the number of CPUs, OS, CI/CD environment, etc. \\* Information about usage, such as number of queries or mutations processed per hour.  This is completely optional and can be disabled at any time. You can also opt-out by setting \`DO\_NOT\_TRACK=1\`.  flag: \`--enable-telemetry\`env: \`ZERO\_ENABLE\_TELEMETRY\`default: \`true\`  \\#\#\# Initial Sync Table Copy Workers  The number of parallel workers used to copy tables during initial sync. Each worker uses a database connection, copies a single table at a time, and buffers up to (approximately) 10 MB of table data in memory during initial sync. Increasing the number of workers may improve initial sync speed; however, local disk throughput (IOPS), upstream CPU, and network bandwidth may also be bottlenecks.  flag: \`--initial-sync-table-copy-workers\`env: \`ZERO\_INITIAL\_SYNC\_TABLE\_COPY\_WORKERS\`default: \`5\`  \\#\#\# Lazy Startup  Delay starting the majority of zero-cache until first request.  This is mainly intended to avoid connecting to Postgres replication stream until the first request is received, which can be useful i.e., for preview instances.  Currently only supported in single-node mode.  flag: \`--lazy-startup\`env: \`ZERO\_LAZY\_STARTUP\`default: \`false\`  \\#\#\# Litestream Backup URL  The location of the litestream backup, usually an s3:// URL. This is only consulted by the replication-manager. view-syncers receive this information from the replication-manager.  In multi-node deployments, this is required on the replication-manager so view-syncers can reserve snapshots; in single-node deployments it is optional.  flag: \`--litestream-backup-url\`env: \`ZERO\_LITESTREAM\_BACKUP\_URL\`  \\#\#\# Litestream Checkpoint Threshold MB  The size of the WAL file at which to perform an SQlite checkpoint to apply the writes in the WAL to the main database file. Each checkpoint creates a new WAL segment file that will be backed up by litestream. Smaller thresholds may improve read performance, at the expense of creating more files to download when restoring the replica from the backup.  flag: \`--litestream-checkpoint-threshold-mb\`env: \`ZERO\_LITESTREAM\_CHECKPOINT\_THRESHOLD\_MB\`default: \`40\`  \\#\#\# Litestream Config Path  Path to the litestream yaml config file. zero-cache will run this with its environment variables, which can be referenced in the file via \`${ENV}\` substitution, for example:  \\* ZERO\\\_REPLICA\\\_FILE for the db Path \\* ZERO\\\_LITESTREAM\\\_BACKUP\\\_LOCATION for the db replica url \\* ZERO\\\_LITESTREAM\\\_LOG\\\_LEVEL for the log Level \\* ZERO\\\_LOG\\\_FORMAT for the log type  flag: \`--litestream-config-path\`env: \`ZERO\_LITESTREAM\_CONFIG\_PATH\`default: \`./src/services/litestream/config.yml\`  \\#\#\# Litestream Executable  Path to the litestream executable. This option has no effect if litestream-backup-url is unspecified.  flag: \`--litestream-executable\`env: \`ZERO\_LITESTREAM\_EXECUTABLE\`  \\#\#\# Litestream Incremental Backup Interval Minutes  The interval between incremental backups of the replica. Shorter intervals reduce the amount of change history that needs to be replayed when catching up a new view-syncer, at the expense of increasing the number of files needed to download for the initial litestream restore.  flag: \`--litestream-incremental-backup-interval-minutes\`env: \`ZERO\_LITESTREAM\_INCREMENTAL\_BACKUP\_INTERVAL\_MINUTES\`default: \`15\`  \\#\#\# Litestream Maximum Checkpoint Page Count  The WAL page count at which SQLite performs a RESTART checkpoint, which blocks writers until complete. Defaults to \`minCheckpointPageCount \* 10\`. Set to \`0\` to disable RESTART checkpoints entirely.  flag: \`--litestream-max-checkpoint-page-count\`env: \`ZERO\_LITESTREAM\_MAX\_CHECKPOINT\_PAGE\_COUNT\`default: \`minCheckpointPageCount \* 10\`  \\#\#\# Litestream Minimum Checkpoint Page Count  The WAL page count at which SQLite attempts a PASSIVE checkpoint, which transfers pages to the main database file without blocking writers. Defaults to \`checkpointThresholdMB \* 250\` (since SQLite page size is 4KB).  flag: \`--litestream-min-checkpoint-page-count\`env: \`ZERO\_LITESTREAM\_MIN\_CHECKPOINT\_PAGE\_COUNT\`default: \`checkpointThresholdMB \* 250\`  \\#\#\# Litestream Multipart Concurrency  The number of parts (of size --litestream-multipart-size bytes) to upload or download in parallel when backing up or restoring the snapshot.  flag: \`--litestream-multipart-concurrency\`env: \`ZERO\_LITESTREAM\_MULTIPART\_CONCURRENCY\`default: \`48\`  \\#\#\# Litestream Multipart Size  The size of each part when uploading or downloading the snapshot with \`--litestream-multipart-concurrency\`. Note that up to \`concurrency \* size\`bytes of memory are used when backing up or restoring the snapshot.  flag: \`--litestream-multipart-size\`env: \`ZERO\_LITESTREAM\_MULTIPART\_SIZE\`default: \`16777216\` (16 MiB)  \\#\#\# Litestream Log Level  flag: \`--litestream-log-level\`env: \`ZERO\_LITESTREAM\_LOG\_LEVEL\`default: \`warn\`values: \`debug\`, \`info\`, \`warn\`, \`error\`  \\#\#\# Litestream Port  Port on which litestream exports metrics, used to determine the replication watermark up to which it is safe to purge change log records.  flag: \`--litestream-port\`env: \`ZERO\_LITESTREAM\_PORT\`default: \`--port + 2\`  \\#\#\# Litestream Restore Parallelism  The number of WAL files to download in parallel when performing the initial restore of the replica from the backup.  flag: \`--litestream-restore-parallelism\`env: \`ZERO\_LITESTREAM\_RESTORE\_PARALLELISM\`default: \`48\`  \\#\#\# Litestream Snapshot Backup Interval Hours  The interval between snapshot backups of the replica. Snapshot backups make a full copy of the database to a new litestream generation. This improves restore time at the expense of bandwidth. Applications with a large database and low write rate can increase this interval to reduce network usage for backups (litestream defaults to 24 hours).  flag: \`--litestream-snapshot-backup-interval-hours\`env: \`ZERO\_LITESTREAM\_SNAPSHOT\_BACKUP\_INTERVAL\_HOURS\`default: \`12\`  \\#\#\# Log Format  Use text for developer-friendly console logging and json for consumption by structured-logging services.  flag: \`--log-format\`env: \`ZERO\_LOG\_FORMAT\`default: \`"text"\`values: \`text\`, \`json\`  \\#\#\# Log IVM Sampling  How often to collect IVM metrics. 1 out of N requests will be sampled where N is this value.  flag: \`--log-ivm-sampling\`env: \`ZERO\_LOG\_IVM\_SAMPLING\`default: \`5000\`  \\#\#\# Log Level  Sets the logging level for the application.  flag: \`--log-level\`env: \`ZERO\_LOG\_LEVEL\`default: \`"info"\`values: \`debug\`, \`info\`, \`warn\`, \`error\`  \\#\#\# Log Slow Hydrate Threshold  The number of milliseconds a query hydration must take to print a slow warning.  flag: \`--log-slow-hydrate-threshold\`env: \`ZERO\_LOG\_SLOW\_HYDRATE\_THRESHOLD\`default: \`100\`  \\#\#\# Log Slow Row Threshold  The number of ms a row must take to fetch from table-source before it is considered slow.  flag: \`--log-slow-row-threshold\`env: \`ZERO\_LOG\_SLOW\_ROW\_THRESHOLD\`default: \`2\`  \\#\#\# Mutate API Key  An optional secret used to authorize zero-cache to call the API server handling writes.  flag: \`--mutate-api-key\`env: \`ZERO\_MUTATE\_API\_KEY\`  \\#\#\# Mutate Forward Cookies  If true, zero-cache will forward cookies from the request to zero-cache to your mutate endpoint. This is useful for passing authentication cookies to the API server. If false, cookies are not forwarded.  flag: \`--mutate-forward-cookies\`env: \`ZERO\_MUTATE\_FORWARD\_COOKIES\`default: \`false\`  \\#\#\# Mutate URL  The URL of the API server to which zero-cache will push mutations. URLs are matched using URLPattern, a standard Web API.  Pattern syntax (similar to Express routes):  \\* Exact URL match: \`"https://api.example.com/mutate"\` \\* Any subdomain using wildcard: \`"https://\*.example.com/mutate"\` \\* Multiple subdomain levels: \`"https://\*.\*.example.com/mutate"\` \\* Any path under a domain: \`"https://api.example.com/\*"\` \\* Named path parameters: \`"https://api.example.com/:version/mutate"\` \\* Matches \`https://api.example.com/v1/mutate\`, \`https://api.example.com/v2/mutate\`, etc.  Advanced patterns:  \\* Optional path segments: \`"https://api.example.com/:path?"\` \\* Regex in segments (for specific patterns): \`"https://api.example.com/:version(v\\\d+)/mutate"\` matches only \`v\` followed by digits.  Multiple patterns can be specified, for example:  \\* \`\["https://api1.example.com/mutate", "https://api2.example.com/mutate"\]\`  Query parameters and URL fragments (\`\#\`) are ignored during matching. See \[URLPattern\](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) for full syntax.  flag: \`--mutate-url\`env: \`ZERO\_MUTATE\_URL\`  \\#\#\# Number of Sync Workers  The number of processes to use for view syncing. Leave this unset to use the maximum available parallelism. If set to 0, the server runs without sync workers, which is the configuration for running the replication-manager in multi-node deployments.  flag: \`--num-sync-workers\`env: \`ZERO\_NUM\_SYNC\_WORKERS\`  \\#\#\# Per User Mutation Limit Max  The maximum mutations per user within the specified windowMs.  flag: \`--per-user-mutation-limit-max\`env: \`ZERO\_PER\_USER\_MUTATION\_LIMIT\_MAX\`  \\#\#\# Per User Mutation Limit Window (ms)  The sliding window over which the perUserMutationLimitMax is enforced.  flag: \`--per-user-mutation-limit-window-ms\`env: \`ZERO\_PER\_USER\_MUTATION\_LIMIT\_WINDOW\_MS\`default: \`60000\`  \\#\#\# Port  The port for sync connections.  flag: \`--port\`env: \`ZERO\_PORT\`default: \`4848\`  \\#\#\# Query API Key  An optional secret used to authorize zero-cache to call the API server handling queries.  flag: \`--query-api-key\`env: \`ZERO\_QUERY\_API\_KEY\`  \\#\#\# Query Forward Cookies  If true, zero-cache will forward cookies from the request to zero-cache to your query endpoint. This is useful for passing authentication cookies to the API server. If false, cookies are not forwarded.  flag: \`--query-forward-cookies\`env: \`ZERO\_QUERY\_FORWARD\_COOKIES\`default: \`false\`  \\#\#\# Query Hydration Stats  Track and log the number of rows considered by query hydrations which take longer than \*\*log-slow-hydrate-threshold\*\* milliseconds.  This is useful for debugging and performance tuning.  flag: \`--query-hydration-stats\`env: \`ZERO\_QUERY\_HYDRATION\_STATS\`  \\#\#\# Query URL  The URL of the API server to which zero-cache will send synced queries. URLs are matched using URLPattern, a standard Web API.  Pattern syntax (similar to Express routes):  \\* Exact URL match: \`"https://api.example.com/query"\` \\* Any subdomain using wildcard: \`"https://\*.example.com/query"\` \\* Multiple subdomain levels: \`"https://\*.\*.example.com/query"\` \\* Any path under a domain: \`"https://api.example.com/\*"\` \\* Named path parameters: \`"https://api.example.com/:version/query"\` \\* Matches \`https://api.example.com/v1/query\`, \`https://api.example.com/v2/query\`, etc.  Advanced patterns:  \\* Optional path segments: \`"https://api.example.com/:path?"\` \\* Regex in segments (for specific patterns): \`"https://api.example.com/:version(v\\\d+)/query"\` matches only \`v\` followed by digits.  Multiple patterns can be specified, for example:  \\* \`\["https://api1.example.com/query", "https://api2.example.com/query"\]\`  Query parameters and URL fragments (\`\#\`) are ignored during matching. See \[URLPattern\](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) for full syntax.  flag: \`--query-url\`env: \`ZERO\_QUERY\_URL\`  \\#\#\# Replica File  File path to the SQLite replica that zero-cache maintains. This can be lost, but if it is, zero-cache will have to re-replicate next time it starts up.  flag: \`--replica-file\`env: \`ZERO\_REPLICA\_FILE\`default: \`"zero.db"\`  \\#\#\# Replica Vacuum Interval Hours  Performs a VACUUM at server startup if the specified number of hours has elapsed since the last VACUUM (or initial-sync). The VACUUM operation is heavyweight and requires double the size of the db in disk space. If unspecified, VACUUM operations are not performed.  flag: \`--replica-vacuum-interval-hours\`env: \`ZERO\_REPLICA\_VACUUM\_INTERVAL\_HOURS\`  \\#\#\# Replica Page Cache Size KiB  The SQLite page cache size in kibibytes (KiB) for view-syncer connections. The page cache stores recently accessed database pages in memory to reduce disk I/O. Larger cache sizes improve performance for workloads that fit in cache. If unspecified, SQLite's default (\\~2 MB) is used. Note that the effective memory use of this setting will be: \`2 \* cache\_size \* num\_cores\`, as each connection to the replica gets its own cache and each core maintains 2 connections.  flag: \`--replica-page-cache-size-kib\`env: \`ZERO\_REPLICA\_PAGE\_CACHE\_SIZE\_KIB\`  \\#\#\# Server Version  The version string outputted to logs when the server starts up.  flag: \`--server-version\`env: \`ZERO\_SERVER\_VERSION\`  \\#\#\# Storage DB Temp Dir  Temporary directory for IVM operator storage. Leave unset to use \`os.tmpdir()\`.  flag: \`--storage-db-tmp-dir\`env: \`ZERO\_STORAGE\_DB\_TMP\_DIR\`  \\#\#\# Task ID  Globally unique identifier for the zero-cache instance. Setting this to a platform specific task identifier can be useful for debugging. If unspecified, zero-cache will attempt to extract the TaskARN if run from within an AWS ECS container, and otherwise use a random string.  flag: \`--task-id\`env: \`ZERO\_TASK\_ID\`  \\#\#\# Upstream Max Connections  The maximum number of connections to open to the upstream database for committing mutations. This is divided evenly amongst sync workers. In addition to this number, zero-cache uses one connection for the replication stream.  Note that this number must allow for at least one connection per sync worker, or zero-cache will fail to start. See num-sync-workers.  flag: \`--upstream-max-conns\`env: \`ZERO\_UPSTREAM\_MAX\_CONNS\`default: \`20\`  \\#\#\# Websocket Compression  Enable WebSocket per-message deflate compression. Compression can reduce bandwidth usage for sync traffic but increases CPU usage on both client and server. Disabled by default. See: \[https://github.com/websockets/ws\#websocket-compression\](https://github.com/websockets/ws\#websocket-compression)  flag: \`--websocket-compression\`env: \`ZERO\_WEBSOCKET\_COMPRESSION\`default: \`false\`  \\#\#\# Websocket Compression Options  JSON string containing WebSocket compression options. Only used if websocket-compression is enabled. Example: \`{"zlibDeflateOptions":{"level":3},"threshold":1024}\`. See \[https://github.com/websockets/ws/blob/master/doc/ws.md\#new-websocketserveroptions-callback\](https://github.com/websockets/ws/blob/master/doc/ws.md\#new-websocketserveroptions-callback) for available options.  flag: \`--websocket-compression-options\`env: \`ZERO\_WEBSOCKET\_COMPRESSION\_OPTIONS\`  \\#\#\# Yield Threshold (ms)  The maximum amount of time in milliseconds that a sync worker will spend in IVM (processing query hydration and advancement) before yielding to the event loop. Lower values increase responsiveness and fairness at the cost of reduced throughput.  flag: \`--yield-threshold-ms\`env: \`ZERO\_YIELD\_THRESHOLD\_MS\`default: \`10\`  \\#\# Deprecated Flags  \\#\#\# Auth JWK  A public key in JWK format used to verify JWTs. Only one of jwk, jwksUrl and secret may be set.  flag: \`--auth-jwk\`env: \`ZERO\_AUTH\_JWK\`  \\#\#\# Auth JWKS URL  A URL that returns a JWK set used to verify JWTs. Only one of jwk, jwksUrl and secret may be set.  flag: \`--auth-jwks-url\`env: \`ZERO\_AUTH\_JWKS\_URL\`  \\#\#\# Auth Secret  A symmetric key used to verify JWTs. Only one of jwk, jwksUrl and secret may be set.  flag: \`--auth-secret\`env: \`ZERO\_AUTH\_SECRET\`      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

`zero-cache` is configured either via CLI flag or environment variable. There is no separate `zero.config` file.

You can also see all available flags by running `zero-cache --help`.

## [Required Flags](https://zero.rocicorp.dev/docs/zero-cache-config\#required-flags)

### [Upstream DB](https://zero.rocicorp.dev/docs/zero-cache-config\#upstream-db)

The "upstream" authoritative postgres database. In the future we will support other types of upstream besides PG.

flag: `--upstream-db`

env: `ZERO_UPSTREAM_DB`

required: `true`

### [Admin Password](https://zero.rocicorp.dev/docs/zero-cache-config\#admin-password)

A password used to administer zero-cache server, for example to access the `/statz` endpoint and the [inspector](https://zero.rocicorp.dev/docs/debug/inspector).

This is required in production (when `NODE_ENV=production`) because we want all Zero servers to be debuggable using admin tools by default, without needing a restart. But we also don't want to expose sensitive data using them.

flag: `--admin-password`

env: `ZERO_ADMIN_PASSWORD`

required: in production (when `NODE_ENV=production`)

## [Optional Flags](https://zero.rocicorp.dev/docs/zero-cache-config\#optional-flags)

### [App ID](https://zero.rocicorp.dev/docs/zero-cache-config\#app-id)

Unique identifier for the app.

Multiple zero-cache apps can run on a single upstream database, each of which is isolated from the others, with its own permissions, sharding (future feature), and change/cvr databases.

The metadata of an app is stored in an upstream schema with the same name, e.g. `zero`, and the metadata for each app shard, e.g. client and mutation ids, is stored in the `{app-id}_{#}` schema. (Currently there is only a single "0" shard, but this will change with sharding).

The CVR and Change data are managed in schemas named `{app-id}_{shard-num}/cvr` and `{app-id}_{shard-num}/cdc`, respectively, allowing multiple apps and shards to share the same database instance (e.g. a Postgres "cluster") for CVR and Change management.

Due to constraints on replication slot names, an App ID may only consist of lower-case letters, numbers, and the underscore character.

Note that this option is used by both `zero-cache` and `zero-deploy-permissions`.

flag: `--app-id`

env: `ZERO_APP_ID`

default: `zero`

### [App Publications](https://zero.rocicorp.dev/docs/zero-cache-config\#app-publications)

Postgres PUBLICATIONs that define the tables and columns to replicate. Publication names may not begin with an underscore, as zero reserves that prefix for internal use.

If unspecified, zero-cache will create and use an internal publication that publishes all tables in the public schema, i.e.:

```
CopyCREATE PUBLICATION _{app-id}_public_0 FOR TABLES IN SCHEMA public;
```

Note that changing the set of publications will result in resyncing the replica, which may involve downtime (replication lag) while the new replica is initializing. To change the set of publications without disrupting an existing app, a new app should be created.

flag: `--app-publications`

env: `ZERO_APP_PUBLICATIONS`

default: `[]`

### [Auto Reset](https://zero.rocicorp.dev/docs/zero-cache-config\#auto-reset)

Automatically wipe and resync the replica when replication is halted. This situation can occur for configurations in which the upstream database provider prohibits event trigger creation, preventing the zero-cache from being able to correctly replicate schema changes. For such configurations, an upstream schema change will instead result in halting replication with an error indicating that the replica needs to be reset. When auto-reset is enabled, zero-cache will respond to such situations by shutting down, and when restarted, resetting the replica and all synced clients. This is a heavy-weight operation and can result in user-visible slowness or downtime if compute resources are scarce.

flag: `--auto-reset`

env: `ZERO_AUTO_RESET`

default: `true`

### [Change DB](https://zero.rocicorp.dev/docs/zero-cache-config\#change-db)

The Postgres database used to store recent replication log entries, in order to sync multiple view-syncers without requiring multiple replication slots on the upstream database. If unspecified, the upstream-db will be used.

flag: `--change-db`

env: `ZERO_CHANGE_DB`

### [Change Max Connections](https://zero.rocicorp.dev/docs/zero-cache-config\#change-max-connections)

The maximum number of connections to open to the change database. This is used by the change-streamer for catching up zero-cache replication subscriptions.

flag: `--change-max-conns`

env: `ZERO_CHANGE_MAX_CONNS`

default: `5`

### [Change Streamer Mode](https://zero.rocicorp.dev/docs/zero-cache-config\#change-streamer-mode)

The mode for running or connecting to the change-streamer:

- `dedicated`: runs the change-streamer and shuts down when another
change-streamer takes over the replication slot. This is appropriate in a
single-node configuration, or for the replication-manager in a
multi-node configuration.
- `discover`: connects to the change-streamer as internally advertised in the
change-db. This is appropriate for the view-syncers in a multi-node setup.
This may not work in all networking configurations (e.g., some private
networking or port forwarding setups). Using `ZERO_CHANGE_STREAMER_URI` with
an explicit routable hostname is recommended instead.

This option is ignored if `ZERO_CHANGE_STREAMER_URI` is set.

flag: `--change-streamer-mode`

env: `ZERO_CHANGE_STREAMER_MODE`

default: `dedicated`

### [Change Streamer Port](https://zero.rocicorp.dev/docs/zero-cache-config\#change-streamer-port)

The port on which the change-streamer runs. This is an internal protocol between the replication-manager and view-syncers, which runs in the same process tree in local development or a single-node configuration. If unspecified, defaults to `--port + 1`.

flag: `--change-streamer-port`

env: `ZERO_CHANGE_STREAMER_PORT`

default: `--port + 1`

### [Change Streamer Startup Delay (ms)](https://zero.rocicorp.dev/docs/zero-cache-config\#change-streamer-startup-delay-ms)

The delay to wait before the change-streamer takes over the replication stream (i.e. the handoff during replication-manager updates), to allow load balancers to register the task as healthy based on healthcheck parameters. If a change stream request is received during this interval, the delay will be canceled and the takeover will happen immediately, since the incoming request indicates that the task is registered as a target.

flag: `--change-streamer-startup-delay-ms`

env: `ZERO_CHANGE_STREAMER_STARTUP_DELAY_MS`

default: `15000`

### [Change Streamer URI](https://zero.rocicorp.dev/docs/zero-cache-config\#change-streamer-uri)

When set, connects to the change-streamer at the given URI. In a multi-node setup, this should be specified in view-syncer options, pointing to the replication-manager URI, which runs a change-streamer on port 4849.

flag: `--change-streamer-uri`

env: `ZERO_CHANGE_STREAMER_URI`

### [CVR DB](https://zero.rocicorp.dev/docs/zero-cache-config\#cvr-db)

The Postgres database used to store CVRs. CVRs (client view records) keep track of the data synced to clients in order to determine the diff to send on reconnect. If unspecified, the upstream-db will be used.

flag: `--cvr-db`

env: `ZERO_CVR_DB`

### [CVR Garbage Collection Inactivity Threshold Hours](https://zero.rocicorp.dev/docs/zero-cache-config\#cvr-garbage-collection-inactivity-threshold-hours)

The duration after which an inactive CVR is eligible for garbage collection. Garbage collection is incremental and periodic, so eligible CVRs are not necessarily purged immediately.

flag: `--cvr-garbage-collection-inactivity-threshold-hours`

env: `ZERO_CVR_GARBAGE_COLLECTION_INACTIVITY_THRESHOLD_HOURS`

default: `48`

### [CVR Garbage Collection Initial Batch Size](https://zero.rocicorp.dev/docs/zero-cache-config\#cvr-garbage-collection-initial-batch-size)

The initial number of CVRs to purge per garbage collection interval. This number is increased linearly if the rate of new CVRs exceeds the rate of purged CVRs, in order to reach a steady state. Setting this to 0 effectively disables CVR garbage collection.

flag: `--cvr-garbage-collection-initial-batch-size`

env: `ZERO_CVR_GARBAGE_COLLECTION_INITIAL_BATCH_SIZE`

default: `25`

### [CVR Garbage Collection Initial Interval Seconds](https://zero.rocicorp.dev/docs/zero-cache-config\#cvr-garbage-collection-initial-interval-seconds)

The initial interval at which to check and garbage collect inactive CVRs. This interval is increased exponentially (up to 16 minutes) when there is nothing to purge.

flag: `--cvr-garbage-collection-initial-interval-seconds`

env: `ZERO_CVR_GARBAGE_COLLECTION_INITIAL_INTERVAL_SECONDS`

default: `60`

### [CVR Max Connections](https://zero.rocicorp.dev/docs/zero-cache-config\#cvr-max-connections)

The maximum number of connections to open to the CVR database. This is divided evenly amongst sync workers.

Note that this number must allow for at least one connection per sync worker, or zero-cache will fail to start. See num-sync-workers.

flag: `--cvr-max-conns`

env: `ZERO_CVR_MAX_CONNS`

default: `30`

### [Enable Query Planner](https://zero.rocicorp.dev/docs/zero-cache-config\#enable-query-planner)

Enable the query planner for optimizing ZQL queries.

The query planner analyzes and optimizes query execution by determining the most efficient join strategies.

You can disable the planner if it is picking bad strategies.

flag: `--enable-query-planner`

env: `ZERO_ENABLE_QUERY_PLANNER`

default: `true`

### [Enable Telemetry](https://zero.rocicorp.dev/docs/zero-cache-config\#enable-telemetry)

Zero collects anonymous telemetry data to help us understand usage. We collect:

- Zero version
- Uptime
- General machine information, like the number of CPUs, OS, CI/CD environment, etc.
- Information about usage, such as number of queries or mutations processed per hour.

This is completely optional and can be disabled at any time. You can also opt-out by setting `DO_NOT_TRACK=1`.

flag: `--enable-telemetry`

env: `ZERO_ENABLE_TELEMETRY`

default: `true`

### [Initial Sync Table Copy Workers](https://zero.rocicorp.dev/docs/zero-cache-config\#initial-sync-table-copy-workers)

The number of parallel workers used to copy tables during initial sync. Each worker uses a database connection, copies a single table at a time, and buffers up to (approximately) 10 MB of table data in memory during initial sync. Increasing the number of workers may improve initial sync speed; however, local disk throughput (IOPS), upstream CPU, and network bandwidth may also be bottlenecks.

flag: `--initial-sync-table-copy-workers`

env: `ZERO_INITIAL_SYNC_TABLE_COPY_WORKERS`

default: `5`

### [Lazy Startup](https://zero.rocicorp.dev/docs/zero-cache-config\#lazy-startup)

Delay starting the majority of zero-cache until first request.

This is mainly intended to avoid connecting to Postgres replication stream until the first request is received, which can be useful i.e., for preview instances.

Currently only supported in single-node mode.

flag: `--lazy-startup`

env: `ZERO_LAZY_STARTUP`

default: `false`

### [Litestream Backup URL](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-backup-url)

The location of the litestream backup, usually an s3:// URL. This is only consulted by the replication-manager. view-syncers receive this information from the replication-manager.

In multi-node deployments, this is required on the replication-manager so view-syncers can reserve snapshots; in single-node deployments it is optional.

flag: `--litestream-backup-url`

env: `ZERO_LITESTREAM_BACKUP_URL`

### [Litestream Checkpoint Threshold MB](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-checkpoint-threshold-mb)

The size of the WAL file at which to perform an SQlite checkpoint to apply the writes in the WAL to the main database file. Each checkpoint creates a new WAL segment file that will be backed up by litestream. Smaller thresholds may improve read performance, at the expense of creating more files to download when restoring the replica from the backup.

flag: `--litestream-checkpoint-threshold-mb`

env: `ZERO_LITESTREAM_CHECKPOINT_THRESHOLD_MB`

default: `40`

### [Litestream Config Path](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-config-path)

Path to the litestream yaml config file. zero-cache will run this with its environment variables, which can be referenced in the file via `${ENV}` substitution, for example:

- ZERO\_REPLICA\_FILE for the db Path
- ZERO\_LITESTREAM\_BACKUP\_LOCATION for the db replica url
- ZERO\_LITESTREAM\_LOG\_LEVEL for the log Level
- ZERO\_LOG\_FORMAT for the log type

flag: `--litestream-config-path`

env: `ZERO_LITESTREAM_CONFIG_PATH`

default: `./src/services/litestream/config.yml`

### [Litestream Executable](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-executable)

Path to the litestream executable. This option has no effect if litestream-backup-url is unspecified.

flag: `--litestream-executable`

env: `ZERO_LITESTREAM_EXECUTABLE`

### [Litestream Incremental Backup Interval Minutes](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-incremental-backup-interval-minutes)

The interval between incremental backups of the replica. Shorter intervals reduce the amount of change history that needs to be replayed when catching up a new view-syncer, at the expense of increasing the number of files needed to download for the initial litestream restore.

flag: `--litestream-incremental-backup-interval-minutes`

env: `ZERO_LITESTREAM_INCREMENTAL_BACKUP_INTERVAL_MINUTES`

default: `15`

### [Litestream Maximum Checkpoint Page Count](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-maximum-checkpoint-page-count)

The WAL page count at which SQLite performs a RESTART checkpoint, which blocks writers until complete. Defaults to `minCheckpointPageCount * 10`. Set to `0` to disable RESTART checkpoints entirely.

flag: `--litestream-max-checkpoint-page-count`

env: `ZERO_LITESTREAM_MAX_CHECKPOINT_PAGE_COUNT`

default: `minCheckpointPageCount * 10`

### [Litestream Minimum Checkpoint Page Count](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-minimum-checkpoint-page-count)

The WAL page count at which SQLite attempts a PASSIVE checkpoint, which transfers pages to the main database file without blocking writers. Defaults to `checkpointThresholdMB * 250` (since SQLite page size is 4KB).

flag: `--litestream-min-checkpoint-page-count`

env: `ZERO_LITESTREAM_MIN_CHECKPOINT_PAGE_COUNT`

default: `checkpointThresholdMB * 250`

### [Litestream Multipart Concurrency](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-multipart-concurrency)

The number of parts (of size --litestream-multipart-size bytes) to upload or download in parallel when backing up or restoring the snapshot.

flag: `--litestream-multipart-concurrency`

env: `ZERO_LITESTREAM_MULTIPART_CONCURRENCY`

default: `48`

### [Litestream Multipart Size](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-multipart-size)

The size of each part when uploading or downloading the snapshot with
`--litestream-multipart-concurrency`. Note that up to `concurrency * size`
bytes of memory are used when backing up or restoring the snapshot.

flag: `--litestream-multipart-size`

env: `ZERO_LITESTREAM_MULTIPART_SIZE`

default: `16777216` (16 MiB)

### [Litestream Log Level](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-log-level)

flag: `--litestream-log-level`

env: `ZERO_LITESTREAM_LOG_LEVEL`

default: `warn`
values: `debug`, `info`, `warn`, `error`

### [Litestream Port](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-port)

Port on which litestream exports metrics, used to determine the replication
watermark up to which it is safe to purge change log records.

flag: `--litestream-port`

env: `ZERO_LITESTREAM_PORT`

default: `--port + 2`

### [Litestream Restore Parallelism](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-restore-parallelism)

The number of WAL files to download in parallel when performing the initial restore of the replica from the backup.

flag: `--litestream-restore-parallelism`

env: `ZERO_LITESTREAM_RESTORE_PARALLELISM`

default: `48`

### [Litestream Snapshot Backup Interval Hours](https://zero.rocicorp.dev/docs/zero-cache-config\#litestream-snapshot-backup-interval-hours)

The interval between snapshot backups of the replica. Snapshot backups make a full copy of the database to a new litestream generation. This improves restore time at the expense of bandwidth. Applications with a large database and low write rate can increase this interval to reduce network usage for backups (litestream defaults to 24 hours).

flag: `--litestream-snapshot-backup-interval-hours`

env: `ZERO_LITESTREAM_SNAPSHOT_BACKUP_INTERVAL_HOURS`

default: `12`

### [Log Format](https://zero.rocicorp.dev/docs/zero-cache-config\#log-format)

Use text for developer-friendly console logging and json for consumption by structured-logging services.

flag: `--log-format`

env: `ZERO_LOG_FORMAT`

default: `"text"`

values: `text`, `json`

### [Log IVM Sampling](https://zero.rocicorp.dev/docs/zero-cache-config\#log-ivm-sampling)

How often to collect IVM metrics. 1 out of N requests will be sampled where N is this value.

flag: `--log-ivm-sampling`

env: `ZERO_LOG_IVM_SAMPLING`

default: `5000`

### [Log Level](https://zero.rocicorp.dev/docs/zero-cache-config\#log-level)

Sets the logging level for the application.

flag: `--log-level`

env: `ZERO_LOG_LEVEL`

default: `"info"`

values: `debug`, `info`, `warn`, `error`

### [Log Slow Hydrate Threshold](https://zero.rocicorp.dev/docs/zero-cache-config\#log-slow-hydrate-threshold)

The number of milliseconds a query hydration must take to print a slow warning.

flag: `--log-slow-hydrate-threshold`

env: `ZERO_LOG_SLOW_HYDRATE_THRESHOLD`

default: `100`

### [Log Slow Row Threshold](https://zero.rocicorp.dev/docs/zero-cache-config\#log-slow-row-threshold)

The number of ms a row must take to fetch from table-source before it is considered slow.

flag: `--log-slow-row-threshold`

env: `ZERO_LOG_SLOW_ROW_THRESHOLD`

default: `2`

### [Mutate API Key](https://zero.rocicorp.dev/docs/zero-cache-config\#mutate-api-key)

An optional secret used to authorize zero-cache to call the API server handling writes.

flag: `--mutate-api-key`

env: `ZERO_MUTATE_API_KEY`

### [Mutate Forward Cookies](https://zero.rocicorp.dev/docs/zero-cache-config\#mutate-forward-cookies)

If true, zero-cache will forward cookies from the request to zero-cache to your mutate endpoint. This is useful for passing authentication cookies to the API server. If false, cookies are not forwarded.

flag: `--mutate-forward-cookies`

env: `ZERO_MUTATE_FORWARD_COOKIES`

default: `false`

### [Mutate URL](https://zero.rocicorp.dev/docs/zero-cache-config\#mutate-url)

The URL of the API server to which zero-cache will push mutations. URLs are matched using URLPattern, a standard Web API.

Pattern syntax (similar to Express routes):

- Exact URL match: `"https://api.example.com/mutate"`
- Any subdomain using wildcard: `"https://*.example.com/mutate"`
- Multiple subdomain levels: `"https://*.*.example.com/mutate"`
- Any path under a domain: `"https://api.example.com/*"`
- Named path parameters: `"https://api.example.com/:version/mutate"`
  - Matches `https://api.example.com/v1/mutate`, `https://api.example.com/v2/mutate`, etc.

Advanced patterns:

- Optional path segments: `"https://api.example.com/:path?"`
- Regex in segments (for specific patterns): `"https://api.example.com/:version(v\\d+)/mutate"` matches only `v` followed by digits.

Multiple patterns can be specified, for example:

- `["https://api1.example.com/mutate", "https://api2.example.com/mutate"]`

Query parameters and URL fragments (`#`) are ignored during matching. See [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) for full syntax.

flag: `--mutate-url`

env: `ZERO_MUTATE_URL`

### [Number of Sync Workers](https://zero.rocicorp.dev/docs/zero-cache-config\#number-of-sync-workers)

The number of processes to use for view syncing. Leave this unset to use the maximum available parallelism. If set to 0, the server runs without sync workers, which is the configuration for running the replication-manager in multi-node deployments.

flag: `--num-sync-workers`

env: `ZERO_NUM_SYNC_WORKERS`

### [Per User Mutation Limit Max](https://zero.rocicorp.dev/docs/zero-cache-config\#per-user-mutation-limit-max)

The maximum mutations per user within the specified windowMs.

flag: `--per-user-mutation-limit-max`

env: `ZERO_PER_USER_MUTATION_LIMIT_MAX`

### [Per User Mutation Limit Window (ms)](https://zero.rocicorp.dev/docs/zero-cache-config\#per-user-mutation-limit-window-ms)

The sliding window over which the perUserMutationLimitMax is enforced.

flag: `--per-user-mutation-limit-window-ms`

env: `ZERO_PER_USER_MUTATION_LIMIT_WINDOW_MS`

default: `60000`

### [Port](https://zero.rocicorp.dev/docs/zero-cache-config\#port)

The port for sync connections.

flag: `--port`

env: `ZERO_PORT`

default: `4848`

### [Query API Key](https://zero.rocicorp.dev/docs/zero-cache-config\#query-api-key)

An optional secret used to authorize zero-cache to call the API server handling queries.

flag: `--query-api-key`

env: `ZERO_QUERY_API_KEY`

### [Query Forward Cookies](https://zero.rocicorp.dev/docs/zero-cache-config\#query-forward-cookies)

If true, zero-cache will forward cookies from the request to zero-cache to your query endpoint. This is useful for passing authentication cookies to the API server. If false, cookies are not forwarded.

flag: `--query-forward-cookies`

env: `ZERO_QUERY_FORWARD_COOKIES`

default: `false`

### [Query Hydration Stats](https://zero.rocicorp.dev/docs/zero-cache-config\#query-hydration-stats)

Track and log the number of rows considered by query hydrations which take longer than **log-slow-hydrate-threshold** milliseconds.

This is useful for debugging and performance tuning.

flag: `--query-hydration-stats`

env: `ZERO_QUERY_HYDRATION_STATS`

### [Query URL](https://zero.rocicorp.dev/docs/zero-cache-config\#query-url)

The URL of the API server to which zero-cache will send synced queries. URLs are matched using URLPattern, a standard Web API.

Pattern syntax (similar to Express routes):

- Exact URL match: `"https://api.example.com/query"`
- Any subdomain using wildcard: `"https://*.example.com/query"`
- Multiple subdomain levels: `"https://*.*.example.com/query"`
- Any path under a domain: `"https://api.example.com/*"`
- Named path parameters: `"https://api.example.com/:version/query"`
  - Matches `https://api.example.com/v1/query`, `https://api.example.com/v2/query`, etc.

Advanced patterns:

- Optional path segments: `"https://api.example.com/:path?"`
- Regex in segments (for specific patterns): `"https://api.example.com/:version(v\\d+)/query"` matches only `v` followed by digits.

Multiple patterns can be specified, for example:

- `["https://api1.example.com/query", "https://api2.example.com/query"]`

Query parameters and URL fragments (`#`) are ignored during matching. See [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) for full syntax.

flag: `--query-url`

env: `ZERO_QUERY_URL`

### [Replica File](https://zero.rocicorp.dev/docs/zero-cache-config\#replica-file)

File path to the SQLite replica that zero-cache maintains. This can be lost, but if it is, zero-cache will have to re-replicate next time it starts up.

flag: `--replica-file`

env: `ZERO_REPLICA_FILE`

default: `"zero.db"`

### [Replica Vacuum Interval Hours](https://zero.rocicorp.dev/docs/zero-cache-config\#replica-vacuum-interval-hours)

Performs a VACUUM at server startup if the specified number of hours has elapsed since the last VACUUM (or initial-sync). The VACUUM operation is heavyweight and requires double the size of the db in disk space. If unspecified, VACUUM operations are not performed.

flag: `--replica-vacuum-interval-hours`

env: `ZERO_REPLICA_VACUUM_INTERVAL_HOURS`

### [Replica Page Cache Size KiB](https://zero.rocicorp.dev/docs/zero-cache-config\#replica-page-cache-size-kib)

The SQLite page cache size in kibibytes (KiB) for view-syncer connections. The page cache stores recently accessed database pages in memory to reduce disk I/O. Larger cache sizes improve performance for workloads that fit in cache. If unspecified, SQLite's default (~2 MB) is used. Note that the effective memory use of this setting will be: `2 * cache_size * num_cores`, as each connection to the replica gets its own cache and each core maintains 2 connections.

flag: `--replica-page-cache-size-kib`

env: `ZERO_REPLICA_PAGE_CACHE_SIZE_KIB`

### [Server Version](https://zero.rocicorp.dev/docs/zero-cache-config\#server-version)

The version string outputted to logs when the server starts up.

flag: `--server-version`

env: `ZERO_SERVER_VERSION`

### [Storage DB Temp Dir](https://zero.rocicorp.dev/docs/zero-cache-config\#storage-db-temp-dir)

Temporary directory for IVM operator storage. Leave unset to use `os.tmpdir()`.

flag: `--storage-db-tmp-dir`

env: `ZERO_STORAGE_DB_TMP_DIR`

### [Task ID](https://zero.rocicorp.dev/docs/zero-cache-config\#task-id)

Globally unique identifier for the zero-cache instance. Setting this to a platform specific task identifier can be useful for debugging. If unspecified, zero-cache will attempt to extract the TaskARN if run from within an AWS ECS container, and otherwise use a random string.

flag: `--task-id`

env: `ZERO_TASK_ID`

### [Upstream Max Connections](https://zero.rocicorp.dev/docs/zero-cache-config\#upstream-max-connections)

The maximum number of connections to open to the upstream database for committing mutations. This is divided evenly amongst sync workers. In addition to this number, zero-cache uses one connection for the replication stream.

Note that this number must allow for at least one connection per sync worker, or zero-cache will fail to start. See num-sync-workers.

flag: `--upstream-max-conns`

env: `ZERO_UPSTREAM_MAX_CONNS`

default: `20`

### [Websocket Compression](https://zero.rocicorp.dev/docs/zero-cache-config\#websocket-compression)

Enable WebSocket per-message deflate compression. Compression can reduce bandwidth usage for sync traffic but increases CPU usage on both client and server. Disabled by default. See: [https://github.com/websockets/ws#websocket-compression](https://github.com/websockets/ws#websocket-compression)

flag: `--websocket-compression`

env: `ZERO_WEBSOCKET_COMPRESSION`

default: `false`

### [Websocket Compression Options](https://zero.rocicorp.dev/docs/zero-cache-config\#websocket-compression-options)

JSON string containing WebSocket compression options. Only used if websocket-compression is enabled. Example: `{"zlibDeflateOptions":{"level":3},"threshold":1024}`. See [https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback) for available options.

flag: `--websocket-compression-options`

env: `ZERO_WEBSOCKET_COMPRESSION_OPTIONS`

### [Yield Threshold (ms)](https://zero.rocicorp.dev/docs/zero-cache-config\#yield-threshold-ms)

The maximum amount of time in milliseconds that a sync worker will spend in IVM (processing query hydration and advancement) before yielding to the event loop. Lower values increase responsiveness and fairness at the cost of reduced throughput.

flag: `--yield-threshold-ms`

env: `ZERO_YIELD_THRESHOLD_MS`

default: `10`

## [Deprecated Flags](https://zero.rocicorp.dev/docs/zero-cache-config\#deprecated-flags)

### [Auth JWK](https://zero.rocicorp.dev/docs/zero-cache-config\#auth-jwk)

A public key in JWK format used to verify JWTs. Only one of jwk, jwksUrl and secret may be set.

flag: `--auth-jwk`

env: `ZERO_AUTH_JWK`

### [Auth JWKS URL](https://zero.rocicorp.dev/docs/zero-cache-config\#auth-jwks-url)

A URL that returns a JWK set used to verify JWTs. Only one of jwk, jwksUrl and secret may be set.

flag: `--auth-jwks-url`

env: `ZERO_AUTH_JWKS_URL`

### [Auth Secret](https://zero.rocicorp.dev/docs/zero-cache-config\#auth-secret)

A symmetric key used to verify JWTs. Only one of jwk, jwksUrl and secret may be set.

flag: `--auth-secret`

env: `ZERO_AUTH_SECRET`

[PreviousHosting](https://zero.rocicorp.dev/docs/deployment)

[NextInspector](https://zero.rocicorp.dev/docs/debug/inspector)

### On this page

[Required Flags](https://zero.rocicorp.dev/docs/zero-cache-config#required-flags) [Upstream DB](https://zero.rocicorp.dev/docs/zero-cache-config#upstream-db) [Admin Password](https://zero.rocicorp.dev/docs/zero-cache-config#admin-password) [Optional Flags](https://zero.rocicorp.dev/docs/zero-cache-config#optional-flags) [App ID](https://zero.rocicorp.dev/docs/zero-cache-config#app-id) [App Publications](https://zero.rocicorp.dev/docs/zero-cache-config#app-publications) [Auto Reset](https://zero.rocicorp.dev/docs/zero-cache-config#auto-reset) [Change DB](https://zero.rocicorp.dev/docs/zero-cache-config#change-db) [Change Max Connections](https://zero.rocicorp.dev/docs/zero-cache-config#change-max-connections) [Change Streamer Mode](https://zero.rocicorp.dev/docs/zero-cache-config#change-streamer-mode) [Change Streamer Port](https://zero.rocicorp.dev/docs/zero-cache-config#change-streamer-port) [Change Streamer Startup Delay (ms)](https://zero.rocicorp.dev/docs/zero-cache-config#change-streamer-startup-delay-ms) [Change Streamer URI](https://zero.rocicorp.dev/docs/zero-cache-config#change-streamer-uri) [CVR DB](https://zero.rocicorp.dev/docs/zero-cache-config#cvr-db) [CVR Garbage Collection Inactivity Threshold Hours](https://zero.rocicorp.dev/docs/zero-cache-config#cvr-garbage-collection-inactivity-threshold-hours) [CVR Garbage Collection Initial Batch Size](https://zero.rocicorp.dev/docs/zero-cache-config#cvr-garbage-collection-initial-batch-size) [CVR Garbage Collection Initial Interval Seconds](https://zero.rocicorp.dev/docs/zero-cache-config#cvr-garbage-collection-initial-interval-seconds) [CVR Max Connections](https://zero.rocicorp.dev/docs/zero-cache-config#cvr-max-connections) [Enable Query Planner](https://zero.rocicorp.dev/docs/zero-cache-config#enable-query-planner) [Enable Telemetry](https://zero.rocicorp.dev/docs/zero-cache-config#enable-telemetry) [Initial Sync Table Copy Workers](https://zero.rocicorp.dev/docs/zero-cache-config#initial-sync-table-copy-workers) [Lazy Startup](https://zero.rocicorp.dev/docs/zero-cache-config#lazy-startup) [Litestream Backup URL](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-backup-url) [Litestream Checkpoint Threshold MB](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-checkpoint-threshold-mb) [Litestream Config Path](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-config-path) [Litestream Executable](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-executable) [Litestream Incremental Backup Interval Minutes](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-incremental-backup-interval-minutes) [Litestream Maximum Checkpoint Page Count](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-maximum-checkpoint-page-count) [Litestream Minimum Checkpoint Page Count](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-minimum-checkpoint-page-count) [Litestream Multipart Concurrency](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-multipart-concurrency) [Litestream Multipart Size](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-multipart-size) [Litestream Log Level](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-log-level) [Litestream Port](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-port) [Litestream Restore Parallelism](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-restore-parallelism) [Litestream Snapshot Backup Interval Hours](https://zero.rocicorp.dev/docs/zero-cache-config#litestream-snapshot-backup-interval-hours) [Log Format](https://zero.rocicorp.dev/docs/zero-cache-config#log-format) [Log IVM Sampling](https://zero.rocicorp.dev/docs/zero-cache-config#log-ivm-sampling) [Log Level](https://zero.rocicorp.dev/docs/zero-cache-config#log-level) [Log Slow Hydrate Threshold](https://zero.rocicorp.dev/docs/zero-cache-config#log-slow-hydrate-threshold) [Log Slow Row Threshold](https://zero.rocicorp.dev/docs/zero-cache-config#log-slow-row-threshold) [Mutate API Key](https://zero.rocicorp.dev/docs/zero-cache-config#mutate-api-key) [Mutate Forward Cookies](https://zero.rocicorp.dev/docs/zero-cache-config#mutate-forward-cookies) [Mutate URL](https://zero.rocicorp.dev/docs/zero-cache-config#mutate-url) [Number of Sync Workers](https://zero.rocicorp.dev/docs/zero-cache-config#number-of-sync-workers) [Per User Mutation Limit Max](https://zero.rocicorp.dev/docs/zero-cache-config#per-user-mutation-limit-max) [Per User Mutation Limit Window (ms)](https://zero.rocicorp.dev/docs/zero-cache-config#per-user-mutation-limit-window-ms) [Port](https://zero.rocicorp.dev/docs/zero-cache-config#port) [Query API Key](https://zero.rocicorp.dev/docs/zero-cache-config#query-api-key) [Query Forward Cookies](https://zero.rocicorp.dev/docs/zero-cache-config#query-forward-cookies) [Query Hydration Stats](https://zero.rocicorp.dev/docs/zero-cache-config#query-hydration-stats) [Query URL](https://zero.rocicorp.dev/docs/zero-cache-config#query-url) [Replica File](https://zero.rocicorp.dev/docs/zero-cache-config#replica-file) [Replica Vacuum Interval Hours](https://zero.rocicorp.dev/docs/zero-cache-config#replica-vacuum-interval-hours) [Replica Page Cache Size KiB](https://zero.rocicorp.dev/docs/zero-cache-config#replica-page-cache-size-kib) [Server Version](https://zero.rocicorp.dev/docs/zero-cache-config#server-version) [Storage DB Temp Dir](https://zero.rocicorp.dev/docs/zero-cache-config#storage-db-temp-dir) [Task ID](https://zero.rocicorp.dev/docs/zero-cache-config#task-id) [Upstream Max Connections](https://zero.rocicorp.dev/docs/zero-cache-config#upstream-max-connections) [Websocket Compression](https://zero.rocicorp.dev/docs/zero-cache-config#websocket-compression) [Websocket Compression Options](https://zero.rocicorp.dev/docs/zero-cache-config#websocket-compression-options) [Yield Threshold (ms)](https://zero.rocicorp.dev/docs/zero-cache-config#yield-threshold-ms) [Deprecated Flags](https://zero.rocicorp.dev/docs/zero-cache-config#deprecated-flags) [Auth JWK](https://zero.rocicorp.dev/docs/zero-cache-config#auth-jwk) [Auth JWKS URL](https://zero.rocicorp.dev/docs/zero-cache-config#auth-jwks-url) [Auth Secret](https://zero.rocicorp.dev/docs/zero-cache-config#auth-secret)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/zero-cache-config.mdx)