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

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	"px.dev/pxapi"
)

const (
	// Define keys to retrieve configs passed from UI.
	apiKeyField    = "apiKey"
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

	if qm.QueryType != GetClusters && len(qm.QueryBody.ClusterID) == 0 {
		return nil, fmt.Errorf("no clusterID present in the request")
	}

	clusterID := qm.QueryBody.ClusterID

	switch qm.QueryType {
	case RunScript:
		return qp.queryScript(ctx, qm.QueryBody.PxlScript, query, clusterID)
	case GetClusters:
		return qp.queryClusters(ctx)
	case GetPods:
		podPxlScript := "import px\ndf = px.DataFrame(table='process_stats', start_time=__time_from)\ndf.pod = df.ctx['pod_name']\ndf = df[['pod']]\npx.display(df)"
		return qp.queryScript(ctx, podPxlScript, query, clusterID)
	case GetServices:
		podPxlScript := "import px\ndf = px.DataFrame(table='process_stats', start_time=__time_from)\ndf.service = df.ctx['service']\ndf = df[df.service != '']\ndf = df.groupby('service').agg()\npx.display(df)"
		return qp.queryScript(ctx, podPxlScript, query, clusterID)
	case GetNamespaces:
		podPxlScript := "import px\ndf = px.DataFrame(table='process_stats', start_time=__time_from)\ndf.namespace = df.ctx['namespace']\npx.display(df.groupby('namespace').agg())"
		return qp.queryScript(ctx, podPxlScript, query, clusterID)
	case GetNodes:
		podPxlScript := "import px\ndf = px.DataFrame(table='process_stats', start_time=__time_from)\ndf.node = df.ctx['node_name']\npx.display(df.groupby('node').agg())"
		return qp.queryScript(ctx, podPxlScript, query, clusterID)
	default:
		return nil, fmt.Errorf("unknown query type: %v", qm.QueryType)
	}
}

// CheckHealth implements the Grafana service health check API.
func (td *PixieDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	status := backend.HealthStatusOk
	message := "Connection to Pixie cluster successfully configured"
	config := req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData

	_, err := createClient(ctx, config[apiKeyField], config[cloudAddrField])
	if err != nil {
		status = backend.HealthStatusError
		message = fmt.Sprintf("Error connecting Pixie client: %s", err.Error())
	}

	log.DefaultLogger.Warn(message)
	return &backend.CheckHealthResult{
		Status:  status,
		Message: message,
	}, nil
}
