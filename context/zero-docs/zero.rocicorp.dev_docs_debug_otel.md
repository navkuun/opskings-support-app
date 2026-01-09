---
url: "https://zero.rocicorp.dev/docs/debug/otel"
title: "OpenTelemetry"
---

## For AI assistants

ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

# OpenTelemetry  Copy markdown  \\# OpenTelemetry  The \`zero-cache\` service embeds the \[JavaScript OTLP Exporter\](https://opentelemetry.io/docs/languages/js/) and can send logs, traces, and metrics to any \[standard otel collector\](https://opentelemetry.io/).  To enable otel, set the following environment variables then run \`zero-cache\` as normal:  \`\`\`sh OTEL\_EXPORTER\_OTLP\_ENDPOINT="<your otel endpoint>" OTEL\_EXPORTER\_OTLP\_HEADERS="<auth headers from your otel collector>" OTEL\_RESOURCE\_ATTRIBUTES="<resource attributes from your otel collector>" OTEL\_NODE\_RESOURCE\_DETECTORS="env,host,os" \`\`\`  \\#\# Grafana Cloud Walkthrough  Here are instructions to setup \[Grafana Cloud\](https://grafana.com/oss/grafana/), but the setup for other otel collectors should be similar.  1\. Sign up for \[Grafana Cloud (Free Tier)\](https://grafana.com/auth/sign-up/create-user?pg=login) 2\. Click Connections > Add Connection in the left sidebar !\[add-connection\](https://zero.rocicorp.dev/images/debugging/otel/add-connection.png) 3\. Search for "OpenTelemetry" and select it 4\. Click "Quickstart" !\[quickstart\](https://zero.rocicorp.dev/images/debugging/otel/quickstart.png) 5\. Select "JavaScript" !\[javascript\](https://zero.rocicorp.dev/images/debugging/otel/javascript.png) 6\. Create a new token 7\. Copy the environment variables into your \`.env\` file or similar !\[copy-env\](https://zero.rocicorp.dev/images/debugging/otel/env.png) 8\. Start \`zero-cache\` 9\. Look for logs under "Drilldown" > "Logs" in left sidebar      \#\# Or, for AI assistants    ALWAYS read [llms.txt](https://zero.rocicorp.dev/llms.txt) for curated documentation pages and examples.

The `zero-cache` service embeds the [JavaScript OTLP Exporter](https://opentelemetry.io/docs/languages/js/) and can send logs, traces, and metrics to any [standard otel collector](https://opentelemetry.io/).

To enable otel, set the following environment variables then run `zero-cache` as normal:

```
CopyOTEL_EXPORTER_OTLP_ENDPOINT="<your otel endpoint>"
OTEL_EXPORTER_OTLP_HEADERS="<auth headers from your otel collector>"
OTEL_RESOURCE_ATTRIBUTES="<resource attributes from your otel collector>"
OTEL_NODE_RESOURCE_DETECTORS="env,host,os"
```

## [Grafana Cloud Walkthrough](https://zero.rocicorp.dev/docs/debug/otel\#grafana-cloud-walkthrough)

Here are instructions to setup [Grafana Cloud](https://grafana.com/oss/grafana/), but the setup for other otel collectors should be similar.

1. Sign up for [Grafana Cloud (Free Tier)](https://grafana.com/auth/sign-up/create-user?pg=login)
2. Click Connections > Add Connection in the left sidebar
![add-connection](https://zero.rocicorp.dev/images/debugging/otel/add-connection.png)
3. Search for "OpenTelemetry" and select it
4. Click "Quickstart"
![quickstart](https://zero.rocicorp.dev/images/debugging/otel/quickstart.png)
5. Select "JavaScript"
![javascript](https://zero.rocicorp.dev/images/debugging/otel/javascript.png)
6. Create a new token
7. Copy the environment variables into your `.env` file or similar
![copy-env](https://zero.rocicorp.dev/images/debugging/otel/env.png)
8. Start `zero-cache`
9. Look for logs under "Drilldown" > "Logs" in left sidebar

[PreviousQuery ASTs](https://zero.rocicorp.dev/docs/debug/query-asts)

[Nextzero-out](https://zero.rocicorp.dev/docs/debug/zero-out)

### On this page

[Grafana Cloud Walkthrough](https://zero.rocicorp.dev/docs/debug/otel#grafana-cloud-walkthrough)

[Edit this page on GitHub](https://github.com/rocicorp/zero-docs/blob/main/contents/docs/debug/otel.mdx)