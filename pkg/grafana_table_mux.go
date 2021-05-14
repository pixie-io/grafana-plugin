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
	"sort"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"

	"px.dev/pxapi"
	"px.dev/pxapi/proto/vizierpb"
	"px.dev/pxapi/types"
)

type TableRow struct {
	// rowVals are all the values in a row.
	rowVals []interface{}
}

type Table []TableRow

// PixieToGrafanaTablePrinter satisfies the TableRecordHandler interface.
type PixieToGrafanaTablePrinter struct {
	// Grafana Frame for Pixie Table. Holds fields.
	frame *data.Frame

	metadata *types.TableMetadata

	// Table holds the tables rows.
	table Table

	timeColIdx int
}

// FormatGrafanaTimeFrame checks if there is a "time_" named column.
func (t *PixieToGrafanaTablePrinter) FormatGrafanaTimeFrame() bool {
	for _, col := range t.metadata.ColInfo {
		if col.Name == "time_" {
			return true
		}
	}
	return false
}

// firstTimeColIdx checks if there is a time based column at all.
func firstTimeColIdx(metadata types.TableMetadata) int {
	for idx, col := range metadata.ColInfo {
		if col.Type == vizierpb.TIME64NS {
			return idx
		}
	}
	return -1
}

// createNewFrame simply creates new frame based on the column names & types.
func createNewFrame(metadata types.TableMetadata) *data.Frame {
	// Create new data frame for new table.
	frame := data.NewFrame(metadata.Name)

	// Create new fields (columns) for the frame.
	for _, col := range metadata.ColInfo {
		switch colType := col.Type; colType {
		case vizierpb.BOOLEAN:
			frame.Fields = append(frame.Fields,
				data.NewField(col.Name, nil, []bool{}))
		case vizierpb.INT64:
			frame.Fields = append(frame.Fields,
				data.NewField(col.Name, nil, []int64{}))
		case vizierpb.TIME64NS:
			frame.Fields = append(frame.Fields,
				data.NewField(col.Name, nil, []time.Time{}))
		case vizierpb.FLOAT64:
			frame.Fields = append(frame.Fields,
				data.NewField(col.Name, nil, []float64{}))
		case vizierpb.STRING:
			frame.Fields = append(frame.Fields,
				data.NewField(col.Name, nil, []string{}))
		case vizierpb.UINT128:
			// Use a UUID style string representation for uint128
			// since Grafana fields do not support uint128
			frame.Fields = append(frame.Fields,
				data.NewField(col.Name, nil, []string{}))
		}
	}
	return frame
}

// HandleInit creates a new Grafana field for each column in a table.
func (t *PixieToGrafanaTablePrinter) HandleInit(ctx context.Context, metadata types.TableMetadata) error {
	t.timeColIdx = firstTimeColIdx(metadata)
	t.metadata = &metadata
	return nil
}

// HandleRecord goes through the record adding the data to the appropriate
// field.
func (t *PixieToGrafanaTablePrinter) HandleRecord(ctx context.Context, r *types.Record) error {
	rowTableData := TableRow{}

	// Go through table row by row, appending to table data structure.
	for _, d := range r.Data {
		switch d.Type() {
		case vizierpb.BOOLEAN:
			rowTableData.rowVals = append(rowTableData.rowVals, d.(*types.BooleanValue).Value())
		case vizierpb.INT64:
			rowTableData.rowVals = append(rowTableData.rowVals, d.(*types.Int64Value).Value())
		case vizierpb.UINT128:
			rowTableData.rowVals = append(rowTableData.rowVals, d.(*types.UInt128Value).String())
		case vizierpb.FLOAT64:
			rowTableData.rowVals = append(rowTableData.rowVals, d.(*types.Float64Value).Value())
		case vizierpb.STRING:
			rowTableData.rowVals = append(rowTableData.rowVals, d.(*types.StringValue).Value())
		case vizierpb.TIME64NS:
			rowTableData.rowVals = append(rowTableData.rowVals, d.(*types.Time64NSValue).Value())
		}
	}
	t.table = append(t.table, rowTableData)
	return nil
}

// HandleDone is run when all record processing is complete.
func (t *PixieToGrafanaTablePrinter) HandleDone(ctx context.Context) error {
	timeColIdx := t.timeColIdx

	// Do sort using first time column.
	if t.timeColIdx != -1 {
		sort.Slice(t.table, func(i, j int) bool {
			// Whichever time is earlier is the lesser.
			firstTime := (t.table[i].rowVals[timeColIdx]).(time.Time)
			secondTime := (t.table[j].rowVals[timeColIdx]).(time.Time)
			return firstTime.Before(secondTime)
		})
	}

	// Create Grafana data frame, casting from interface type appropriately.
	frame := createNewFrame(*t.metadata)
	for _, tRow := range t.table {
		for colIdx, rowVal := range tRow.rowVals {
			switch rowValType := rowVal.(type) {
			case bool:
				frame.Fields[colIdx].Append(rowValType)
			case int64:
				frame.Fields[colIdx].Append(rowValType)
			case time.Time:
				frame.Fields[colIdx].Append(rowValType)
			case string:
				frame.Fields[colIdx].Append(rowValType)
			case float64:
				frame.Fields[colIdx].Append(rowValType)
			}
		}
	}
	t.frame = frame
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
