---
url: "https://zero.rocicorp.dev/docs/connecting-to-postgres"
title: "Connecting to Postgres"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# Connecting to Postgres  Copy markdown  \\# Connecting to Postgres  In the future, Zero will work with many different backend databases. Today only Postgres is supported. Specifically, Zero requires Postgres v15.0 or higher, and support for \[logical replication\](https://www.postgresql.org/docs/current/logical-replication.html).  Here are some common Postgres options and what we know about their support level:  \| Postgres \| Support Status \| \| \-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\- \| \-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\- \| \| AWS RDS \| ✅ \| \| AWS Aurora \| ✅  v15.6+ \| \| Google Cloud SQL \| ✅  See \[notes below\](\#google-cloud-sql) \| \| \[Fly.io\](https://fly.io) Postgres \| ✅  See \[notes below\](\#flyio) \| \| Neon \| ✅  See \[notes below\](\#neon) \| \| PlanetScale for Postgres \| ✅  See \[notes below\](\#planetscale-for-postgres) \| \| Postgres.app \| ✅ \| \| postgres:16.2-alpine docker image \| ✅ \| \| Supabase \| ✅  See \[notes below\](\#supabase) \| \| Render \| 🤷‍♂️  No \[event triggers\](\#event-triggers) \| \| Heroku \| 🤷‍♂️  No \[event triggers\](\#event-triggers) \|  \\#\# Event Triggers  Zero uses Postgres “ \[Event Triggers\](https://www.postgresql.org/docs/current/sql-createeventtrigger.html)” when possible to implement high-quality, efficient \[schema migration\](https://zero.rocicorp.dev/docs/schema\#migrations).  Some hosted Postgres providers don’t provide access to Event Triggers.  Zero still works out of the box with these providers, but for correctness, any schema change triggers a full reset of all server-side and client-side state. For small databases (\\< 10GB) this can be OK, but for bigger databases we recommend choosing a provider that grants access to Event Triggers.  \\#\# Configuration  \\#\#\# WAL Level  The Postgres \`wal\_level\` config parameter has to be set to \`logical\`. You can check what level your pg has with this command:  \`\`\`bash psql -c 'SHOW wal\_level' \`\`\`  If it doesn’t output \`logical\` then you need to change the wal level. To do this, run:  \`\`\`bash psql -c "ALTER SYSTEM SET wal\_level = 'logical';" \`\`\`  Then restart Postgres. On most pg systems you can do this like so:  \`\`\`bash data\_dir=$(psql -t -A -c 'SHOW data\_directory') pg\_ctl -D "$data\_dir" restart \`\`\`  After your server restarts, show the \`wal\_level\` again to ensure it has changed:  \`\`\`bash psql -c 'SHOW wal\_level' \`\`\`  \\#\#\# Bounding WAL Size  For development databases, you can set a \`max\_slot\_wal\_keep\_size\` value in Postgres. This will help limit the amount of WAL kept around.  This is a configuration parameter that bounds the amount of WAL kept around for replication slots, and \[invalidates the slots that are too far behind\](https://www.postgresql.org/docs/current/runtime-config-replication.html\#GUC-MAX-SLOT-WAL-KEEP-SIZE).  \`zero-cache\` will automatically detect if the replication slot has been invalidated and re-sync replicas from scratch.  This configuration can cause problems like \`slot has been invalidated because it exceeded the maximum reserved size\` and is not recommended for production databases.  \\#\# Provider-Specific Notes  \\#\#\# Google Cloud SQL  Zero works with Google Cloud SQL out of the box. In many configurations, when you connect with a user that has sufficient privileges, \`zero-cache\` will create its default publication automatically.  If your Cloud SQL user does not have permission to create publications, you can still use Zero by \[creating a publication manually\](https://zero.rocicorp.dev/docs/postgres-support\#limiting-replication) and then specifying that publication name in \[App Publications\](https://zero.rocicorp.dev/docs/zero-cache-config\#app-publications) when running \`zero-cache\`.  On Google Cloud SQL for PostgreSQL, enable logical decoding by turning on the instance flag \`cloudsql.logical\_decoding\`. You do not set \`wal\_level\` directly on Cloud SQL. See Google's documentation for details: \[Configure logical replication\](https://cloud.google.com/sql/docs/postgres/replication/configure-logical-replication).  \\#\#\# Fly.io  Fly does not support TLS on their internal networks. If you run both \`zero-cache\` and Postgres on Fly, you need to stop \`zero-cache\` from trying to use TLS to talk to Postgres. You can do this by adding the \`sslmode=disable\`query parameter to your connection strings from \`zero-cache\`.  \\#\#\# Supabase  \\#\#\#\# Postgres Version  Supabase requires at least 15.8.1.083 for event trigger support. If you have a lower 15.x, Zero will still work but \[schema updates will be slower\](\#event-triggers). See Supabase's docs for upgrading your Postgres version.  \\#\#\#\# Connection Type  In order to connect to Supabase you must use the "Direct Connection" style connection string, not the pooler:  !\[Use the "Direct Connection" option to connect zero-cache to your Supabase database.\](https://zero.rocicorp.dev/images/connecting-to-postgres/direct.png)  This is because Zero sets up a logical replication slot, which is only supported with a direct connection.  \\#\#\#\# IPv4  You may also need to assign an IPv4 address to your Supabase instance:  !\[Assign an IPv4 address if you have trouble connecting from residential internet.\](https://zero.rocicorp.dev/images/connecting-to-postgres/ipv4.png)  This will be required if you cannot use IPv6 from wherever \`zero-cache\` is running. Most cloud providers support IPv6, but some do not. For example, if you are running \`zero-cache\` in AWS, it is possible to use IPv6 but difficult. \[Hetzner\](https://www.hetzner.com/) offers cheap hosted VPS that supports IPv6.  IPv4 addresses are only supported on the Pro plan and are an extra $4/month.  \\#\#\# PlanetScale for Postgres  PlanetScale doesn't support creating publications with the \[\`FOR ALL TABLES\` clause\](https://www.postgresql.org/docs/current/sql-createpublication.html). Zero typically uses this to create an initial default publication during setup. You can workaround this by \[creating a publication\](https://zero.rocicorp.dev/docs/postgres-support\#limiting-replication) explicitly listing the tables you want to replicate.  \\#\#\# Neon  Neon fully supports Zero, but you should be aware of how Neon's pricing model and Zero interact.  Because Zero keeps an open connection to Postgres to replicate changes, as long as zero-cache is running, Postgres will be running and you will be charged by Neon.  For production databases that have enough usage to always be running anyway, this is fine. But for smaller applications that would otherwise not always be running, this can create a surprisingly high bill. You may want to choose a provider that charge a flat monthly rate instead.  Also some users choose Neon because they hope to use branching for previews. Note that Zero doesn't support this usage model well yet, and if not done with care, Zero can end up keeping each Neon \*preview\* branch running too 😳.  We are actively working on better preview support.      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

In the future, Zero will work with many different backend databases. Today only Postgres is supported. Specifically, Zero requires Postgres v15.0 or higher, and support for [logical replication](https://www.postgresql.org/docs/current/logical-replication.html).

Here are some common Postgres options and what we know about their support level:

| Postgres | Support Status |
| --- | --- |
| AWS RDS | ✅ |
| AWS Aurora | ✅  v15.6+ |
| Google Cloud SQL | ✅  See [notes below](https://zero.rocicorp.dev/docs/connecting-to-postgres#google-cloud-sql) |
| [Fly.io](https://fly.io/) Postgres | ✅  See [notes below](https://zero.rocicorp.dev/docs/connecting-to-postgres#flyio) |
| Neon | ✅  See [notes below](https://zero.rocicorp.dev/docs/connecting-to-postgres#neon) |
| PlanetScale for Postgres | ✅  See [notes below](https://zero.rocicorp.dev/docs/connecting-to-postgres#planetscale-for-postgres) |
| Postgres.app | ✅ |
| postgres:16.2-alpine docker image | ✅ |
| Supabase | ✅  See [notes below](https://zero.rocicorp.dev/docs/connecting-to-postgres#supabase) |
| Render | 🤷‍♂️  No [event triggers](https://zero.rocicorp.dev/docs/connecting-to-postgres#event-triggers) |
| Heroku | 🤷‍♂️  No [event triggers](https://zero.rocicorp.dev/docs/connecting-to-postgres#event-triggers) |

## [Event Triggers](https://zero.rocicorp.dev/docs/connecting-to-postgres\#event-triggers)

Zero uses Postgres “ [Event Triggers](https://www.postgresql.org/docs/current/sql-createeventtrigger.html)” when possible to implement high-quality, efficient [schema migration](https://zero.rocicorp.dev/docs/schema/#migrations).

Some hosted Postgres providers don’t provide access to Event Triggers.

Zero still works out of the box with these providers, but for correctness, any schema change triggers a full reset of all server-side and client-side state. For small databases (< 10GB) this can be OK, but for bigger databases we recommend choosing a provider that grants access to Event Triggers.

## [Configuration](https://zero.rocicorp.dev/docs/connecting-to-postgres\#configuration)

### [WAL Level](https://zero.rocicorp.dev/docs/connecting-to-postgres\#wal-level)

The Postgres `wal_level` config parameter has to be set to `logical`. You can check what level your pg has with this command:

```
Copypsql -c 'SHOW wal_level'
```

If it doesn’t output `logical` then you need to change the wal level. To do this, run:

```
Copypsql -c "ALTER SYSTEM SET wal_level = 'logical';"
```

Then restart Postgres. On most pg systems you can do this like so:

```
Copydata_dir=$(psql -t -A -c 'SHOW data_directory')
pg_ctl -D "$data_dir" restart
```

After your server restarts, show the `wal_level` again to ensure it has changed:

```
Copypsql -c 'SHOW wal_level'
```

### [Bounding WAL Size](https://zero.rocicorp.dev/docs/connecting-to-postgres\#bounding-wal-size)

For development databases, you can set a `max_slot_wal_keep_size` value in Postgres. This will help limit the amount of WAL kept around.

This is a configuration parameter that bounds the amount of WAL kept around for replication slots, and [invalidates the slots that are too far behind](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-SLOT-WAL-KEEP-SIZE).

`zero-cache` will automatically detect if the replication slot has been invalidated and re-sync replicas from scratch.

This configuration can cause problems like `slot has been invalidated because it exceeded the maximum reserved size` and is not recommended for production databases.

## [Provider-Specific Notes](https://zero.rocicorp.dev/docs/connecting-to-postgres\#provider-specific-notes)

### [Google Cloud SQL](https://zero.rocicorp.dev/docs/connecting-to-postgres\#google-cloud-sql)

Zero works with Google Cloud SQL out of the box. In many configurations, when you connect with a user that has sufficient privileges, `zero-cache` will create its default publication automatically.

If your Cloud SQL user does not have permission to create publications, you can still use Zero by [creating a publication manually](https://zero.rocicorp.dev/docs/postgres-support#limiting-replication) and then specifying that publication name in [App Publications](https://zero.rocicorp.dev/docs/zero-cache-config#app-publications) when running `zero-cache`.

On Google Cloud SQL for PostgreSQL, enable logical decoding by turning on the instance flag `cloudsql.logical_decoding`.
You do not set `wal_level` directly on Cloud SQL.
See Google's documentation for details: [Configure logical replication](https://cloud.google.com/sql/docs/postgres/replication/configure-logical-replication).

### [Fly.io](https://zero.rocicorp.dev/docs/connecting-to-postgres\#flyio)

Fly does not support TLS on their internal networks. If you run both `zero-cache` and Postgres on Fly, you need
to stop `zero-cache` from trying to use TLS to talk to Postgres. You can do this by adding the `sslmode=disable`
query parameter to your connection strings from `zero-cache`.

### [Supabase](https://zero.rocicorp.dev/docs/connecting-to-postgres\#supabase)

#### [Postgres Version](https://zero.rocicorp.dev/docs/connecting-to-postgres\#postgres-version)

Supabase requires at least 15.8.1.083 for event trigger support. If you have a lower 15.x, Zero will still work but [schema updates will be slower](https://zero.rocicorp.dev/docs/connecting-to-postgres#event-triggers). See Supabase's docs for upgrading your Postgres version.

#### [Connection Type](https://zero.rocicorp.dev/docs/connecting-to-postgres\#connection-type)

In order to connect to Supabase you must use the "Direct Connection" style connection string, not the pooler:

![Use the "Direct Connection" option to connect zero-cache to your Supabase database.](https://zero.rocicorp.dev/images/connecting-to-postgres/direct.png)

Use the "Direct Connection" option to connect zero-cache to your Supabase database.

This is because Zero sets up a logical replication slot, which is only supported with a direct connection.

#### [IPv4](https://zero.rocicorp.dev/docs/connecting-to-postgres\#ipv4)

You may also need to assign an IPv4 address to your Supabase instance:

![Assign an IPv4 address if you have trouble connecting from residential internet.](https://zero.rocicorp.dev/images/connecting-to-postgres/ipv4.png)

Assign an IPv4 address if you have trouble connecting from residential internet.

This will be required if you
cannot use IPv6 from wherever `zero-cache` is running. Most cloud providers
support IPv6, but some do not. For example, if you are running `zero-cache` in AWS, it is possible to use IPv6 but
difficult. [Hetzner](https://www.hetzner.com/) offers cheap hosted VPS that supports IPv6.

IPv4 addresses are only supported on the Pro plan and are an extra $4/month.

### [PlanetScale for Postgres](https://zero.rocicorp.dev/docs/connecting-to-postgres\#planetscale-for-postgres)

PlanetScale doesn't support creating publications with the [`FOR ALL TABLES` clause](https://www.postgresql.org/docs/current/sql-createpublication.html). Zero typically uses this to create an initial default publication during setup. You can workaround this by [creating a publication](https://zero.rocicorp.dev/docs/postgres-support#limiting-replication) explicitly listing the tables you want to replicate.

### [Neon](https://zero.rocicorp.dev/docs/connecting-to-postgres\#neon)

Neon fully supports Zero, but you should be aware of how Neon's pricing model and Zero interact.

Because Zero keeps an open connection to Postgres to replicate changes, as long as zero-cache is running, Postgres will be running and you will be charged by Neon.

For production databases that have enough usage to always be running anyway, this is fine. But for smaller applications that would otherwise not always be running, this can create a surprisingly high bill. You may want to choose a provider that charge a flat monthly rate instead.

Also some users choose Neon because they hope to use branching for previews. Note that Zero doesn't support this usage model well yet, and if not done with care, Zero can end up keeping each Neon _preview_ branch running too 😳.

We are actively working on better preview support.

[PreviousConnection Status](https://zero.rocicorp.dev/docs/connection)

[NextFeature Compatibility](https://zero.rocicorp.dev/docs/postgres-support)

### On this page

[Event Triggers](https://zero.rocicorp.dev/docs/connecting-to-postgres#event-triggers) [Configuration](https://zero.rocicorp.dev/docs/connecting-to-postgres#configuration) [WAL Level](https://zero.rocicorp.dev/docs/connecting-to-postgres#wal-level) [Bounding WAL Size](https://zero.rocicorp.dev/docs/connecting-to-postgres#bounding-wal-size) [Provider-Specific Notes](https://zero.rocicorp.dev/docs/connecting-to-postgres#provider-specific-notes) [Google Cloud SQL](https://zero.rocicorp.dev/docs/connecting-to-postgres#google-cloud-sql) [Fly.io](https://zero.rocicorp.dev/docs/connecting-to-postgres#flyio) [Supabase](https://zero.rocicorp.dev/docs/connecting-to-postgres#supabase) [Postgres Version](https://zero.rocicorp.dev/docs/connecting-to-postgres#postgres-version) [Connection Type](https://zero.rocicorp.dev/docs/connecting-to-postgres#connection-type) [IPv4](https://zero.rocicorp.dev/docs/connecting-to-postgres#ipv4) [PlanetScale for Postgres](https://zero.rocicorp.dev/docs/connecting-to-postgres#planetscale-for-postgres) [Neon](https://zero.rocicorp.dev/docs/connecting-to-postgres#neon)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/connecting-to-postgres.mdx)