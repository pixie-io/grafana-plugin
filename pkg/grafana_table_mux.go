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
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"

	"px.dev/pxapi"
	"px.dev/pxapi/types"
	"px.dev/pxapi/proto/vizierpb"
)

// PixieToGrafanaTablePrinter satisfies the TableRecordHandler interface.
type PixieToGrafanaTablePrinter struct {
	// Grafana Frame for Pixie Table. Holds fields.
	frame *data.Frame
}

// HandleInit creates a new Grafana field for each column in a table.
func (t *PixieToGrafanaTablePrinter) HandleInit(ctx context.Context, metadata types.TableMetadata) error {
	// Create new data frame for new table.
	t.frame = data.NewFrame(metadata.Name)

	// Create new fields (columns) for the frame.
	for _, col := range metadata.ColInfo {
		switch colType := col.Type; colType {
		case vizierpb.BOOLEAN:
			t.frame.Fields = append(t.frame.Fields,
				data.NewField(col.Name, nil, []bool{}))
		case vizierpb.INT64:
			t.frame.Fields = append(t.frame.Fields,
				data.NewField(col.Name, nil, []int64{}))
		case vizierpb.TIME64NS:
			t.frame.Fields = append(t.frame.Fields,
				data.NewField(col.Name, nil, []time.Time{}))
		case vizierpb.FLOAT64:
			t.frame.Fields = append(t.frame.Fields,
				data.NewField(col.Name, nil, []float64{}))
		case vizierpb.STRING:
			t.frame.Fields = append(t.frame.Fields,
				data.NewField(col.Name, nil, []string{}))
		case vizierpb.UINT128:
			// Use a UUID style string representation for uint128
			// since Grafana fields do not support uint128
			t.frame.Fields = append(t.frame.Fields,
				data.NewField(col.Name, nil, []string{}))
		}
	}
	return nil
}

// HandleRecord goes through the record adding the data to the appropriate
// field.
func (t *PixieToGrafanaTablePrinter) HandleRecord(ctx context.Context, r *types.Record) error {
	for colIdx, d := range r.Data {
		switch d.Type() {
		case vizierpb.BOOLEAN:
			t.frame.Fields[colIdx].Append(d.(*types.BooleanValue).Value())
		case vizierpb.INT64:
			t.frame.Fields[colIdx].Append(d.(*types.Int64Value).Value())
		case vizierpb.UINT128:
			t.frame.Fields[colIdx].Append(d.(*types.UInt128Value).String())
		case vizierpb.FLOAT64:
			t.frame.Fields[colIdx].Append(d.(*types.Float64Value).Value())
		case vizierpb.STRING:
			t.frame.Fields[colIdx].Append(d.(*types.StringValue).Value())
		case vizierpb.TIME64NS:
			t.frame.Fields[colIdx].Append(d.(*types.Time64NSValue).Value())
		}
	}

	return nil
}

// HandleDone is run when all record processing is complete.
func (t *PixieToGrafanaTablePrinter) HandleDone(ctx context.Context) error {
	return nil
}

// PixieToGrafanaTableMux satisfies the TableMuxer interface.
type PixieToGrafanaTableMux struct {
	// pxTablePrinterLst is a list of the table printers.
	pxTablePrinterLst []*PixieToGrafanaTablePrinter
}

// AcceptTable adds the table printer to the list of table printers.
func (s *PixieToGrafanaTableMux) AcceptTable(ctx context.Context, metadata types.TableMetadata) (pxapi.TableRecordHandler, error) {
	tablePrinter := &PixieToGrafanaTablePrinter{}
	s.pxTablePrinterLst = append(s.pxTablePrinterLst, tablePrinter)
	return tablePrinter, nil
}
