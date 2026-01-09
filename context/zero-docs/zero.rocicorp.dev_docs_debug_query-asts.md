---
url: "https://zero.rocicorp.dev/docs/debug/query-asts"
title: "Query ASTs"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# Query ASTs  Copy markdown  \\# Query ASTs  An AST (Abstract Syntax Tree) is a representation of a query that is used internally by Zero. It is not meant to be human readable, but it sometimes shows up in logs and other places.  If you need to read one of these, save the AST to a json file. Then run the following command:  \`\`\`bash cat ast.json \| npx ast-to-zql \`\`\`  The returned ZQL query will be using server names, rather than client names, to identify columns and tables. If you provide the schema file as an option you will get mapped back to client names:  \`\`\`bash cat ast.json \| npx ast-to-zql --schema schema.ts \`\`\`  This comes into play if, in your schema.ts, you use the \`from\` feature to have different names on the client than your backend DB.  \> The \`ast-to-zql\` process is a de-compilation of sorts. Given that, the ZQL string you get back will not be identical to the one you wrote in your application. Regardless, the queries will be semantically equivalent.      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

An AST (Abstract Syntax Tree) is a representation of a query that is used internally by Zero. It is not meant to be human readable, but it sometimes shows up in logs and other places.

If you need to read one of these, save the AST to a json file. Then run the following command:

```
Copycat ast.json | npx ast-to-zql
```

The returned ZQL query will be using server names, rather than client names, to identify columns and tables.
If you provide the schema file as an option you will get mapped back to client names:

```
Copycat ast.json | npx ast-to-zql --schema schema.ts
```

This comes into play if, in your schema.ts, you use the `from` feature to have different names on the client than your backend DB.

[🤔Note](https://zero.rocicorp.dev/docs/debug/query-asts#decompilation)

[PreviousReplication](https://zero.rocicorp.dev/docs/debug/replication)

[NextOpenTelemetry](https://zero.rocicorp.dev/docs/debug/otel)