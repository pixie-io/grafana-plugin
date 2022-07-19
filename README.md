## What is Pixie?

[Pixie](https://docs.px.dev/about-pixie/what-is-pixie/) is an observability platform for Kubernetes. It allows developers to debug, monitor, and explore their applications. Pixie uses [eBPF](https://docs.px.dev/about-pixie/pixie-ebpf/) to automatically capture telemetry data without the need for manual instrumentation.

This plugin allows Grafana users to use Pixie as a datasource in their Grafana dashboards. It can be used to visualize the following [data](https://docs.px.dev/about-pixie/data-sources/) automatically collected in Pixie:

* **Protocol tracing and metrics**: Pixie automatically collects full-body messages between the pods of your applications. Supports [protocols](https://docs.px.dev/about-pixie/data-sources/#supported-protocols) such as HTTP, MySQL, DNS, and Redis. You can also expose application metrics such as request latency, error rate, and throughput.

* **Resource metrics**: CPU, memory and I/O metrics for your pods. For more information, see the Infra Health tutorial.

* **Network metrics**: Network-layer and connection-level RX/TX statistics. For more information, see the Network Monitoring tutorial.

* **JVM metrics**: JVM memory management metrics for Java applications.

* **Application CPU profiles**: Sampled stack traces from your application.

![pxCluster](https://raw.githubusercontent.com/pixie-io/grafana-plugin/master/src/img/screenshots/px-cluster-grafana.png)

## Getting started

[Install Pixie](https://docs.pixielabs.ai/installing-pixie/) on your Kubernetes cluster.

## Installing the Plugin

### On Grafana Cloud

The Pixie datasource plugin is [available](https://grafana.com/grafana/plugins/pixie-pixie-datasource/?tab=installation) on Grafana Cloud, which makes it easy to install Grafana plugins to your Grafana Cloud instance.

### On a local Grafana instance

In order to deploy to a local Grafana instance, you can run the following command:

```bash
grafana-cli plugins install pixie-pixie-datasource
```

## Using the plugin

Check out the Grafana Pixie plugin [tutorial](https://docs.px.dev/tutorials/integrations/grafana) and [example queries](https://github.com/pixie-io/grafana-plugin/tree/main/examples).

Pixie's data can be accessed using [PxL](https://docs.px.dev/reference/pxl/), the query language for the data it collects. This datasource allows Grafana users to enter a PxL script when using Pixie as a datasource for a panel in their dashboard.

## Development

If you want to add a new feature to the plugin, check out `CONTRIBUTING.md`. We welcome the contributions of the community!

### Clone the repo

```bash
git clone git@github.com:pixie-io/grafana-plugin.git
```

### Building from source: front-end

Once the repo has been cloned, please:

1. Install dependencies

   ```bash
   yarn install
   ```

2. Build plugin in development mode or run in watch mode

   ```bash
   yarn dev
   ```

   or

   ```bash
   yarn watch
   ```

3. Build plugin in production mode

   ```bash
   yarn build
   ```

### Building from source: back-end

1. Update [Grafana plugin SDK for Go](https://grafana.com/docs/grafana/latest/developers/plugins/backend/grafana-plugin-sdk-for-go/) dependency to the latest minor version:

   ```bash
   go get -u github.com/grafana/grafana-plugin-sdk-go
   ```

2. Build backend plugin binaries for Linux, Windows and Darwin:

   ```bash
   mage -v
   ```

### Installing the dev version of the plugin

1. Copy the `dist` folder to your Grafana [plugins directory](https://grafana.com/docs/grafana/latest/administration/configuration/#plugins).

2. Edit your Grafana configuration file to detect the plugin binaries. Additional details [here](https://grafana.com/docs/grafana/latest/administration/configuration/).
