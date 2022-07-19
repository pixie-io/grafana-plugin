/*
 * Copyright 2018- The Pixie Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	"px.dev/pxapi"
)

const (
	// Define keys to retrieve configs passed from UI.
	apiKeyField    = "apiKey"
	clusterIDField = "clusterId"
	cloudAddrField = "cloudAddr"
)

// createPixieDatasource creates a new Pixie datasource.
func createPixieDatasource() datasource.ServeOpts {
	ds := &PixieDatasource{}
	return datasource.ServeOpts{
		QueryDataHandler:   ds,
		CheckHealthHandler: ds,
	}
}

// PixieDatasource is an instance of a Pixie datasource.
type PixieDatasource struct {
}

// QueryData implements Grafana's public API for querying data.
// Can receive multiple queries and return multiple dataframes.
func (td *PixieDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (
	*backend.QueryDataResponse, error) {
	response := backend.NewQueryDataResponse()
	// Loop over queries and execute them individually. Save the response
	// in a hashmap with RefID as identifier.
	for _, q := range req.Queries {
		res, err := td.query(ctx, q, req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData)
		if err != nil {
			return response, err
		}
		response.Responses[q.RefID] = *res
	}

	return response, nil
}

// Creates Pixie API client using API key and cloud Address
func createClient(ctx context.Context, apiKey string, cloudAddr string) (*pxapi.Client, error) {
	// untrimmed apiKey string will cause an error when creating a client
	apiKey = strings.TrimSpace(apiKey)

	var client *pxapi.Client
	var err error
	// First, create a client connecting to Pixie Cloud.
	if cloudAddr == "" {
		client, err = pxapi.NewClient(ctx, pxapi.WithAPIKey(apiKey))
	} else {
		client, err = pxapi.NewClient(ctx, pxapi.WithAPIKey(apiKey), pxapi.WithCloudAddr(cloudAddr))
	}
	if err != nil {
		return nil, err
	}

	return client, nil
}

// Specifies available query types
type QueryType string

const (
	RunScript     QueryType = "run-script"
	GetClusters   QueryType = "get-clusters"
	GetPods       QueryType = "get-pods"
	GetServices   QueryType = "get-services"
	GetNamespaces QueryType = "get-namespaces"
	GetNodes      QueryType = "get-nodes"
)

const (
	getPodsScript string = `
import px
df = px.DataFrame(table='process_stats', start_time=__time_from)
df.pod = df.ctx['pod_name']
df = df[df.pod != '']
df = df.groupby('pod').agg()
px.display(df)
`
	getServicesScript string = `
import px
df = px.DataFrame(table='process_stats', start_time=__time_from)
df.service = df.ctx['service']
df = df[df.service != '']
df = df.groupby('service').agg()
px.display(df)
`
	getNamespacesScript string = `
import px
df = px.DataFrame(table='process_stats', start_time=__time_from)
df.namespace = df.ctx['namespace']
df = df[df.namespace != '']
px.display(df.groupby('namespace').agg())
`
	getNodesScript string = `
import px
df = px.DataFrame(table='process_stats', start_time=__time_from)
df.node = df.ctx['node_name']
df = df[df.node != '']
px.display(df.groupby('node').agg())
`
)

type queryBody struct {
	// The body of a pxl script
	PxlScript string
	ClusterID string `json:"clusterID"`
}

type queryModel struct {
	// QueryType specifies which API call to call.
	QueryType QueryType `json:"queryType"`
	// QueryBody contains any additional information needed to make the API call
	QueryBody queryBody `json:"queryBody"`
}

// Handle an incoming query
func (td *PixieDatasource) query(ctx context.Context, query backend.DataQuery,
	config map[string]string) (*backend.DataResponse, error) {

	apiToken := config[apiKeyField]
	cloudAddr := config[cloudAddrField]
	clusterID := config[clusterIDField]
	var qm queryModel
	if err := json.Unmarshal(query.JSON, &qm); err != nil {
		return nil, fmt.Errorf("error unmarshalling JSON: %v", err)
	}

	client, err := createClient(ctx, apiToken, cloudAddr)
	if err != nil {
		return nil, fmt.Errorf("error creating Pixie Client: %v", err)
	}

	qp := PixieQueryProcessor{
		client: client,
	}

	// if cluster id is not set, fall back to using id from config
	if len(qm.QueryBody.ClusterID) != 0 {
		clusterID = qm.QueryBody.ClusterID
	}

	// untrimmed clusterID string will cause an error when creating a vizier client
	clusterID = strings.TrimSpace(clusterID)

	if qm.QueryType != GetClusters && (len(qm.QueryBody.ClusterID) == 0 && clusterID == "") {
		return nil, fmt.Errorf("no clusterID present in the request or default clusterID configured. Please set `pixieCluster` dashboard variable to `Pixie Datasource`->`Clusters`")
	}

	switch qm.QueryType {
	case RunScript:
		return qp.queryScript(ctx, qm.QueryBody.PxlScript, query, clusterID)
	case GetClusters:
		return qp.queryClusters(ctx)
	case GetPods:
		return qp.queryScript(ctx, getPodsScript, query, clusterID)
	case GetServices:
		return qp.queryScript(ctx, getServicesScript, query, clusterID)
	case GetNamespaces:
		return qp.queryScript(ctx, getNamespacesScript, query, clusterID)
	case GetNodes:
		return qp.queryScript(ctx, getNodesScript, query, clusterID)
	default:
		return nil, fmt.Errorf("unknown query type: %v", qm.QueryType)
	}
}

// CheckHealth implements the Grafana service health check API.
func (td *PixieDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	status := backend.HealthStatusOk
	message := "Connection to Pixie cluster successfully configured"
	config := req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData

	var client *pxapi.Client
	var err error

	if status == backend.HealthStatusOk {
		client, err = createClient(ctx, config[apiKeyField], config[cloudAddrField])
		if err != nil {
			message = fmt.Sprintf("Error connecting Pixie client: %s", err.Error())
			status = backend.HealthStatusError
		}
	}

	if status == backend.HealthStatusOk {
		// only check the health of clusterID if the user specified clusterID
		if len(config[clusterIDField]) != 0 {
			_, err = client.NewVizierClient(ctx, config[clusterIDField])
			if err != nil {
				message = fmt.Sprintf("Unable to create Vizier Client: %+v, clusterID: '%+v'", err, config[clusterIDField])
				status = backend.HealthStatusError
			}
		}
	}

	log.DefaultLogger.Warn(message)
	return &backend.CheckHealthResult{
		Status:  status,
		Message: message,
	}, nil
}
