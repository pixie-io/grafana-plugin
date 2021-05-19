## What is the Pixie Datasource Grafana Plugin?

[Pixie](https://docs.pixielabs.ai/) is an observability platform for Kubernetes. It allows developers to debug, monitor, and explore their applications.

This plugin allows Grafana users to use Pixie as a datasource in their Grafana dashboards. Pixie's data can be accessed using [PxL](https://docs.pixielabs.ai/reference/pxl/), the query language for the data it collects. This datasource allows Grafana users to enter a PxL script when using Pixie as a datasource for a panel in their dashboard.

## Getting started

[Install Pixie](https://docs.pixielabs.ai/installing-pixie/) on your Kubernetes cluster.

### Installing the Plugin on an Existing Grafana with the CLI

Grafana comes with a command line tool that can be used to install plugins.

1. Run this command: `grafana-cli plugins install pixie-datasource`
2. Restart the Grafana server. 
3. With Grafana open, from the left vertical menu choose "Configuration" > "Data Sources." Select the "Add data source" button. Search for "Pixie Grafana Datasource Plugin" and press the "Select" button. The Pixie Plugin requires a Pixie API Key and Cluster ID to execute queries. To create an API Key, follow the directions [here](https://docs.pixielabs.ai/using-pixie/api-quick-start/#get-an-api-token). To find your cluster's ID, follow the directions [here](https://docs.pixielabs.ai/using-pixie/api-quick-start/#get-a-cluster-id). Finally, select the "Save & Test" button.



### Installing the Plugin Manually

Plugin can also be downloaded & manually copied to a Grafana server.

1. Get the zip file from Grafana or from the github release.
2. Extract the zip file into the plugins directory for Grafana.
3. Restart the Grafana server. Details [here](https://grafana.com/docs/grafana/latest/installation/restart-grafana/).
4. Select from the list of installed datasource plugins in Grafana.




   