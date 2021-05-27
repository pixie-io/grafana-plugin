## What is the Pixie Datasource Grafana Plugin?

[Pixie](https://docs.pixielabs.ai/) is an observability platform for Kubernetes. It allows developers to debug, monitor, and explore their applications.

This plugin allows Grafana users to use Pixie as a datasource in their Grafana dashboards. Pixie's data can be accessed using [PxL](https://docs.pixielabs.ai/reference/pxl/), the query language for the data it collects. This datasource allows Grafana users to enter a PxL script when using Pixie as a datasource for a panel in their dashboard.

## Getting started

[Install Pixie](https://docs.pixielabs.ai/installing-pixie/) on your Kubernetes cluster.

### Installing the Plugin

For now, to deploy the plugin, it must be manually copied to a Grafana server.

1. Get the zip file from the Github [releases page](https://github.com/pixie-labs/grafana-plugin/releases) on this repo.
2. Extract the zip file into the [plugins directory](https://grafana.com/docs/grafana/latest/administration/configuration/#plugins) for Grafana.
3. [Restart](https://grafana.com/docs/grafana/latest/installation/restart-grafana/) the Grafana server.
4. Select **Pixie Grafana Datasource Plugin** from the list of installed datasource plugins in Grafana.
