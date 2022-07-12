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
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"

	"px.dev/pxapi"
)

// GrafanaMacro is a type which defines a macro.
type GrafanaMacro string

const (
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

// PixieQueryProcessor is a type which handles different PixieAPI calls and returns a Grafana response
type PixieQueryProcessor struct {
	client *pxapi.Client
}

// queryScript sends a request to Pixie with pxlScript and returns DataResponse about the current cluster
func (qp PixieQueryProcessor) queryScript(
	ctx context.Context,
	pxlScript string,
	query backend.DataQuery,
	clusterID string,
) (*backend.DataResponse, error) {

	vz, err := qp.client.NewVizierClient(ctx, clusterID)
	if err != nil {
		log.DefaultLogger.Error(fmt.Sprintf("Unable to create Vizier Client: %+v, clusterID: '%+v'", err, clusterID))
		return nil, err
	}

	response := &backend.DataResponse{}

	// Create TableMuxer to accept results table.
	tm := &PixieToGrafanaTableMux{}
	// Update macros in query text.
	pxlScript = replaceTimeMacroInQueryText(pxlScript, timeFromMacro,
		query.TimeRange.From)
	pxlScript = replaceTimeMacroInQueryText(pxlScript, timeToMacro,
		query.TimeRange.To)
	pxlScript = replaceIntervalMacroInQueryText(pxlScript, intervalMacro,
		query.Interval)

	// Execute the PxL script.
	resultSet, err := vz.ExecuteScript(ctx, pxlScript, tm)
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
		// If time series schema long && time_ column && table not empty, convert to wide. Otherwise
		// proceed as normal.
		tsSchema := tablePrinter.frame.TimeSeriesSchema()
		numRows, err := tablePrinter.frame.RowLen()
		if err != nil {
			return nil, err
		}
		if numRows != 0 && tablePrinter.FormatGrafanaTimeFrame() && tsSchema.Type == data.TimeSeriesTypeLong {
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

// queryClusters sends a request to Pixie, and returns a DataResponse with healthy clusters
func (qp PixieQueryProcessor) queryClusters(ctx context.Context) (*backend.DataResponse, error) {
	response := &backend.DataResponse{}
	viziers, err := qp.client.ListViziers(ctx)

	if err != nil {
		return nil, fmt.Errorf("Error with getting viziers: %s", err)
	}

	vizierIds := make([]string, 0)
	vizierNames := make([]string, 0)

	for _, vizier := range viziers {
		// Only show connected clusters
		if vizier.Status != pxapi.VizierStatusDisconnected {
			vizierIds = append(vizierIds, vizier.ID)
			vizierNames = append(vizierNames, vizier.Name)
		}
	}

	vizierFrame := data.NewFrame(
		"Vizier Clusters",
		data.NewField("id", data.Labels{}, vizierIds),
		data.NewField("name", data.Labels{}, vizierNames),
	)

	response.Frames = append(response.Frames, vizierFrame)

	return response, nil
}
