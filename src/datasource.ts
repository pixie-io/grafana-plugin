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

import { DataSourceInstanceSettings, ScopedVars } from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';
import { PixieDataSourceOptions, PixieDataQuery, PixieVariableQuery } from './types';

export class DataSource extends DataSourceWithBackend<PixieDataQuery, PixieDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<PixieDataSourceOptions>) {
    super(instanceSettings);
  }

  applyTemplateVariables(query: PixieDataQuery, scopedVars: ScopedVars) {
    return {
      ...query,
      pxlScript: query.pxlScript
        ? getTemplateSrv().replace(query.pxlScript, {
            ...scopedVars,
          })
        : '',
    };
  }

  async fetchMetricNames(cluster: string) {
    return {
      data: [{ name: 'test' }],
    };
  }

  async metricFindQuery(query: PixieVariableQuery, options?: any) {
    // Retrieve DataQueryResponse based on query.
    const response = await this.fetchMetricNames(query.cluster);

    // Convert query results to a MetricFindValue[]
    const values = response.data.map((frame) => ({ text: frame.name }));
    console.log(values);

    return values;
  }
}
