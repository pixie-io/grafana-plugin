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

const podMetrics = require('pxl_scripts/pods-metrics.json');

//Array which contains the string format query for each column name
const podColumnQueries: string[] = [
  `'pod',`,
  `'cpu_usage',`,
  `'total_disk_read_throughput',`,
  `'total_disk_write_throughput',`,
  `'container_count',`,
  `'node',`,
  `'start_time',`,
  `'status',`,
];

//String which contains the script that displays every column in the table
const podAllColumnsScript =
  `
out = output[[` +
  podColumnQueries[0] +
  podColumnQueries[1] +
  podColumnQueries[2] +
  podColumnQueries[3] +
  podColumnQueries[4] +
  podColumnQueries[5] +
  podColumnQueries[6] +
  podColumnQueries[7] +
  `]]
px.display(out)`;

//array of json objects containing every column name with its corresponding index for an array containing the string format query
export const podColumnOptions = [
  { label: 'pod', value: 0 },
  { label: 'cpu_usage', value: 1 },
  { label: 'total_disk_read_throughput', value: 2 },
  { label: 'total_disk_write_throughput', value: 3 },
  { label: 'container_count', value: 4 },
  { label: 'node', value: 5 },
  { label: 'start_time', value: 6 },
  { label: 'status', value: 7 },
];

export const tabularScripts: string[] = ['Pod Metrics'];

export function makeFilteringScript(obj: any[]) {
  //locates the index of the part of the script which deals with displaying the columns
  const podGetDataScript = podMetrics.script.substr(0, podMetrics.script.indexOf('px.display'));

  //Contains the part of the full script which contains all columns
  var filteredColumnScript = podAllColumnsScript;

  //If a column is chosen to be filtered by the user, filteredColumnScript will be updated
  if (obj.length > 0) {
    //Dynamically builds the script by concatenating each option that was chosen
    filteredColumnScript = `px.display(output[[`;

    for (let i = 0; i < obj.length; i++) {
      filteredColumnScript += podColumnQueries[obj[i].value];
    }
    filteredColumnScript += `]])`;
  }

  //returns a string that concatenates a part of script dealing with collecting data with a new string of updated columns to display
  return podGetDataScript + filteredColumnScript;
}
