---
url: "https://zero.rocicorp.dev/docs/postgres-support"
title: "Supported Postgres Features"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# Supported Postgres Features  Copy markdown  \\# Supported Postgres Features  Postgres has a massive feature set, and Zero supports a growing subset of it.  \\#\# Object Names  \\* Table and column names must begin with a letter or underscore \\* This can be followed by letters, numbers, underscores, and hyphens \\* Regex: \`/^\[A-Za-z\_\]+\[A-Za-z0-9\_-\]\*$/\` \\* The column name \`\_0\_version\` is reserved for internal use  \\#\# Object Types  \\* Tables are synced. \\* Views are not synced. \\* \`generated as identity\` columns are synced. \\* In Postgres 18+, \`generated stored\` columns are synced. In lower Postgres versions they aren't. \\* Indexes aren't \*synced\* per-se, but we do implicitly add indexes to the replica that match the upstream indexes. In the future, this will be customizable.  \\#\# Column Types  \> ⚠️ \*\*No ZQL operators for arrays yet\*\*: Zero will sync arrays to the client, but there is no support for filtering or joining on array elements yet in ZQL.  Other Postgres column types aren’t supported. They will be ignored when replicating (the synced data will be missing that column) and you will get a warning when \`zero-cache\` starts up.  If your schema has a pg type not listed here, you can support it in Zero by using a trigger to map it to some type that Zero can support. For example if you have a \[GIS polygon type\](https://www.postgresql.org/docs/current/datatype-geometric.html\#DATATYPE-POLYGON) in the column \`my\_poly polygon\`, you can use a trigger to map it to a \`my\_poly\_json json\` column. You could either use another trigger to map in the reverse direction to support changes for writes, or you could use a \[mutator\](https://zero.rocicorp.dev/docs/mutators) to write to the polygon type directly on the server.  Let us know if the lack of a particular column type is hindering your use of Zero. It can likely be added.  \\#\# Column Defaults  Default values are allowed in the Postgres schema, but there currently is no way to use them from a Zero app.  An \`insert()\` mutation requires all columns to be specified, except when columns are nullable (in which case, they default to null). Since there is no way to leave non-nullable columns off the insert on the client, there is no way for PG to apply the default. This is a known issue and will be fixed in the future.  \\#\# IDs  It is strongly recommended to use client-generated random strings like \[uuid\](https://www.npmjs.com/package/uuid), \[ulid\](https://www.npmjs.com/package/ulid), \[nanoid\](https://www.npmjs.com/package/nanoid), etc for primary keys. This makes optimistic creation and updates much easier.  \> \*\*Why are client-generated IDs better?\*\*: Imagine that the PK of your table is an auto-incrementing integer. If you optimistically create an entity of this type, you will have to give it some ID – the type will require it locally, but also if you want to optimistically create relationships to this row you’ll need an ID. > \> You could sync the highest value seen for that table, but there are race conditions and it is possible for that ID to be taken by the time the creation makes it to the server. Your database can resolve this and assign the next ID, but now the relationships you created optimistically will be against the wrong row. Blech. > \> GUIDs makes a lot more sense in synced applications. > \> If your table has a natural key you can use that and it has less problems. But there is still the chance for a conflict. Imagine you are modeling orgs and you choose domainName as the natural key. It is possible for a race to happen and when the creation gets to the server, somebody has already chosen that domain name. In that case, the best thing to do is reject the write and show the user an error.  If you want to have a short auto-incrementing numeric ID for UX reasons (i.e., a bug number), that is possible - see \[this video\](https://discord.com/channels/830183651022471199/1288232858795769917/1298114323272568852).  \\#\# Primary Keys  Each table synced with Zero must have either a primary key or at least one unique index. This is needed so that Zero can identify rows during sync, to distinguish between an edit and a remove/add.  Multi-column primary and foreign keys are supported.  \\#\# Limiting Replication  There are two levels of replication to consider with Zero: replicating from Postgres to zero-cache, and from zero-cache to the Zero browser client.  \\#\#\# zero-cache replication  By default, Zero creates a Postgres \[\*publication\*\](https://www.postgresql.org/docs/current/sql-createpublication.html) that publishes all tables in the \`public\` schema to zero-cache.  To limit which tables or columns are replicated to zero-cache, you can create a Postgres \`publication\` with the tables and columns you want:  \`\`\`sql CREATE PUBLICATION zero\_data FOR TABLE users (col1, col2, col3, ...), issues, comments; \`\`\`  Then, specify this publication in the \[App Publications\](https://zero.rocicorp.dev/docs/zero-cache-config\#app-publications) \`zero-cache\` option.  \\#\#\# Browser client replication  You can use \[Read Permissions\](https://zero.rocicorp.dev/docs/auth\#read-permissions) to control which rows are synced from the \`zero-cache\` replica to actual clients (e.g., web browsers).  Currently, Permissions can limit which tables and rows can be replicated to the client. In the near future, you'll also be able to use Permissions to limit syncing individual columns. Until then, you will need to create a publication to control which columns are synced to zero-cache.  \\#\# Schema changes  Most Postgres schema changes are supported as is.  Two cases require special handling:  \\#\#\# Adding columns  Adding a column with a non-constant \`DEFAULT\` value is not supported.  This includes any expression with parentheses, as well as the special functions \`CURRENT\_TIME\`, \`CURRENT\_DATE\`, and \`CURRENT\_TIMESTAMP\`(due to a \[constraint of SQLite\](https://www.sqlite.org/lang\_altertable.html\#altertabaddcol)).  However, the \`DEFAULT\` value of an \*existing\* column can be changed to any value, including non-constant expressions. To achieve the desired column default:  \\* Add the column with no \`DEFAULT\` value \\* Backfill the column with desired values \\* Set the column's \`DEFAULT\` value  \`\`\`sql BEGIN;  ALTER TABLE foo ADD bar ...; -- without a DEFAULT value UPDATE foo SET bar = ...; ALTER TABLE foo ALTER bar SET DEFAULT ...;  COMMIT; \`\`\`  \\#\#\# Changing publications  Postgres allows you to change published tables/columns with an \`ALTER PUBLICATION\` statement. Zero automatically adjusts the table schemas on the replica, but it does not receive the pre-existing data.  To stream the pre-existing data to Zero, make an innocuous \`UPDATE\` after adding the tables/columns to the publication:  \`\`\`sql BEGIN;  ALTER PUBLICATION zero\_data ADD TABLE foo;  ALTER TABLE foo REPLICA IDENTITY FULL; UPDATE foo SET id = id; -- For some column "id" in "foo" ALTER TABLE foo REPLICA IDENTITY DEFAULT;  COMMIT; \`\`\`  \\#\# Self-Referential Relationships  See \[schema\](https://zero.rocicorp.dev/docs/schema\#self-referential-relationships)      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

Postgres has a massive feature set, and Zero supports a growing subset of it.

## [Object Names](https://zero.rocicorp.dev/docs/postgres-support\#object-names)

- Table and column names must begin with a letter or underscore
  - This can be followed by letters, numbers, underscores, and hyphens
  - Regex: `/^[A-Za-z_]+[A-Za-z0-9_-]*$/`
- The column name `_0_version` is reserved for internal use

## [Object Types](https://zero.rocicorp.dev/docs/postgres-support\#object-types)

- Tables are synced.
- Views are not synced.
- `generated as identity` columns are synced.
- In Postgres 18+, `generated stored` columns are synced. In lower Postgres versions they aren't.
- Indexes aren't _synced_ per-se, but we do implicitly add indexes to the replica that match the upstream indexes. In the future, this will be customizable.

## [Column Types](https://zero.rocicorp.dev/docs/postgres-support\#column-types)

| Postgres Type | Type to put in `schema.ts` | Resulting JS/TS Type |
| --- | --- | --- |
| All numeric types | `number` | `number` |
| `char`, `varchar`,`text`, `uuid` | `string` | `string` |
| `bool` | `boolean` | `boolean` |
| `date`, `timestamp`,`timestampz` | `number` | `number` |
| `json`, `jsonb` | `json` | `JSONValue` |
| `enum` | `enumeration` | `string` |
| `T[]` _where `T` is a supported Postgres type_<br>_(but please see ⚠️ below)_ | `json<U[]>` _where `U` is the schema.ts type for`T`_ | `V[]` _where `V` is the JS/TS type for`T`_ |

[⚠️No ZQL operators for arrays yet](https://zero.rocicorp.dev/docs/postgres-support#no-zql-operators-for-arrays-yet)

Other Postgres column types aren’t supported. They will be ignored when replicating (the synced data will be missing that column) and you will get a warning when `zero-cache` starts up.

If your schema has a pg type not listed here, you can support it in Zero by using a trigger to map it to some type that Zero can support. For example if you have a [GIS polygon type](https://www.postgresql.org/docs/current/datatype-geometric.html#DATATYPE-POLYGON) in the column `my_poly polygon`, you can use a trigger to map it to a `my_poly_json json` column. You could either use another trigger to map in the reverse direction to support changes for writes, or you could use a [mutator](https://zero.rocicorp.dev/docs/mutators) to write to the polygon type directly on the server.

Let us know if the lack of a particular column type is hindering your use of Zero. It can likely be added.

## [Column Defaults](https://zero.rocicorp.dev/docs/postgres-support\#column-defaults)

Default values are allowed in the Postgres schema, but there currently is no way to use them from a Zero app.

An `insert()` mutation requires all columns to be specified, except when columns are nullable (in which case, they default to null). Since there is no way to leave non-nullable columns off the insert on the client, there is no way for PG to apply the default. This is a known issue and will be fixed in the future.

## [IDs](https://zero.rocicorp.dev/docs/postgres-support\#ids)

It is strongly recommended to use client-generated random strings like [uuid](https://www.npmjs.com/package/uuid), [ulid](https://www.npmjs.com/package/ulid), [nanoid](https://www.npmjs.com/package/nanoid), etc for primary keys. This makes optimistic creation and updates much easier.

[🤔Why are client-generated IDs better?](https://zero.rocicorp.dev/docs/postgres-support#client-generated-ids)

If you want to have a short auto-incrementing numeric ID for UX reasons (i.e., a bug number), that is possible - see [this video](https://discord.com/channels/830183651022471199/1288232858795769917/1298114323272568852).

## [Primary Keys](https://zero.rocicorp.dev/docs/postgres-support\#primary-keys)

Each table synced with Zero must have either a primary key or at least one unique index. This is needed so that Zero can identify rows during sync, to distinguish between an edit and a remove/add.

Multi-column primary and foreign keys are supported.

## [Limiting Replication](https://zero.rocicorp.dev/docs/postgres-support\#limiting-replication)

There are two levels of replication to consider with Zero: replicating from Postgres to zero-cache, and from zero-cache to the Zero browser client.

### [zero-cache replication](https://zero.rocicorp.dev/docs/postgres-support\#zero-cache-replication)

By default, Zero creates a Postgres [_publication_](https://www.postgresql.org/docs/current/sql-createpublication.html) that publishes all tables in the `public` schema to zero-cache.

To limit which tables or columns are replicated to zero-cache, you can create a Postgres `publication` with the tables and columns you want:

```
CopyCREATE PUBLICATION zero_data FOR TABLE users (col1, col2, col3, ...), issues, comments;
```

Then, specify this publication in the [App Publications](https://zero.rocicorp.dev/docs/zero-cache-config#app-publications)`zero-cache` option.

### [Browser client replication](https://zero.rocicorp.dev/docs/postgres-support\#browser-client-replication)

You can use [Read Permissions](https://zero.rocicorp.dev/docs/auth#read-permissions) to control which rows are synced from the `zero-cache` replica to actual clients (e.g., web browsers).

Currently, Permissions can limit which tables and rows can be replicated to the client. In the near future, you'll also be able to use Permissions to limit syncing individual columns. Until then, you will need to create a publication to control which columns are synced to zero-cache.

## [Schema changes](https://zero.rocicorp.dev/docs/postgres-support\#schema-changes)

Most Postgres schema changes are supported as is.

Two cases require special handling:

### [Adding columns](https://zero.rocicorp.dev/docs/postgres-support\#adding-columns)

Adding a column with a non-constant `DEFAULT` value is not supported.

This includes any expression with parentheses, as well as the special functions `CURRENT_TIME`, `CURRENT_DATE`, and `CURRENT_TIMESTAMP`
(due to a [constraint of SQLite](https://www.sqlite.org/lang_altertable.html#altertabaddcol)).

However, the `DEFAULT` value of an _existing_ column can be changed to any value, including non-constant expressions. To achieve the desired column default:

- Add the column with no `DEFAULT` value
- Backfill the column with desired values
- Set the column's `DEFAULT` value

```
CopyBEGIN;

ALTER TABLE foo ADD bar ...;  -- without a DEFAULT value
UPDATE foo SET bar = ...;
ALTER TABLE foo ALTER bar SET DEFAULT ...;

COMMIT;
```

### [Changing publications](https://zero.rocicorp.dev/docs/postgres-support\#changing-publications)

Postgres allows you to change published tables/columns with an `ALTER PUBLICATION` statement. Zero automatically adjusts the table schemas on the replica, but it does not receive the pre-existing data.

To stream the pre-existing data to Zero, make an innocuous `UPDATE` after adding the tables/columns to the publication:

```
CopyBEGIN;

ALTER PUBLICATION zero_data ADD TABLE foo;

ALTER TABLE foo REPLICA IDENTITY FULL;
UPDATE foo SET id = id;  -- For some column "id" in "foo"
ALTER TABLE foo REPLICA IDENTITY DEFAULT;

COMMIT;
```

## [Self-Referential Relationships](https://zero.rocicorp.dev/docs/postgres-support\#self-referential-relationships)

See [schema](https://zero.rocicorp.dev/docs/schema#self-referential-relationships)

[PreviousProvider Support](https://zero.rocicorp.dev/docs/connecting-to-postgres)

[NextReact](https://zero.rocicorp.dev/docs/react)

### On this page

[Object Names](https://zero.rocicorp.dev/docs/postgres-support#object-names) [Object Types](https://zero.rocicorp.dev/docs/postgres-support#object-types) [Column Types](https://zero.rocicorp.dev/docs/postgres-support#column-types) [Column Defaults](https://zero.rocicorp.dev/docs/postgres-support#column-defaults) [IDs](https://zero.rocicorp.dev/docs/postgres-support#ids) [Primary Keys](https://zero.rocicorp.dev/docs/postgres-support#primary-keys) [Limiting Replication](https://zero.rocicorp.dev/docs/postgres-support#limiting-replication) [zero-cache replication](https://zero.rocicorp.dev/docs/postgres-support#zero-cache-replication) [Browser client replication](https://zero.rocicorp.dev/docs/postgres-support#browser-client-replication) [Schema changes](https://zero.rocicorp.dev/docs/postgres-support#schema-changes) [Adding columns](https://zero.rocicorp.dev/docs/postgres-support#adding-columns) [Changing publications](https://zero.rocicorp.dev/docs/postgres-support#changing-publications) [Self-Referential Relationships](https://zero.rocicorp.dev/docs/postgres-support#self-referential-relationships)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/postgres-support.mdx)