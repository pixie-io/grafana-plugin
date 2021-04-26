## What is the Pixie Datasource Grafana Plugin?

[Pixie](https://docs.pixielabs.ai/) is an observability platform for Kubernetes. It allows developers to debug, monitor, and explore their applications.

This plugin allows Grafana users to use Pixie as a datasource in their Grafana dashboards. Pixie's data can be accessed using [PxL](https://docs.pixielabs.ai/reference/pxl/), the query language for the data it collects. This datasource allows Grafana users to enter a PxL script when using Pixie as a datasource for a panel in their dashboard.

## Getting started

[Install Pixie](https://docs.pixielabs.ai/installing-pixie/) on your Kubernetes cluster.

### Building from source: front-end

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

3. List all available Mage targets for additional commands:

   ```bash
   mage -l
   ```   
