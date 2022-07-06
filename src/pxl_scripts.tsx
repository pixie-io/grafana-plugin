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

const customQuery = require('pxl_scripts/custom-query.json');
const exampleQuery = require('pxl_scripts/example-query.json');
const httpDataFiltered = require('pxl_scripts/http-data-filtered.json');
const httpErrorsPerService = require('pxl_scripts/http-errors-per-service.json');
const podMetrics = require('pxl_scripts/pods-metrics.json');
const httpRequestPerService = require('pxl_scripts/http-request-throughput-per-service.json');
const httpRequestThroughput = require('pxl_scripts/http-request-throughput.json');
const httpServiceMap = require('pxl_scripts/http-service-map.json');
const inboundConnections = require('pxl_scripts/inbound-connections-node-graph.json');
const networkTraffic = require('pxl_scripts/network-traffic-node-graph.json');
const outboundConnections = require('pxl_scripts/outbound-connections-node-graph.json');
const nodeMetrics = require('pxl_scripts/node-metrics.json');
const namespacesMetrics = require('pxl_scripts/namespaces-metrics.json');
const serviceMetrics = require('pxl_scripts/service-metrics.json');

export interface Script {
  name: string;
  description: string;
  script: string;
  columnNames?: string[];
  isColDisplay?: boolean;
  isGroupBy?: boolean;
  groupByColumns?: string[];
}

// Load predefined scripts
const scriptsRaw: Script[] = [
  customQuery,
  exampleQuery,
  podMetrics,
  nodeMetrics,
  namespacesMetrics,
  serviceMetrics,
  httpDataFiltered,
  httpErrorsPerService,
  httpRequestPerService,
  httpRequestThroughput,
  httpServiceMap,
  networkTraffic,
  inboundConnections,
  outboundConnections,
];

// Construct options list which is injested by Select component in
export const scriptOptions: Array<SelectableValue<Script>> = scriptsRaw.map((scriptObject: Script) => ({
  label: scriptObject.name,
  description: scriptObject.description,
  value: scriptObject,
  columnOptions: (scriptObject.columnNames || []).map((name, index) => ({ label: name, value: index })),
  groupByColOptions: (scriptObject.groupByColumns || []).map((name, index) => ({ label: name, value: index })),
}));
