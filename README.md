## What is the Pixie Datasource Grafana Plugin?

[Pixie](https://docs.pixielabs.ai/) is an observability platform for Kubernetes. It allows developers to debug, monitor, and explore their applications.

This plugin allows Grafana users to use Pixie as a datasource in their Grafana dashboards. Pixie's data can be accessed using [PxL](https://docs.pixielabs.ai/reference/pxl/), the query language for the data it collects. This datasource allows Grafana users to enter a PxL script when using Pixie as a datasource for a panel in their dashboard.

## Getting started

[Install Pixie](https://docs.pixielabs.ai/installing-pixie/) on your Kubernetes cluster.

### Installing the Plugin

For now, to deploy the plugin, it must be manually copied to a Grafana server.

1. Get the zip file from the Github releases page on this repo.
2. Extract the zip file into the plugins directory for Grafana.
3. Restart the Grafana server. Details [here](https://grafana.com/docs/grafana/latest/installation/restart-grafana/).
4. Select from the list of installed datasource plugins in Grafana.
