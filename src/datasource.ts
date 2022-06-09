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

import { DataFrame, DataSourceInstanceSettings, ScopedVars, TimeRange, toDataFrame } from '@grafana/data';
import { BackendSrv, DataSourceWithBackend, FetchResponse, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { PixieDataSourceOptions, PixieDataQuery } from './types';

interface ClusterMeta {
  id: string;
  name: string;
}

export class DataSource extends DataSourceWithBackend<PixieDataQuery, PixieDataSourceOptions> {
  backendServ?: BackendSrv;

  constructor(instanceSettings: DataSourceInstanceSettings<PixieDataSourceOptions>) {
    super(instanceSettings);
    this.backendServ = getBackendSrv();
  }

  applyTemplateVariables(query: PixieDataQuery, scopedVars: ScopedVars) {
    const pxlScript = query?.queryBody?.pxlScript;
    return {
      ...query,
      queryBody: {
        pxlScript: pxlScript
          ? getTemplateSrv().replace(pxlScript, {
              ...scopedVars,
            })
          : '',
      },
    };
  }

  async fetchMetricNames(options: any): Promise<FetchResponse | void> {
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
      queryType: 'get-clusters',
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

    const response = this.backendServ?.fetch<any>(options);
    if (response) {
      return response.toPromise();
    } else {
      return Promise.resolve();
    }
  }

  /**
   * Zip fields in the dataframe into a list of individual objects with fields from dataframe.
   * Ex: if df has n entries, and fields `a` and `b`, this function
   * will return [{a:value of a in first row of df, b: value of b in the first row of df},
   *  *values from the second row*, ...]
   *
   * @param df grafana dataframe
   * @returns list of objects with fields names from df
   */
  zipGrafanaDataFrame(df: DataFrame) {
    const zippedData = new Array(df.length);

    for (let i = 0; i < df.length; i++) {
      zippedData[i] = {};
    }

    df.fields.forEach((field) => {
      field.values.toArray().forEach((elem, i) => {
        zippedData[i][field.name] = elem;
      });
    });

    console.log(zippedData);
    return zippedData;
  }

  async metricFindQuery(query: string, options?: any) {
    // Retrieve DataQueryResponse based on query.
    const variableName = options.variable.name;
    const response = await this.fetchMetricNames(options);
    const vizierFrame = toDataFrame(response!.data.results[variableName].frames[0]);
    const clusterData: ClusterMeta[] = this.zipGrafanaDataFrame(vizierFrame);

    return clusterData.map((entry) => ({
      text: entry.name,
    }));
  }
}
