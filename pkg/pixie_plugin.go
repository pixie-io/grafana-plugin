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
	"io"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"

	"px.dev/pxapi"
)

// GrafanaMacro is a type which defines a macro.
type GrafanaMacro string

const (
	// Define keys to retrieve configs passed from UI.
	apiKeyField       = "apiKey"
	cloudAddrField    = "cloudAddr"
	clusterIDField    = "clusterId"
	// timeFromMacro is the start of the time range of a query.
	timeFromMacro GrafanaMacro = "__time_from"
	// timeToMacro is the end of the time range of a query.
	timeToMacro GrafanaMacro = "__time_to"
	// intervalMacro is the suggested duration between time points.
	intervalMacro GrafanaMacro = "__interval"
)

// replaceTimeMacroInQueryText takes the query text (PxL script to execute)
// and replaces the time macros with the relevant time objects.
func replaceTimeMacroInQueryText(queryText string, grafanaMacro GrafanaMacro,
	timeReplacement time.Time) string {
	tStr := fmt.Sprintf("%d", timeReplacement.UnixNano())
	return strings.ReplaceAll(queryText, string(grafanaMacro), tStr)
}

// replaceIntervalMacroInQueryText takes the query text and replaces
// interval macro with interval duration specified in Grafana UI.
func replaceIntervalMacroInQueryText(queryText string, grafanaMacro GrafanaMacro,
	intervalDuration time.Duration) string {
	intervalStr := fmt.Sprintf("%d", intervalDuration.Nanoseconds())
	return strings.ReplaceAll(queryText, string(grafanaMacro), intervalStr)
}

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

type queryModel struct {
	// The PxL script passed in by the user.
	PxlScript string `json:"pxlScript"`
}

func createVizierClient(ctx context.Context, apiKey string, clusterID string, cloudAddr string) (*pxapi.VizierClient, error) {
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
	// Next, create a client that connects to the particular Vizier instance matching `clusterID`.
	vzClient, err := client.NewVizierClient(ctx, clusterID)
	if err != nil {
		return nil, err
	}
	return vzClient, nil
}

func (td *PixieDatasource) query(ctx context.Context, query backend.DataQuery,
	config map[string]string) (*backend.DataResponse, error) {

	var qm queryModel
	err := json.Unmarshal(query.JSON, &qm)
	if err != nil {
		return nil, fmt.Errorf("Error unmarshalling JSON: %v", err)
	}

	apiToken := config[apiKeyField]
	clusterID := config[clusterIDField]
	cloudAddr := config[cloudAddrField]

	vz, err := createVizierClient(ctx, apiToken, clusterID, cloudAddr)
	if err != nil {
		log.DefaultLogger.Error(fmt.Sprintf("Unable to create Vizier Client: %+v", err))
		return nil, err
	}

	response := &backend.DataResponse{}

	// Create TableMuxer to accept results table.
	tm := &PixieToGrafanaTableMux{}

	// Update macros in query text.
	qm.PxlScript = replaceTimeMacroInQueryText(qm.PxlScript, timeFromMacro,
		query.TimeRange.From)
	qm.PxlScript = replaceTimeMacroInQueryText(qm.PxlScript, timeToMacro,
		query.TimeRange.To)
	qm.PxlScript = replaceIntervalMacroInQueryText(qm.PxlScript, intervalMacro,
		query.Interval)

	// Execute the PxL script.
	resultSet, err := vz.ExecuteScript(ctx, qm.PxlScript, tm)
	if err != nil && err != io.EOF {
		log.DefaultLogger.Warn("Can't execute script.")
		return nil, err
	}

	// Receive the PxL script results.
	defer resultSet.Close()
	if err := resultSet.Stream(); err != nil {
		streamStrErr := fmt.Errorf("got error : %+v, while streaming", err)
		response.Error = streamStrErr
		log.DefaultLogger.Error(streamStrErr.Error())
	}

	// Add the frames to the response.
	for _, tablePrinter := range tm.pxTablePrinterLst {
		// If time series schema long && time_ column, convert to wide. Otherwise
		// proceed as normal.
		tsSchema := tablePrinter.frame.TimeSeriesSchema()
		if tablePrinter.FormatGrafanaTimeFrame() && tsSchema.Type == data.TimeSeriesTypeLong {
			wideFrame, err := data.LongToWide(tablePrinter.frame,
				&data.FillMissing{Mode: data.FillModeNull})
			if err != nil {
				return nil, err
			}
			response.Frames = append(response.Frames, wideFrame)
		} else {
			response.Frames = append(response.Frames,
				tablePrinter.frame)
		}
	}
	return response, nil
}

// CheckHealth implements the Grafana service health check API.
func (td *PixieDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	status := backend.HealthStatusOk
	message := "Connection to Pixie cluster successfully configured"
	config := req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData

	vz, err := createVizierClient(ctx, config[apiKeyField], config[clusterIDField], config[cloudAddrField])
	if vz == nil || err != nil {
		status = backend.HealthStatusError
		message = fmt.Sprintf("Error connecting to Vizier: %s", err.Error())
	}

	log.DefaultLogger.Warn(message)
	return &backend.CheckHealthResult{
		Status:  status,
		Message: message,
	}, nil
}
