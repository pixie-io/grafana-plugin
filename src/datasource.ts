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
import { PixieDataSourceOptions, PixieDataQuery } from './types';
import { getColumnsScript } from './column_filtering';

export class DataSource extends DataSourceWithBackend<PixieDataQuery, PixieDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<PixieDataSourceOptions>) {
    super(instanceSettings);
  }

  applyTemplateVariables(query: PixieDataQuery, scopedVars: ScopedVars) {
    let timeVars = [
      ['$__from', '__time_from'],
      ['$__to', '__time_to'],
      ['$__interval', '__interval'],
    ];

    //Replace Grafana's time global variables from the script with Pixie's time macros
    for (const [changeFrom, changeTo] of timeVars) {
      query.pxlScript = query.pxlScript.replaceAll(changeFrom, changeTo);
    }

    let columnsVar = '$__columns';
    //Replace $__columns with columns selected to filter
    if (query.isTabular) {
      query.pxlScript = query.pxlScript.replace(
        columnsVar,
        getColumnsScript(query.selectedColumns, query.columnOptions)
      );
    }

    return {
      ...query,
      pxlScript: query.pxlScript
        ? getTemplateSrv().replace(query.pxlScript, {
            ...scopedVars,
          })
        : '',
    };
  }
}
