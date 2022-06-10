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

import { DataFrame, DataSourceInstanceSettings, ScopedVars, toDataFrame } from '@grafana/data';
import { BackendSrv, DataSourceWithBackend, FetchResponse, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { PixieDataSourceOptions, PixieDataQuery, PixieVariableQuery } from './types';

interface ClusterMeta {
  id: string;
  name: string;
}

export class DataSource extends DataSourceWithBackend<PixieDataQuery, PixieDataSourceOptions> {
  backendSrv: BackendSrv;

  constructor(instanceSettings: DataSourceInstanceSettings<PixieDataSourceOptions>) {
    super(instanceSettings);
    this.backendSrv = getBackendSrv();
  }

  applyTemplateVariables(query: PixieDataQuery, scopedVars: ScopedVars) {
    const pxlScript = query.queryBody?.pxlScript ?? '';
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

  async fetchMetricNames(query: PixieVariableQuery, options: any): Promise<FetchResponse | void> {
    const refId = options?.variable?.name ?? 'tempvar';

    const interpolatedQuery = {
      refId,
      datasource: {
        type: this.type,
        uid: this.uid,
      },
      queryType: query.queryType,
    };

    options = {
      ...options,
      url: '/api/ds/query',
      method: 'POST',
      data: {
        queries: [interpolatedQuery],
      },
    };

    const response = this.backendSrv.fetch<any>(options);
    return response ? response.toPromise() : Promise.resolve();
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
    const zipped = new Array(df.length).fill(null);

    for (const field of df.fields) {
      for (let i = 0; i < field.values.length; i++) {
        zipped[i] ??= {};
        zipped[i][field.name] = field.values.get(i);
      }
    }

    return zipped;
  }

  async metricFindQuery(query: PixieVariableQuery, options?: any) {
    const variableName: string = options.variable.name;
    //Make sure the query is not empty. Variable query editor will send empty string if user haven't clicked on dropdown menu
    query = query || { queryType: 'get-clusters' as const };

    // Fetch variables from the backend
    const response = await this.fetchMetricNames(query, options);
    //Convert the response to a DataFrame
    const vizierFrame: DataFrame = toDataFrame(response!.data.results[variableName].frames[0]);
    //Convert DataFrame to an array of objects containing fields same as column names of the DataFrame
    const clusterData: ClusterMeta[] = this.zipGrafanaDataFrame(vizierFrame);

    return clusterData.map((entry) => ({
      text: entry.name,
    }));
  }
}
