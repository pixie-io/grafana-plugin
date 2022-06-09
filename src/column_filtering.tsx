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
import { SelectableValue } from '@grafana/data';

export const podMetrics = require('pxl_scripts/pods-metrics.json');

//locates the index of the part of the script which deals with displaying the columns
const podGetDataScript = podMetrics.script.substr(0, podMetrics.script.indexOf('px.display'));

export function makeFilteringScript(columns: SelectableValue<{}>): string {
  //Contains the part of the full script which contains all columns
  let filteredColumnScript = podMetrics.allColumnsScript;

  //If a column is chosen to be filtered by the user, filteredColumnScript will be updated
  if (columns.length > 0) {
    //Dynamically builds the script by concatenating each option that was chosen
    filteredColumnScript = `px.display(output[[`;

    for (let i = 0; i < columns.length; i++) {
      filteredColumnScript += podMetrics.columnQueries[columns[i].value];
    }
    filteredColumnScript += `]])`;
  }

  //returns a string that concatenates a part of script dealing with collecting data with a new string of updated columns to display
  return podGetDataScript + filteredColumnScript;
}
