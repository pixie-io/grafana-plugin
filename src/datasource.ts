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

import { DataSourceInstanceSettings, ScopedVars, TimeRange } from '@grafana/data';
import { BackendSrv, DataSourceWithBackend, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { PixieDataSourceOptions, PixieDataQuery } from './types';

export class DataSource extends DataSourceWithBackend<PixieDataQuery, PixieDataSourceOptions> {
  backendServ?: BackendSrv;

  constructor(instanceSettings: DataSourceInstanceSettings<PixieDataSourceOptions>) {
    super(instanceSettings);
    this.backendServ = getBackendSrv();
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

  async fetchMetricNames(cluster: string, options?: any) {
    let refId = 'tempvar';
    if (options && options.variable && options.variable.name) {
      refId = options.variable.name;
    }

    const range = options?.range as TimeRange;
    const interpolatedQuery = {
      refId: refId,
      datasource: {
        type: this.type,
        uid: this.uid,
      },
      clusterFlag: true,
    };

    options = {
      ...options,
      url: '/api/ds/query',
      method: 'POST',
      data: {
        from: range?.from?.valueOf()?.toString(),
        to: range?.to?.valueOf()?.toString(),
        queries: [interpolatedQuery],
      },
    };
    console.log(options);
    const response = await this.backendServ?.fetch(options).toPromise();
    console.log(response);

    return {
      data: [{ name: 'test' }],
    };
  }

  async metricFindQuery(query: string, options?: any) {
    // Retrieve DataQueryResponse based on query.
    const response = await this.fetchMetricNames(query, options);

    // Convert query results to a MetricFindValue[]
    const values = response.data.map((frame) => ({ text: frame.name }));
    console.log(values);

    return values;
  }
}
