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

import { DataQuery, DataSourceJsonData } from '@grafana/data';
import { scriptOptions } from 'pxl_scripts';

// Types of available queries to the backend
export type QueryType = 'run-script' | 'get-clusters';

// Describes variable query to be sent to the backend.
export interface PixieVariableQuery {
  queryType: QueryType;
}

// PixieDataQuery is the interface representing a query in Pixie.
// Pixie queries use PxL, Pixie's query language.
export interface PixieDataQuery extends DataQuery {
  queryType: QueryType;
  queryBody?: {
    pxlScript?: string;
  };
}

export const defaultQuery: Partial<PixieDataQuery> = {
  queryType: 'run-script' as const,
  queryBody: {
    pxlScript: scriptOptions[0].value,
  },
};

export interface PixieDataSourceOptions extends DataSourceJsonData {}

export interface PixieSecureDataSourceOptions {
  // Pixie API key.
  apiKey?: string;
  // ID of the Pixie cluster to query.
  clusterId?: string;
  // Address of Pixie cloud.
  cloudAddr?: string;
}
