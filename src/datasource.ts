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

import { DataSourceWithBackend, getTemplateSrv, FetchResponse, getBackendSrv, BackendSrv } from '@grafana/runtime';
import { getColumnsScript } from './column_filtering';
import { getGroupByScript } from './groupby';
import {
  DataFrame,
  DataSourceInstanceSettings,
  MetricFindValue,
  ScopedVars,
  toDataFrame,
  VariableModel,
} from '@grafana/data';
import {
  PixieDataSourceOptions,
  PixieDataQuery,
  PixieVariableQuery,
  CLUSTER_VARIABLE_NAME as CLUSTER_VARIABLE_NAME,
  QueryType,
  checkExhaustive,
} from './types';

const timeVars = [
  ['$__from', '__time_from'],
  ['$__to', '__time_to'],
  ['$__interval', '__interval'],
];

const columnsVar = '$__columns';

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

  getClusterId(): string {
    const dashboardVariables: VariableModel[] = getTemplateSrv().getVariables();

    // find cluster variable and convert it to any since the variable value field is not exposed
    const pixieClusterIdVariable = dashboardVariables.find(
      (variable) => variable.name === CLUSTER_VARIABLE_NAME
    ) as any;
    return pixieClusterIdVariable?.current?.value ?? '';
  }

  applyTemplateVariables(query: PixieDataQuery, scopedVars: ScopedVars) {
    let pxlScript = query.queryBody?.pxlScript ?? '';

    // Replace Grafana's time global variables from the script with Pixie's time macros
    for (const [changeFrom, changeTo] of timeVars) {
      pxlScript = pxlScript.replaceAll(changeFrom, changeTo);
    }

    // Replace $__columns with columns selected to filter or all columns in script
    if (query.queryMeta?.isColDisplay) {
      pxlScript = pxlScript.replace(
        columnsVar,
        getColumnsScript(query.queryMeta.selectedColDisplay!, query.queryMeta.columnOptions!)
      );
    }

    // Modifies px.display to display a script that groups by selected columns
    if (query.queryMeta?.isGroupBy) {
      pxlScript = pxlScript.replace(
        columnsVar,
        query.queryMeta.columnOptions!.map((columnName) => `'${columnName.label}'`).join()
      );

      if (query.queryMeta.selectedColGroupby) {
        pxlScript =
          pxlScript.substring(0, pxlScript.lastIndexOf('px.display')) +
          getGroupByScript(query.queryMeta.selectedColGroupby!, query.queryMeta.aggData!);
      }
    }

    return {
      ...query,
      queryBody: {
        ...query.queryBody,
        clusterID: this.getClusterId(),
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
      ...query,
      refId,
      datasource: {
        type: this.type,
        uid: this.uid,
      },
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

  /**
   * Converts zipped output into dashboard ingestible data.
   *
   * @param data zipped data
   * @param textField field to use for dashboard variable name.
   * Set to `undefined` if textField should be the same as valueField in the output.
   *
   * @param valueField field to use for dashboard variable value
   */
  convertData(data: any[], textField: string | undefined, valueField: string): MetricFindValue[] {
    const output = data.flatMap((entry: any) => {
      let values: string[] = [entry[valueField] as string];
      //check if the value is in array form
      if (values[0].includes(',')) {
        //expand and clean values
        values = JSON.parse(values[0]);
      }
      return values.map((value) => ({
        // if textField undefined use value for the text label
        text: textField ? entry[textField] : value,
        value: value,
      }));
    });
    return output;
  }

  async metricFindQuery(query: PixieVariableQuery, options?: any): Promise<MetricFindValue[]> {
    const variableName: string = options.variable.name;
    // Make sure the query is not empty. Variable query editor will send empty string if user haven't clicked on dropdown menu
    query = query || { queryType: 'get-clusters' as const };

    if (query.queryType !== 'get-clusters' && query.queryBody?.clusterID === `\$${CLUSTER_VARIABLE_NAME}`) {
      const interpolatedClusterId = getTemplateSrv().replace(query.queryBody?.clusterID, options.scopedVars);
      query = { ...query, queryBody: { clusterID: interpolatedClusterId } };
    }
    // Fetch variables from the backend
    const response = await this.fetchMetricNames(query, options);
    //Convert the response to a DataFrame
    const frame: DataFrame = toDataFrame(response!.data.results[variableName].frames[0]);

    //Convert DataFrame to an array of objects containing fields same as column names of the DataFrame
    const flatData: ClusterMeta[] = this.zipGrafanaDataFrame(frame);

    switch (query.queryType) {
      case QueryType.GetClusters:
        return this.convertData(flatData, 'name', 'id');
      case QueryType.GetPods:
        return this.convertData(flatData, undefined, 'pod');
      case QueryType.GetServices:
        return this.convertData(flatData, undefined, 'service');
      case QueryType.GetNamespaces:
        return this.convertData(flatData, undefined, 'namespace');
      case QueryType.GetNodes:
        return this.convertData(flatData, undefined, 'node');
      case QueryType.RunScript:
        return Promise.resolve([]);
      default:
        checkExhaustive(query.queryType);
    }
  }
}
